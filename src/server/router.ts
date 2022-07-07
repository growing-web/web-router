import { html, HTMLResponse, unsafeHTML } from '@worker-tools/html';
import defaultsDeep from 'lodash-es/defaultsDeep.js';
import { matchRoutes} from '../isomorphic/matchRoutes.js';

const escapeAttributeValue = value => value.replace(/"/g, '&quot;');

const getRouteArgs = match => match.routeParams = Object.entries(match.params)
    .filter(([name]) => name !== '*')
    .reduce((previousValue, [name, value]) => {
      previousValue[`routeparam-${name}`] = value;
      return previousValue;
    }, { routepattern: match.pathname }); 

async function transformElementRoute(match, content, context, transforms, request) {
  let localName = match.route.element;
  let attrs = {
    ...match.route.attributes,
    ...getRouteArgs(match)
  };
  let child = content
  let scope = null;

  if (transforms) {
    for (const transform of transforms) {
      const results = await transform(localName, attrs, content, request);
      if (results) {
        [localName, attrs, child, scope] = results;
        if (scope) {
          defaultsDeep(context, scope);
        }
        break;
      }
    }
  }

  attrs = Object.entries(attrs).map(([name, value]) =>
    value ? `${name}="${escapeAttributeValue(value)}"` : name
  );
  const startTag = `<${[localName, ...attrs].join(' ')}>`;
  const endTag = `</${localName}>`;
  return html`${unsafeHTML(startTag)}${await child}${unsafeHTML(endTag)}`;
}

async function transformResourceRoute(match, request) {
  const url = match.route.import;
  const app = await import(url);
  let meta = null;
  let data = null;
  const context = {};
  const parameters = {
    ...getRouteArgs(match)
  };
  const dependencies = { request, meta, data, context, parameters };
  const lifecycles = app.default ? app.default(dependencies) : app;

  if (typeof lifecycles.meta === 'function') {
    meta = await lifecycles.meta.call(context, dependencies).catch(() => null);
    if (meta) {
      dependencies.meta = meta;
    }
  }

  if (typeof lifecycles.data === 'function') {
    data = await lifecycles.data.call(context, dependencies).catch(() => null);
    if (data) {
      dependencies.data = data;
    }
  }

  if (typeof lifecycles.response !== 'function') {
    throw new TypeError(`The current application does not export the "response" function: ${url}`);
  }
  
  const response: Response = await lifecycles.response.call(context, dependencies);

  if (!(response instanceof Response)) {
    throw new TypeError(`The application does not return a Response object as expected: ${url}`);
  }

  return response;
}

async function transformEmptyRoute(match, content) {
  return (await content) || html``;
}

async function transformRoute(matches, transforms, request) {
  if (matches == null) return null;
  let accumulator;
  let isElementRouter = true;
  const context = {};
  const lastIndex = matches.length - 1;

  for (let index = lastIndex; index >= 0; index --) {
    const content = accumulator;
    const match = matches[index];
    const { element } = match.route;

    if (element) {
      accumulator = transformElementRoute(match, content, context, transforms, request);
    } else if (match.route.import && index === lastIndex) {
      
      accumulator = transformResourceRoute(match, request);
      isElementRouter = false;
      break;
    } else {
      accumulator = transformEmptyRoute(match, content);
    }
  }

  return [accumulator, isElementRouter, context];
}

export { html, unsafeHTML };

export async function router({ routemap, request, layout, importmap, transforms }) {
  
  const { pathname } = new URL(request.url);
  const matches = matchRoutes(routemap.routes, pathname);
  const results = await transformRoute(matches, transforms, request);

  if (!results) {
    return new Response(null, {
      status: 204,
      statusText: 'No Content'
    });
  }

  const [outlet, isElementRouter, context]  = results;

  if (!isElementRouter) {
    return outlet;
  }

  const content = layout ? layout({
    importmap: () => html`<script type="importmap">${unsafeHTML(JSON.stringify(importmap, null, 2))}</script>`,
    routemap: () => html`<script type="routemap">${unsafeHTML(JSON.stringify(routemap, null, 2))}</script>`,
    meta: () => {
      const meta = context.meta || {};
      return html`<title>${meta.title}</title>`
    },
    outlet: () => html`<web-router hydrateonly>${outlet}</web-router>`
  }) : () => outlet;
  
  const response = new HTMLResponse(content, {
    status: context.status,
    statusText: context.statusText,
    headers: context.headers
  });

  return response;
}


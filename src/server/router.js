import { html, HTMLResponse, unsafeHTML } from '@worker-tools/html';
import defaultsDeep from 'lodash-es/defaultsDeep.js';
import { matchRoutes } from '../isomorphic/matchRoutes.js';

export { html, unsafeHTML };
export { Importmap } from './Importmap.js';
export { Meta } from './Meta.js';
export { Outlet } from './Outlet.js';
export { Routemap } from './Routemap.js';

const escapeAttributeValue = value => value.replace(/"/g, '&quot;');

const getRouteArgs = match =>
  (match.routeParams = Object.entries(match.params)
    .filter(([name]) => name !== '*')
    .reduce(
      (previousValue, [name, value]) => {
        previousValue[`routeparam-${name}`] = value;
        return previousValue;
      },
      { routepattern: match.pathname }
    ));

async function transformElementRoute({
  match,
  outlet,
  dataset,
  transforms,
  provider
}) {
  const localName = match.route.element;
  const attributes = {
    ...match.route.attributes,
    ...getRouteArgs(match)
  };
  const results = [attributes, outlet];

  if (transforms) {
    for (const transform of transforms) {
      if (transform.element === localName) {
        const data = {};
        const transformed = await transform.transform.call(
          {
            provider,
            error(error) {
              console.error(error);
            },
            emitData(name, value) {
              data[name] = value;
            }
          },
          ...results
        );
        defaultsDeep(dataset, data);
        if (transformed) {
          Object.assign(results, transformed);
          break;
        }
      }
    }
  }

  const startTag = unsafeHTML(
    `<${[
      localName,
      ...Object.entries(results[0]).map(([name, value]) =>
        value ? `${name}="${escapeAttributeValue(value)}"` : name
      )
    ].join(' ')}>`
  );
  const endTag = unsafeHTML(`</${localName}>`);

  return html`${startTag}${await results[1]}${endTag}`;
}

async function transformResourceRoute({ match, provider }) {
  const url = match.route.import;
  const app = await import(url);
  const context = {};
  const parameters = {
    ...getRouteArgs(match)
  };
  const dependencies = {
    ...provider,
    meta: null,
    data: null,
    context,
    parameters
  };
  const lifecycles = app.default ? app.default(dependencies) : app;

  if (typeof lifecycles.data === 'function') {
    const data = await lifecycles.data
      .call(context, dependencies)
      .catch(() => null);
    if (data) {
      dependencies.data = data;
    }
  }

  if (typeof lifecycles.meta === 'function') {
    const meta = await lifecycles.meta
      .call(context, dependencies)
      .catch(() => null);
    if (meta) {
      dependencies.meta = meta;
    }
  }

  if (typeof lifecycles.response !== 'function') {
    throw new TypeError(
      `The current application does not export the "response" function: ${url}`
    );
  }

  const response = await lifecycles.response.call(context, dependencies);

  if (!(response instanceof Response)) {
    throw new TypeError(
      `The application does not return a Response object as expected: ${url}`
    );
  }

  return response;
}

async function transformEmptyRoute({ outlet }) {
  return (await outlet) || html``;
}

async function transformRoute(matches, transforms, provider) {
  if (matches == null) return null;
  let outlet;
  let type = 'element';
  const dataset = {};
  const lastIndex = matches.length - 1;

  for (let index = lastIndex; index >= 0; index--) {
    const match = matches[index];
    const { element } = match.route;

    if (element) {
      outlet = transformElementRoute({
        match,
        outlet,
        dataset,
        transforms,
        provider
      });
    } else if (match.route.import && index === lastIndex) {
      outlet = transformResourceRoute({ match, provider });
      type = 'resource';
      break;
    } else {
      outlet = transformEmptyRoute({ outlet });
    }
  }

  return { outlet, type, dataset };
}

export async function router({
  routemap,
  request,
  layout,
  importmap,
  transforms
}) {
  const { pathname } = new URL(request.url);
  const matches = matchRoutes(routemap.routes, pathname);
  const results = await transformRoute(matches, transforms, { request });

  if (!results) {
    return new Response(null, {
      status: 404,
      statusText: 'Not Found'
    });
  }

  const { outlet, type, dataset } = results;
  const { meta = {} } = dataset;

  if (type === 'resource') {
    return outlet;
  }

  const content = layout
    ? layout({
        importmap,
        routemap,
        meta,
        outlet
      })
    : outlet;

  const response = new HTMLResponse(content, {
    status: dataset.status || 200,
    statusText: dataset.statusText || '',
    headers: dataset.headers || {}
  });

  return response;
}

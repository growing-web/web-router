import { html, HTMLResponse, unsafeHTML } from '@worker-tools/html';
import defaultsDeep from 'lodash-es/defaultsDeep.js';
import { matchRoutes } from '../isomorphic/matchRoutes.js';

export { html, unsafeHTML };
export * from './components.js';

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

function reasonableTime(promise, timeout) {
  return new Promise((resolve, reject) => {
    let finished = false;
    promise
      .then(val => {
        finished = true;
        resolve(val);
      })
      .catch(val => {
        finished = true;
        reject(val);
      });

    setTimeout(() => {
      if (!finished) {
        finished = true;
        reject(new Error(`Request timed out`));
      }
    }, timeout);
  });
}

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
        const timeout = transform.timeout || 2000;
        const transformed = await reasonableTime(
          transform.transform.call(
            {
              html,
              unsafeHTML,
              provider,
              error(error) {
                console.error(error);
              },
              emitData(name, value) {
                data[name] = value;
              }
            },
            ...results
          ),
          timeout
        ).catch(error => {
          console.error(error);
          return null;
        });

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
  const module = await import(url);
  const parameters = {
    ...getRouteArgs(match)
  };
  const dependencies = {
    ...provider,
    meta: null,
    data: null,
    parameters
  };
  const lifecycles = { ...module };

  if (typeof lifecycles.data === 'function') {
    const data = await lifecycles.data(dependencies);
    if (data) {
      dependencies.data = data;
    }
  }

  if (typeof lifecycles.meta === 'function') {
    const meta = await lifecycles.meta(dependencies);
    if (meta) {
      dependencies.meta = meta;
    }
  }

  if (typeof lifecycles.response !== 'function') {
    throw new TypeError(`Module does not export "response" function: ${url}`);
  }

  const response = await lifecycles.response(dependencies);

  if (!(response instanceof Response)) {
    throw new TypeError(`Not an "Response" object was returned: ${url}`);
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
      outlet = await transformElementRoute({
        match,
        outlet,
        dataset,
        transforms,
        provider
      });
    } else if (match.route.import && index === lastIndex) {
      outlet = await transformResourceRoute({ match, provider });
      type = 'resource';
      break;
    } else {
      outlet = await transformEmptyRoute({ outlet });
    }
  }

  return { outlet, type, dataset };
}

export async function router({
  request,
  layout,
  routemap = { routes: {} },
  importmap = { imports: {} },
  transforms = []
}) {
  try {
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
          outlet,
          links: meta.links || [],
          scripts: {}
        })
      : outlet;

    const response = new HTMLResponse(content, {
      status: dataset.status || 200,
      statusText: dataset.statusText || '',
      headers: dataset.headers || {}
    });

    return response;
  } catch (error) {
    console.error(error);
    return new Response(null, {
      status: 500
    });
  }
}

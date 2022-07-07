import { html, unsafeHTML } from '@worker-tools/html';

export async function transformWebWidget (element, attributes, children, deps) {
  if (element !== 'web-widget') {
    return;
  }

  const scope = { meta: {}, data: {}, headers: {}, status: 200, statusText: '' };
  const clientonly = typeof attributes['clientonly'] === 'string'
  const hydrateonly = typeof attributes['hydrateonly'] === 'string';
  const rendertarget = attributes['rendertarget'] || 'shadow';
  const module = attributes['import'];
  const src = attributes['src'];
  const url = module || src;
  const ssr =
    !clientonly &&
    !hydrateonly &&
    url;

  if (!ssr) {
    return;
  }

  try {
    let app = await import(/* @vite-ignore */ /* webpackIgnore: true */url);
    let meta = null;
    let data = null;
    const context = {};
    const parameters = attributes;
    const dependencies = { ...deps, meta, data, context, parameters };
    const lifecycles = app.default ? app.default(dependencies) : app;

    if (typeof lifecycles.meta === 'function') {
      meta = await lifecycles.meta.call(context, dependencies).catch(() => null);
      if (meta) {
        dependencies.meta = meta;
        scope.meta = meta;
      }
    }

    if (typeof lifecycles.data === 'function') {
      data = await lifecycles.data.call(context, dependencies).catch(() => null);
      if (data) {
        dependencies.data = data;
        attributes.data = JSON.stringify(data);
        scope.data = data;
      }
    }

    if (typeof lifecycles.response !== 'function') {
      throw new TypeError(`The current application does not export the "response" function`);
    }
    
    const response: Response = await lifecycles.response.call(context, dependencies);

    if (!(response instanceof Response)) {
      throw new TypeError(`The application does not return a Response object as expected`);
    }

    if (response.headers.get('Content-Type') !== 'text/html') {
      throw new TypeError(`This MIME type is not supported: ${response.headers.get('Content-Type')}`);
    }

    scope.headers = Object.fromEntries(response.headers);
    scope.status = response.status;
    scope.statusText = response.statusText;

    const asyncInnerHTML = (async function* () {     
      // TODO 这样处理流是否正确？
      for await (const part of response.body) {
        let string = new TextDecoder().decode(part);
        yield unsafeHTML(string);
      }
    })();
    
    attributes.hydrateonly = '';

    if (rendertarget === 'shadow') {
      children = html`
        <template shadowroot="open">
          ${asyncInnerHTML}
        </template>
        ${children}
      `;
    } else {
      children = asyncInnerHTML;
    }
  } catch (error) {
    // eslint-disable-next-line no-undef, no-console
    console.error(
      Object.assign(error, {
        message: `SSR_ERROR: "${url}" ${error.message}`
      })
    );
    children = html`
      <script>
        /*By WebWidgetServer*/
        (script => {
          console.error('SSR_ERROR', script.parentNode);
          script.parentNode.removeChild(script);
        })(document.currentScript);
      </script>
      ${children}
    `;
  }

  return [element, attributes, children, scope];
}
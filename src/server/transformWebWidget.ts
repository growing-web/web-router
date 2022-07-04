import { html, unsafeHTML } from '@worker-tools/html';

export async function transformWebWidget (element, attributes, children, deps) {
  if (element !== 'web-widget') {
    return;
  }

  const scope = { meta: {}, data: {}, headers: {}, status: 200, statusText: '' };
  const hydrateonly = typeof attributes['hydrateonly'] === 'string';
  const rendertarget = attributes['rendertarget'] || 'shadow';
  const loading = attributes['loading'] || 'auto';
  const inactive = typeof attributes['inactive'] === 'string';
  const module = attributes['import'];
  const src = attributes['src'];
  const url = module || src;
  const shadow = rendertarget === 'shadow';
  const ssr =
    !hydrateonly &&
    !inactive &&
    loading !== 'lazy' &&
    url;

  if (!ssr) {
    return;
  }

  try {
    let app = await import(url);
    let meta = null;
    let data = null;
    const context = {
      async mount() {},
      async update() {},
      async unmount() {}
    };
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

    if (shadow) {
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
        /*By WebRouterServer*/
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
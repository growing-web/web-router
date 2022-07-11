export default function webWidget({ timeout = 2000 } = {}) {
  return {
    element: 'web-widget',
    timeout,
    async transform(attributes, outlet) {
      const { html, unsafeHTML } = this;
      const clientonly = typeof attributes['clientonly'] === 'string';
      const hydrateonly = typeof attributes['hydrateonly'] === 'string';
      const rendertarget = attributes['rendertarget'] || 'shadow';
      const url = attributes['import'] || attributes['src'];
      const ssr = !clientonly && !hydrateonly && url;

      if (!ssr) {
        return;
      }

      try {
        let app = await import(
          /* @vite-ignore */ /* webpackIgnore: true */ url
        );
        const context = {};
        const parameters = attributes;
        const dependencies = {
          ...this.provider,
          meta: null,
          data: null,
          context,
          parameters
        };
        const lifecycles = app.default ? app.default(dependencies) : app;

        if (typeof lifecycles.data === 'function') {
          const data = await lifecycles.data
            .call(context, dependencies);
          if (data) {
            dependencies.data = data;
            attributes.data = JSON.stringify(data);
            this.emitData('data', data);
          }
        }

        if (typeof lifecycles.meta === 'function') {
          const meta = await lifecycles.meta
            .call(context, dependencies);
          if (meta) {
            dependencies.meta = meta;
            this.emitData('meta', meta);
          }
        }


        if (typeof lifecycles.response !== 'function') {
          throw new TypeError(
            `Module does not export "response" function`
          );
        }

        const response = await lifecycles.response.call(context, dependencies);

        if (!(response instanceof Response)) {
          throw new TypeError(
            `Not an "Response" object was returned`
          );
        }

        if (response.headers.get('Content-Type') !== 'text/html') {
          throw new TypeError(
            `This MIME type is not supported: ${response.headers.get(
              'Content-Type'
            )}`
          );
        }

        this.emitData('headers', Object.fromEntries(response.headers));
        this.emitData('status', response.status);
        this.emitData('statusText', response.statusText);

        const asyncInnerHTML = async function* () {
          // TODO 这样处理流是否正确？
          for await (const part of response.body) {
            let string = new TextDecoder().decode(part);
            yield unsafeHTML(string);
          }
        };

        attributes.hydrateonly = '';

        if (rendertarget === 'shadow') {
          outlet = html`
            <template shadowroot="open">${asyncInnerHTML}</template>
            ${outlet}
          `;
        } else {
          outlet = asyncInnerHTML;
        }
      } catch (error) {
        this.error(
          Object.assign(error, {
            message: `SSR_ERROR: ${url} ${error.message}`
          })
        );
        outlet = html`
          <script>
            /*By WebWidgetServer*/
            (script => {
              console.error('SSR_ERROR', script.parentNode);
              script.parentNode.removeChild(script);
            })(document.currentScript);
          </script>
          ${outlet}
        `;
      }

      return [attributes, outlet];
    }
  };
}

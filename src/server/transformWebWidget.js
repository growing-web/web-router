import { html, unsafeHTML } from '@worker-tools/html';

export default function () {
  return {
    element: 'web-widget',
    async transform(attributes, content) {
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
        let meta = null;
        let data = null;
        const request = this.request;
        const context = {};
        const parameters = attributes;
        const dependencies = { request, meta, data, context, parameters };
        const lifecycles = app.default ? app.default(dependencies) : app;

        if (typeof lifecycles.meta === 'function') {
          meta = await lifecycles.meta
            .call(context, dependencies)
            .catch(() => null);
          if (meta) {
            dependencies.meta = meta;
            this.emitData('meta', meta);
          }
        }

        if (typeof lifecycles.data === 'function') {
          data = await lifecycles.data
            .call(context, dependencies)
            .catch(() => null);
          if (data) {
            dependencies.data = data;
            attributes.data = JSON.stringify(data);
            this.emitData('data', data);
          }
        }

        if (typeof lifecycles.response !== 'function') {
          throw new TypeError(
            `The current application does not export the "response" function`
          );
        }

        const response = await lifecycles.response.call(
          context,
          dependencies
        );

        if (!(response instanceof Response)) {
          throw new TypeError(
            `The application does not return a Response object as expected`
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
          content = html`
            <template shadowroot="open"> ${asyncInnerHTML} </template>
            ${content}
          `;
        } else {
          content = asyncInnerHTML;
        }
      } catch (error) {
        this.error(Object.assign(error, {
          message: `SSR_ERROR: "${url}" ${error.message}`
        }));
        content = html`
          <script>
            /*By WebWidgetServer*/
            (script => {
              console.error('SSR_ERROR', script.parentNode);
              script.parentNode.removeChild(script);
            })(document.currentScript);
          </script>
          ${content}
        `;
      }

      return [attributes, content];
    }
  };
}

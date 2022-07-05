export default ({ importmap, routemap, meta, outlet, html }) => html`<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="X-UA-Compatible" main="IE=edge" />
    ${meta()}
    ${importmap()}
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>

  <body>

    ${outlet()}
    ${routemap()}

    <script type="module">
      // Polyfill: Declarative Shadow DOM
      (function attachShadowRoots(root) {
        root.querySelectorAll('template[shadowroot]').forEach(template => {
          const mode = template.getAttribute('shadowroot');
          const host = template.parentNode;
          const shadowRoot = template.parentNode.attachShadow({ mode });
          const attachInternals = host.attachInternals;
          const attachShadow = host.attachShadow;

          Object.assign(host, {
            attachShadow() {
              shadowRoot.innerHTML = '';
              return shadowRoot;
            },
            attachInternals() {
              const ei = attachInternals
                ? attachInternals.call(this, arguments)
                : {};
              return Object.create(ei, {
                shadowRoot: { value: shadowRoot }
              });
            }
          });

          shadowRoot.appendChild(template.content);
          template.remove();
          attachShadowRoots(shadowRoot);
        });
      })(document);

      // Polyfill: Custom Elements
      // if (window.customElements) {
      //   customElements.define('test-builtin', class extends HTMLAnchorElement {}, { extends: 'a'});
      //   // Safari
      //   if (document.createElement('a', { is: 'test-builtin' }).constructor === HTMLAnchorElement) {
      //     document.head.appendChild(Object.assign(document.createElement('script'), {
      //       src: '//unpkg.com/@ungap/custom-elements/es.js',
      //       crossorigin: 'anonymous',
      //       async: true
      //     }));
      //   }
      // }

      // Polyfill: Import Maps
      if (
        !HTMLScriptElement.supports ||
        !HTMLScriptElement.supports('importmap')
      ) {
        document.head.appendChild(
          Object.assign(document.createElement('script'), {
            src: 'https://unpkg.com/es-module-shims@1.5.6/dist/es-module-shims.js',
            crossorigin: 'anonymous',
            async: true,
            onload() {
              importShim('@examples/bootstrap');
            }
          })
        );
      } else {
        import('@examples/bootstrap');
      }
    </script>
  </body>
</html>`
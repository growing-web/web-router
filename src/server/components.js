import { html, unsafeHTML } from '@worker-tools/html';
import { SCROLL_POSITIONS } from '../isomorphic/keys.js';

export function Importmap(importmap) {
  return html`<script type="importmap">
    ${unsafeHTML(JSON.stringify(importmap, null, 2))}
  </script>`;
}

const attributeName = value => value.replace(/([A-Z])/g, '-$1').toLowerCase();
const attributeValue = value => value.replace(/"/g, '&quot;');

export function Meta(meta) {
  return Object.entries(meta).map(([name, value]) => {
    if (!value) {
      return null;
    }

    if (name === 'charset') {
      return html`<meta charset="${value}" />`;
    }

    if (name === 'title') {
      return html`<title>${value}</title>`;
    }

    const isOpenGraphTag = name.startsWith('og:');
    const isLinkTag = name === 'links';

    return [value].flat().map(content => {
      if (isOpenGraphTag) {
        return html`<meta content="${content}" property="${name}" />`;
      }

      if (isLinkTag) {
        return ''; //Links(value);
      }

      if (typeof content === 'string') {
        return html`<meta content="${content}" name="${name}" />`;
      }

      return unsafeHTML(
        `<meta ${Object.entries(value)
          .map(
            ([attrName, attrValue]) =>
              `${attributeName(attrName)}="${attributeValue(attrValue)}"`
          )
          .join(' ')} />`
      );
    });
  });
}

export function Links(links) {
  return links.map(link =>
    unsafeHTML(
      `<link ${Object.entries(link)
        .map(
          ([attrName, attrValue]) =>
            `${attributeName(attrName)}="${attributeValue(attrValue)}"`
        )
        .join(' ')} />`
    )
  );
}

export function Outlet(outlet) {
  return html`<web-router hydrateonly>${outlet}</web-router>`;
}

export function Routemap(routemap) {
  return html`<script type="routemap">
    ${unsafeHTML(JSON.stringify(routemap, null, 2))}
  </script>`;
}

export function Scripts({
  bootstrap,
  customElementPolyfill,
  esModulePolyfill
} = {}) {
  return html`
    <script>
      window.__WEBROUTER__ = ${unsafeHTML(
        JSON.stringify({
          bootstrap,
          customElementPolyfill,
          esModulePolyfill,
          scrollPositions: SCROLL_POSITIONS
        })
      )};

      /* Scroll Restoration */

      if (!window.history.state || !window.history.state.key) {
        let key = Math.random().toString(32).slice(2);
        window.history.replaceState({ key }, '');
      }
      try {
        let positions = JSON.parse(
          sessionStorage.getItem(__WEBROUTER__.scrollPositions) || '{}'
        );
        let storedY = positions[window.history.state.key];
        if (typeof storedY === 'number') {
          window.scrollTo(0, storedY);
        }
      } catch (error) {
        console.error(error);
        sessionStorage.removeItem(__WEBROUTER__.scrollPositions);
      }

      /* Polyfill: Declarative Shadow DOM */

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

      /* Polyfill: Custom Elements */

      if (window.customElements) {
        customElements.define(
          'check-builtin',
          class extends HTMLAnchorElement {},
          { extends: 'a' }
        );
        // Safari
        if (
          document.createElement('a', { is: 'check-builtin' }).constructor ===
          HTMLAnchorElement
        ) {
          document.head.appendChild(
            Object.assign(document.createElement('script'), {
              src: __WEBROUTER__.customElementPolyfill,
              crossorigin: 'anonymous',
              async: true
            })
          );
        }
      }

      /* Polyfill: Import Maps */

      if (
        !HTMLScriptElement.supports ||
        !HTMLScriptElement.supports('importmap')
      ) {
        document.head.appendChild(
          Object.assign(document.createElement('script'), {
            src: __WEBROUTER__.esModulePolyfill,
            crossorigin: 'anonymous',
            async: true,
            onload() {
              importShim(__WEBROUTER__.bootstrap);
            }
          })
        );
      } else {
        import(__WEBROUTER__.bootstrap);
      }
    </script>
  `;
}

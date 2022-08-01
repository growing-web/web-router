import { html, unsafeHTML } from '@worker-tools/html';

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
        return value.map(link =>
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

export function Outlet(outlet) {
  return html`<web-router hydrateonly>${outlet}</web-router>`;
}

export function Routemap(routemap) {
  return html`<script type="routemap">
    ${unsafeHTML(JSON.stringify(routemap, null, 2))}
  </script>`;
}

// export function ScrollRestoration() {
//   let STORAGE_KEY = "positions";
//   let restoreScroll = ((STORAGE_KEY) => {
//     if (!window.history.state || !window.history.state.key) {
//       let key = Math.random().toString(32).slice(2);
//       window.history.replaceState({ key }, "");
//     }
//     try {
//       let positions = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
//       let storedY = positions[window.history.state.key];
//       if (typeof storedY === "number") {
//         window.scrollTo(0, storedY);
//       }
//     } catch (error) {
//       console.error(error);
//       sessionStorage.removeItem(STORAGE_KEY);
//     }
//   }).toString();

//   return html`<script>${unsafeHTML(`(${restoreScroll})(${JSON.stringify(STORAGE_KEY)})`)}</script>`
// }
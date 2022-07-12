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
    const isLinksTag = name === 'links';

    return [value].flat().map(content => {
      if (isOpenGraphTag) {
        return html`<meta content="${content}" property="${name}" />`;
      }

      if (isLinksTag) {
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

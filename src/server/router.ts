import { html, HTMLResponse, unsafeHTML } from '@worker-tools/html';
import defaultsDeep from 'lodash-es/defaultsDeep.js';
import { create } from '../isomorphic/renderElements.js'; 
import { matchRoutes} from '../isomorphic/matchRoutes.js';

const escapeAttributeValue = value => value.replace(/"/g, '&quot;');

async function transformElement(matches, transforms, request) {
  const context = {};
  const element = await create(matches, async (element, attributes, children) => {
    if (element) {
      
      if (transforms) {
        for (const transform of transforms) {
          const results = await transform(element, attributes, children, request);
          if (results) {
            let scope;
            [element, attributes, children, scope] = results;
            if (scope) {
              defaultsDeep(context, scope);
            }
            break;
          }
        }
      }

      const attrs = Object.entries(attributes).map(([name, value]) =>
        value ? `${name}="${escapeAttributeValue(value)}"` : name
      );
      const startTag = `<${[element, ...attrs].join(' ')}>`;
      const content = await children;
      const endTag = `</${element}>`;
      return html`${unsafeHTML(startTag)}${content}${unsafeHTML(endTag)}`;
    }

    return html``;
  });
  return [element, context];
}

export { html, unsafeHTML };

export async function router({ routemap, request, layout, importmap, transforms }) {
  
  const { pathname } = new URL(request.url);
  const matches = matchRoutes(routemap.routes, pathname);
  const [outlet, context] = await transformElement(matches, transforms, { request });

  const content = layout ? layout({
    importmap: () => html`<script type="importmap">${unsafeHTML(JSON.stringify(importmap, null, 2))}</script>`,
    routemap: () => html`<script type="routemap">${unsafeHTML(JSON.stringify(routemap, null, 2))}</script>`,
    meta: () => {
      const meta = context.meta || {};
      return html`<title>${meta.title}</title>`
    },
    outlet: () => html`<web-router hydrateonly>${outlet}</web-router>`
  }) : () => outlet;
  
  const response = new HTMLResponse(content, {
    status: context.status,
    statusText: context.statusText,
    headers: context.headers
  });

  return response;
}


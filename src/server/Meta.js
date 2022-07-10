import { html } from '@worker-tools/html';

export function Meta(meta) {
  return Object.entries(meta).map(([name, value]) => {
    if (name === 'charset') {
      return html`<meta charset="${value}">`
    }
    if (name === 'title') {
      return html`<title>${value}</title>`;
    }
    if (name === 'og:image') {
      return html`<meta property="og:image" content="${value}" />`
    }
    if (name === 'refresh') {
      return html`<meta http-equiv="${value.httpEquiv}" content="${value.content}">`
    }
    return html`<meta name="${name}" content="${value}" />`;
  });
}

import { html } from '@worker-tools/html';
export function Outlet(outlet) {
  return html`<web-router hydrateonly>${outlet}</web-router>`;
}
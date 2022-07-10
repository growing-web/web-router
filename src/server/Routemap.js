import { html, unsafeHTML } from '@worker-tools/html';

export function Routemap(routemap) {
  return  html`<script type="routemap">${unsafeHTML(JSON.stringify(routemap, null, 2))}</script>`;
}
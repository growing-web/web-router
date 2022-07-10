import { html, unsafeHTML } from '@worker-tools/html';

export function Importmap(importmap) {
  return  html`<script type="importmap">${unsafeHTML(JSON.stringify(importmap, null, 2))}</script>`;
}
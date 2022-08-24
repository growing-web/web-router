import { ImportMap } from '@jspm/import-map';
import {
  html,
  Importmap,
  Meta,
  Links,
  Outlet,
  Routemap,
  Scripts
} from './src/server/index.js';

export default ({ importmap, routemap, meta, links, outlet }) => {
  const map = new ImportMap({
    map: importmap
  });
  return html`<!DOCTYPE html>
    <html>
      <head>
        ${Meta({
          charset: 'utf-8',
          title: 'The default title',
          ...meta
        })}
        ${Links([
            {
              rel: 'modulepreload',
              href: map.resolve('@examples/bootstrap')
            },
            ...links
        ])}
        ${Importmap(importmap)}

        <style>
          body {
            margin: 0;
          }
        </style>
      </head>

      <body>
        ${Outlet(outlet)} ${Routemap(routemap)}
        ${Scripts({
          bootstrap: map.resolve('@examples/bootstrap'),
          customElementPolyfill: map.resolve('@ungap/custom-elements'),
          esModulePolyfill: map.resolve('es-module-shims')
        })}
      </body>
    </html>`;
};

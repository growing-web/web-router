import {
  html,
  Importmap,
  Meta,
  Links,
  Outlet,
  Routemap,
  Scripts
} from '../../src/server/index.js';

export default ({ importmap, routemap, meta, links, scripts, outlet }) => html`<!DOCTYPE html>
<html>
  <head>
    ${Meta({
      charset: 'utf-8',
      title: 'The default title',
      ...meta
    })}
    ${Importmap(importmap)}
    ${Links(links)}
    <style>
      body {
        margin: 0;
      }
    </style>
  </head>

  <body>
    ${Outlet(outlet)}
    ${Routemap(routemap)}
    ${Scripts(scripts)}
  </body>
</html>`;

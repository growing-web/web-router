import { html, Importmap, Meta, Outlet, Routemap, Scripts } from './src/server/index.js';

export default ({ importmap, routemap, meta, outlet }) => html`<!DOCTYPE html>
<html>
  <head>
    ${Meta({ charset: 'utf-8', title: 'The default title', ...meta })}
    ${Importmap(importmap)}
    <style>body {margin: 0}</style>
  </head>

  <body>
    ${Outlet(outlet)}
    ${Routemap(routemap)}
    ${Scripts({ entry: '@examples/bootstrap' })}
  </body>
</html>`
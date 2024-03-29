import { serve } from 'https://deno.land/std@0.146.0/http/server.ts';
import layout from './layout.js';
import { router } from '../../src/server/index.js';
import webWidget from '../../src/server/plugins/webWidget.js';
// import { router } from '../../dist/esm/web-router.server.js';
// import webWidget from '../../dist/esm/web-widget.server.js';

const importmap = {
  imports: {
    "vue": "https://unpkg.com/vue@2.6.14/dist/vue.js",
    "vue-router": "https://unpkg.com/vue-router@3.5.2/dist/vue-router.js",
    '@web-widget/container':
      'https://unpkg.com/@web-widget/container@1.0.0-alpha.3/dist/esm/web-widget.js',
    '@ungap/custom-elements':
      'https://unpkg.com/@ungap/custom-elements@1.1.0/es.js',
    'es-module-shims': 'https://unpkg.com/es-module-shims@1.5.17/dist/es-module-shims.js',
    '@growing-web/web-router': '/dist/esm/web-router.js',
    '@examples/bootstrap': '/examples/client/bootstrap.js',
    "@examples/layout": "/examples/client/layout.widget.js",
    "@examples/nav": "/examples/client/nav.widget.js",
    "@examples/home": "/examples/client/index.widget.js",
    "@examples/news": "/examples/client/news.widget.js",
    "@examples/about": "/examples/client/about.widget.js?v=3",
    "@examples/vue-router": "/examples/client/vue-router.widget.js?v=34",
    "@examples/404": "/examples/client/404.widget.js?v=32",
    "@examples/download": "/examples/client/download.js",

  }
};

const routemap = {
  routes: [
    {
      path: '/',
      element: 'web-widget',
      attributes: {
        import: '@examples/layout',
        //rendertarget: 'light'
      },
      children: [
        {
          element: 'web-widget',
          index: true,
          attributes: {
            import: '@examples/home',
            rendertarget: 'light'
          }
        },
        {
          path: 'news',
          element: 'web-widget',
          attributes: {
            import: '@examples/news',
            rendertarget: 'light'
          }
        },
        {
          path: 'about',
          element: 'web-widget',
          attributes: {
            import: '@examples/about',
            rendertarget: 'light'
          },
          children: [
            {
              path: 'download',
              import: '@examples/download'
            },
          ]
        },
        {
          path: 'vue-router/*',
          element: 'web-widget',
          attributes: {
            import: '@examples/vue-router',
            rendertarget: 'light'
          }
        },
        {
          path: 'test',
          children: [
            {
              path: 'xxx',
              element: 'web-widget',
              attributes: {
                import: '@examples/about',
                rendertarget: 'light',
                'data-id': 'xxxx'
              }
            }
          ]
        },
        {
          path: '*',
          element: 'web-widget',
          attributes: {
            import: '@examples/404',
            rendertarget: 'light'
          }
        }
      ]
    }
  ]
};

 async function handler(request) {
  const { pathname } = new URL(request.url);

  // 演示用的静态文件目录
  if (/^\/(examples\/client|dist)\//.test(pathname)) {
    const wd = new URL('../../', import.meta.url).pathname;
    const url = `file://${wd}${pathname.replace(/^\//, '')}`;
    return fetch(url).then(res => {
      return new Response(res.body, {
        headers: {
          'content-type': 'application/javascript',
          'access-control-allow-origin': '*'
        },
      });
    });
  }

  return router({
    request,
    routemap,
    importmap,
    layout,
    bootstrap: '@examples/bootstrap',
    customElementPolyfill: '@ungap/custom-elements',
    esModulePolyfill: 'es-module-shims',
    transforms: [webWidget()]
  });
}

serve(handler);

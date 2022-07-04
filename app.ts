import { serve } from 'https://deno.land/std@0.146.0/http/server.ts';
import { router } from './src/server/router.ts';
import layout from './layout.ts';
import { transformWebWidget } from './src/server/transformWebWidget.ts';

const importmap = {
  imports: {
    "vue": "https://unpkg.com/vue@2.6.14/dist/vue.js",
    "vue-router": "https://unpkg.com/vue-router@3.5.2/dist/vue-router.js",
    '@web-widget/container':
      'https://unpkg.com/@web-widget/container@0.0.27/dist/esm/main.js',
    '@ungap/custom-elements':
      'https://unpkg.com/@ungap/custom-elements@1.1.0/es.js',

    '@growing-web/web-router': '/dist/esm/web-router.js',
    '@examples/bootstrap': '/examples/bootstrap.js',
    '@examples/nav': '/examples/nav.widget.js',
    '@examples/home': '/examples/index.widget.js',
    '@examples/news': '/examples/news.widget.js',
    '@examples/about': '/examples/about.widget.js',
    '@examples/vue-router':
      '/examples/vue-router.widget.js',
    '@examples/404': '/examples/404.widget.js?v=30'
  }
};

const routemap = {
  routes: [
    {
      path: '/',
      element: 'main',
      children: [
        {
          element: 'web-widget',
          index: true,
          attributes: {
            import: '@examples/home'
          }
        },
        {
          path: 'news',
          element: 'web-widget',
          attributes: {
            import: '@examples/news'
          }
        },
        {
          path: 'about',
          element: 'web-widget',
          attributes: {
            import: '@examples/about',
            'data-id': 'xxxx'
          }
        },
        {
          path: 'vue-router/*',
          element: 'web-widget',
          attributes: {
            import: '@examples/vue-router'
          }
        },
        {
          path: 'test',
          element: 'test-element',
          attributes: {},
          children: [
            {
              path: '*',
              element: 'web-widget',
              attributes: {
                import: '@examples/404'
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

function handler(request: Request): Response {
  const { pathname } = new URL(request.url);

  // 演示用的静态文件目录
  if (pathname.indexOf('/examples/') === 0 || pathname.indexOf('/dist/') === 0) {
    const url = `${import.meta.url.replace(/\/[^\/]+$/, '')}${pathname}`;
    return fetch(url).then(res => {
      return new Response(res.body, {
        headers: {
          "content-type": "application/javascript",
        },
      });
    });
  }

  return router({
    request,
    routemap,
    importmap,
    layout,
    transforms: [transformWebWidget]
  });
}

serve(handler);

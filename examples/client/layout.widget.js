export async function response() {
  const html = `
    <style>
      nav {
        position: fixed;
        top: 0;
        line-height: 2em;
        border-bottom: 1px solid #ccc;
      }
      a[is="web-link"][active] {
        background: #F00;
        color: #FFF;
      }
      main {
        margin-top: 4em;
      }
    </style>
    <nav>
      <a is="web-link" href="/?xxxx#abcd">Home</a> |
      <a is="web-link" href="/news">News</a> |
      <a is="web-link" href="/about">About</a> |
      <a is="web-link" href="/vue-router">Vue router</a> |
      <a href="https://google.com">Google</a> |
      <a is="web-link" href="/404">404</a>  |
      <button onclick="WebRouter.navigate('https://google.com')">button</button>
    </nav>
    <main>
      <slot></slot>
    </main>
  `;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function mount({ data, container, parameters  }) {
  if (typeof parameters .hydrateonly === 'undefined') {
    const body = await response({ data });
    container.innerHTML = await body.text();
  } else {
    console.log('is ssr!');
  }
}

export async function unmount({ container }) {
  container.innerHTML = '';
}
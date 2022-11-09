export async function data() {
  return {
    "user": "hello wrold"
  }
}

export async function meta() {
  return {
    title: 'About'
  };
}

export async function response({ request, meta = {}, data = {} }) {
  let c = '';
  for (let i = 0; i < 50; i ++) {
    c += `
    <pre>request.url: ${request?.url}</pre>
    <pre>meta: ${JSON.stringify(meta, null, 2)}</pre>
    <pre>data: ${JSON.stringify(data, null, 2)}</pre>
    <p><a href="/about/download">download</a><p></p>
    `;
  }
  
  return new Response(`
  <main>
    <h3>About</h3>
    ${c}
  </main>`, {
    headers: { 'Content-Type': 'text/html' }
  });
}

// export async function bootstrap({ container }) {
//   await new Promise(() => {});
// }

export async function mount({ data, container, parameters  }) {
  console.log('About mount');

  if (typeof parameters .hydrateonly === 'undefined') {
    const body = await response({ data });
    container.innerHTML = await body.text();
  } else {
    console.log('is ssr');
  }
}

export async function unmount({ container }) {
  container.innerHTML = '';
}

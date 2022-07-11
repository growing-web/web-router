export async function meta() {
  return {
    title: 'About'
  };
}

export async function data() {
  return {
    "user": "hello wrold"
  }
}

export async function response({ request, meta = {}, data = {} }) {
  return new Response(`
  <main>
    <h3>About</h3>
    <pre>request.url: ${request?.url}</pre>
    <pre>meta: ${JSON.stringify(meta, null, 2)}</pre>
    <pre>data: ${JSON.stringify(data, null, 2)}</pre>
    <p><a href="/about/download">download</a><p>
  </main>`, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function mount({ data, container, parameters }) {
  console.log('About mount');

  if (typeof parameters.hydrateonly === 'undefined') {
    const body = await response({ data });
    container.innerHTML = await body.text();
  } else {
    console.log('is ssr');
  }
}

export async function unmount({ container }) {
  container.innerHTML = '';
}

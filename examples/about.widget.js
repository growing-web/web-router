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

export async function response({ data = {} }) {
  return new Response(`
  <main>
    <h3>About</h3>
    <pre>${JSON.stringify(data, null, 2)}</pre>
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

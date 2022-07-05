export async function data() {
  return {
    user: 'hahahah'
  }
}

export async function response({ data }) {
  const html = `
    <h3>Home</h3>
    <pre>${JSON.stringify(data, null, 2)}</pre>
  `;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function mount({ container, data, parameters }) {
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

export async function data() {
  return {
    user: 'hahahah'
  }
}

export async function meta() {
  return {
    title: 'Home'
  };
}

export async function response({ data }) {
  let c = '';
  for (let i = 0; i < 50; i ++) {
    c += `
    <pre>${JSON.stringify(data, null, 2)}</pre>
    `;
  }
  const html = `
    <h3>Home</h3>
    ${c}
  `;
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function mount({ container, data, parameters  }) {
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

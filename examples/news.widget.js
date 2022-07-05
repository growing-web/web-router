function guardian() {
  window.addEventListener(
    'navigationwillchange',
    e => {
      // Check if we should navigate away from this page
      if (!confirm('You have unsafed data. Do you wish to discard it?')) {
        e.preventDefault();
        guardian();
      }
    },
    { once: true }
  );
}

export async function data() {
  this.xx = 0;
  return {
    a: 1,
    b: 2
  };
}

export async function response({ data }) {
  const stream = new ReadableStream({
    start(controller) {
      let index = 0;
      const timer = setInterval(() => {
        controller.enqueue(
          new TextEncoder('utf-8').encode(`
            <pre>data: ${JSON.stringify(data, null, 2)}</pre>
            <pre>log: ${Date.now()}</pre>
          `)
        );
        index++;
        if (index > 10) {
          controller.close();
          clearInterval(timer);
        }
      }, 100);
    }
  });

  return new Response(stream, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function mount({ container, data, parameters }) {
  if (typeof parameters.hydrateonly === 'undefined') {
    const body = await response({ data });
    container.innerHTML = await body.text();
  } else {
    console.log('已经被服务端渲染');
  }
}

export async function unmount({ container }) {
  container.innerHTML = '';
}

export async function meta() {
  return {
    title: '404 页面没找到'
  };
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
    status: 404,
    headers: { 'Content-Type': 'text/html' }
  });

  // return new Response(`data: ${JSON.stringify(data)}`, {
  //   status: 404,
  //   headers: new Headers({
  //     'Set-Title': encodeURIComponent('404: 页面未找到')
  //   })
  // });
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

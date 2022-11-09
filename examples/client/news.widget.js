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
      this.timer = setInterval(() => {
        controller.enqueue(
          `
            <pre>data: ${JSON.stringify(data, null, 2)}</pre>
            <pre>log: ${Date.now()}</pre>
          `
        );
        index++;
        if (index > 3) {
          controller.close();
          clearInterval(this.timer);
        }
      }, 1000);
    },
    cancel() {
      clearInterval(this.timer);
    }
  });

  return new Response(stream.pipeThrough(new TextEncoderStream()), {
    headers: { 'Content-Type': 'text/html' }
  });
}

export async function bootstrap({ data, parameters  }) {
  if (typeof parameters .hydrateonly === 'undefined') {
    // 模拟预加载等待
    this.$body = await (await response({ data })).text();
  }
}

export async function mount({ container, data, parameters  }) {
  if (typeof parameters .hydrateonly === 'undefined') {
    container.innerHTML = this.$body;
  } else {
    console.log('已经被服务端渲染');
  }
}

export async function unmount({ container }) {
  container.innerHTML = '';
}

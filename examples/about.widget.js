export async function meta() {
  return {
    title: ''
  };
}
export async function data() {}
export async function body({ data = {} }) {
  return `<main>
  <h3>About</h3>
  <pre>${JSON.stringify(data, null, 2)}</pre>
  <web-widget import="@examples/nav"></web-widget>
  </main>`;
}

export default () => {
  let main;
  console.log('About load');
  return {
    async bootstrap({ data }) {
      console.log('About bootstrap');
      return new Promise(r => setTimeout(r, 1000));
    },
    async mount({ data, container, parameters }) {
      console.log('About mount');

      if (typeof parameters.hydrateonly === 'undefined') {
        main = document.createElement('main');
        main.innerHTML = `
          <h3>About</h3>
          <pre>${JSON.stringify(data, null, 2)}</pre>
          <web-widget import="@examples/nav"></web-widget>
        `;
        container.appendChild(main);
      } else {
        main = container.querySelector('main');
      }
    },
    async unmount({ container }) {
      console.log('About unmount');
      container.removeChild(main);
    }
  };
};

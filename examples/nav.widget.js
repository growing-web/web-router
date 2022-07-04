if (typeof window !== 'undefined') {
  window.$navigate = function (event) {
    window.dispatchEvent(
      new CustomEvent('webrouter:navigate', {
        detail: { path: event.target.getAttribute('href') }
      })
    );
    event.preventDefault();
  };
}

export default ({ parameters } = {}) => {
  let nav;
  console.log('nav load');
  return {
    async bootstrap() {
      console.log('nav bootstrap');
      nav = document.createElement('nav');
    },
    async mount({ container }) {
      console.log('nav mount');
      nav.innerHTML = `
        <a is="web-link" href="/">Home</a> |
        <a is="web-link" href="/news">News</a> |
        <a is="web-link" href="/about">About</a> |
        <a is="web-link" href="/vue-router">Vue router</a> |
        <a is="web-link" href="https://google.com">Google</a> |
        <a is="web-link" href="/404">404</a>  |
        <button onclick="WebRouter.navigate('https://google.com')">button</button>
        <style>
          a[is="web-link"][active] {
            background: #F00;
            color: #FFF;
          }
        </style>
      `;
      container.appendChild(nav);
    },
    async unmount({ container }) {
      console.log('nav unmount');
      container.removeChild(nav);
    }
  };
};

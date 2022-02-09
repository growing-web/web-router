/* global customElements, HTMLElement */
export class HTMLWebRouteElement extends HTMLElement {
  get element() {
    return this.getAttribute('element');
  }

  set element(value) {
    this.setAttribute('element', value);
  }

  get path() {
    return this.getAttribute('path');
  }

  set path(value) {
    this.setAttribute('path', value);
  }

  get index() {
    return this.hasAttribute('index');
  }

  set index(value) {
    if (value) {
      this.setAttribute('index', '');
    } else {
      this.removeAttribute('index');
    }
  }

  get title() {
    return this.getAttribute('title');
  }

  set title(value) {
    this.setAttribute('title', value);
  }
}

customElements.define('web-route', HTMLWebRouteElement);

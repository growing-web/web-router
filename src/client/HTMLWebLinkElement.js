/* eslint-disable no-restricted-globals */
/* global window, document, location, customElements, HTMLAnchorElement */
import { WebRouter } from './WebRouter.js';
import { history, createPath, parsePath } from './history.js';

const STATE = Symbol('state');
const HANDLE_CLICK = Symbol('handle-click');
const HANDLE_NAVIGATION = Symbol('handle-navigation');
const SAME_ORIGIN = Symbol('same-origin');

export class HTMLWebLinkElement extends HTMLAnchorElement {
  constructor() {
    super();
    this[HANDLE_NAVIGATION] = this[HANDLE_NAVIGATION].bind(this);
    this[HANDLE_CLICK] = this[HANDLE_CLICK].bind(this);
  }

  get state() {
    if (!this[STATE]) {
      const json = this.getAttribute('state');

      if (json) {
        try {
          this[STATE] = JSON.parse(json);
        } catch (error) {
          this[STATE] = {};
        }
      }
    }

    return this[STATE];
  }

  set state(value) {
    if (typeof value === 'object') {
      this[STATE] = value;
    }
  }

  get replace() {
    return this.hasAttribute('replace');
  }

  set replace(value) {
    if (value) {
      this.setAttribute('replace', '');
    } else {
      this.removeAttribute('replace');
    }
  }

  get end() {
    return this.hasAttribute('end');
  }

  set end(value) {
    if (value) {
      this.setAttribute('end', '');
    } else {
      this.removeAttribute('end');
    }
  }

  get active() {
    if (!this[SAME_ORIGIN]()) {
      return false;
    }

    let locationPathname = history.location.pathname;
    let toPathname = this.pathname;
    if (!this.caseSensitive) {
      locationPathname = locationPathname.toLowerCase();
      toPathname = toPathname.toLowerCase();
    }

    const isActive =
      locationPathname === toPathname ||
      (!this.end &&
        locationPathname.startsWith(toPathname) &&
        locationPathname.charAt(toPathname.length) === '/');

    return isActive;
  }

  static get observedAttributes() {
    return ['state'];
  }

  connectedCallback() {
    this.addEventListener('click', this[HANDLE_CLICK]);
    window.addEventListener('navigationend', this[HANDLE_NAVIGATION]);
    this[HANDLE_NAVIGATION]();
  }

  disconnectedCallback() {
    this.removeEventListener('click', this[HANDLE_CLICK]);
    window.removeEventListener('navigationend', this[HANDLE_NAVIGATION]);
  }

  attributeChangedCallback(name) {
    if (name === 'state') {
      delete this[STATE];
    }
  }

  [HANDLE_CLICK](event) {
    const location = history.location;
    const target = this.target;
    const isMainButton = event.button === 0;
    const isDefaultPrevented = event.defaultPrevented;
    const isSelf = !target || target === '_self';
    const isModifiedEvent = !!(event.metaKey || event.altKey || event.ctrlKey || event.shiftKey);
    const { pathname, hash, search } = parsePath(this.href);

    if (isMainButton && !isDefaultPrevented && isSelf && !isModifiedEvent) {
      const replace = !!this.replace || createPath(location) === createPath({ pathname, hash, search });
      WebRouter.navigate({ pathname, hash, search }, {
        replace,
        state: this.state
      });
      event.preventDefault();
    }
  }

  [HANDLE_NAVIGATION]() {
    if (this.active) {
      this.setAttribute('active', '');
    } else {
      this.removeAttribute('active');
    }
  }

  [SAME_ORIGIN]() {
    return (
      this.protocol === location.protocol &&
      this.host === location.host &&
      this.port === location.port
    );
  }
}

customElements.define('web-link', HTMLWebLinkElement, { extends: 'a' });

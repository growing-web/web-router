/* eslint-disable no-restricted-globals, class-methods-use-this */
/* global window, document, customElements, HTMLElement, setTimeout */
import { history } from './history.js';
import { matchRoutes } from '../isomorphic/matchRoutes.js';
import { renderToElements } from '../isomorphic/renderElements.js';
import { NavigationChangeEvent } from './NavigationChangeEvent.js';

const CHANGE = Symbol('change');
const ROUTES = Symbol('routes');
const RENDER = Symbol('render');
const LOCATION = Symbol('location');
const UN_HISTORY_LISTEN = Symbol('un-history-listen');

function dispatchNavigationChangeEvent(name, options) {
  return window.dispatchEvent(new NavigationChangeEvent(name, options));
}

// @see https://github.com/hjylewis/trashable
function makeTrashable(promise) {
  let trash = () => {};

  const wrappedPromise = new Promise((resolve, reject) => {
    trash = () => {
      resolve = null;
      reject = null;
    };

    promise.then(
      val => {
        if (resolve) resolve(val);
      },
      error => {
        if (reject) reject(error);
      }
    );
  });

  wrappedPromise.trash = trash;
  return wrappedPromise;
}

function reasonableTime(promise, timeout) {
  return new Promise((resolve, reject) => {
    promise.then(
      () => resolve(promise),
      error => reject(error)
    );
    setTimeout(() => reject(new Error('Timeout')), timeout);
  });
}

function runTasks(tasks, timeout) {
  return makeTrashable(
    timeout ? reasonableTime(Promise.all(tasks), timeout) : Promise.all(tasks)
  );
}

function isAsyncElement(element) {
  return element.load && element.bootstrap && element.mount && element.unload;
}

export class HTMLWebRouterElement extends HTMLElement {
  get outlet() {
    return this;
  }

  get routemap() {
    if (this[ROUTES]) {
      return this[ROUTES];
    }
    this[ROUTES] = JSON.parse(
      document.querySelector(`script[type="routemap"]`).textContent
    );
    return this[ROUTES];
  }

  connectedCallback() {
    const render = (
      update = {
        location: history.location,
        action: history.action
      }
    ) => this[CHANGE](update);
    this[UN_HISTORY_LISTEN] = history.listen(render);

    if (!this.hasAttribute('hydrateonly')) {
      render();
    } else {
      this.removeAttribute('hydrateonly');
    }
  }

  disconnectedCallback() {
    this[UN_HISTORY_LISTEN]();
  }

  renderElements(matches) {
    return renderToElements(matches, { document });
  }

  matchRoutes(to) {
    return matchRoutes(this.routemap.routes, to);
  }

  async [CHANGE]({ location }) {
    const matches = this.matchRoutes(location.pathname);

    if (matches) {
      const oldPathname = this[LOCATION]?.pathname;
      const newPathname = location.pathname;
      const state = location.state;
      const eventInit = { oldPathname, newPathname, state };

      this[LOCATION] = location;
      dispatchNavigationChangeEvent('navigationstart', eventInit);
      try {
        await this.renderMatches(matches);
      } catch (error) {
        dispatchNavigationChangeEvent('navigationerror', eventInit);
        throw error;
      }
      dispatchNavigationChangeEvent('navigationend', eventInit);
    }
  }

  async renderMatches(matches) {
    if (this[RENDER]) {
      this[RENDER].trash();
    }

    const oldElement = this.outlet.querySelector('[routepattern]');
    const oldElements = oldElement
      ? [oldElement, ...oldElement.querySelectorAll('*')]
      : [];
    const oldAsyncElements = oldElements.filter(isAsyncElement);
    const newElement = this.renderElements(matches);
    const newElements = [newElement, ...newElement.querySelectorAll('*')];
    const newAsyncElements = newElements.filter(isAsyncElement);

    await (this[RENDER] = runTasks(
      newAsyncElements.map(element =>
        element.load().then(() => element.bootstrap())
      )
    ));

    await (this[RENDER] = runTasks(
      oldAsyncElements.map(element =>
        element.unmount().then(() => element.unload())
      ),
      2000
    )).catch(() => console.error);

    oldElement?.parentNode?.removeChild(oldElement);
    this.outlet.appendChild(newElement);

    await (this[RENDER] = runTasks(
      newAsyncElements.map(element => element.mount())
    ));

    delete this[RENDER];
  }
}

customElements.define('web-router', HTMLWebRouterElement);

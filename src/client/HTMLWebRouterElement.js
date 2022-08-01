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

function reasonableTime(promise, timeout, ignore) {
  return new Promise((resolve, reject) => {
    promise.then(
      () => resolve(promise),
      error => reject(error)
    );
    setTimeout(
      () => (ignore ? resolve() : reject(new Error('Timeout'))),
      timeout
    );
  });
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
    if (!this[LOCATION] || this[LOCATION].pathname !== location.pathname) {
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
  }

  async renderMatches(matches) {
    if (this[RENDER]) {
      this[RENDER].trash();
    }

    const activePaths = matches.map(({ path }) => path);
    const inactiveElements = [
      ...this.outlet.querySelectorAll('[routepattern]')
    ].filter(
      element => !activePaths.includes(element.getAttribute('routepattern'))
    );

    const element = this.renderElements(matches);
    const flattenElements = [element, ...element.querySelectorAll('*')];
    const asyncElementFilter = element =>
      element.load && element.bootstrap && element.mount && element.unload;
    const asyncElements = flattenElements.filter(asyncElementFilter);
    const task = (tasks, timeout, ignore) =>
      makeTrashable(
        timeout
          ? reasonableTime(Promise.all(tasks), timeout, ignore)
          : Promise.all(tasks)
      );

    asyncElements.forEach(element => {
      element.hidden = true;
      element.setAttribute('inactive', '');
    });
    this.outlet.appendChild(element);

    // Prefetch next widget file
    await (this[RENDER] = task(asyncElements.map(element => element.load())));

    // Display widget title
    // document.title =
    //   matches
    //     .map(({ route }) => route.title)
    //     .filter(title => typeof title === 'string')
    //     .pop() || document.title;

    // Initialize the next widget
    await (this[RENDER] = task(
      asyncElements.map(element => element.bootstrap())
    ));

    // Unload widget
    await (this[RENDER] = task(
      inactiveElements
        .filter(asyncElementFilter)
        .map(element => element.unload()),
      1000,
      true
    ));

    inactiveElements.forEach(element => {
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    });

    // Mount next widget
    await (this[RENDER] = task(asyncElements.map(element => element.mount())));

    asyncElements.forEach(element => {
      element.hidden = false;
      element.removeAttribute('inactive');
    });

    delete this[RENDER];
  }
}

customElements.define('web-router', HTMLWebRouterElement);

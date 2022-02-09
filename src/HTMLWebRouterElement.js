/* eslint-disable no-restricted-globals, class-methods-use-this */
/* global window, document, customElements, HTMLElement */
import { history } from './history.js';
import { matchRoutes, makeTrashable, reasonableTime } from './utils.js';
import { NavigationChangeEvent } from './NavigationChangeEvent.js';

const CHANGE = Symbol('change');
const ROUTES = Symbol('routes');
const RENDER = Symbol('render');
const LOCATION = Symbol('location');
const UN_HISTORY_LISTEN = Symbol('un-history-listen');

function dispatchNavigationChangeEvent(name, options) {
  return window.dispatchEvent(new NavigationChangeEvent(name, options));
}

export class HTMLWebRouterElement extends HTMLElement {
  get outlet() {
    return this;
  }

  /**
   * Get all routes from the direct web-route child element.
   * The document title can be updated by providing an
   * title attribute to the web-route tag
   */
  get routes() {
    if (this[ROUTES]) {
      return this[ROUTES];
    }
    const getRoutes = context => {
      const routes = [];
      const ignore = ['path', 'element', 'index', 'title'];

      for (const node of context.children) {
        if (node.localName === 'web-route') {
          routes.push({
            path: node.path,
            title: node.title,
            element: node.element,
            index: node.index,
            children: getRoutes(node),
            attributes: [...node.attributes].reduce(
              (accumulator, { name, value }) => {
                if (!ignore.includes(name)) {
                  accumulator[name] = value;
                }
                return accumulator;
              },
              {}
            )
          });
        }
      }

      return routes;
    };

    this[ROUTES] = getRoutes(this);
    return this[ROUTES];
  }

  connectedCallback() {
    const change = (
      update = {
        location: history.location,
        action: history.action
      }
    ) => this[CHANGE](update);
    this[UN_HISTORY_LISTEN] = history.listen(change);

    // TODO SSR
    change();
  }

  disconnectedCallback() {
    this[UN_HISTORY_LISTEN]();
  }

  createElement(matches) {
    if (matches == null) return null;
    return matches.reduceRight((outlet, match) => {
      let element;
      if (match.route.element) {
        element = document.createElement(match.route.element, {
          is: match.route.attributes.is
        });

        const routePath = ['routepattern', match.pathname];
        const routeParams = Object.entries(match.params)
          .filter(([name]) => name !== '*')
          .map(([name, value]) => [`routeparam-${name}`, value]);
        [
          ...Object.entries(match.route.attributes),
          routePath,
          ...routeParams
        ].forEach(([name, value]) => {
          element.setAttribute(name, value);
        });

        element.router = {
          history,
          location: history.location
        };
        element.route = {
          path: match.route.path,
          params: match.params
        };
      } else {
        element = document.createDocumentFragment();
      }

      if (outlet) {
        element.appendChild(outlet);
      }

      return element;
    }, null);
  }

  matchRoutes(to) {
    return matchRoutes(this.routes, to);
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
      element =>
        element.localName !== 'web-route' &&
        !activePaths.includes(element.getAttribute('routepattern'))
    );

    const element = this.createElement(matches);
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
    document.title =
      matches
        .map(({ route }) => route.title)
        .filter(title => typeof title === 'string')
        .pop() || document.title;

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

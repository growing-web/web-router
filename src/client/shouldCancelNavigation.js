/* global window */
import { NavigationChangeEvent } from './NavigationChangeEvent.js';
import { history } from './history.js';

let oldPathname = history.location.pathname;
export function shouldCancelNavigation(to, { state } = {}) {
  const newPathname = to;

  const eventInit = {
    cancelable: true,
    oldPathname,
    newPathname,
    state
  };

  oldPathname = to;
  return window.dispatchEvent(
    new NavigationChangeEvent('navigationwillchange', eventInit)
  );
}

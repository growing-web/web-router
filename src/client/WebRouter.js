/* global window */

import { history } from './history.js';
import { shouldCancelNavigation } from './shouldCancelNavigation.js';

export class WebRouter {
  static navigate(to, { replace, state = {} } = {}) {
    if (shouldCancelNavigation(to, { state })) {
      if (replace) {
        history.replace(to, state);
      } else {
        history.push(to, state);
      }
    }
  }
}

window.WebRouter = WebRouter;

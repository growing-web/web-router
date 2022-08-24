import { history } from './history.js';
import { SCROLL_POSITIONS } from '../isomorphic/keys.js';

let positions = {};


const sessionPositions = sessionStorage.getItem(SCROLL_POSITIONS);
if (sessionPositions) {
  positions = JSON.parse(sessionPositions);
}
const getCurrentLocation = () => history.location;

window.addEventListener('navigationwillchange', function() {
  const location = getCurrentLocation();
  positions[location.key] = window.scrollY;
});

window.addEventListener('navigationend', function () {
  const location = getCurrentLocation();
  const y = positions[location.key];

  // been here before, scroll to it
  if (y != undefined) {
    window.scrollTo(0, y);
    return;
  }

  // try to scroll to the hash
  if (location.hash) {
    const el = document.getElementById(location.hash.slice(1));
    if (el) {
      el.scrollIntoView();
      return;
    }
  }

  // otherwise go to the top on new locations
  window.scrollTo(0, 0);
});

// wait for the browser to restore it on its own
window.history.scrollRestoration = 'manual';

// let the browser restore on it's own for refresh
window.addEventListener('beforeunload', () => {
  window.history.scrollRestoration = 'auto';
  sessionStorage.setItem(SCROLL_POSITIONS, JSON.stringify(positions));
});

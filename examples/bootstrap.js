import '@ungap/custom-elements'; // safari
import {
  HTMLWebWidgetElement,
  WebWidgetDependencies
} from '@web-widget/container';
import { HTMLWebRouterElement } from '@growing-web/web-router';

function defineHook(target, name, callback) {
  return Reflect.defineProperty(
    target,
    name,
    callback(Reflect.getOwnPropertyDescriptor(target, name))
  );
}

defineHook(WebWidgetDependencies.prototype, 'data', ({ get }) => {
  const isRouterApp = widget =>
    [...document.querySelectorAll('web-router')].some(router =>
      router.outlet.contains(widget)
    );
  const getRootAppData = () => {
    const element = document.querySelector(
      'script[type="application/pfd+json"]'
    );
    if (element) {
      try {
        return JSON.parse(element.textContent);
      } catch (error) {}
    }
    return null;
  };
  return {
    get() {
      const data = get.apply(this, arguments);
      if (isRouterApp(this.ownerElement)) {
        const rootAppData = getRootAppData();
        return { ...rootAppData, ...data };
      }
      return data;
    }
  };
});

window.addEventListener('navigationwillchange', event => {
  console.log(
    'oldPathname',
    event.oldPathname,
    'newPathname',
    event.newPathname
  );
});

/* global Event */
const OLD_PATHNAME = Symbol('old-pathname');
const NEW_PATHNAME = Symbol('new-pathname');
const STATE = Symbol('state');

export class NavigationChangeEvent extends Event {
  constructor(type, init = {}) {
    super(type, init);
    this[NEW_PATHNAME] = init.newPathname;
    this[OLD_PATHNAME] = init.oldPathname;
    this[STATE] = init.state;
  }

  get newPathname() {
    return this[NEW_PATHNAME];
  }

  get oldPathname() {
    return this[OLD_PATHNAME];
  }

  get state() {
    return this[STATE];
  }
}

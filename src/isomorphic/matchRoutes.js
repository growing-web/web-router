/* global console */

function invariant(cond, message) {
  if (!cond) throw new Error(message);
}

function warning(cond, message) {
  if (!cond) {
    // eslint-disable-next-line no-console
    if (typeof console !== 'undefined') console.warn(message);

    try {
      // Welcome to debugging React Router!
      //
      // This error is thrown as a convenience so you can more easily
      // find the source for a warning that appears in the console by
      // enabling "pause on exceptions" in your JavaScript debugger.
      throw new Error(message);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}

/**
 * Parses a string URL path into its separate pathname, search, and hash components.
 *
 * @see https://github.com/remix-run/history/tree/main/docs/api-reference.md#parsepath
 */
function parsePath(path) {
  const parsedPath = {};

  if (path) {
    const hashIndex = path.indexOf('#');
    if (hashIndex >= 0) {
      parsedPath.hash = path.substr(hashIndex);
      path = path.substr(0, hashIndex);
    }

    const searchIndex = path.indexOf('?');
    if (searchIndex >= 0) {
      parsedPath.search = path.substr(searchIndex);
      path = path.substr(0, searchIndex);
    }

    if (path) {
      parsedPath.pathname = path;
    }
  }

  return parsedPath;
}

// @see https://github.com/remix-run/react-router/blob/main/packages/react-router/index.tsx#L1188
function compilePath(path, caseSensitive = false, end = true) {
  warning(
    path === '*' || !path.endsWith('*') || path.endsWith('/*'),
    `Route path "${path}" will be treated as if it were ` +
      `"${path.replace(/\*$/, '/*')}" because the \`*\` character must ` +
      `always follow a \`/\` in the pattern. To get rid of this warning, ` +
      `please change the route path to "${path.replace(/\*$/, '/*')}".`
  );

  const paramNames = [];
  let regexpSource = `^${path
    .replace(/\/*\*?$/, '') // Ignore trailing / and /*, we'll handle it below
    .replace(/^\/*/, '/') // Make sure it has a leading /
    .replace(/[\\.*+^$?{}|()[\]]/g, '\\$&') // Escape special regex chars
    .replace(/:(\w+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^\\/]+)';
    })}`;

  if (path.endsWith('*')) {
    paramNames.push('*');
    regexpSource +=
      path === '*' || path === '/*'
        ? '(.*)$' // Already matched the initial /, just match the rest
        : '(?:\\/(.+)|\\/*)$'; // Don't include the / in params["*"]
  } else {
    regexpSource += end
      ? '\\/*$' // When matching to the end, ignore trailing slashes
      : // Otherwise, match a word boundary or a proceeding /. The word boundary restricts
        // parent routes to matching only their own words and nothing more, e.g. parent
        // route "/home" should not match "/home2".
        '(?:\\b|\\/|$)';
  }

  const matcher = new RegExp(regexpSource, caseSensitive ? undefined : 'i');

  return [matcher, paramNames];
}

function safelyDecodeURIComponent(value, paramName) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    warning(
      false,
      `The value for the URL param "${paramName}" will not be decoded because` +
        ` the string "${value}" is a malformed URL segment. This is probably` +
        ` due to a bad percent encoding (${error}).`
    );

    return value;
  }
}

/**
 * Performs pattern matching on a URL pathname and returns information about
 * the match.
 *
 * @see https://reactrouter.com/docs/en/v6/api#matchpath
 */
function matchPath(pattern, pathname) {
  if (typeof pattern === 'string') {
    pattern = { path: pattern, caseSensitive: false, end: true };
  }

  const [matcher, paramNames] = compilePath(
    pattern.path,
    pattern.caseSensitive,
    pattern.end
  );

  const match = pathname.match(matcher);
  if (!match) return null;

  const matchedPathname = match[0];
  let pathnameBase = matchedPathname.replace(/(.)\/+$/, '$1');
  const captureGroups = match.slice(1);
  const params = paramNames.reduce((memo, paramName, index) => {
    // We need to compute the pathnameBase here using the raw splat value
    // instead of using params["*"] later because it will be decoded then
    if (paramName === '*') {
      const splatValue = captureGroups[index] || '';
      pathnameBase = matchedPathname
        .slice(0, matchedPathname.length - splatValue.length)
        .replace(/(.)\/+$/, '$1');
    }

    memo[paramName] = safelyDecodeURIComponent(
      captureGroups[index] || '',
      paramName
    );
    return memo;
  }, {});

  return {
    params,
    pathname: matchedPathname,
    pathnameBase,
    pattern
  };
}

function stripBasename(pathname, basename) {
  if (basename === '/') return pathname;

  if (!pathname.toLowerCase().startsWith(basename.toLowerCase())) {
    return null;
  }

  const nextChar = pathname.charAt(basename.length);
  if (nextChar && nextChar !== '/') {
    // pathname does not start with basename/
    return null;
  }

  return pathname.slice(basename.length) || '/';
}

const joinPaths = paths => paths.join('/').replace(/\/\/+/g, '/');

function flattenRoutes(
  routes,
  branches = [],
  parentsMeta = [],
  parentPath = ''
) {
  routes.forEach((route, index) => {
    const meta = {
      relativePath: route.path || '',
      caseSensitive: route.caseSensitive === true,
      childrenIndex: index,
      route
    };

    if (meta.relativePath.startsWith('/')) {
      invariant(
        meta.relativePath.startsWith(parentPath),
        `Absolute route path "${meta.relativePath}" nested under path ` +
          `"${parentPath}" is not valid. An absolute child route path ` +
          `must start with the combined path of all its parent routes.`
      );

      meta.relativePath = meta.relativePath.slice(parentPath.length);
    }

    const path = joinPaths([parentPath, meta.relativePath]);
    const routesMeta = parentsMeta.concat(meta);

    // Add the children before adding this route to the array so we traverse the
    // route tree depth-first and child routes appear before their parents in
    // the "flattened" version.
    if (route.children && route.children.length > 0) {
      invariant(
        route.index !== true,
        `Index routes must not have child routes. Please remove ` +
          `all child routes from route path "${path}".`
      );

      flattenRoutes(route.children, branches, routesMeta, path);
    }

    // Routes without a path shouldn't ever match by themselves unless they are
    // index routes, so don't add them to the list of possible branches.
    if (route.path == null && !route.index) {
      return;
    }

    branches.push({
      path,
      /* score: computeScore(path, route.index), */
      routesMeta
    });
  });

  return branches;
}

function matchRouteBranch(branch, pathname) {
  const { routesMeta } = branch;

  const matchedParams = {};
  let matchedPathname = '/';
  const matches = [];
  for (let i = 0; i < routesMeta.length; ++i) {
    const meta = routesMeta[i];
    const end = i === routesMeta.length - 1;
    const remainingPathname =
      matchedPathname === '/'
        ? pathname
        : pathname.slice(matchedPathname.length) || '/';
    const match = matchPath(
      { path: meta.relativePath, caseSensitive: meta.caseSensitive, end },
      remainingPathname
    );

    if (!match) return null;

    Object.assign(matchedParams, match.params);

    const route = meta.route;

    matches.push({
      params: matchedParams,
      pathname: joinPaths([matchedPathname, match.pathname]),
      pathnameBase: joinPaths([matchedPathname, match.pathnameBase]),
      route
    });

    if (match.pathnameBase !== '/') {
      matchedPathname = joinPaths([matchedPathname, match.pathnameBase]);
    }
  }

  return matches;
}

/**
 * Matches the given routes to a location and returns the match data.
 *
 * @see https://reactrouter.com/docs/en/v6/api#matchroutes
 */
export function matchRoutes(routes, locationArg, basename = '/') {
  const location =
    typeof locationArg === 'string' ? parsePath(locationArg) : locationArg;

  const pathname = stripBasename(location.pathname || '/', basename);

  if (pathname == null) {
    return null;
  }

  const branches = flattenRoutes(routes);

  let matches = null;
  for (let i = 0; matches == null && i < branches.length; ++i) {
    matches = matchRouteBranch(branches[i], pathname);
  }

  return matches;
}

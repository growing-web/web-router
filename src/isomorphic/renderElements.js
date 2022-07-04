export function create(matches, creator) {
  if (matches == null) return null;
  return matches.reduceRight((children, match) => {
    const { element } = match.route;
    const routePath = { routepattern: match.pathname };
    const routeParams = Object.entries(match.params)
      .filter(([name]) => name !== '*')
      .reduce((previousValue, [name, value]) => {
        previousValue[`routeparam-${name}`] = value;
        return previousValue;
      }, {});

    const attributes = {
      ...match.route.attributes,
      ...routePath,
      ...routeParams
    };

    return creator(element, attributes, children);
  }, null);
}

export function renderToElements(matches, { document } = {}) {
  return create(matches, (element, attributes, children) => {
    let node;
    if (element) {
      node = document.createElement(element, {
        is: attributes.is
      });
      Object.entries(attributes).forEach(([name, value]) => {
        node.setAttribute(name, value);
      });
    } else {
      node = document.createDocumentFragment();
    }

    if (children) {
      node.appendChild(children);
    }

    return node;
  });
}

export function renderToString(matches) {
  const escapeAttributeValue = value => value.replace(/"/g, '&quot;');
  return create(matches, (element, attributes, children) => {
    let tag = '';

    if (element) {
      const attrs = Object.entries(attributes).map(([name, value]) =>
        value ? `${name}="${escapeAttributeValue(value)}"` : name
      );
      tag = `<${[element, ...attrs].join(' ')}>${children || ''}</${element}>`;
    }

    return tag;
  });
}

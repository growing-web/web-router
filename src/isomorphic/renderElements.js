export function create(matches, creator) {
  if (matches == null) return null;
  return matches.reduceRight((content, match) => {
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

    return creator(element, attributes, content);
  }, null);
}

export function renderToElements(matches, { document } = {}) {
  return create(matches, (element, attributes, content) => {
    if (element) {
      const node = document.createElement(element, {
        is: attributes.is
      });
      Object.entries(attributes).forEach(([name, value]) => {
        node.setAttribute(name, value);
      });
      if (content) {
        node.appendChild(content);
      }
      return node;
    }

    return content || document.createDocumentFragment();
  });
}

export function renderToString(matches) {
  const escapeAttributeValue = value => value.replace(/"/g, '&quot;');
  return create(matches, (element, attributes, content) => {
    if (element) {
      const attrs = Object.entries(attributes).map(([name, value]) =>
        value ? `${name}="${escapeAttributeValue(value)}"` : name
      );
      return `<${[element, ...attrs].join(' ')}>${content || ''}</${element}>`;
    }

    return content || '';
  });
}

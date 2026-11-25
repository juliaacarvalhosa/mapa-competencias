(function () {
  let nextId = 0;

  window.compactMapList = function (list) {
    const previous = list.nextElementSibling;
    if (previous && previous.classList.contains('list-toggle')) previous.remove();
    const cards = Array.from(list.children).filter(function (child) {
      return !list.classList.contains('section-block') || child.matches('.market-card');
    });
    const extra = cards.slice(4);
    if (!extra.length) return;
    extra.forEach(card => card.classList.add('compact-extra'));
    list.classList.remove('list-expanded');
    if (!list.id) list.id = 'map-list-' + (++nextId);

    const button = document.createElement('button');
    const label = 'Ver todos (' + cards.length + ')';
    button.type = 'button';
    button.className = 'list-toggle';
    button.textContent = label;
    button.setAttribute('aria-controls', list.id);
    button.setAttribute('aria-expanded', 'false');
    button.addEventListener('click', function () {
      const expanded = list.classList.toggle('list-expanded');
      button.setAttribute('aria-expanded', String(expanded));
      button.textContent = expanded ? 'Mostrar menos' : label;
      if (expanded) {
        const first = extra[0];
        first.tabIndex = first.tabIndex < 0 ? -1 : first.tabIndex;
        first.focus();
      }
    });
    list.after(button);
  };
})();

/* Progressive enhancement keeps generated information readable without JS. */
export function bindInformationTabs() {
  const page = document.querySelector('[data-information-tabs]');
  if (!page) return;
  const list = page.querySelector('nav');
  const tabs = [...list.querySelectorAll('a')];
  const panels = tabs.map(tab => page.querySelector(tab.getAttribute('href')));
  list.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.id = `tab-${panels[index].id}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panels[index].id);
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].setAttribute('aria-labelledby', tab.id);
    panels[index].tabIndex = 0;
  });
  const activate = index => tabs.forEach((tab, i) => {
    tab.setAttribute('aria-selected', String(i === index));
    tab.tabIndex = i === index ? 0 : -1;
    panels[i].hidden = i !== index;
  });
  const fromHash = () => activate(Math.max(0, panels.findIndex(panel => `#${panel.id}` === location.hash)));
  const select = index => {
    activate(index);
    history.replaceState(null, '', tabs[index].getAttribute('href'));
  };
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', event => { event.preventDefault(); select(index); });
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
      if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next === undefined) return;
      event.preventDefault();
      select(next);
      tabs[next].focus();
    });
  });
  addEventListener('hashchange', fromHash);
  fromHash();
}

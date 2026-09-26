/* Shared menu lifecycle. CSS owns motion; native links retain their destinations. */
export function bindMenu({ openLabel, closeLabel }) {
  const toggle = document.querySelector('[data-menu-toggle]');
  const menu = document.querySelector('[data-menu]');
  if (!toggle || !menu) return;
  const background = [...document.querySelectorAll('main, [data-fragment="footer"], [data-theme-toggle]')];
  let isOpen = false;
  const root = document.documentElement;
  const navigation = document.querySelector('[data-site-navigation], .site-navigation');
  let previousY = Math.max(0, window.scrollY);
  let pending = false;
  const revealHeader = () => root.removeAttribute('data-header-hidden');
  navigation?.addEventListener('focusin', revealHeader);
  window.addEventListener('scroll', () => {
    if (pending) return;
    pending = true;
    requestAnimationFrame(() => {
      pending = false;
      const y = Math.max(0, window.scrollY);
      if (isOpen || y <= 8 || navigation?.querySelector(':focus-visible')) {
        revealHeader();
        previousY = y;
      } else if (Math.abs(y - previousY) > 8) {
        root.toggleAttribute('data-header-hidden', y > previousY);
        previousY = y;
      }
    });
  }, { passive: true });
  window.addEventListener('pageshow', () => { previousY = Math.max(0, window.scrollY); revealHeader(); });
  const setOpen = value => {
    isOpen = value;
    revealHeader();
    previousY = Math.max(0, window.scrollY);
    menu.inert = !value;
    menu.setAttribute('aria-hidden', String(!value));
    toggle.setAttribute('aria-expanded', String(value));
    toggle.setAttribute('aria-label', value ? closeLabel : openLabel);
    document.documentElement.toggleAttribute('data-menu-open', value);
    document.body.toggleAttribute('data-menu-locked', value);
    background.forEach(element => { element.inert = value; });
  };
  setOpen(false);
  document.documentElement.setAttribute('data-menu-ready', '');
  menu.hidden = false;
  toggle.hidden = false;
  toggle.addEventListener('click', () => setOpen(!isOpen));
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) { setOpen(false); if (event.detail === 0) toggle.focus(); }
  });
  document.addEventListener('keydown', event => {
    if (!isOpen) return;
    if (event.key === 'Escape') { setOpen(false); toggle.focus(); }
    if (event.key === 'Tab') {
      const targets = [toggle, ...menu.querySelectorAll('a[href]')];
      const index = targets.indexOf(document.activeElement);
      if (event.shiftKey && index <= 0) { event.preventDefault(); targets.at(-1).focus(); }
      else if (!event.shiftKey && (index === targets.length - 1 || index < 0)) { event.preventDefault(); toggle.focus(); }
    }
  });
}

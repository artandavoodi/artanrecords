/* Pre-paint theme; readiness ends loading immediately, with native load as fallback. */
(() => {
  const root = document.documentElement;
  try {
    const theme = localStorage.getItem('artanrecords-theme') === 'dark' ? 'dark' : 'light';
    root.dataset.theme = theme;
    root.dataset.themeEffective = theme;
  } catch { /* Storage is optional. */ }
  root.dataset.loading = 'true';
  const finish = () => {
    delete root.dataset.loading;
  };
  window.addEventListener('site:ready', finish, {once: true});
  window.addEventListener('load', finish, {once: true});
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
})();

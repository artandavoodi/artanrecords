/* Pre-paint theme and bounded loading lifecycle; static HTML remains the fallback. */
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
    clearTimeout(timeout);
  };
  const timeout = setTimeout(finish, 8000);
  window.addEventListener('site:ready', finish, {once: true});
  window.addEventListener('pageshow', event => { if (event.persisted) finish(); });
})();

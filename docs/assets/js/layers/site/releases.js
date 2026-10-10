/* Enhance server-rendered catalogue cards; JSON remains the content authority. */
export function bindReleaseDiscovery() {
  const section = document.querySelector('[data-release-discovery]');
  if (!section) return;
  const form = section.querySelector('form');
  const cards = [...section.querySelectorAll('[data-release-search]')];
  const empty = section.querySelector('[data-release-empty]');
  const normalize = value => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const filter = () => {
    const terms = normalize(form.elements.query.value).trim().split(/\s+/).filter(Boolean);
    let visible = 0;
    for (const card of cards) {
      const matches = terms.every(term => normalize(card.dataset.releaseSearch).includes(term))
        && (!form.elements.category.value || card.dataset.releaseCategory === form.elements.category.value)
        && (!form.elements.artist.value || card.dataset.releaseArtist === form.elements.artist.value);
      card.hidden = !matches;
      visible += Number(matches);
    }
    empty.hidden = visible > 0;
  };
  form.addEventListener('submit', event => event.preventDefault());
  form.addEventListener('input', filter);
  form.addEventListener('change', filter);
  form.hidden = false;
  filter();
}

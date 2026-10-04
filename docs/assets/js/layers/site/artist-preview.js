/* Preview entries never become public artists, profile routes or structured data. */
export async function bindArtistPreview() {
  if (!['localhost', '127.0.0.1', '::1'].includes(location.hostname)) return;
  const roster = document.querySelector('main[data-fragment="artists"] .artist-roster');
  if (!roster) return;
  const response = await fetch('/assets/data/artists/roster.json');
  if (!response.ok) return;
  const config = await response.json();
  const tokens = getComputedStyle(document.documentElement);
  for (const artist of config.previewItems || []) {
    const card = document.createElement('article');
    card.className = 'artist-card';
    card.setAttribute('aria-label', `${artist.name}, preview placeholder`);
    const frame = document.createElement('div');
    frame.className = 'artist-card__preview';
    const figure = document.createElement('figure');
    const image = document.createElement('img');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 1 1');
    const rect = document.createElementNS(svg.namespaceURI, 'rect');
    rect.setAttribute('width', '1');
    rect.setAttribute('height', '1');
    rect.setAttribute('fill', tokens.getPropertyValue(artist.colorToken).trim());
    svg.append(rect);
    image.src = `data:image/svg+xml,${encodeURIComponent(new XMLSerializer().serializeToString(svg))}`;
    image.alt = '';
    const name = document.createElement('h3');
    name.textContent = artist.name;
    figure.append(image);
    frame.append(figure, name);
    card.append(frame);
    roster.append(card);
  }
}

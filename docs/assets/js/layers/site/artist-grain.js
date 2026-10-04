/* Local decorative grain; configuration is owned by the artist directory JSON. */
export async function bindArtistGrain() {
  const canvas = document.querySelector('.artist-directory-grain');
  if (!canvas) return;
  const response = await fetch('/assets/data/artists/roster.json');
  if (!response.ok) return;
  const {grain} = await response.json();
  if (!grain) return;
  const context = canvas.getContext('2d');
  const tile = document.createElement('canvas');
  tile.width = tile.height = grain.tileSize;
  const tileContext = tile.getContext('2d');
  if (!context || !tileContext) return;
  canvas.style.setProperty('--artist-grain-opacity', grain.opacity);
  const pixels = tileContext.createImageData(tile.width, tile.height);
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  let visible = false;
  let timer;
  function paint() {
    for (let i = 0; i < pixels.data.length; i += 4) {
      const value = Math.random() < 0.5 ? 0 : 255;
      pixels.data[i] = pixels.data[i + 1] = pixels.data[i + 2] = value;
      pixels.data[i + 3] = 255;
    }
    tileContext.putImageData(pixels, 0, 0);
    context.fillStyle = context.createPattern(tile, 'repeat');
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  function schedule() {
    clearTimeout(timer);
    if (!visible || document.hidden || motion.matches) return;
    timer = setTimeout(() => { paint(); schedule(); }, 1000 / grain.framesPerSecond);
  }
  const roster = document.querySelector('.artist-roster');
  const resize = new ResizeObserver(() => {
    const height = Math.max(1, Math.round(roster.getBoundingClientRect().top + scrollY));
    canvas.style.blockSize = `${height}px`;
    canvas.width = Math.max(1, Math.round(document.body.clientWidth));
    canvas.height = height;
    paint();
  });
  resize.observe(document.querySelector('.artist-directory-intro'));
  resize.observe(document.querySelector('[data-fragment="navigation"]'));
  const intersection = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    schedule();
  });
  intersection.observe(canvas);
  document.addEventListener('visibilitychange', schedule);
  motion.addEventListener('change', schedule);
}

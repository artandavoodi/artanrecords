/* Progressive enhancement: the full editorial flow stays visible without JavaScript. */
export function bindArtistJourney() {
  const journey = document.querySelector('.artist-journey');
  if (!journey || !('IntersectionObserver' in window)) return;
  const steps = journey.querySelectorAll('[data-journey-step]');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      entry.target.setAttribute('data-visible', '');
      observer.unobserve(entry.target);
    }
  }, {threshold: 0.1});
  steps.forEach(step => observer.observe(step));
  journey.setAttribute('data-motion-ready', '');
}

export async function bindJourneyScenes() {
  const elements = [...document.querySelectorAll('[data-journey-scene]')];
  if (!elements.length || !('IntersectionObserver' in window)) return;
  const response = await fetch('/assets/data/artists/journey-scenes.json');
  if (!response.ok) return;
  const {scenes} = await response.json();
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const states = new Map(elements.map(element => {
    const scene = scenes.find(item => item.id === element.dataset.journeyScene);
    const animations = [...element.children].map((shape, index) => {
      const animation = shape.animate(scene.keyframes, {duration: scene.duration, delay: index * scene.duration / scene.elements.length, iterations: Infinity, easing: 'ease-in-out'});
      animation.pause();
      return animation;
    });
    return [element, {animations, visible: false}];
  }));
  function update() {
    for (const state of states.values()) {
      for (const animation of state.animations) {
        if (reduced.matches) { animation.pause(); animation.currentTime = 0; }
        else if (state.visible && !document.hidden) animation.play();
        else animation.pause();
      }
    }
  }
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) states.get(entry.target).visible = entry.isIntersecting;
    update();
  });
  elements.forEach(element => observer.observe(element));
  reduced.addEventListener('change', update);
  document.addEventListener('visibilitychange', update);
  update();
}

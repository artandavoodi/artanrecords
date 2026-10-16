/* Progressive enhancement: the full editorial flow stays visible without JavaScript. */
export function journeyFocusProgress(center,height){
  const progress=Math.max(0,Math.min(1,(height*0.82-center)/(height*0.32)));
  return progress*progress*(3-2*progress);
}
export function bindArtistJourney() {
  const journey = document.querySelector('.artist-journey');
  if (!journey || journey.hasAttribute('data-motion-ready') || !('IntersectionObserver' in window)) return;
  const steps = journey.querySelectorAll('[data-journey-step]');
  const hero=journey.querySelector('.artist-journey__hero');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const anchors=new Map();
  const measureFocus=()=>{
    for(const step of steps){
      const copy=step.querySelector('.artist-journey__copy');
      const rect=copy.getBoundingClientRect();
      const heading=copy.querySelector('h2');
      anchors.set(step,rect.top+scrollY+heading.offsetTop+heading.offsetHeight/2);
    }
  };
  let frame=0;
  const updateFocus=()=>{
    frame=0;
    for(const step of steps){
      const progress=reduced.matches?1:journeyFocusProgress(anchors.get(step)-scrollY,innerHeight);
      step.style.setProperty('--journey-focus',String(progress));
    }
    if(hero){
      const progress=reduced.matches?0:Math.max(0,Math.min(1,scrollY/hero.getBoundingClientRect().height));
      hero.style.setProperty('--journey-hero-focus',String(Math.min(1,progress/0.6)));
      hero.style.setProperty('--journey-hero-exit',String(Math.max(0,Math.min(1,(progress-0.65)/0.2))));
    }
  };
  const scheduleFocus=()=>{if(!frame)frame=requestAnimationFrame(updateFocus);};
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      entry.target.toggleAttribute('data-visible',entry.isIntersecting);
    }
    scheduleFocus();
  }, {threshold: 0,rootMargin:'0px 0px -8% 0px'});
  steps.forEach(step => observer.observe(step));
  journey.setAttribute('data-motion-ready', '');
  addEventListener('scroll',scheduleFocus,{passive:true});
  addEventListener('resize',()=>{measureFocus();scheduleFocus();});
  reduced.addEventListener('change',scheduleFocus);
  measureFocus();
  updateFocus();
  document.fonts?.ready.then(()=>{measureFocus();scheduleFocus();});
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
      const delay=(scene.phase==='distributed'?-1:1)*index*scene.duration/scene.elements.length;
      const animation = shape.animate(scene.keyframes, {duration: scene.duration, delay, iterations: Infinity, easing: 'ease-in-out'});
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

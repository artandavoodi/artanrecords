/* Soft color fields contained by homepage content, never by the footer. */
export function bindHomeAtmosphere(){
  const home=document.querySelector('main[data-fragment="home"]');
  const atmosphere=home?.querySelector('[data-home-atmosphere]');
  if(!atmosphere||atmosphere.hasAttribute('data-bound'))return;
  atmosphere.setAttribute('data-bound','');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let visible=false;
  const playback=()=>atmosphere.toggleAttribute('data-playing',visible&&!document.hidden&&!reduced.matches);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;playback();});
    observer.observe(home);
  }
  document.addEventListener('visibilitychange',playback);
  reduced.addEventListener('change',playback);
}

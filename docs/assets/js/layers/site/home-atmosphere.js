/* Scroll-following score contained by homepage content, never by the footer. */
export function homeAtmosphereProgress(top,height,viewport){
  return Math.max(0,Math.min(1,(viewport/2-top)/Math.max(1,height)));
}
export function homeAtmosphereSoftness(progress,min,max,softOpacity){
  const phase=Math.sin(Math.max(0,Math.min(1,progress))*Math.PI*2)**2;
  return {blur:Math.round((min+(max-min)*phase)*10)/10,opacity:1-(1-softOpacity)*phase};
}
export function bindHomeAtmosphere(){
  const home=document.querySelector('main[data-fragment="home"]');
  const atmosphere=home?.querySelector('[data-home-atmosphere]');
  if(!atmosphere||atmosphere.hasAttribute('data-bound'))return;
  atmosphere.setAttribute('data-bound','');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const blur=atmosphere.querySelector('feGaussianBlur');
  const min=Number(atmosphere.dataset.blurMin),max=Number(atmosphere.dataset.blurMax),softOpacity=Number(atmosphere.dataset.softOpacity);
  let visible=false,frame=0;
  const update=()=>{
    frame=0;
    const rect=home.getBoundingClientRect();
    const progress=reduced.matches?0.5:homeAtmosphereProgress(rect.top,rect.height,innerHeight);
    const softness=homeAtmosphereSoftness(progress,min,max,softOpacity);
    atmosphere.style.setProperty('--home-atmosphere-progress',String(progress));
    atmosphere.style.setProperty('--home-atmosphere-clarity',String(softness.opacity));
    if(blur&&blur.getAttribute('stdDeviation')!==String(softness.blur))blur.setAttribute('stdDeviation',String(softness.blur));
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const playback=()=>atmosphere.toggleAttribute('data-playing',visible&&!document.hidden&&!reduced.matches);
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;playback();});
    observer.observe(home);
  }
  document.addEventListener('visibilitychange',playback);
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  reduced.addEventListener('change',()=>{playback();schedule();});
  update();
}

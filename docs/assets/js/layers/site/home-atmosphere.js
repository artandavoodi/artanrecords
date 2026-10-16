/* Scroll-following score contained by homepage content, never by the footer. */
export function homeAtmosphereProgress(top,height,viewport){
  return Math.max(0,Math.min(1,(viewport/2-top)/Math.max(1,height)));
}
export function homeAtmosphereSoftness(progress,min,max,softOpacity){
  const phase=Math.sin(Math.max(0,Math.min(1,progress))*Math.PI*2)**2;
  return {blur:Math.round((min+(max-min)*phase)*10)/10,opacity:1-(1-softOpacity)*phase};
}
export function homeAtmospherePresence(scroll,releaseTop,landingOpacity){
  const progress=Math.max(0,Math.min(1,scroll/Math.max(1,releaseTop)));
  return landingOpacity+(1-landingOpacity)*progress*progress*(3-2*progress);
}
export function homeAtmosphereSectionBlur(center,viewport,min,max){
  const focus=1-Math.min(1,Math.abs(center-viewport/2)/Math.max(1,viewport));
  return Math.round((min+(max-min)*focus*focus*(3-2*focus))*10)/10;
}
export function bindHomeAtmosphere(){
  const home=document.querySelector('main[data-fragment="home"]');
  const atmosphere=home?.querySelector('[data-home-atmosphere]');
  if(!atmosphere||atmosphere.hasAttribute('data-bound'))return;
  atmosphere.setAttribute('data-bound','');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const blur=atmosphere.querySelector('feGaussianBlur');
  const min=Number(atmosphere.dataset.blurMin),max=Number(atmosphere.dataset.blurMax),softOpacity=Number(atmosphere.dataset.softOpacity);
  const landingOpacity=Number(atmosphere.dataset.landingOpacity),highlightMix=Number(atmosphere.dataset.highlightMix);
  const latest=home.querySelector('.label-latest-release');
  const featured=home.querySelector('.label-featured-releases');
  let visible=false,frame=0;
  const update=()=>{
    frame=0;
    const rect=home.getBoundingClientRect();
    const progress=reduced.matches?0.5:homeAtmosphereProgress(rect.top,rect.height,innerHeight);
    const softness=homeAtmosphereSoftness(progress,min,max,softOpacity);
    const featuredRect=featured?.getBoundingClientRect();
    const sectionBlur=!reduced.matches&&featuredRect?homeAtmosphereSectionBlur(featuredRect.top+featuredRect.height/2,innerHeight,min,max):min;
    const currentBlur=Math.max(softness.blur,sectionBlur);
    const scroll=Math.max(0,scrollY);
    const releaseTop=latest?latest.getBoundingClientRect().top+scroll:rect.height/4;
    const presence=reduced.matches?1:homeAtmospherePresence(scroll,releaseTop,landingOpacity);
    const diffusion=(softness.blur-min)/Math.max(1,max-min);
    atmosphere.style.setProperty('--home-atmosphere-progress',String(progress));
    atmosphere.style.setProperty('--home-atmosphere-presence',String(presence));
    atmosphere.style.setProperty('--home-atmosphere-clarity',String(softness.opacity+diffusion));
    atmosphere.style.setProperty('--home-atmosphere-light',`${diffusion*highlightMix*100}%`);
    if(blur&&blur.getAttribute('stdDeviation')!==String(currentBlur))blur.setAttribute('stdDeviation',String(currentBlur));
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

/* Soft color fields contained by homepage content, never by the footer. */
export function bindHomeAtmosphere(){
  const home=document.querySelector('main[data-fragment="home"]');
  const atmosphere=home?.querySelector('[data-home-atmosphere]');
  if(!atmosphere||atmosphere.hasAttribute('data-bound'))return;
  atmosphere.setAttribute('data-bound','');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const fields=[...atmosphere.querySelectorAll('.home-atmosphere__field')];
  let visible=false,frame=0;
  const update=()=>{
    frame=0;
    const top=atmosphere.getBoundingClientRect().top;
    const viewport=document.documentElement.clientHeight;
    const offsets=fields.map(field=>reduced.matches?0:Math.max(-viewport*0.2,Math.min(viewport*0.2,(viewport/2-top-field.offsetTop-field.offsetHeight/2)*0.18)));
    fields.forEach((field,index)=>field.style.setProperty('--atmosphere-drift',`${offsets[index]}px`));
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

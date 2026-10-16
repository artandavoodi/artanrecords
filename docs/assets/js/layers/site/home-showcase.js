/* Native scrolling owns slides; enhancement adds selection and content entrances. */
export function nearestShowcaseSlide(offsets,left){
  return offsets.reduce((nearest,offset,index)=>Math.abs(offset-left)<Math.abs(offsets[nearest]-left)?index:nearest,0);
}
export function bindHomeShowcase(){
  const home=document.querySelector('main[data-fragment="home"]');
  if(!home||home.hasAttribute('data-home-showcase-ready'))return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>entry.target.toggleAttribute('data-home-revealed',entry.isIntersecting));
    },{threshold:0.12,rootMargin:'0px 0px -8% 0px'});
    home.querySelectorAll('[data-home-reveal]').forEach(element=>observer.observe(element));
    home.setAttribute('data-home-showcase-ready','');
  }
  home.querySelectorAll('[data-home-carousel]').forEach(carousel=>{
    if(carousel.hasAttribute('data-carousel-ready'))return;
    const track=carousel.querySelector('[data-carousel-track]');
    const slides=[...track.children];
    const dots=[...carousel.querySelectorAll('[data-carousel-dot]')];
    const status=carousel.querySelector('[data-carousel-status]');
    if(slides.length<2||slides.length!==dots.length)return;
    let frame=0,active=0;
    const update=()=>{
      frame=0;
      const index=nearestShowcaseSlide(slides.map(slide=>slide.offsetLeft),track.scrollLeft);
      dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
      if(index!==active)status.textContent=slides[index].getAttribute('aria-label');
      active=index;
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
    const go=index=>{
      const target=Math.max(0,Math.min(slides.length-1,index));
      track.scrollTo({left:slides[target].offsetLeft,behavior:reduced.matches?'auto':'smooth'});
    };
    dots.forEach((dot,index)=>dot.addEventListener('click',()=>go(index)));
    carousel.addEventListener('keydown',event=>{
      const index=nearestShowcaseSlide(slides.map(slide=>slide.offsetLeft),track.scrollLeft);
      const targets={ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:slides.length-1};
      if(!(event.key in targets)||event.altKey||event.ctrlKey||event.metaKey)return;
      event.preventDefault();go(targets[event.key]);
    });
    track.addEventListener('scroll',schedule,{passive:true});
    addEventListener('resize',schedule);
    carousel.querySelector('[data-carousel-dots]').hidden=false;
    carousel.setAttribute('data-carousel-ready','');
    update();
  });
}

/* Shared content motion; never intercepts input or controls scrolling. */
export function observeEntrances(targets,{attribute='data-content-visible',threshold=0.15,rootMargin='0px 0px -8% 0px',mark=true}={}){
  if(!('IntersectionObserver' in window))return ()=>{};
  const observer=new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const visible=entry.isIntersecting&&(entry.target.hasAttribute(attribute)||entry.intersectionRatio>=threshold);
      if(!entry.isIntersecting)entry.target.style.setProperty('--content-entrance-direction',entry.boundingClientRect.bottom<=entry.rootBounds?.top?'-1':'1');
      entry.target.toggleAttribute(attribute,visible);
    });
  },{threshold:[0,threshold],rootMargin});
  targets.forEach(target=>{
    if(mark)target.setAttribute('data-content-reveal','');
    observer.observe(target);
  });
  return ()=>observer.disconnect();
}

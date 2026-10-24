let current;
export function bindArtistSections(root,mount,tabs){
 current?.();
 const header=document.querySelector('.label-navigation'),logo=header?.querySelector('.label-header-logo');if(!header||!logo)return;
 const desktop=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)');
 let frame,leaving=false;
 const restore=()=>{leaving=false;delete tabs.dataset.leaving;delete tabs.dataset.inHeader;tabs.hidden=desktop.matches;if(desktop.matches)header.append(tabs);else mount.prepend(tabs);logo.hidden=false;};
 const update=()=>{
  frame=null;const rect=mount.getBoundingClientRect(),height=header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--artist-header-height',height+'px');
  const active=desktop.matches&&rect.top<=height+1&&rect.bottom>height+1;
  root.dataset.artistSectionMode=desktop.matches?'desktop':'natural';
  if(active){leaving=false;delete tabs.dataset.leaving;tabs.hidden=false;logo.hidden=true;if(!tabs.hasAttribute('data-in-header')){tabs.dataset.inHeader='';if(tabs.parentElement!==header)header.append(tabs);}}
  else if(tabs.hasAttribute('data-in-header')&&desktop.matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){if(!leaving){leaving=true;tabs.dataset.leaving='';}}
  else restore();
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);desktop.addEventListener('change',schedule);
 tabs.addEventListener('animationend',event=>{if(event.animationName==='artist-tab-leave'&&leaving)restore();});
 current=()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);desktop.removeEventListener('change',schedule);if(frame)cancelAnimationFrame(frame);tabs.remove();logo.hidden=false;};
 update();
}

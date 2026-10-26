let current;
export function bindArtistSections(root,mount,tabs){
 current?.();
 const header=document.querySelector('.label-navigation'),logo=header?.querySelector('.label-header-logo');if(!header||!logo)return;
 const desktop=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)');
 const archive=root.querySelector('[data-artist-archive]'),intro=root.querySelector('.artist-biography'),directory=root.querySelector('[data-artist-directory]');
 let frame,leaving=false,departing=false;
 const restore=()=>{leaving=false;delete tabs.dataset.leaving;delete tabs.dataset.inHeader;tabs.hidden=desktop.matches;if(desktop.matches)header.append(tabs);else mount.prepend(tabs);logo.hidden=false;};
 const update=()=>{
  frame=null;const rect=mount.getBoundingClientRect(),height=header.getBoundingClientRect().height;
  document.documentElement.style.setProperty('--artist-header-height',height+'px');
  const active=desktop.matches&&!departing&&rect.top<=height+1&&rect.bottom>height+1;
  if(rect.top>height+1||rect.bottom<=height+1)departing=false;
  root.dataset.artistSectionMode=desktop.matches?'desktop':'natural';
  root.toggleAttribute('data-artist-free-scroll',desktop.matches&&Boolean(archive)&&archive.getBoundingClientRect().top<innerHeight-1);
  const progress=desktop.matches&&intro?Math.max(0,Math.min(1,(height-intro.getBoundingClientRect().top)/(intro.offsetHeight*0.35))):0;
  root.style.setProperty('--artist-directory-progress',String(progress));
  if(directory)directory.inert=progress>=1;
  root.dataset.artistMotion='';
  for(const section of root.children){const bounds=section.getBoundingClientRect();section.toggleAttribute('data-artist-visible',bounds.bottom>height&&bounds.top<innerHeight*0.9);}
  if(active){leaving=false;delete tabs.dataset.leaving;tabs.hidden=false;logo.hidden=true;if(!tabs.hasAttribute('data-in-header')){tabs.dataset.inHeader='';if(tabs.parentElement!==header)header.append(tabs);}}
  else if(tabs.hasAttribute('data-in-header')&&desktop.matches&&!matchMedia('(prefers-reduced-motion:reduce)').matches){if(!leaving){leaving=true;tabs.dataset.leaving='';}}
  else restore();
 };
 const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
 const leaveOnIntent=event=>{if(!desktop.matches||!tabs.hasAttribute('data-in-header'))return;if(event.type==='wheel'&&event.deltaY<0){departing=false;schedule();return;}if(event.type==='wheel'&&event.deltaY>0||event.type==='keydown'&&['PageDown','ArrowDown',' '].includes(event.key)){departing=true;schedule();}};
 addEventListener('wheel',leaveOnIntent,{passive:true});addEventListener('keydown',leaveOnIntent);
 addEventListener('scroll',schedule,{passive:true});addEventListener('resize',schedule);desktop.addEventListener('change',schedule);
 tabs.addEventListener('animationend',event=>{if(event.animationName==='artist-tab-leave'&&leaving)restore();});
 current=()=>{removeEventListener('scroll',schedule);removeEventListener('resize',schedule);removeEventListener('wheel',leaveOnIntent);removeEventListener('keydown',leaveOnIntent);desktop.removeEventListener('change',schedule);if(frame)cancelAnimationFrame(frame);tabs.remove();logo.hidden=false;};
 update();
}

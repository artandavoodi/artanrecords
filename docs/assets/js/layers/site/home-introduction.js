/* Homepage-only progressive motion; content remains readable without scripting. */
export function homeScrollProgress(top,height){
  return Math.max(0,Math.min(1,-top/Math.max(1,height*0.75)));
}
export function homeTailIsFree(top,viewport,wasFree=false){
  return top<=viewport*(wasFree?1:0.75);
}
export function phraseFrame(phrases,time,motion){
  const cycle=phrases.reduce((sum,phrase,index)=>sum+motion.hold+phrase.length*motion.erase+phrases[(index+1)%phrases.length].length*motion.type,0);
  let elapsed=time%cycle;
  for(let index=0;index<phrases.length;index++){
    const word=phrases[index],next=phrases[(index+1)%phrases.length];
    if(elapsed<motion.hold)return word;
    elapsed-=motion.hold;
    if(elapsed<word.length*motion.erase)return word.slice(0,Math.ceil(word.length-elapsed/motion.erase));
    elapsed-=word.length*motion.erase;
    if(elapsed<next.length*motion.type)return next.slice(0,Math.ceil(elapsed/motion.type));
    elapsed-=next.length*motion.type;
  }
  return phrases[0];
}
function bindPhraseStatement(home,reduced){
  const statement=home.querySelector('[data-phrases]');
  if(!statement)return ()=>{};
  const phrases=JSON.parse(statement.dataset.phrases);
  const motion=JSON.parse(statement.dataset.phraseMotion);
  if(!['hold','type','erase'].every(key=>Number.isFinite(motion[key])&&motion[key]>0))return ()=>{};
  const original=statement.textContent;
  let visible=false,frame=0,last=0,elapsed=0,word;
  const tick=time=>{
    if(last)elapsed+=time-last;
    last=time;
    const value=phraseFrame(phrases,elapsed,motion);
    if(word.textContent!==value)word.textContent=value;
    frame=requestAnimationFrame(tick);
  };
  const update=()=>{
    if(frame)cancelAnimationFrame(frame);
    frame=0;last=0;
    if(reduced.matches){statement.textContent=original;word=null;return;}
    if(!visible||document.hidden)return;
    if(!word){
      const accessible=document.createElement('span');
      accessible.className='label-accessible-title';accessible.textContent=original;
      const visual=document.createElement('span');visual.setAttribute('aria-hidden','true');
      const prefix=document.createElement('span');prefix.textContent=statement.dataset.phrasePrefix;
      word=document.createElement('span');word.className='label-introduction-phrase';word.textContent=phraseFrame(phrases,elapsed,motion);
      visual.append(prefix,document.createTextNode(' '),word);
      statement.replaceChildren(accessible,visual);
    }
    frame=requestAnimationFrame(tick);
  };
  document.addEventListener('visibilitychange',update);
  reduced.addEventListener('change',update);
  return value=>{visible=value;update();};
}
export function bindHomeIntroduction(){
  const home=document.querySelector('main[data-fragment="home"]');
  if(!home||home.hasAttribute('data-home-motion-ready')||!('IntersectionObserver' in window))return;
  const hero=home.querySelector('.label-introduction');
  if(!hero)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const desktop=matchMedia('(min-width:1025px) and (hover:hover) and (pointer:fine)');
  const tail=home.querySelector('.label-featured-artists');
  const phraseVisibility=bindPhraseStatement(home,reduced);
  let frame=0;
  const update=()=>{
    frame=0;
    const rect=hero.getBoundingClientRect();
    hero.style.setProperty('--home-scroll-progress',String(reduced.matches?0:homeScrollProgress(rect.top,rect.height)));
    if(tail){
      const root=document.documentElement;
      const free=desktop.matches&&homeTailIsFree(tail.getBoundingClientRect().top,innerHeight,root.hasAttribute('data-home-free-scroll'));
      root.toggleAttribute('data-home-free-scroll',free);
    }
  };
  const schedule=()=>{if(!frame)frame=requestAnimationFrame(update);};
  const observer=new IntersectionObserver(entries=>{
    for(const entry of entries){
      entry.target.toggleAttribute('data-home-visible',entry.isIntersecting);
      if(entry.target===hero)phraseVisibility(entry.isIntersecting);
    }
  },{threshold:0,rootMargin:'0px 0px -6% 0px'});
  observer.observe(hero);
  home.setAttribute('data-home-motion-ready','');
  addEventListener('scroll',schedule,{passive:true});
  addEventListener('resize',schedule);
  reduced.addEventListener('change',schedule);
  desktop.addEventListener('change',schedule);
  update();
}

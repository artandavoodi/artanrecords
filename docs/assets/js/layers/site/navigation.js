/* Native document links; same approved menu geometry, keyboard-safe behavior. */
export function bindNavigation(labels){
  const toggle=document.querySelector('[data-menu-toggle]'),menu=document.querySelector('[data-menu]');
  const main=document.querySelector('main'),footer=document.querySelector('[data-fragment="footer"]');
  toggle.hidden=false;
  function open(value){menu.hidden=!value;toggle.setAttribute('aria-expanded',String(value));toggle.setAttribute('aria-label',value?labels.menuClose:labels.menuOpen);document.documentElement.toggleAttribute('data-menu-open',value);document.body.toggleAttribute('data-menu-locked',value);main.inert=value;footer.inert=value;}
  toggle.addEventListener('click',()=>open(menu.hidden));
  document.addEventListener('keydown',event=>{
    if(menu.hidden)return;
    if(event.key==='Escape'){open(false);toggle.focus();}
    if(event.key==='Tab'){
      const focusable=[toggle,...menu.querySelectorAll('a')],index=focusable.indexOf(document.activeElement);
      if(event.shiftKey&&index<=0){event.preventDefault();focusable.at(-1).focus();}
      else if(!event.shiftKey&&index===focusable.length-1){event.preventDefault();toggle.focus();}
    }
  });open(false);
}

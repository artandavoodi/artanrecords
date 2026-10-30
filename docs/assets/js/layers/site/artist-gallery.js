import {openDialog} from '../../core/dialogs.js';

// Entries contain only decoded blobs already authorized by the public portfolio.
export function createArtistGallery(root,labels,icons){
 const entries=[];
 let dialog,index=0,items=[],start;
 function button(label){const node=document.createElement('button');node.type='button';node.setAttribute('aria-label',label);return node;}
 function dispose(){if(!dialog)return;if(dialog.open)dialog.close();dialog.remove();dialog=null;}
 function open(entry){
  dispose();items=entries.filter(item=>!item.card.hidden);index=items.indexOf(entry);if(index<0)return;
  dialog=document.createElement('dialog');dialog.className='artist-gallery';dialog.setAttribute('aria-label',labels.viewer);
  const header=document.createElement('header'),close=button(labels.close),photo=document.createElement('div'),image=document.createElement('img'),information=document.createElement('div'),caption=document.createElement('p'),count=document.createElement('output'),nav=document.createElement('nav'),strip=document.createElement('div');
  close.className='global-close-button';close.dataset.coreCloseButton='true';close.autofocus=true;close.onclick=()=>dialog.close();header.append(close);
  photo.className='artist-gallery__photo';photo.append(image);information.className='artist-gallery__information';count.setAttribute('aria-live','polite');information.append(caption,count);nav.className='artist-gallery__nav';nav.setAttribute('aria-label',labels.navigation);strip.className='artist-gallery__filmstrip';
  const controls=[labels.imagePrevious,labels.imageNext].map((label,i)=>{const control=button(label),source=icons.items?.find(icon=>icon.id===labels[i?'nextIcon':'previousIcon']);if(source){const icon=document.createElement('img');icon.src='/'+source.src.replace(/^\//,'');icon.alt='';if(source.monochrome)icon.dataset.monochrome='true';control.append(icon);}else control.textContent=label;control.onclick=()=>show(index+(i?1:-1));return control;});
  const thumbnails=items.map((item,i)=>{const control=button(item.alt),preview=document.createElement('img');preview.src=item.src;preview.alt='';control.append(preview);control.onclick=()=>show(i);strip.append(control);return control;});
  function reveal(){const selected=thumbnails[index],frame=strip.getBoundingClientRect(),rect=selected.getBoundingClientRect();if(rect.left<frame.left||rect.right>frame.right)strip.scrollTo({left:strip.scrollLeft+rect.left-frame.left-(strip.clientWidth-rect.width)/2,behavior:'instant'});}
  function show(next){if(next<0||next>=items.length)return;index=next;const item=items[index];image.src=item.src;image.alt=item.alt;caption.textContent=item.title;count.textContent=`${index+1} / ${items.length}`;controls[0].disabled=index===0;controls[1].disabled=index===items.length-1;thumbnails.forEach((node,i)=>{if(i===index)node.setAttribute('aria-current','true');else node.removeAttribute('aria-current');});reveal();}
  nav.append(controls[0],strip,controls[1]);dialog.append(header,photo,information,nav);root.append(dialog);
  dialog.addEventListener('keydown',event=>{if(event.altKey||event.ctrlKey||event.metaKey||/INPUT|SELECT|TEXTAREA/.test(event.target.tagName))return;if(event.key==='ArrowLeft'||event.key==='ArrowRight'){event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));}});
  photo.addEventListener('touchcancel',()=>{start=null;},{passive:true});
  photo.addEventListener('touchstart',event=>{start=event.touches.length===1?{x:event.touches[0].clientX,y:event.touches[0].clientY}:null;},{passive:true});
  photo.addEventListener('touchend',event=>{const origin=start;start=null;if(!origin||event.touches.length||!event.changedTouches.length)return;const touch=event.changedTouches[0],dx=touch.clientX-origin.x,dy=touch.clientY-origin.y;if(Math.abs(dx)<photo.clientWidth/5||Math.abs(dx)<Math.abs(dy)*2)return;event.preventDefault();show(index+(dx<0?1:-1));},{passive:false});
  const observer=typeof ResizeObserver==='function'?new ResizeObserver(reveal):null;observer?.observe(strip);dialog.addEventListener('close',()=>observer?.disconnect(),{once:true});
  show(index);openDialog(dialog);reveal();
 }
 return {dispose,add(card,image,title){const entry={card,src:image.src,alt:image.alt,title};entries.push(entry);const trigger=button(image.alt);trigger.className='artist-gallery-trigger';trigger.append(image);trigger.onclick=()=>open(entry);card.prepend(trigger);}};
}

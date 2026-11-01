import {openDialog} from '../../core/dialogs.js';

// Entries contain only decoded blobs already authorized by the public portfolio.
export function createArtistGallery(root,labels,icons){
 const entries=[];
 let dialog,index=0,items=[],start;
 function button(label){const node=document.createElement('button');node.type='button';node.setAttribute('aria-label',label);return node;}
 function closeViewer(){if(!dialog)return;if(dialog.open)dialog.close();dialog.remove();dialog=null;}
 function dispose(){closeViewer();root.removeEventListener('click',activate);}
 function activate(event){
  const trigger=event.target.closest?.('button.artist-gallery-trigger');if(!trigger||!root.contains(trigger))return;
  const entry=entries.find(item=>item.card.dataset.portfolioId===trigger.closest('[data-portfolio-id]')?.dataset.portfolioId);if(entry)open(entry,trigger);
 }
 root.addEventListener('click',activate);
 function open(entry,trigger){
  closeViewer();const cards=[...trigger.closest('.artist-portfolio-grid').querySelectorAll('[data-portfolio-id]')].filter(card=>!card.hidden);
  items=cards.map(card=>entries.find(item=>item.card.dataset.portfolioId===card.dataset.portfolioId)).filter(Boolean);index=items.indexOf(entry);if(index<0)return;
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
 return {dispose,add(card,image,title){const entry={card,src:image.src,alt:image.alt,title};entries.push(entry);const trigger=button(image.alt);trigger.className='artist-gallery-trigger';trigger.append(image);card.prepend(trigger);}};
}

// No provider thumbnails, scripts or embeds: the visitor chooses to leave the site.
export function publicGalleryVideo(value){
 try{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password||url.port)return null;
  if(['youtube.com','www.youtube.com','m.youtube.com'].includes(url.hostname)){const id=url.pathname==='/watch'?url.searchParams.get('v'):/^\/(?:shorts|embed)\/([\w-]{11})\/?$/.exec(url.pathname)?.[1];return /^[\w-]{11}$/.test(id||'')?'https://www.youtube.com/watch?v='+id:null;}
  if(url.hostname==='youtu.be'&&/^\/[\w-]{11}\/?$/.test(url.pathname))return 'https://www.youtube.com/watch?v='+url.pathname.split('/')[1];
  if(['vimeo.com','www.vimeo.com'].includes(url.hostname)&&/^\/\d+(?:\/[a-zA-Z0-9]+)?\/?$/.test(url.pathname)){const parts=url.pathname.split('/').filter(Boolean),token=parts[1]||url.searchParams.get('h');return 'https://vimeo.com/'+parts[0]+(token&&/^[a-zA-Z0-9]+$/.test(token)?'?h='+token:'');}
  if(url.hostname==='player.vimeo.com'&&/^\/video\/\d+\/?$/.test(url.pathname)){const token=url.searchParams.get('h');return 'https://vimeo.com/'+url.pathname.split('/')[2]+(token&&/^[a-zA-Z0-9]+$/.test(token)?'?h='+token:'');}
 }catch{}return null;
}

function galleryIcon(id,icons){const source=icons.items?.find(item=>item.id===id);if(!source)return null;const image=document.createElement('img');image.src='/'+source.src.replace(/^\//,'');image.alt='';image.className='catalogue-icon';if(source.monochrome)image.dataset.monochrome='true';return image;}

const galleryControls=new WeakMap();
export function bindArtistGalleryControls(section,list,records,labels,icons){
 galleryControls.get(section)?.abort();const events=new AbortController();galleryControls.set(section,events);
 section.querySelector('.artist-gallery-controls')?.remove();
 section.querySelector('.artist-gallery-empty')?.remove();
 const root=section.closest('[data-artist-subpage]')||section.parentElement;
 const controls=document.createElement('div'),panels=[],params=new URLSearchParams(location.search),fields=new Map(),cards=new Map([...list.children].map(card=>[card.dataset.portfolioId,card]));controls.className='artist-gallery-controls';
 function panel(id,label,closeLabel){const details=document.createElement('details'),summary=document.createElement('summary'),icon=galleryIcon(id,icons),close=galleryIcon('close',icons);summary.setAttribute('aria-label',label);summary.setAttribute('aria-expanded','false');if(icon&&close)summary.append(icon,close);else summary.textContent=label;details.append(summary);details.addEventListener('toggle',()=>{summary.setAttribute('aria-expanded',String(details.open));summary.setAttribute('aria-label',details.open?closeLabel:label);if(details.open)panels.filter(other=>other!==details).forEach(other=>{other.open=false;});});panels.push(details);controls.append(details);return details;}
 const filters=panel(labels.filterIcon,labels.filter,labels.closeFilters),views=panel(labels.viewIcon,labels.view,labels.closeView),filterFields=document.createElement('div'),options=document.createElement('div'),count=document.createElement('output'),empty=document.createElement('p'),reset=document.createElement('button'),active=document.createElement('div');filterFields.className='artist-gallery-filters';options.className='artist-gallery-filters artist-gallery-views';count.setAttribute('aria-live','polite');empty.textContent=labels.empty;empty.className='artist-gallery-empty';reset.type='button';reset.setAttribute('aria-label',labels.clear);const resetIcon=galleryIcon(labels.resetIcon,icons);if(resetIcon)reset.append(resetIcon);else reset.textContent=labels.clear;reset.className='artist-gallery-reset';active.className='artist-gallery-active';active.setAttribute('aria-label',labels.active);
 function select(key,label,values){const wrapper=document.createElement('label'),input=document.createElement('select');wrapper.textContent=label;input.name=key;for(const value of ['',...values])input.add(new Option(value||labels.all,value));input.value=params.get(key)||'';if(!input.value)params.delete(key);input.onchange=()=>{if(input.value)params.set(key,input.value);else params.delete(key);update();};fields.set(key,input);wrapper.append(input);filterFields.append(wrapper);}
 select('collection',labels.collection,[...new Set(records.map(item=>item.details.collection).filter(Boolean))]);
 select('year',labels.year,[...new Set(records.map(item=>String(item.details.year||labels.undated)))].sort().reverse());
 select('tag',labels.tags,[...new Set(records.flatMap(item=>Array.isArray(item.details.tags)?item.details.tags:[]).filter(tag=>typeof tag==='string'))].sort());
 const searchLabel=document.createElement('label'),search=document.createElement('input');searchLabel.textContent=labels.search;search.type='search';search.value=params.get('q')||'';search.oninput=()=>{if(search.value.trim())params.set('q',search.value.trim());else params.delete('q');update();};fields.set('q',search);searchLabel.append(search);filterFields.append(searchLabel);filters.append(filterFields);
 for(const view of labels.views){const button=document.createElement('button');button.type='button';button.textContent=view.label;button.dataset.galleryView=view.id;button.onclick=()=>{params.set('view',view.id);update();views.open=false;views.querySelector('summary').focus();};options.append(button);}views.append(options);
 reset.onclick=()=>{for(const [key,input] of fields){params.delete(key);input.value='';}update();filters.querySelector('summary').focus();};
 controls.addEventListener('keydown',event=>{if(event.key==='Escape'){const open=panels.find(panel=>panel.open);if(open){open.open=false;open.querySelector('summary').focus();event.preventDefault();}}});
 document.addEventListener('pointerdown',event=>{panels.filter(panel=>panel.open&&!panel.contains(event.target)).forEach(panel=>{panel.open=false;});},{signal:events.signal});
 root.addEventListener('artanrecords:artist-gallery-design',()=>update(false),{signal:events.signal});
 controls.append(reset,active,count);section.insertBefore(controls,list);section.append(empty);
 function update(writeAddress=true){let visible=0;const query=(params.get('q')||'').toLocaleLowerCase();for(const item of records){const value=item.details,card=cards.get(item.id);if(!card)continue;card.hidden=Boolean((params.get('collection')&&value.collection!==params.get('collection'))||(params.get('year')&&String(value.year||labels.undated)!==params.get('year'))||(params.get('tag')&&(!Array.isArray(value.tags)||!value.tags.includes(params.get('tag'))))||(query&&![value.title,value.image_alt,...(Array.isArray(value.tags)?value.tags:[])].join(' ').toLocaleLowerCase().includes(query)));if(!card.hidden)visible++;}
  const preferred=labels.views.some(view=>view.id===root.dataset.artistGalleryView)?root.dataset.artistGalleryView:labels.views[0].id;
  list.dataset.view=labels.views.some(view=>view.id===params.get('view'))?params.get('view'):preferred;for(const button of options.children)button.setAttribute('aria-pressed',String(button.dataset.galleryView===list.dataset.view));count.textContent=visible+' '+labels.items;empty.hidden=visible!==0;
  const selected=[...fields.keys()].filter(key=>params.get(key));reset.hidden=!selected.length;active.replaceChildren(...selected.map(key=>{const button=document.createElement('button');button.type='button';button.textContent=params.get(key);button.setAttribute('aria-label',labels.remove+': '+params.get(key));const icon=galleryIcon('close',icons);if(icon)button.append(icon);button.onclick=()=>{params.delete(key);fields.get(key).value='';update();filters.querySelector('summary').focus();};return button;}));
  if(writeAddress){const queryString=params.toString();history.replaceState(null,'',location.pathname+(queryString?'?'+queryString:'')+location.hash);}
 }update();
}

/* Reference gallery grain engine: identical pixels, timing and lifecycle. */
export function bindArtistGalleryGrain(canvas,grain){
 if(!canvas||!grain)return;
 const context=canvas.getContext('2d'),tile=document.createElement('canvas');tile.width=tile.height=grain.tileSize;
 const tileContext=tile.getContext('2d');if(!context||!tileContext)return;
 canvas.style.setProperty('--gallery-grain-opacity',grain.opacity);
 const pixels=tileContext.createImageData(tile.width,tile.height),motion=matchMedia('(prefers-reduced-motion: reduce)');let visible=false,timer;
 function paint(){for(let i=0;i<pixels.data.length;i+=4){const value=Math.random()<0.5?0:255;pixels.data[i]=pixels.data[i+1]=pixels.data[i+2]=value;pixels.data[i+3]=255;}tileContext.putImageData(pixels,0,0);context.fillStyle=context.createPattern(tile,'repeat');context.fillRect(0,0,canvas.width,canvas.height);}
 function schedule(){clearTimeout(timer);if(!visible||document.hidden||motion.matches)return;timer=setTimeout(()=>{paint();schedule();},1000/grain.framesPerSecond);}
 const resize=new ResizeObserver(()=>{const bounds=canvas.parentElement.getBoundingClientRect();canvas.width=Math.max(1,Math.round(bounds.width));canvas.height=Math.max(1,Math.round(bounds.height));paint();});resize.observe(canvas.parentElement);
 const intersection=new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;schedule();});intersection.observe(canvas);document.addEventListener('visibilitychange',schedule);motion.addEventListener('change',schedule);
 return ()=>{clearTimeout(timer);resize.disconnect();intersection.disconnect();document.removeEventListener('visibilitychange',schedule);motion.removeEventListener('change',schedule);};
}

export function bindArtistDiscovery(form,config){
 const root=form.querySelector('[data-artist-discovery]');if(!root||!config)return;
 const query=root.querySelector('[data-artist-query]'),button=root.querySelector('[data-artist-search]'),status=root.querySelector('[data-artist-status]'),results=root.querySelector('[data-artist-results]'),selected=root.querySelector('[data-artist-selected]'),hidden=root.querySelector('[name=streaming_profiles]');let revision=0,controller;const choices=new Map();
 const platform=artist=>config.providers.find(item=>item.id===artist.provider);
 function identity(artist){
  const fragment=document.createDocumentFragment(),link=document.createElement('a'),logo=document.createElement('img'),fallback=()=>{const badge=document.createElement('span');badge.className='artist-discovery__initials';badge.textContent=artist.name.trim().split(/\s+/).slice(0,2).map(word=>word[0]).join('');badge.setAttribute('aria-label','Artist photo not supplied');return badge;};
  let image;
  try{const url=new URL(artist.image);if(url.protocol==='https:'&&url.hostname==='i.scdn.co'){image=document.createElement('img');image.src=url.href;image.alt=artist.name;image.className='artist-discovery__portrait';image.referrerPolicy='no-referrer';image.onerror=()=>image.replaceWith(fallback());}}catch{}
  fragment.append(image||fallback());logo.src=artist.provider==='spotify'?'/assets/icons/social/platforms/spotify.svg':'/assets/icons/social/platforms/apple-music.svg';logo.className='artist-discovery__platform';logo.alt=platform(artist).label;
  link.href=artist.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=artist.name;fragment.append(logo,link);return fragment;
 }
 const clear=root.querySelector('[data-artist-clear]');
 window.NeuroartanCloseButtons?.initCloseButtonPrimitive(root);
 const sync=()=>{
  hidden.value=JSON.stringify([...choices.values()].map(({provider,id,name,url})=>({provider,id,name,url})));selected.replaceChildren();
  for(const [key,artist] of choices){const row=document.createElement('article'),remove=document.createElement('button');row.className='artist-discovery__result';remove.type='button';remove.textContent='Remove';remove.setAttribute('aria-label','Remove '+artist.name+' from '+key);remove.onclick=()=>{choices.delete(key);sync();};row.append(identity(artist),remove);selected.append(row);}
  for(const choice of results.querySelectorAll('[data-select-artist]')){const active=[...choices.values()].some(artist=>artist.provider+':'+artist.id===choice.dataset.selectArtist);choice.disabled=active;choice.textContent=active?'Selected':'Select';}
 };
 const invalidate=()=>{revision++;controller?.abort();results.replaceChildren();button.disabled=false;clear.hidden=!query.value;status.textContent='';};query.addEventListener('input',invalidate);
 clear.addEventListener('click',()=>{query.value='';invalidate();query.focus();});
 query.addEventListener('keydown',event=>{if(event.key==='Enter'){event.preventDefault();button.click();}});
 button.addEventListener('click',async()=>{
  const term=query.value.trim();if(term.length<2){status.textContent='Enter at least two characters.';return;}
  const turn=++revision;controller?.abort();controller=new AbortController();results.replaceChildren();button.disabled=true;status.textContent='Searching artist profiles…';
  try{
   const response=await fetch(config.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({provider:'all',query:term}),signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'}),data=await response.json();if(turn!==revision)return;if(!response.ok)throw Error(data.error||'Search is unavailable.');
   const artists=Array.isArray(data.artists)?data.artists:[];status.textContent=(artists.length?'Select your profile. This is not ownership verification.':'No matching profiles found. Try a different spelling or continue with your name and listening link.')+(data.unavailable?.length?' Some platforms are unavailable; you can add their listening links below.':'');
   for(const artist of artists){
    if(!platform(artist)||typeof artist.name!=='string')continue;const url=new URL(artist.url);if(url.protocol!=='https:'||url.username||url.password||url.hostname!==(artist.provider==='spotify'?'open.spotify.com':'music.apple.com'))continue;
    const row=document.createElement('article'),select=document.createElement('button');row.className='artist-discovery__result';select.type='button';select.textContent='Select';select.dataset.selectArtist=artist.provider+':'+artist.id;select.setAttribute('aria-label','Select '+artist.name+' on '+artist.provider);
    select.onclick=()=>{choices.clear();choices.set(artist.provider,artist);if(!form.elements.artist.value.trim())form.elements.artist.value=artist.name;query.value='';invalidate();sync();status.textContent=artist.name+' selected as a listening reference.';};row.append(identity(artist),select);results.append(row);
   }sync();
  }catch(error){if(turn===revision&&error.name!=='AbortError')status.textContent=error.message;}finally{if(turn===revision)button.disabled=false;}
 });
}

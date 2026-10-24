import {renderConcerts} from './artist-concerts.js';
import {renderArtistTabs} from './artist-tabs.js';
import {renderArtistContent} from './artist-content.js';
let refreshInFlight=false,refreshQueued=false;
const mediaSources=new Map();
async function renderArtistMedia(root,record,config){
 for(const [field,bucket,selector] of [['portrait_path','studio-avatars','[data-artist-portrait]'],['header_path','studio-headers','[data-artist-header]'],['logo_path','studio-logos','[data-artist-logo]']]){
  const mount=root.querySelector(selector);if(!mount)continue;
  const key=record.fields[field],previous=mediaSources.get(mount),version=key?key+'?v='+record.updated_at:'';
  if(previous?.version===version)continue;
  if(previous)URL.revokeObjectURL(previous.url);mediaSources.delete(mount);mount.replaceChildren();
  if(!key||!/^\b[0-9a-f-]{36}\/(avatar|header|logo)$/.test(key))continue;
  try{
   const url=new URL('/storage/v1/object/authenticated/'+bucket+'/'+key,config.backend);url.searchParams.set('v',record.updated_at);
   const response=await fetch(url,{headers:{apikey:config.publishableKey},cache:'no-store',credentials:'omit'});if(!response.ok)throw Error();
   const blob=await response.blob();if(!['image/jpeg','image/png','image/webp'].includes(blob.type))throw Error();
   const source=URL.createObjectURL(blob),image=document.createElement('img');image.src=source;image.alt=field==='portrait_path'?(record.fields.portrait_alt||record.fields.artist_name):'';
   try{await image.decode();}catch{URL.revokeObjectURL(source);continue;}
   mount.removeAttribute('aria-label');mount.append(image);mediaSources.set(mount,{version,url:source});
  }catch{/* Never substitute another artist's image or expose a private URL. */}
 }
}
export async function bindPublicArtist(){
 if(refreshInFlight){refreshQueued=true;return;}
 const root=document.querySelector('[data-public-artist]');if(!root)return;
 const embedded=Boolean(root.dataset.artistUsername),status=root.querySelector('[data-artist-status]'),username=root.dataset.artistUsername||new URL(location.href).searchParams.get('username');
 if(!username||!/^[a-z0-9][a-z0-9.]{1,30}[a-z0-9]$/.test(username)||username.includes('..')){status.textContent='Choose an artist profile from a shared artist link.';return;}
 refreshInFlight=true;
 try{
  const config=await fetch('/assets/data/artists/platform.json').then(response=>{if(!response.ok)throw Error();return response.json();});
  const icons=await fetch(config.icons).then(response=>response.ok?response.json():{items:[]}).catch(()=>({items:[]}));
  const endpoint=new URL('/rest/v1/studio_artist_pages',config.backend);endpoint.searchParams.set('select','username,fields,updated_at');endpoint.searchParams.set('username','eq.'+username);
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();const [record]=await response.json();
  let unavailable=document.querySelector('[data-artist-unavailable]');
  if(!unavailable){unavailable=document.createElement('p');unavailable.dataset.artistUnavailable='';unavailable.setAttribute('role','status');unavailable.hidden=true;root.before(unavailable);}
  if(!record){root.hidden=true;unavailable.hidden=false;unavailable.textContent='This artist page is not public.';for(const mount of root.querySelectorAll('[data-artist-portrait],[data-artist-header]')){const previous=mediaSources.get(mount);if(previous)URL.revokeObjectURL(previous.url);mediaSources.delete(mount);mount.replaceChildren();}document.body.style.setProperty('--artist-cover','none');return;}
  root.hidden=false;unavailable.hidden=true;
  root.querySelector('[data-artist-name]').textContent=record.fields.artist_name;document.title=record.fields.artist_name+' · Artanrecords';status.textContent='@'+record.username;
  const background=record.fields.catalogue_background||'Latest release';
  if(background==='Latest release'&&root.dataset.latestCover)document.body.style.setProperty('--artist-cover','url("'+root.dataset.latestCover.replace(/["\\\n\r]/g,'')+'")');
  else document.body.style.setProperty('--artist-cover','none');
  const routed=Object.values(config.routes||{}).includes(record.username);
  const canonical=new URL(routed?'/artists/'+record.username+'/':'/artists/profile/',location.origin);if(!routed)canonical.searchParams.set('username',record.username);document.querySelector('link[rel=canonical]')?.setAttribute('href',canonical.href);
  for(const [property,value] of [['og:title',document.title],['og:url',canonical.href]])document.querySelector(`meta[property="${property}"]`)?.setAttribute('content',value);
  let graphics=root.querySelector('[data-artist-graphics]');
  if(!graphics){graphics=document.createElement('div');graphics.dataset.artistGraphics='';const logo=document.createElement('div');logo.dataset.artistLogo='';const palette=document.createElement('div');palette.dataset.artistPalette='';palette.setAttribute('aria-label','Artist colours');graphics.append(logo,palette);root.querySelector('[data-artist-name]').after(graphics);}
  const palette=graphics.querySelector('[data-artist-palette]');palette.replaceChildren();
  for(const color of (Array.isArray(record.fields.palette)?record.fields.palette:[]).slice(0,5)){if(!/^#[0-9a-f]{6}$/i.test(color))continue;const swatch=document.createElement('span');swatch.style.backgroundColor=color;swatch.title=color;swatch.setAttribute('aria-label',color);palette.append(swatch);}
  await renderArtistMedia(root,record,config);
  if(background==='Profile image')document.body.style.setProperty('--artist-cover',mediaSources.get(root.querySelector('[data-artist-portrait]'))?'url("'+mediaSources.get(root.querySelector('[data-artist-portrait]')).url+'")':'none');
  const body=root.querySelector('[data-artist-fields]');body.replaceChildren();for(const field of config.fields){const value=record.fields[field.key];if(!value)continue;if(field.inline){const line=document.createElement('p');line.dataset.artistSince='';line.textContent=field.label+' '+value;body.append(line);continue;}const section=document.createElement('section'),heading=document.createElement('h2'),text=document.createElement('p');heading.textContent=field.label;text.textContent=value;section.append(heading,text);body.append(section);}
  const links=root.querySelector('[data-artist-links]'),concerts=root.querySelector('[data-artist-concerts]'),existing=new Map([...links.querySelectorAll('a')].map(link=>[link.getAttribute('aria-label')||link.textContent.trim(),link.cloneNode(true)]));
  if(concerts)links.after(concerts);links.replaceChildren();
  for(const group of config.linkGroups){
   const section=document.createElement('section'),heading=document.createElement('h2'),list=document.createElement('div');
   section.className='artist-link-group hub__group';section.dataset.artistGroup=group.id;section.dataset.presentation=group.presentation;heading.textContent=group.label;list.className='hub__group-links';
   for(const field of config.links.filter(field=>group.keys.includes(field.key))){
    const value=record.fields[field.key];if(!value)continue;let href;
    try{if(field.email){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))continue;href='mailto:'+value;}else{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)continue;href=url.href;}}catch{continue;}
    const link=existing.get(field.label)||document.createElement('a');link.href=href;link.setAttribute('aria-label',field.label);
    if(!link.childNodes.length){const source=icons.items.find(item=>item.id===config.linkIcons[field.key]);link.className='hub__link';if(source){const image=document.createElement('img');image.src='/'+source.src.replace(/^\//,'');image.alt='';if(source.monochrome)image.dataset.monochrome='true';link.append(image);}const label=document.createElement('span');label.className='hub__tooltip';label.textContent=field.label;link.append(label);}
    link.rel='noopener';list.append(link);
   }
   if(list.childNodes.length||group.id==='concerts'){section.append(heading,list);links.append(section);}
  }
  renderArtistTabs(links,config.linkGroups,concerts);
  await Promise.allSettled([renderArtistContent(root,record,config),renderConcerts(root,record.username,config)]);
 }catch{if(!embedded)status.textContent='This artist page could not be loaded. Please try again.';}finally{refreshInFlight=false;if(refreshQueued){refreshQueued=false;queueMicrotask(()=>bindPublicArtist());}}
}

import {renderConcerts} from './artist-concerts.js';
import {renderArtistTabs} from './artist-tabs.js';
import {renderArtistContent} from './artist-content.js';
import {showNotFound} from './not-found.js';
import {artistColourProperties} from './artist-colours.js';
let refreshInFlight=false,refreshQueued=false;
const mediaSources=new Map();
let companyHeader;
function renderArtistColours(root,fields){
 const navigation=document.querySelector('[data-fragment="navigation"]');
 for(const [property,value] of Object.entries(artistColourProperties(fields))){
  if(value)root.style.setProperty(property,value);
  else root.style.removeProperty(property);
 }
 if(navigation){const colour=root.style.getPropertyValue('--artist-header-ribbon');if(colour)navigation.style.setProperty('--artist-header-ribbon',colour);else navigation.style.removeProperty('--artist-header-ribbon');}
 // The public snapshot includes palette only when the artist shares it.
 for(const icon of root.querySelectorAll('[data-artist-colour-icon]')){
  const image=document.createElement('img');image.src=icon.dataset.artistColourIcon;image.alt='';
  if(icon.dataset.monochrome)image.dataset.monochrome=icon.dataset.monochrome;
  icon.replaceWith(image);
 }
 if(!root.style.getPropertyValue('--artist-icon-colour'))return;
 for(const image of root.querySelectorAll('.hub__link img')){
  const icon=document.createElement('span');icon.className='artist-colour-icon';icon.setAttribute('aria-hidden','true');
  icon.dataset.artistColourIcon=image.src;if(image.dataset.monochrome)icon.dataset.monochrome=image.dataset.monochrome;
  icon.style.setProperty('--artist-icon-artwork','url("'+image.src.replace(/["\\\n\r]/g,'')+'")');image.replaceWith(icon);
 }
}
function artistHeader(){
 const mount=document.querySelector('.label-header-logo');if(!mount)return null;
 if(companyHeader?.mount!==mount)companyHeader={mount,nodes:[...mount.childNodes],label:mount.getAttribute('aria-label')};
 return mount;
}
function clearArtistMedia(mount,field){
 const previous=mediaSources.get(mount);mediaSources.delete(mount);
 if(field==='logo_path'){
  mount.replaceChildren(...companyHeader.nodes);mount.setAttribute('aria-label',companyHeader.label);delete mount.dataset.artistLogo;
 }else mount.replaceChildren();
 if(previous)URL.revokeObjectURL(previous.url);
}
async function renderArtistMedia(root,record,config){
 for(const [field,bucket,selector] of [['portrait_path','studio-avatars','[data-artist-portrait]'],['header_path','studio-headers','[data-artist-header]'],['logo_path','studio-logos','[data-artist-logo]']]){
  const mount=field==='logo_path'?artistHeader():root.querySelector(selector);if(!mount)continue;
  const key=record.fields[field],previous=mediaSources.get(mount),version=key?key+'?v='+record.updated_at:'';
  if(previous?.version===version)continue;
  if(!key||!/^\b[0-9a-f-]{36}\/(avatar|header|logo)$/.test(key)){clearArtistMedia(mount,field);continue;}
  try{
   const url=new URL('/storage/v1/object/authenticated/'+bucket+'/'+key,config.backend);url.searchParams.set('v',record.updated_at);
   const response=await fetch(url,{headers:{apikey:config.publishableKey},cache:'no-store',credentials:'omit'});if(!response.ok)throw Error();
   const blob=await response.blob();if(!['image/jpeg','image/png','image/webp'].includes(blob.type))throw Error();
   const source=URL.createObjectURL(blob),image=document.createElement('img');image.src=source;image.alt=field==='portrait_path'?(record.fields.portrait_alt||record.fields.artist_name):'';
   try{await image.decode();}catch{URL.revokeObjectURL(source);throw Error('Artist image could not be decoded');}
   // Swap only a decoded image into the existing mount; its scroll lifecycle stays unchanged.
   mount.replaceChildren(image);mediaSources.set(mount,{version,url:source});
   if(field==='logo_path'){mount.dataset.artistLogo='';mount.setAttribute('aria-label',record.fields.artist_name+' · '+companyHeader.label);}
   else mount.removeAttribute('aria-label');
   if(previous)URL.revokeObjectURL(previous.url);
  }catch{clearArtistMedia(mount,field);/* Never substitute another artist's image or expose a private URL. */}
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
  if(!record){renderArtistColours(root,{});await showNotFound();}
  if(!record){root.hidden=true;unavailable.hidden=false;unavailable.textContent='This artist page is not public.';for(const mount of root.querySelectorAll('[data-artist-portrait],[data-artist-header]'))clearArtistMedia(mount);const header=artistHeader();if(header)clearArtistMedia(header,'logo_path');document.body.style.setProperty('--artist-cover','none');return;}
  root.hidden=false;unavailable.hidden=true;
  root.querySelector('[data-artist-name]').textContent=record.fields.artist_name;document.title=record.fields.artist_name+' · Artanrecords';status.textContent='@'+record.username;
  const background=record.fields.catalogue_background||'Latest release';
  if(background==='Latest release'&&root.dataset.latestCover)document.body.style.setProperty('--artist-cover','url("'+root.dataset.latestCover.replace(/["\\\n\r]/g,'')+'")');
  else document.body.style.setProperty('--artist-cover','none');
  const canonical=new URL('/'+record.username+'/',location.origin);document.querySelector('link[rel=canonical]')?.setAttribute('href',canonical.href);
  for(const [property,value] of [['og:title',document.title],['og:url',canonical.href]])document.querySelector(`meta[property="${property}"]`)?.setAttribute('content',value);
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
  renderArtistColours(root,record.fields);
 }catch{const header=artistHeader();if(header)clearArtistMedia(header,'logo_path');if(!embedded)status.textContent='This artist page could not be loaded. Please try again.';}finally{refreshInFlight=false;if(refreshQueued){refreshQueued=false;queueMicrotask(()=>bindPublicArtist());}}
}

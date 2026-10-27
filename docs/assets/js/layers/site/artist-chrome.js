function safeLink(item){
 if(!item||typeof item.label!=='string'||!item.label.trim()||item.label.length>60||typeof item.url!=='string'||item.url.length>2000)return null;
 if(/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(item.url))return item;
 try{const url=new URL(item.url);return url.protocol==='https:'&&!url.username&&!url.password?{label:item.label,url:url.href}:null;}catch{return null;}
}
function links(mount,items,base=''){
 mount.replaceChildren();for(const item of items.slice(0,16)){const value=safeLink(item);if(!value)continue;const link=document.createElement('a');link.href=base&&value.url.startsWith('#')?base+value.url:value.url;link.textContent=value.label;link.rel='noopener';mount.append(link);}
}
export async function renderArtistChrome(root,record,config){
 const menu=document.querySelector('.site-menu__links');let footer=document.querySelector('.site-footer');
 if(!footer){footer=document.createElement('footer');footer.className='site-footer';const mount=document.querySelector('[data-fragment="footer"]');if(mount)mount.append(footer);else document.querySelector('main')?.after(footer);}
 const defaults=[];
 for(const [selector,id,label] of [['[data-artist-name]','artist-home',record.fields.artist_name],['.artist-connections','artist-links','Listen & follow'],['[data-artist-archive]','artist-releases','Releases'],['[data-artist-concerts]','artist-live','Live']]){const section=root.querySelector(selector);if(section){if(!section.id)section.id=id;defaults.push({label,url:'#'+section.id});}}
 const base='/'+record.username+'/',pageDefaults=[{label:record.fields.artist_name,url:new URL(base,location.origin).href},...['Music','Concerts','Gallery','Shop'].map(label=>({label:label==='Shop'?'Store':label,url:new URL(base+label.toLowerCase()+'/',location.origin).href}))];
 try{const endpoint=new URL('/rest/v1/studio_public_artist_site_pages',config.backend);endpoint.searchParams.set('select','slug,title');endpoint.searchParams.set('username','eq.'+record.username);const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(response.ok)for(const page of (await response.json()).slice(0,12))if(/^[a-z0-9]+(-[a-z0-9]+)*$/.test(page.slug))pageDefaults.push({label:page.title,url:new URL(base+page.slug+'/',location.origin).href});}catch{}
 if(menu)menu.onclick=event=>{const link=event.target.closest('a');if(!link?.hash||link.origin!==location.origin||link.pathname!==location.pathname)return;const target=document.getElementById(link.hash.slice(1)),panel=target?.closest('[role=tabpanel]');if(panel?.hidden)document.querySelector('[aria-controls="'+panel.id+'"]')?.click();};
 if(menu){menu.setAttribute('aria-label',record.fields.artist_name);links(menu,pageDefaults);}
 if(footer){footer.replaceChildren();const credit=document.createElement('p');credit.dataset.artistCopyright='© '+new Date().getUTCFullYear()+' '+record.fields.artist_name;credit.textContent=credit.dataset.artistCopyright;footer.append(credit);}
 const directory=root.querySelector('[data-artist-directory]');if(directory)links(directory,defaults.filter(item=>item.url!=='#artist-home').slice(0,3));
 try{
  const endpoint=new URL('/rest/v1/studio_public_artist_navigation',config.backend);endpoint.searchParams.set('select','menu,footer,footer_text');endpoint.searchParams.set('username','eq.'+record.username);
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)return;
  const [value]=await response.json();if(!value)return;
  if(menu&&Array.isArray(value.menu)&&value.menu.length)links(menu,value.menu,root.dataset.artistSubpage?base:'');
  if(footer){const nav=document.createElement('nav');nav.className='information-links';nav.setAttribute('aria-label','Artist footer');links(nav,Array.isArray(value.footer)?value.footer:[]);footer.prepend(nav);if(typeof value.footer_text==='string'&&value.footer_text){const text=document.createElement('p');text.textContent=value.footer_text.slice(0,500);footer.append(text);}}
 }catch{/* Keep artist-only defaults when no published customization is available. */}
}

function safeLink(item){
 if(!item||typeof item.label!=='string'||!item.label.trim()||item.label.length>60||typeof item.url!=='string'||item.url.length>2000)return null;
 if(/^#[a-zA-Z][a-zA-Z0-9_-]*$/.test(item.url))return item;
 try{const url=new URL(item.url);return url.protocol==='https:'&&!url.username&&!url.password?{label:item.label,url:url.href}:null;}catch{return null;}
}
function links(mount,items){
 mount.replaceChildren();for(const item of items.slice(0,8)){const value=safeLink(item);if(!value)continue;const link=document.createElement('a');link.href=value.url;link.textContent=value.label;link.rel='noopener';mount.append(link);}
}
export async function renderArtistChrome(root,record,config){
 const menu=document.querySelector('.site-menu__links');let footer=document.querySelector('.site-footer');
 if(!footer){footer=document.createElement('footer');footer.className='site-footer';const mount=document.querySelector('[data-fragment="footer"]');if(mount)mount.append(footer);else document.querySelector('main')?.after(footer);}
 const defaults=[];
 for(const [selector,id,label] of [['[data-artist-name]','artist-home',record.fields.artist_name],['.artist-connections','artist-links','Listen & follow'],['[data-artist-releases]','artist-releases','Releases'],['[data-artist-concerts]','artist-live','Live']]){const section=root.querySelector(selector);if(section){if(!section.id)section.id=id;defaults.push({label,url:'#'+section.id});}}
 if(menu){menu.setAttribute('aria-label',record.fields.artist_name);links(menu,defaults);}
 if(footer){footer.replaceChildren();const credit=document.createElement('p');credit.textContent='© '+new Date().getUTCFullYear()+' '+record.fields.artist_name;footer.append(credit);}
 try{
  const endpoint=new URL('/rest/v1/studio_public_artist_navigation',config.backend);endpoint.searchParams.set('select','menu,footer,footer_text');endpoint.searchParams.set('username','eq.'+record.username);
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)return;
  const [value]=await response.json();if(!value)return;
  if(menu&&Array.isArray(value.menu)&&value.menu.length)links(menu,value.menu);
  if(footer){const nav=document.createElement('nav');nav.className='information-links';nav.setAttribute('aria-label','Artist footer');links(nav,Array.isArray(value.footer)?value.footer:[]);footer.prepend(nav);if(typeof value.footer_text==='string'&&value.footer_text){const text=document.createElement('p');text.textContent=value.footer_text.slice(0,500);footer.append(text);}}
 }catch{/* Keep artist-only defaults when no published customization is available. */}
}

const urls=new Map();
const turns=new WeakMap();
export async function renderArtistPortfolio(root,record,config,offset=0){
 const turn=(turns.get(root)||0)+1;turns.set(root,turn);
 const previous=urls.get(root)||[],next=[];urls.set(root,next);
 try{
  const endpoint=new URL('/rest/v1/studio_public_artist_portfolio',config.backend);endpoint.searchParams.set('select','id,kind,details,updated_at');endpoint.searchParams.set('username','eq.'+record.username);endpoint.searchParams.set('order','updated_at.desc,id.asc');endpoint.searchParams.set('limit','49');endpoint.searchParams.set('offset',String(offset));
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();const result=await response.json();if(!Array.isArray(result))throw Error();const hasMore=result.length>48,rows=result.slice(0,48);
  const labels=await fetch('/assets/data/artists/portfolio.json').then(response=>response.json());
  if(turns.get(root)!==turn)return;
  for(const kind of ['gallery','project']){
   let section=root.querySelector('[data-artist-portfolio="'+kind+'"]');if(!section){section=document.createElement('section');section.className='site-section artist-portfolio';section.dataset.artistPortfolio=kind;root.append(section);}section.replaceChildren();section.hidden=true;
   const items=rows.filter(item=>item.kind===kind);if(!items.length)continue;
   const heading=document.createElement('h2'),list=document.createElement('div');heading.textContent=labels[kind];list.className='artist-portfolio-grid';section.append(heading);
   const collections=[...new Set(items.map(item=>item.details.collection).filter(Boolean))];
   if(collections.length>1){const label=document.createElement('label'),select=document.createElement('select');label.textContent=labels.collection;select.className='ui-dropdown';for(const title of ['',...collections]){const option=document.createElement('option');option.value=title;option.textContent=title||labels.all;select.append(option);}select.onchange=()=>{for(const card of list.children)card.hidden=Boolean(select.value)&&card.dataset.collection!==select.value;};label.append(select);section.append(label);}
   for(const item of items){const value=item.details,card=document.createElement('article'),title=document.createElement('h3');card.dataset.collection=value.collection||'';title.textContent=value.title;card.append(title);
    if(value.image_path&&/^[0-9a-f-]{36}$/.test(item.id)&&new RegExp('^[0-9a-f-]{36}/'+item.id+'/image$').test(value.image_path))try{
     const path=new URL('/storage/v1/object/authenticated/studio-portfolio/'+value.image_path,config.backend);path.searchParams.set('v',item.updated_at);const media=await fetch(path,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!media.ok)throw Error();const blob=await media.blob();if(!['image/png','image/jpeg','image/webp'].includes(blob.type))throw Error();const src=URL.createObjectURL(blob),image=document.createElement('img');next.push(src);image.src=src;image.alt=value.image_alt||value.title;await image.decode();if(turns.get(root)!==turn)return;card.prepend(image);
    }catch{/* Unavailable images never fall back to another artist's media. */}
    for(const field of ['collection','year','description','role','credits'])if(value[field]){const text=document.createElement('p');text.textContent=(field==='credits'?labels.credits+': ':'')+value[field];card.append(text);}
    if(value.project_url)try{const url=new URL(value.project_url);if(url.protocol==='https:'&&!url.username&&!url.password){const link=document.createElement('a');link.href=url.href;link.textContent=labels.visit;link.rel='noopener noreferrer';card.append(link);}}catch{}
    list.append(card);
   }
   section.append(list);section.hidden=false;
  }
  root.querySelector('[data-portfolio-pagination]')?.remove();
  if(offset||hasMore){const navigation=document.createElement('nav');navigation.dataset.portfolioPagination='';navigation.setAttribute('aria-label',labels.gallery+' & '+labels.project);for(const [text,next,disabled] of [[labels.previous,offset-48,offset===0],[labels.next,offset+48,!hasMore]]){const button=document.createElement('button');button.type='button';button.textContent=text;button.disabled=disabled;button.onclick=()=>{for(const control of navigation.querySelectorAll('button'))control.disabled=true;renderArtistPortfolio(root,record,config,next);};navigation.append(button);}root.append(navigation);}
 }catch{if(turns.get(root)!==turn)return;for(const section of root.querySelectorAll('[data-artist-portfolio]')){section.replaceChildren();section.hidden=true;}}
 finally{for(const url of previous)URL.revokeObjectURL(url);if(turns.get(root)!==turn)for(const url of next)URL.revokeObjectURL(url);}
}

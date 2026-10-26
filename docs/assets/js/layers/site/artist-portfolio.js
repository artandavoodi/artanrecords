const urls=new Map();
export async function renderArtistPortfolio(root,record,config){
 const previous=urls.get(root)||[],next=[];urls.set(root,next);
 try{
  const endpoint=new URL('/rest/v1/studio_public_artist_portfolio',config.backend);endpoint.searchParams.set('select','id,kind,details,updated_at');endpoint.searchParams.set('username','eq.'+record.username);endpoint.searchParams.set('order','updated_at.desc');
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();const rows=await response.json();if(!Array.isArray(rows))throw Error();
  const labels=await fetch('/assets/data/artists/portfolio.json').then(response=>response.json());
  for(const kind of ['gallery','project']){
   let section=root.querySelector('[data-artist-portfolio="'+kind+'"]');if(!section){section=document.createElement('section');section.className='site-section artist-portfolio';section.dataset.artistPortfolio=kind;root.append(section);}section.replaceChildren();section.hidden=true;
   const items=rows.filter(item=>item.kind===kind);if(!items.length)continue;
   const heading=document.createElement('h2'),list=document.createElement('div');heading.textContent=labels[kind];list.className='artist-portfolio-grid';section.append(heading);
   const collections=[...new Set(items.map(item=>item.details.collection).filter(Boolean))];
   if(collections.length>1){const label=document.createElement('label'),select=document.createElement('select');label.textContent=labels.collection;select.className='ui-dropdown';for(const title of ['',...collections]){const option=document.createElement('option');option.value=title;option.textContent=title||labels.all;select.append(option);}select.onchange=()=>{for(const card of list.children)card.hidden=Boolean(select.value)&&card.dataset.collection!==select.value;};label.append(select);section.append(label);}
   for(const item of items){const value=item.details,card=document.createElement('article'),title=document.createElement('h3');card.dataset.collection=value.collection||'';title.textContent=value.title;card.append(title);
    if(value.image_path&&new RegExp('^[0-9a-f-]{36}/'+item.id+'/image$').test(value.image_path)&&/^[0-9a-f-]{36}$/.test(item.id))try{
     const path=new URL('/storage/v1/object/authenticated/studio-portfolio/'+value.image_path,config.backend);path.searchParams.set('v',item.updated_at);const media=await fetch(path,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!media.ok)throw Error();const blob=await media.blob();if(!['image/png','image/jpeg','image/webp'].includes(blob.type))throw Error();const src=URL.createObjectURL(blob),image=document.createElement('img');next.push(src);image.src=src;image.alt=value.image_alt||value.title;await image.decode();card.prepend(image);
    }catch{/* Unavailable images never fall back to another artist's media. */}
    for(const field of ['collection','year','description','role','credits'])if(value[field]){const text=document.createElement('p');text.textContent=(field==='credits'?labels.credits+': ':'')+value[field];card.append(text);}
    if(value.project_url)try{const url=new URL(value.project_url);if(url.protocol==='https:'&&!url.username&&!url.password){const link=document.createElement('a');link.href=url.href;link.textContent=labels.visit;link.rel='noopener noreferrer';card.append(link);}}catch{}
    list.append(card);
   }
   section.append(list);section.hidden=false;
  }
 }catch{for(const section of root.querySelectorAll('[data-artist-portfolio]')){section.replaceChildren();section.hidden=true;}}
 finally{for(const url of previous)URL.revokeObjectURL(url);}
}

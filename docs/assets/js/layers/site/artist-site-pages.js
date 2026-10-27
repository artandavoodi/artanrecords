import {showNotFound} from './not-found.js';
export async function renderArtistSubpage(root,record,config){
 const slug=root.dataset.artistSubpage;if(!slug)return;
 const pages=await fetch('/assets/data/artists/site-pages.json').then(response=>response.json());
 const builtin=pages.builtins.find(item=>item.slug===slug);let title,body,sections=[];
 if(builtin){title=builtin.title;sections=builtin.selectors.flatMap(selector=>[...root.querySelectorAll(selector)]).filter(section=>!section.hidden);}
 else{
  const endpoint=new URL('/rest/v1/studio_public_artist_site_pages',config.backend);endpoint.searchParams.set('select','title,body');endpoint.searchParams.set('username','eq.'+record.username);endpoint.searchParams.set('slug','eq.'+slug);
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok){await showNotFound();return;}
  const [page]=await response.json();if(!page){await showNotFound();return;}title=page.title;body=page.body;
 }
 const header=document.createElement('header'),back=document.createElement('a'),heading=document.createElement('h1');back.href='/'+record.username+'/';back.textContent=record.fields.artist_name;heading.textContent=title;header.append(back,heading);
 root.replaceChildren(header,...sections);root.dataset.artistSubpage=slug;delete root.dataset.artistSectionMode;
 if(body!==undefined){const content=document.createElement('div');content.className='artist-page-copy';for(const paragraph of body.split(/\n\s*\n/)){const text=document.createElement('p');text.textContent=paragraph;content.append(text);}root.append(content);}
 if(builtin&&!sections.length){const empty=document.createElement('p');empty.textContent=slug==='shop'?'This artist’s store is not available yet.':'No published '+title.toLowerCase()+' yet.';root.append(empty);}
 document.title=title+' · '+record.fields.artist_name;const canonical=new URL('/'+record.username+'/'+slug+'/',location.origin);document.querySelector('link[rel=canonical]')?.setAttribute('href',canonical.href);document.querySelector('meta[property="og:url"]')?.setAttribute('content',canonical.href);
}

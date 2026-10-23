export async function renderConcerts(root,username,config){
 const mount=root.querySelector('[data-artist-concerts]');if(!mount)return;
 const heading=document.createElement('h2');heading.textContent=config.concerts.title;
 const endpoint=new URL('/rest/v1/studio_public_concerts',config.backend);
 endpoint.searchParams.set('select','id,title,starts_at,ends_at,timezone,venue,city,country,ticket_url,ticket_price,currency,announcement,status');
 endpoint.searchParams.set('username','eq.'+username);endpoint.searchParams.set('starts_at','gte.'+new Date().toISOString());endpoint.searchParams.set('order','starts_at.asc');endpoint.searchParams.set('limit','100');
 try{
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},cache:'no-store',credentials:'omit'});if(!response.ok)throw Error();
  const events=await response.json();mount.replaceChildren(heading);
  if(!events.length){const empty=document.createElement('p');empty.textContent=config.concerts.empty;mount.append(empty);return;}
  for(const event of events){
   const article=document.createElement('article'),title=document.createElement('h3'),time=document.createElement('time'),place=document.createElement('p');
   title.textContent=event.title;time.dateTime=event.starts_at;time.textContent=new Intl.DateTimeFormat(undefined,{timeZone:event.timezone,dateStyle:'medium',timeStyle:'short'}).format(new Date(event.starts_at))+' · '+event.timezone;
   place.textContent=[event.venue,event.city,event.country].filter(Boolean).join(' · ');article.append(time,title,place);
   if(event.announcement){const text=document.createElement('p');text.textContent=event.announcement;article.append(text);}
   if(event.status==='cancelled'){const text=document.createElement('p');text.textContent=config.concerts.cancelled;article.append(text);}
   else{
    if(event.ticket_price!==null&&event.currency){const price=document.createElement('p');try{price.textContent=new Intl.NumberFormat(undefined,{style:'currency',currency:event.currency}).format(event.ticket_price);article.append(price);}catch{}}
    if(event.ticket_url){try{const url=new URL(event.ticket_url);if(url.protocol==='https:'&&!url.username&&!url.password){const link=document.createElement('a');link.href=url.href;link.textContent=config.concerts.tickets;link.rel='noopener';article.append(link);}}catch{}}
   }
   mount.append(article);
  }
 }catch{mount.replaceChildren(heading);const notice=document.createElement('p');notice.textContent=config.concerts.unavailable;mount.append(notice);}
}

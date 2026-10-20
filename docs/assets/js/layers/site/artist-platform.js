export async function bindPublicArtist(){
 const root=document.querySelector('[data-public-artist]');if(!root)return;
 const status=root.querySelector('[data-artist-status]'),username=new URL(location.href).searchParams.get('username');
 if(!username||!/^[a-z0-9][a-z0-9.]{1,30}[a-z0-9]$/.test(username)||username.includes('..')){status.textContent='Choose an artist profile from a shared artist link.';return;}
 try{
  const config=await fetch('/assets/data/artists/platform.json').then(response=>{if(!response.ok)throw Error();return response.json();});
  const endpoint=new URL('/rest/v1/studio_artist_pages',config.backend);endpoint.searchParams.set('select','username,fields,updated_at');endpoint.searchParams.set('username','eq.'+username);
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();const [record]=await response.json();
  if(!record){status.textContent='This artist page is not public.';return;}
  root.querySelector('[data-artist-name]').textContent=record.fields.artist_name;document.title=record.fields.artist_name+' · Artanrecords';status.textContent='@'+record.username;
  const canonical=new URL('/artists/profile/',location.origin);canonical.searchParams.set('username',record.username);document.querySelector('link[rel=canonical]')?.setAttribute('href',canonical.href);
  for(const [property,value] of [['og:title',document.title],['og:url',canonical.href]])document.querySelector(`meta[property="${property}"]`)?.setAttribute('content',value);
  const body=root.querySelector('[data-artist-fields]');for(const field of config.fields){const value=record.fields[field.key];if(!value)continue;const section=document.createElement('section'),heading=document.createElement('h2'),text=document.createElement('p');heading.textContent=field.label;text.textContent=value;section.append(heading,text);body.append(section);}
  const links=root.querySelector('[data-artist-links]');for(const field of config.links){const value=record.fields[field.key];if(!value)continue;let href;try{if(field.email){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))continue;href='mailto:'+value;}else{const url=new URL(value);if(url.protocol!=='https:'||url.username||url.password)continue;href=url.href;}}catch{continue;}const link=document.createElement('a');link.href=href;link.textContent=field.label;link.rel='noopener';links.append(link);}
 }catch{status.textContent='This artist page could not be loaded. Please try again.';}
}

export async function renderArtistContent(root,record,config){
 let mount=root.querySelector('[data-artist-extra-content]');
 if(!mount){mount=document.createElement('div');mount.dataset.artistExtraContent='';root.querySelector('[data-artist-fields]').append(mount);}
 try{
  const labels=await fetch('/assets/data/artists/content.json').then(response=>response.json());
  const endpoint=new URL('/rest/v1/studio_public_artist_content',config.backend);endpoint.searchParams.set('select','content,updated_at');endpoint.searchParams.set('username','eq.'+record.username);
  const response=await fetch(endpoint,{headers:{apikey:config.publishableKey},credentials:'omit',cache:'no-store'});if(!response.ok)throw Error();
  const [snapshot]=await response.json(),content=snapshot?.content||{};mount.replaceChildren();
  for(const field of labels.fields){if(typeof content[field.key]!=='string'||!content[field.key])continue;const section=document.createElement('section'),heading=document.createElement('h2'),text=document.createElement('p');heading.textContent=field.label;text.textContent=content[field.key];section.append(heading,text);mount.append(section);}
  let spotlight=root.querySelector('[data-artist-spotlight]');if(!spotlight){spotlight=document.createElement('aside');spotlight.dataset.artistSpotlight='';root.querySelector('[data-artist-name]').after(spotlight);}spotlight.replaceChildren();spotlight.hidden=true;
  if(!content.spotlight_release)return;
  const releases=await fetch(labels.releases,{cache:'no-store'}).then(response=>response.json());
  const artistIds=Object.entries(config.routes||{}).filter(([,username])=>username===record.username).map(([id])=>id);
  const release=releases.items.find(item=>item.id===content.spotlight_release&&item.status==='Released'&&artistIds.includes(item.artistId));if(!release)return;
  const heading=document.createElement('h2'),link=document.createElement('a');heading.textContent=labels.spotlightTitle;link.href='/releases/'+encodeURIComponent(release.id)+'/';link.textContent=release.title;spotlight.append(heading,link);
  if(content.spotlight_note){const note=document.createElement('p');note.textContent=content.spotlight_note;spotlight.append(note);}spotlight.hidden=false;
 }catch{mount.replaceChildren();root.querySelector('[data-artist-spotlight]')?.replaceChildren();}
}

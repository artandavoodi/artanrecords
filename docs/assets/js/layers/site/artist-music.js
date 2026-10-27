const element=(tag,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;return node;};
export function artistMusicItems(items,username,config){
 const ids=Object.entries(config.routes||{}).filter(([,handle])=>handle===username).map(([id])=>id);
 return items.filter(item=>ids.includes(item.artistId)).sort((a,b)=>(Date.parse(b.releaseDate)||0)-(Date.parse(a.releaseDate)||0));
}
export function musicCategory(item,category){return category==='all'||category==='released'&&item.status==='Released'||item.category===category;}
function streaming(items,icons,title){
 const group=element('div');group.className='hub__group-links';group.setAttribute('aria-label',title);
 for(const item of items||[])try{const url=new URL(item.url);if(url.protocol!=='https:'||url.username||url.password)continue;const link=element('a'),source=icons.items.find(icon=>icon.id===item.icon);link.href=url.href;link.className='hub__link';link.rel='noopener noreferrer';link.setAttribute('aria-label',item.label);if(source){const image=element('img');image.src='/'+source.src.replace(/^\//,'');image.alt='';if(source.monochrome)image.dataset.monochrome='true';link.append(image);}const label=element('span',item.label);label.className='hub__tooltip';link.append(label);group.append(link);}catch{}
 return group;
}
function facts(item,labels){
 const details=element('details'),summary=element('summary',labels.information);details.className='information-accordion';details.append(summary);
 for(const field of labels.facts){const value=item[field.key];if(typeof value!=='string'||!value)continue;const section=element('section');section.append(element('h3',field.label),element('p',value));details.append(section);}return details;
}
function labelCredit(record,labels){
 if(typeof record.label!=='string'||!record.label.trim())return null;
 const footer=element('footer'),known=labels.labels.find(label=>label.name===record.label);footer.className='artist-release-label';footer.setAttribute('aria-label',labels.label);
 if(!known){footer.textContent=record.label;return footer;}
 const link=element('a');link.href=known.url;link.setAttribute('aria-label',known.name);
 for(const [mode,src] of [['light',known.light],['dark',known.dark]]){const image=element('img');image.src=src;image.alt='';image.className='label-wordmark label-wordmark--'+mode;link.append(image);}footer.append(link);return footer;
}
export async function renderArtistMusic(root,record,config){
 const section=element('section');section.className='artist-music';root.append(section);
 try{
  const labels=await fetch('/assets/data/artists/music.json').then(response=>{if(!response.ok)throw Error();return response.json();});
  const [catalogue,icons]=await Promise.all([fetch(labels.releases).then(response=>{if(!response.ok)throw Error();return response.json();}),fetch(config.icons).then(response=>response.json())]);
  const records=artistMusicItems(catalogue.items,record.username,config),navigation=element('div'),list=element('div'),tracks=element('div'),empty=element('p',labels.empty);
  navigation.className='artist-music-tabs';navigation.setAttribute('role','tablist');navigation.setAttribute('aria-label','Music categories');list.className='catalogue';list.id='artist-music-releases';list.setAttribute('role','tabpanel');tracks.id='artist-music-tracks';tracks.setAttribute('role','tabpanel');tracks.className='artist-track-directory';tracks.hidden=true;
  const buttons=[];
  const select=id=>{for(const button of buttons){const selected=button.dataset.category===id;button.setAttribute('aria-selected',String(selected));button.tabIndex=selected?0:-1;}list.hidden=id==='tracks';tracks.hidden=id!=='tracks';let count=0;for(const card of list.children){card.hidden=!musicCategory(records.find(item=>item.id===card.dataset.releaseId),id);if(!card.hidden)count++;}empty.hidden=id==='tracks'?tracks.childElementCount>0:count>0;};
  for(const tab of labels.tabs){const button=element('button',tab.label);button.type='button';button.dataset.category=tab.id;button.id='artist-music-tab-'+tab.id;button.setAttribute('role','tab');button.setAttribute('aria-controls',tab.id==='tracks'?tracks.id:list.id);button.onclick=()=>{select(tab.id);(tab.id==='tracks'?tracks:list).setAttribute('aria-labelledby',button.id);};button.onkeydown=event=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const index=buttons.indexOf(button),next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:-1)+buttons.length)%buttons.length;buttons[next].click();buttons[next].focus();};buttons.push(button);navigation.append(button);}
  for(const record of records){
   const card=element('article'),link=element('a',record.title);card.className='release-card';card.dataset.releaseId=record.id;link.href='/releases/'+encodeURIComponent(record.id)+'/';
   if(record.cover?.src){const image=element('img');image.src='/'+record.cover.src.replace(/^\//,'');image.alt=record.cover.alt||record.title;image.loading='lazy';card.append(image);}const heading=element('h2');heading.append(link);card.append(heading,element('p',[record.type,record.releaseDate,record.duration].filter(Boolean).join(' · ')),streaming(record.links,icons,record.title),facts(record,labels));
   const credit=labelCredit(record,labels);if(credit)card.append(credit);list.append(card);
   const entries=record.tracks?.length?record.tracks:[{...record,title:record.title}];
   for(const [index,track] of entries.entries()){const row=element('article');row.append(element('h2',track.title),element('p',[record.title,track.duration].filter(Boolean).join(' · ')),streaming(track.links,icons,track.title),facts(track,labels));row.dataset.releaseId=record.id;row.dataset.trackId=track.id||String(index+1);tracks.append(row);}
  }
  section.append(navigation,list,tracks,empty);buttons[0].click();
 }catch{section.replaceChildren(element('p','Music could not be loaded. Please try again.'));}
}

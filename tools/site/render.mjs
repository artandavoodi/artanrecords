import platform from '../../docs/assets/data/artists/platform.json' with {type:'json'};
export const artistPath=id=>{
  const slug=platform.routes?.[id]||id;
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))throw Error('Invalid artist route');
  return '/artists/'+slug+'/';
};
export const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function releaseArtist(record,artists) {
  if(!record.artistId) throw new Error(`Missing stable artist ID: ${record.id}`);
  const matches=artists.filter(artist=>artist.id===record.artistId);
  if(matches.length!==1) throw new Error(`Unregistered or duplicate artist ID: ${record.artistId}`);
  return matches[0];
}
export const fill=(template,values)=>template.replace(/\{\{(\w+)\}\}/g,(_,key)=>{
  if(!(key in values)) throw new Error(`Missing template value: ${key}`);
  return values[key];
});
export const paragraphs=value=>String(value||'').split(/\n\n+/).filter(Boolean).map(text=>`<p>${escape(text)}</p>`).join('');
export const image=(cover,lazy=false)=>cover?`<figure><img src="/${escape(cover.src)}"${cover.variants?.length?` srcset="${cover.variants.map(v=>`/${escape(v.src)} ${v.width}w`).join(', ')}" sizes="${escape(cover.sizes)}"`:''} alt="${escape(cover.alt)}" width="${cover.width}" height="${cover.height}" decoding="async"${lazy?' loading="lazy"':''}></figure>`:'';
export function icon(id,icons) {
  const item=icons.items.find(i=>i.id===id);
  if(!item) throw new Error(`Unregistered icon: ${id}`);
  return `<img src="/${escape(item.src)}" alt=""${item.monochrome?' data-monochrome="true"':''}>`;
}
export function links(items,icons,className='streaming',presentation='icons') {
  const content = `<div class="${className==='streaming'?'hub__group-links':escape(className)}">${[...(items||[])].sort((a,b)=>a.order-b.order).map(l=>`<a class="hub__link" href="${escape(l.url)}" aria-label="${escape(l.label)}"${l.url.startsWith('mailto:')?'':' target="_blank" rel="noopener noreferrer"'}>${icon(l.icon,icons)}${presentation==='icons-only'?'':`<span class="hub__tooltip" aria-hidden="true">${escape(l.label)}</span>`}</a>`).join('')}</div>`;
  return className==='streaming' ? `<div class="hub hub__group" data-presentation="${escape(presentation)}">${content}</div>` : content;
}
export const cards=items=>items.map(r=>`<article class="release-card"><a href="/releases/${escape(r.id)}/">${image(r.cover,true)}<h3>${escape(r.title)}</h3></a><p>${escape(r.type)} · ${escape(r.artist)}</p></article>`).join('');
export function discoveryCards(items, artists, icons) {
  return items.map(r=>{
    const artist=releaseArtist(r,artists);
    if(!artist) throw new Error(`Unregistered release artist: ${r.artist}`);
    return `<article class="release-card" data-release-category="${escape(r.category)}" data-release-artist="${escape(artist.id)}" data-release-search="${escape(r.title+' '+r.artist)}"><a href="/releases/${escape(r.id)}/">${image(r.cover,true)}<h3>${escape(r.title)}</h3></a><div class="release-card__details"><p class="release-card__meta">${escape(r.type)} · <time datetime="${escape(r.releaseDate)}">${escape(r.releaseDate.slice(0,4))}</time></p><p class="release-card__artist"><a href="${escape(artistPath(artist.id))}">${escape(r.artist)}</a></p></div>${links(r.links,icons)}</article>`;
  }).join('');
}
export function artistYears(artist,labels) {
  if(!artist.yearsActive) return '';
  return `<p class="artist-facts" data-artist-since>${escape(labels.yearsActive)} ${escape(artist.yearsActive.start)}</p>`;
}
export const artistCards=(artists,labels)=>artists.map(a=>`<article class="artist-card"><a href="${escape(artistPath(a.id))}">${a.portrait?image(a.portrait,true):''}<h3>${escape(a.name)}</h3></a></article>`).join('');
export function artistLinks(artist,groups,icons) {
  return `<div class="artist-link-groups">${groups.map(group=>{
    const items=(artist.links||[]).filter(link=>link.category===group.id);
    return items.length?`<section class="artist-link-group hub__group" data-presentation="${escape(group.presentation)}" aria-label="${escape(group.label)}"><h2>${escape(group.label)}</h2>${links(items,icons,'hub__group-links')}</section>`:'';
  }).join('')}</div>`;
}
export function sections(record,ui,icons) {
  return ui.musicReaderFields.filter(f=>record.editorial?.[f.key]!=='draft'&&typeof record[f.key]==='string'&&record[f.key]).map(f=>`<details id="${escape(record.id)}-${escape(f.key)}"><summary>${escape(f.label)}${icon('chevron-right',icons)}</summary>${paragraphs(record[f.key])}</details>`).join('');
}
export function metadata(record,ui) {
  return `<dl>${ui.musicDetails.map(f=>({f,value:f.key==='trackCount'?record.tracks?.length:record[f.key]})).filter(({f,value})=>value&&(!f.when||f.when===value)).map(({f,value})=>`<div><dt>${escape(f.label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
}

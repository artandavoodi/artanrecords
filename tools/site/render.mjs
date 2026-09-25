export const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const fill=(template,values)=>template.replace(/\{\{(\w+)\}\}/g,(_,key)=>{
  if(!(key in values)) throw new Error(`Missing template value: ${key}`);
  return values[key];
});
export const paragraphs=value=>String(value||'').split(/\n\n+/).filter(Boolean).map(text=>`<p>${escape(text)}</p>`).join('');
export const image=(cover,lazy=false)=>`<figure><img src="/${escape(cover.src)}" alt="${escape(cover.alt)}" width="${cover.width}" height="${cover.height}" decoding="async"${lazy?' loading="lazy"':''}></figure>`;
export function icon(id,icons) {
  const item=icons.items.find(i=>i.id===id);
  if(!item) throw new Error(`Unregistered icon: ${id}`);
  return `<img src="/${escape(item.src)}" alt=""${item.monochrome?' data-monochrome="true"':''}>`;
}
export function links(items,icons) {
  return `<div class="streaming">${[...(items||[])].sort((a,b)=>a.order-b.order).map(l=>`<a class="hub__link" href="${escape(l.url)}" aria-label="${escape(l.label)}"${l.url.startsWith('mailto:')?'':' target="_blank" rel="noopener noreferrer"'}>${icon(l.icon,icons)}<span class="hub__tooltip" aria-hidden="true">${escape(l.label)}</span></a>`).join('')}</div>`;
}
export const cards=items=>items.map(r=>`<article class="release-card"><a href="/releases/${escape(r.id)}/">${image(r.cover,true)}<h3>${escape(r.title)}</h3></a><p>${escape(r.type)} · ${escape(r.artist)}</p></article>`).join('');
export function artistYears(artist,labels) {
  if(!artist.yearsActive) return '';
  return `<dl class="artist-facts"><div><dt>${escape(labels.yearsActive)}</dt><dd>${escape(artist.yearsActive.start)}–${escape(artist.yearsActive.end??labels.present)}</dd></div></dl>`;
}
export const artistCards=(artists,labels)=>artists.map(a=>`<article class="artist-card"><a href="/artists/${escape(a.id)}/">${a.portrait?image(a.portrait,true):''}<h3>${escape(a.name)}</h3></a>${artistYears(a,labels)}</article>`).join('');
export function artistLinks(artist,groups,icons) {
  return `<div class="artist-link-groups">${groups.map(group=>{
    const items=(artist.links||[]).filter(link=>link.category===group.id);
    return items.length?`<section class="artist-link-group" aria-label="${escape(group.label)}"><h2>${escape(group.label)}</h2>${links(items,icons)}</section>`:'';
  }).join('')}</div>`;
}
export function sections(record,ui,icons) {
  return ui.musicReaderFields.filter(f=>typeof record[f.key]==='string'&&record[f.key]).map(f=>`<details id="${escape(record.id)}-${escape(f.key)}"><summary>${escape(f.label)}${icon('chevron-right',icons)}</summary>${paragraphs(record[f.key])}</details>`).join('');
}
export function metadata(record,ui) {
  return `<dl>${ui.musicDetails.map(f=>({f,value:f.key==='trackCount'?record.tracks?.length:record[f.key]})).filter(({f,value})=>value&&(!f.when||f.when===value)).map(({f,value})=>`<div><dt>${escape(f.label)}</dt><dd>${escape(value)}</dd></div>`).join('')}</dl>`;
}

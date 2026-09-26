import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {intakeForm} from './site/intake.mjs';
import {escape as e,fill,image,icon,links,cards,sections,metadata,artistCards,artistYears,artistLinks} from './site/render.mjs';
const docs=new URL('../docs/',import.meta.url);
const read=p=>readFile(new URL(p,docs),'utf8');
const json=async p=>JSON.parse(await read(p));
const [site,registry,catalogue,artists,icons,ui]=await Promise.all(['site','fragments','music/releases','artists/items','icons','music/interface'].map(p=>json('assets/data/'+p+'.json')));
const roster=await json('assets/data/artists/roster.json');
const intake=await json('assets/data/artists/intake.json');
const discovery=await json('assets/data/discovery.json');
for(const artist of roster.items) {
  if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(artist.id)||!artist.name||!artist.biography||artist.approved!==true) throw new Error('Roster must contain only approved, complete public profiles');
  if(artists.items.some(a=>a.id===artist.id)) throw new Error('Duplicate artist: '+artist.id);
  artists.items.push(artist);
}
if(new Set(artists.items.map(a=>a.id)).size!==artists.items.length) throw new Error('Duplicate roster identifier');
for(const artist of artists.items) {
  if(artist.yearsActive&&(!Number.isInteger(artist.yearsActive.start)||artist.yearsActive.start<1900||artist.yearsActive.start>new Date().getUTCFullYear()||(artist.yearsActive.end!=null&&(!Number.isInteger(artist.yearsActive.end)||artist.yearsActive.end<artist.yearsActive.start)))) throw new Error('Invalid active years');
  for(const item of artist.links||[]) {
    if(!roster.linkGroups.some(g=>g.id===item.category)) throw new Error('Unregistered artist link group');
    if(new URL(item.url).protocol!==(item.category==='email'?'mailto:':'https:')) throw new Error('Invalid artist link protocol');
  }
  for(const item of artist.portfolio||[]) if(new URL(item.url).protocol!=='https:') throw new Error('Portfolio links must use HTTPS');
}
const personFor=artist=>({'@type':'Person','@id':site.domain+`/artists/${artist.id}/#artist`,name:artist.name,description:artist.biography,...(artist.portrait?{image:site.domain+'/'+artist.portrait.src}:{}),...(artist.id===site.founder.artistId?{alternateName:site.founder.alternateName}:{}),url:site.domain+`/artists/${artist.id}/`,sameAs:(artist.links||[]).filter(l=>l.category!=='email').map(l=>l.url)});
const founder=artists.items.find(a=>a.id===site.founder.artistId);
if(!founder||founder.name!==site.founder.name) throw new Error('Founder must match a registered artist');
const shell=(await readFile(new URL('site/shell.html',import.meta.url),'utf8')).replace('{{logo}}',e(site.logo));
const fragment=async(name,values)=>{if(!registry[name])throw new Error('Unregistered fragment '+name);return fill(await read(registry[name]),values);};
const escaped=object=>Object.fromEntries(Object.entries(object).filter(([,v])=>typeof v==='string').map(([k,v])=>[k,e(v)]));
const navigation=await fragment('navigation',{...escaped(site.labels),links:site.navigation.map(n=>`<a href="${e(n.path)}">${e(n.label)}</a>`).join('')});
const footer=await fragment('footer',{name:e(site.name),year:String(new Date().getUTCFullYear())});
const organization={'@type':'Organization','@id':site.domain+'/#label',name:site.name,url:site.domain+'/',logo:site.domain+'/'+site.logo,description:site.description,founder:{'@id':personFor(founder)['@id']}};
const people=artists.items.map(personFor);
const paths=[];
async function output(file,value){await mkdir(new URL('./',new URL(file,docs)),{recursive:true});await writeFile(new URL(file,docs),value);}
async function page(path,title,description,fragmentName,values,entity={}) {
  const content=await fragment(fragmentName,values);
  const cover=fragmentName==='release'?catalogue.items.find(r=>path===`/releases/${r.id}/`).cover:artists.items.find(a=>path===`/artists/${a.id}/`)?.portrait;
  const graph=[organization,...people,{'@type':'WebSite','@id':site.domain+'/#website',name:site.name,url:site.domain+'/'},{'@type':'WebPage','@id':site.domain+path,url:site.domain+path,name:title,description,isPartOf:{'@id':site.domain+'/#website'},...(cover?{primaryImageOfPage:{'@type':'ImageObject',contentUrl:site.domain+'/'+cover.src}}:{}),...entity}];
  const head=`<title>${e(title)} · ${e(site.name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${site.domain}${path}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${site.domain}${path}"><meta name="twitter:card" content="${cover?'summary_large_image':'summary'}">${cover?`<meta property="og:image" content="${site.domain}/${e(cover.src)}"><meta name="twitter:image" content="${site.domain}/${e(cover.src)}">`:''}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
  await output(path.slice(1)+'index.html',fill(shell,{head,navigation,footer,fragment:fragmentName,content}));paths.push(path);
}
for(const nav of site.navigation) {
  const values={...escaped(site),title:e(nav.label),releases:cards(catalogue.items),artistsTitle:e(roster.labels.artists),artists:artistCards(artists.items,roster.labels)};
  if(nav.fragment==='home') {
    const featured=catalogue.items.find(r=>r.id===discovery.featuredRelease);
    if(!featured) throw new Error('Unregistered featured release');
    values.featured=`<article class="discovery-feature"><a href="/releases/${e(featured.id)}/">${image(featured.cover)}<div><p class="eyebrow">${e(discovery.featuredLabel)}</p><h2>${e(featured.title)}</h2><p>${e(featured.artist)}</p><p>${e(featured.description)}</p><span>${e(discovery.openLabel)}</span></div></a></article>`;
    values.releaseRows=discovery.rows.map(row=>{
      const items=catalogue.items.filter(r=>r.category===row.category);
      return items.length?`<section class="site-section"><h2>${e(row.title)}</h2><div class="catalogue">${cards(items)}</div></section>`:'';
    }).join('');
  }
  if(nav.fragment==='for-artists') Object.assign(values,escaped(intake),{form:intakeForm(intake.form,icons),channels:intake.channels.map(c=>`<section class="artist-intake__channel"><h2>${e(c.title)}</h2><p class="reading">${e(c.description)}</p></section>`).join('')});
  if(nav.fragment==='contact') values.links=links(site.contact,icons);
  await page(nav.path,nav.label,site.description,nav.fragment,values);
}
for(const artist of artists.items) {
  const releases=catalogue.items.filter(r=>r.artist===artist.name);
  await page(`/artists/${artist.id}/`,artist.name,artist.biography,'artist',{...escaped(artist),yearsActive:artistYears(artist,roster.labels),portrait:artist.portrait?image(artist.portrait):'',releases:releases.length?`<section><h2>${e(roster.labels.releases)}</h2><div class="catalogue">${cards(releases)}</div></section>`:'',portfolio:artist.portfolio?.length?`<section><h2>${e(roster.labels.portfolio)}</h2>${artist.portfolio.map(p=>`<article><h3><a href="${e(p.url)}">${e(p.title)}</a></h3><p>${e(p.description)}</p></article>`).join('')}</section>`:'',links:artistLinks(artist,roster.linkGroups,icons)},{'@type':'ProfilePage',mainEntity:{'@id':personFor(artist)['@id']}});
}
for(const r of catalogue.items) {
  const artist=artists.items.find(a=>a.name===r.artist);
  if(!artist) throw new Error('Release has no registered artist: '+r.id);
  const person=personFor(artist);
  const recordings=(r.tracks||[]).map(t=>({'@type':'MusicRecording',name:t.title,isrcCode:t.isrc,url:site.domain+`/releases/${r.id}/#track-${t.id}`,byArtist:{'@id':person['@id']},duration:'PT'+t.duration.replace(':','M')+'S'}));
  const entity={'@type':r.type==='Single'?'MusicRecording':'MusicAlbum',name:r.title,byArtist:{'@id':person['@id']},datePublished:r.releaseDate,image:site.domain+'/'+r.cover.src,...(recordings.length?{track:recordings,numTracks:recordings.length}:{isrcCode:r.isrc})};
  await page(`/releases/${r.id}/`,r.title,r.description,'release',{...escaped(r),back:e(site.labels.back),backIcon:icon('back',icons),cover:image(r.cover),metadata:metadata(r,ui),links:links(r.links,icons),sections:sections(r,ui,icons),tracks:recordings.length?`<section><h2>${e(site.labels.tracks)}</h2><ol>${r.tracks.map(t=>`<li id="track-${e(t.id)}"><details><summary>${e(t.title)} <span>${e(t.duration)}</span>${icon('chevron-right',icons)}</summary>${sections(t,ui,icons)}${links(t.links,icons)}</details></li>`).join('')}</ol></section>`:''},{mainEntity:entity});
}
await output('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${paths.map(p=>{
  const images=catalogue.items.filter(r=>p==='/'||p==='/releases/'||artists.items.some(a=>p===`/artists/${a.id}/`&&r.artist===a.name)||p===`/releases/${r.id}/`).map(r=>r.cover.src);
  const portrait=artists.items.find(a=>p===`/artists/${a.id}/`)?.portrait;
  if(portrait) images.push(portrait.src);
  if(p==='/'||p==='/artists/') images.push(...artists.items.filter(a=>a.portrait).map(a=>a.portrait.src));
  return `<url><loc>${site.domain}${p}</loc>${[...new Set(images)].map(src=>`<image:image><image:loc>${e(site.domain+'/'+src)}</image:loc></image:image>`).join('')}</url>`;
}).join('')}</urlset>`);
await output('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
await output('404.html',fill(shell,{head:`<title>${e(site.labels.notFound)}</title><meta name="robots" content="noindex">`,navigation,footer,fragment:'home',content:`<section class="site-section"><h1>${e(site.labels.notFound)}</h1><a href="/">${e(site.labels.returnHome)}</a></section>`}));
console.log(`Generated ${paths.length} public documents, 404, sitemap and robots.`);

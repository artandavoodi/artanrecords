import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {escape as e,fill,image,icon,links,cards,sections,metadata} from './site/render.mjs';
const docs=new URL('../docs/',import.meta.url);
const read=p=>readFile(new URL(p,docs),'utf8');
const json=async p=>JSON.parse(await read(p));
const [site,registry,catalogue,artists,icons,ui]=await Promise.all(['site','fragments','music/releases','artists/items','icons','music/interface'].map(p=>json('assets/data/'+p+'.json')));
const shell=await readFile(new URL('site/shell.html',import.meta.url),'utf8');
const fragment=async(name,values)=>{if(!registry[name])throw new Error('Unregistered fragment '+name);return fill(await read(registry[name]),values);};
const escaped=object=>Object.fromEntries(Object.entries(object).filter(([,v])=>typeof v==='string').map(([k,v])=>[k,e(v)]));
const navigation=await fragment('navigation',{...escaped(site.labels),links:site.navigation.map(n=>`<a href="${e(n.path)}">${e(n.label)}</a>`).join('')});
const footer=await fragment('footer',{name:e(site.name),year:String(new Date().getUTCFullYear())});
const organization={'@type':'Organization','@id':site.domain+'/#label',name:site.name,url:site.domain+'/',description:site.description,founder:{'@id':site.artistWebsite+'#artist'}};
const person={'@type':'Person','@id':site.artistWebsite+'#artist',name:artists.items[0].name,url:site.artistWebsite,sameAs:[site.publicHub]};
const paths=[];
async function output(file,value){await mkdir(new URL('./',new URL(file,docs)),{recursive:true});await writeFile(new URL(file,docs),value);}
async function page(path,title,description,fragmentName,values,entity={}) {
  const content=await fragment(fragmentName,values);
  const cover=fragmentName==='release'?catalogue.items.find(r=>path===`/releases/${r.id}/`).cover:undefined;
  const graph=[organization,person,{'@type':'WebSite','@id':site.domain+'/#website',name:site.name,url:site.domain+'/'},{'@type':'WebPage','@id':site.domain+path,url:site.domain+path,name:title,description,isPartOf:{'@id':site.domain+'/#website'},...entity}];
  const head=`<title>${e(title)} · ${e(site.name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${site.domain}${path}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${site.domain}${path}"><meta name="twitter:card" content="${cover?'summary_large_image':'summary'}">${cover?`<meta property="og:image" content="${site.domain}/${e(cover.src)}"><meta name="twitter:image" content="${site.domain}/${e(cover.src)}">`:''}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
  await output(path.slice(1)+'index.html',fill(shell,{head,navigation,footer,fragment:fragmentName,content}));paths.push(path);
}
for(const nav of site.navigation) {
  const values={...escaped(site),title:e(nav.label),releases:cards(catalogue.items)};
  if(nav.fragment==='home') values.title=e(site.navigation.find(n=>n.fragment==='releases').label);
  if(nav.fragment==='artists') values.artists=artists.items.map(a=>`<a href="/artists/${e(a.id)}/">${e(a.name)}</a>`).join('');
  if(nav.fragment==='contact') values.links=site.contact.map(l=>`<a href="${e(l.url)}">${icon(l.icon,icons)}<span>${e(l.label)}</span></a>`).join('');
  await page(nav.path,nav.label,site.description,nav.fragment,values);
}
for(const artist of artists.items) await page(`/artists/${artist.id}/`,artist.name,artist.biography,'artist',{...escaped(artist),releases:cards(catalogue.items.filter(r=>r.artist===artist.name)),links:`<a href="${site.artistWebsite}">${e(site.labels.artistWebsite)}</a><a href="${site.publicHub}">${e(site.labels.publicHub)}</a>`},{mainEntity:{'@id':person['@id']}});
for(const r of catalogue.items) {
  const recordings=(r.tracks||[]).map(t=>({'@type':'MusicRecording',name:t.title,isrcCode:t.isrc,url:site.domain+`/releases/${r.id}/#track-${t.id}`,byArtist:{'@id':person['@id']},duration:'PT'+t.duration.replace(':','M')+'S'}));
  const entity={'@type':r.type==='Single'?'MusicRecording':'MusicAlbum',name:r.title,byArtist:{'@id':person['@id']},datePublished:r.releaseDate,image:site.domain+'/'+r.cover.src,...(recordings.length?{track:recordings,numTracks:recordings.length}:{isrcCode:r.isrc})};
  await page(`/releases/${r.id}/`,r.title,r.description,'release',{...escaped(r),back:e(site.labels.back),backIcon:icon('back',icons),cover:image(r.cover),metadata:metadata(r,ui),links:links(r.links,icons),sections:sections(r,ui,icons),tracks:recordings.length?`<section><h2>${e(site.labels.tracks)}</h2><ol>${r.tracks.map(t=>`<li id="track-${e(t.id)}"><details><summary>${e(t.title)} <span>${e(t.duration)}</span>${icon('chevron-right',icons)}</summary>${sections(t,ui,icons)}${links(t.links,icons)}</details></li>`).join('')}</ol></section>`:''},{mainEntity:entity});
}
await output('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${paths.map(p=>{
  const images=catalogue.items.filter(r=>p==='/'||p==='/releases/'||artists.items.some(a=>p===`/artists/${a.id}/`&&r.artist===a.name)||p===`/releases/${r.id}/`).map(r=>r.cover.src);
  return `<url><loc>${site.domain}${p}</loc>${[...new Set(images)].map(src=>`<image:image><image:loc>${e(site.domain+'/'+src)}</image:loc></image:image>`).join('')}</url>`;
}).join('')}</urlset>`);
await output('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
await output('404.html',fill(shell,{head:`<title>${e(site.labels.notFound)}</title><meta name="robots" content="noindex">`,navigation,footer,fragment:'home',content:`<section class="site-section"><h1>${e(site.labels.notFound)}</h1><a href="/">${e(site.labels.returnHome)}</a></section>`}));
console.log(`Generated ${paths.length} public documents, 404, sitemap and robots.`);

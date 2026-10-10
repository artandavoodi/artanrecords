import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {bundleStyles} from './site/styles.mjs';
import {intakeForm,intakeJourney,journeyScene} from './site/intake.mjs';
import {escape as e,fill,image,icon,links,cards,discoveryCards,sections,metadata,artistCards,artistYears,artistLinks} from './site/render.mjs';
const docs=new URL('../docs/',import.meta.url);
await writeFile(new URL('assets/css/site.generated.css',docs),await bundleStyles(new URL('assets/css/core/00-orchestrator/style.css',docs),docs));
const read=p=>readFile(new URL(p,docs),'utf8');
const json=async p=>JSON.parse(await read(p));
const [site,registry,catalogue,artists,icons,ui]=await Promise.all(['site','fragments','music/releases','artists/items','icons','music/interface'].map(p=>json('assets/data/'+p+'.json')));
const roster=await json('assets/data/artists/roster.json');
const intake=await json('assets/data/artists/intake.json');
const journeyScenes=await json('assets/data/artists/journey-scenes.json');
const responseShell=await readFile(new URL('site/enquiry-response.shell.html',import.meta.url),'utf8');
const responseIcon=icons.items.find(item=>item.id===intake.response.returnIcon);
if(!responseIcon) throw new Error('Unregistered enquiry response icon');
await writeFile(new URL('site/enquiry-response.html',import.meta.url),fill(responseShell,{
  name:e(site.name),domain:e(site.domain),logo:e(site.domain+'/'+intake.response.logo),logoAlt:e(intake.response.logoAlt),
  returnUrl:e(intake.response.returnUrl),returnLabel:e(intake.response.returnLabel),returnIcon:e(site.domain+'/'+responseIcon.src)
}));
const discovery=await json('assets/data/discovery.json');
const information=await json('assets/data/pages.json');
const textLinks=items=>(items||[]).map(item=>{
  if(!/^\/(?!\/)|^https:\/\/|^mailto:/.test(item.url)) throw new Error('Invalid information link');
  return `<a href="${e(item.url)}">${e(item.label)}</a>`;
}).join('');
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
const navigationFor=path=>fragment('navigation',{...escaped(site.labels),name:e(site.name),homeLinks:textLinks(information.homeLinks.filter(item=>item.url!==path)),wordmarkLight:e(site.logoAssets.wordmarkBlack),wordmarkDark:e(site.logoAssets.wordmarkWhite),links:site.navigation.map(n=>`<a href="${e(n.path)}">${e(n.label)}</a>`).join('')});
const footer=await fragment('footer',{name:e(site.name),year:String(new Date().getUTCFullYear()),links:textLinks(information.footerLinks),social:links(site.social,icons,'streaming','icons-only')});
const navigation=await navigationFor('/404.html');
const organization={'@type':'Organization','@id':site.domain+'/#label',name:site.name,url:site.domain+'/',logo:site.domain+'/'+site.logoAssets.wordmark,foundingDate:site.foundingDate,description:site.description,founder:{'@id':personFor(founder)['@id']}};
const people=artists.items.map(personFor);
const paths=[];
async function output(file,value){await mkdir(new URL('./',new URL(file,docs)),{recursive:true});await writeFile(new URL(file,docs),value);}
async function page(path,title,description,fragmentName,values,entity={}) {
  const navigation=await navigationFor(path);
  if(fragmentName==='artist') values.contextLinks=textLinks([{label:site.labels.allArtists,url:'/artists/'},{label:site.labels.allReleases,url:'/releases/'}]);
  if(fragmentName==='release') {
    const release=catalogue.items.find(r=>path===`/releases/${r.id}/`);
    const artist=artists.items.find(a=>a.name===release.artist);
    values.contextLinks=textLinks([{label:site.labels.artistProfile,url:`/artists/${artist.id}/`},{label:site.labels.allReleases,url:'/releases/'}]);
  }
  const content=await fragment(fragmentName,values);
  const cover=fragmentName==='release'?catalogue.items.find(r=>path===`/releases/${r.id}/`).cover:artists.items.find(a=>path===`/artists/${a.id}/`)?.portrait;
  const graph=[organization,...people,{'@type':'WebSite','@id':site.domain+'/#website',name:site.name,url:site.domain+'/'},{'@type':'WebPage','@id':site.domain+path,url:site.domain+path,name:title,description,isPartOf:{'@id':site.domain+'/#website'},...(cover?{primaryImageOfPage:{'@type':'ImageObject',contentUrl:site.domain+'/'+cover.src}}:{}),...entity}];
  const head=`<title>${e(title)} · ${e(site.name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${site.domain}${path}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${site.domain}${path}"><meta name="twitter:card" content="${cover?'summary_large_image':'summary'}">${cover?`<meta property="og:image" content="${site.domain}/${e(cover.src)}"><meta name="twitter:image" content="${site.domain}/${e(cover.src)}">`:''}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
  await output(path.slice(1)+'index.html',fill(shell,{head,navigation,footer,fragment:fragmentName,content,backgroundStyle:values.backgroundStyle || '',atmosphere:fragmentName==='artists'?'<canvas class="artist-directory-grain" aria-hidden="true"></canvas>':''}));paths.push(path);
}
for(const nav of site.navigation) {
  const values={...escaped(site),title:e(nav.label),homeLinks:textLinks(information.homeLinks),releases:cards(catalogue.items),artistsTitle:e(roster.labels.artists),artists:artistCards(artists.items,roster.labels)};
  if(nav.fragment==='home') {
    values.introduction=site.introduction.map(line=>`<p>${e(line)}</p>`).join('');
    values.featuredTitle=e(discovery.featuredTitle);
    values.latestTitle=e(discovery.latestTitle);
    const latest=catalogue.items.filter(r=>r.status==='Released').sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate))[0];
    values.latest=latest?cards([latest]):'';
    values.artistsTitle=e(discovery.featuredArtistsLabel);
    values.artists=artistCards(discovery.featuredArtists.map(id=>{
      const artist=artists.items.find(item=>item.id===id);
      if(!artist) throw new Error('Unregistered featured artist');
      return artist;
    }),roster.labels);
    values.homeLinks=textLinks(information.homeLinks);
    const featured=catalogue.items.find(r=>r.id===discovery.featuredRelease);
    if(!featured) throw new Error('Unregistered featured release');
    values.featured=`<article class="discovery-feature"><a href="/releases/${e(featured.id)}/">${image(featured.cover)}<div><p class="eyebrow">${e(discovery.featuredLabel)}</p><h2>${e(featured.title)}</h2><p>${e(featured.artist)}</p><p>${e(featured.description)}</p><span>${e(discovery.openLabel)}</span></div></a></article>`;
  }
  if(nav.fragment==='releases') {
    const released=catalogue.items.filter(r=>r.status==='Released').sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate));
    const latest=released[0];
    const labels=discovery.catalogue;
    const releaseArtists=artists.items.filter(a=>released.some(r=>r.artist===a.name));
    Object.assign(values,{latestTitle:e(discovery.latestTitle),catalogueTitle:e(labels.title),empty:e(labels.empty),
      latest:latest?`<article><a href="/releases/${e(latest.id)}/">${image(latest.cover)}<h3>${e(latest.title)}</h3></a><div><p>${e(latest.description)}</p>${links(latest.links,icons)}<a href="/releases/${e(latest.id)}/">${e(discovery.openLabel)}</a></div></article>`:'',
      releases:discoveryCards(released,artists.items,icons),
      filters:`<label>${e(labels.search)}<input type="search" name="query" autocomplete="off"></label><label>${e(labels.type)}<select name="category"><option value="">${e(labels.allTypes)}</option>${labels.types.map(t=>`<option value="${e(t.value)}">${e(t.label)}</option>`).join('')}</select></label><label>${e(labels.artist)}<select name="artist"><option value="">${e(labels.allArtists)}</option>${releaseArtists.map(a=>`<option value="${e(a.id)}">${e(a.name)}</option>`).join('')}</select></label>`});
  }
  if(nav.fragment==='for-artists') Object.assign(values,escaped(intake),{journeyLinks:textLinks(intake.journeyLinks),startLabel:e(intake.form.startLabel),form:intakeForm(intake.form,icons),channels:intakeJourney(intake.channels,journeyScenes)});
  if(nav.fragment==='contact') Object.assign(values,escaped(intake.contact),{
    links:links(site.contact.map(item=>({...item,label:item.url?.replace('mailto:','')||item.label})),icons,'streaming','labels'),
    scene:journeyScene('contact',journeyScenes),
    form:intakeForm({...intake.form,...intake.contact.form,startLabel:intake.contact.startLabel},icons)
  });
  if(nav.fragment==='about') Object.assign(values,{wordmarkLight:e(site.logoAssets.wordmarkBlack),wordmarkDark:e(site.logoAssets.wordmarkWhite)});
  await page(nav.path,nav.label,site.description,nav.fragment,values);
}
for(const item of information.items) {
  if(item.publish===false) continue;
  if(!/^\/[a-z0-9-]+\/$/.test(item.path)||paths.includes(item.path)) throw new Error('Invalid or duplicate information route');
  const ids=new Set();
  for(const section of item.sections) {
    if(!/^[a-z0-9-]+$/.test(section.id)||ids.has(section.id)) throw new Error('Invalid or duplicate section identifier');
    ids.add(section.id);
  }
  await page(item.path,item.title,item.description,'information',{
    title:e(item.title),description:e(item.description),
    contents:item.sections.map(section=>`<a href="#${e(section.id)}">${e(section.title)}</a>`).join(''),
    sections:item.sections.map(section=>`<section id="${e(section.id)}"><h2>${e(section.title)}</h2><p>${e(section.text)}</p></section>`).join(''),
    links:textLinks(item.links),form:item.form?intakeForm(intake.form,icons):''
  });
}
await page(intake.form.privacyUrl,intake.submissionPrivacy.title,intake.submissionPrivacy.description,'submission-privacy',{
  title:e(intake.submissionPrivacy.title),
  sections:intake.submissionPrivacy.sections.map(s=>`<section class="artist-intake__channel"><h2>${e(s.title)}</h2><p>${e(s.text)}</p></section>`).join('')
});
for(const artist of artists.items) {
  const releases=catalogue.items.filter(r=>r.artist===artist.name);
  const latest = releases.filter(r=>r.status==='Released').sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate))[0];
  artist.artistHeading = latest ? 'h2' : 'h1';
  artist.backgroundStyle = latest?.cover ? `--artist-cover: url('/${latest.cover.src}')` : '';
  const latestRelease = latest ? `<section class="site-section artist-latest-release" aria-label="${e(roster.labels.latestRelease)}"><h1>${e(latest.title)}</h1><p>${e(artist.name)}</p><a href="/releases/${e(latest.id)}/">${image(latest.cover)}</a><p class="reading">${e(latest.description)}</p><div class="hub__group" data-presentation="icons">${links(latest.links,icons,'hub__group-links')}</div></section>` : '';
  await page(`/artists/${artist.id}/`,artist.name,artist.biography,'artist',{...escaped(artist),latestRelease,yearsActive:artistYears(artist,roster.labels),portrait:artist.portrait?image(artist.portrait):'',releases:releases.length?`<section><h2>${e(roster.labels.releases)}</h2><div class="catalogue">${cards(releases)}</div></section>`:'',portfolio:artist.portfolio?.length?`<section><h2>${e(roster.labels.portfolio)}</h2>${artist.portfolio.map(p=>`<article><h3><a href="${e(p.url)}">${e(p.title)}</a></h3><p>${e(p.description)}</p></article>`).join('')}</section>`:'',links:artistLinks(artist,roster.linkGroups,icons)},{'@type':'ProfilePage',mainEntity:{'@id':personFor(artist)['@id']}});
}
for(const r of catalogue.items) {
  const artist=artists.items.find(a=>a.name===r.artist);
  if(!artist) throw new Error('Release has no registered artist: '+r.id);
  const person=personFor(artist);
  const recordings=(r.tracks||[]).map(t=>({'@type':'MusicRecording',name:t.title,isrcCode:t.isrc,url:site.domain+`/releases/${r.id}/#track-${t.id}`,byArtist:{'@id':person['@id']},duration:t.duration?'PT'+t.duration.replace(':','M')+'S':undefined}));
  const entity={'@type':r.type==='Single'?'MusicRecording':'MusicAlbum',name:r.title,byArtist:{'@id':person['@id']},datePublished:r.releaseDate,creativeWorkStatus:r.status,image:r.cover?site.domain+'/'+r.cover.src:undefined,...(recordings.length?{track:recordings,numTracks:recordings.length}:{isrcCode:r.isrc})};
  await page(`/releases/${r.id}/`,r.title,r.description,'release',{...escaped(r),back:e(site.labels.back),backIcon:icon('back',icons),cover:image(r.cover),metadata:metadata(r,ui),links:links(r.links,icons),sections:sections(r,ui,icons),tracks:recordings.length?`<section><h2>${e(site.labels.tracks)}</h2><ol>${r.tracks.map(t=>`<li id="track-${e(t.id)}"><details><summary>${e(t.title)} <span>${e(t.duration)}</span>${icon('chevron-right',icons)}</summary>${sections(t,ui,icons)}${links(t.links,icons)}</details></li>`).join('')}</ol></section>`:''},{mainEntity:entity});
}
await output('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${paths.map(p=>{
  const images=catalogue.items.filter(r=>r.cover&&(p==='/'||p==='/releases/'||artists.items.some(a=>p===`/artists/${a.id}/`&&r.artist===a.name)||p===`/releases/${r.id}/`)).map(r=>r.cover.src);
  const portrait=artists.items.find(a=>p===`/artists/${a.id}/`)?.portrait;
  if(portrait) images.push(portrait.src);
  if(p==='/about/') images.push(site.logoAssets.wordmark);
  if(p==='/'||p==='/artists/') images.push(...artists.items.filter(a=>a.portrait).map(a=>a.portrait.src));
  return `<url><loc>${site.domain}${p}</loc>${[...new Set(images)].map(src=>`<image:image><image:loc>${e(site.domain+'/'+src)}</image:loc></image:image>`).join('')}</url>`;
}).join('')}</urlset>`);
await output('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
await output('404.html',fill(shell,{head:`<title>${e(site.labels.notFound)}</title><meta name="robots" content="noindex">`,navigation,footer,fragment:'home',backgroundStyle:'',atmosphere:'',content:`<section class="site-section"><h1>${e(site.labels.notFound)}</h1><a href="/">${e(site.labels.returnHome)}</a></section>`}));
console.log(`Generated ${paths.length} public documents, 404, sitemap and robots.`);

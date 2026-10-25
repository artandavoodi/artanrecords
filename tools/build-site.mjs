import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {bundleStyles} from './site/styles.mjs';
import {partnershipPages} from './site/partnerships.mjs';
import {intakeForm,intakeJourney,journeyScene,submissionJourneySteps} from './site/intake.mjs';
import {showcaseRelease,showcaseCarousel} from './site/home-showcase.mjs';
import {escape as e,fill,image,icon,links,cards,discoveryCards,sections,metadata,artistCards,artistYears,artistLinks,paragraphs,releaseArtist,artistPath} from './site/render.mjs';
const docs=new URL('../docs/',import.meta.url);
await writeFile(new URL('assets/css/site.generated.css',docs),await bundleStyles(new URL('assets/css/core/00-orchestrator/style.css',docs),docs));
const read=p=>readFile(new URL(p,docs),'utf8');
const json=async p=>JSON.parse(await read(p));
const commerce=await json('assets/data/commerce.json');
if(Object.values(commerce.activation).some(Boolean))throw Error('Commerce activation requires an approved server runtime and reviewed financial/domain controls');
const [site,registry,catalogue,artists,icons,ui]=await Promise.all(['site','fragments','music/releases','artists/items','icons','music/interface'].map(p=>json('assets/data/'+p+'.json')));
await writeFile(new URL('assets/js/core/preference-config.js',docs),`window.ArtanRecordsPreferenceConfig=${JSON.stringify(site.preferences.storage)};\n`);
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
information.items.push(...partnershipPages(await json('assets/data/partnerships.json'),icons));
information.items.push({...site.companyPage,description:site.companyDescriptions.short,presentation:'flow',sections:[{id:'company',title:site.name,text:site.companyDescriptions.long},{id:'brand',title:site.companyPage.brandTitle,text:site.companyPage.brandText}]});
const studioLegal=await json('assets/data/studio-legal.json');
information.items.push(...studioLegal.notices.map(notice=>({...notice,presentation:'tabs',sections:notice.sections.map(section=>({...section,text:section.paragraphs.join('\n\n')}))})));
information.footerGroups.find(group=>group.id==='legal').links.push(...studioLegal.notices.map(notice=>({label:notice.footerLabel,url:notice.path})));
const legalDates=(publication=information.legalPublication)=>`<p class="publication-meta"><span>Effective date: <time datetime="${e(publication.effectiveDate)}">${e(publication.effectiveDate)}</time></span><span>Last updated: <time datetime="${e(publication.lastUpdated)}">${e(publication.lastUpdated)}</time></span></p>`;
const textLinks=(items,path='',placement='body')=>(items||[]).map(item=>{
  if(!/^\/(?!\/)|^https:\/\/|^mailto:/.test(item.url)) throw new Error('Invalid information link');
  if(item.emphasis && item.emphasis!=='primary') throw new Error('Invalid action emphasis');
  const duplicate=placement==='body'&&information.homeLinks.some(link=>link.url===item.url&&link.url!==path&&!link.excludeOn?.includes(path));
  return `<a href="${e(item.url)}"${duplicate?' data-header-duplicate':''}${item.emphasis?' data-emphasis="primary"':''}>${e(item.label)}</a>`;
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
const personFor=artist=>({'@type':'Person','@id':site.domain+artistPath(artist.id)+'#artist',name:artist.name,description:artist.biography,...(artist.portrait?{image:site.domain+'/'+artist.portrait.src}:{}),...(artist.id===site.founder.artistId?{alternateName:site.founder.alternateName}:{}),url:site.domain+artistPath(artist.id),sameAs:(artist.links||[]).filter(l=>l.category!=='email').map(l=>l.url)});
const founder=artists.items.find(a=>a.id===site.founder.artistId);
if(!founder||founder.name!==site.founder.name) throw new Error('Founder must match a registered artist');
const shell=(await readFile(new URL('site/shell.html',import.meta.url),'utf8')).replace('{{logo}}',e(site.logo));
const fragment=async(name,values)=>{if(!registry[name])throw new Error('Unregistered fragment '+name);return fill(await read(registry[name]),values);};
const escaped=object=>Object.fromEntries(Object.entries(object).filter(([,v])=>typeof v==='string').map(([k,v])=>[k,e(v)]));
const navigationFor=(path,{artistShowcase=false}={})=>fragment('navigation',{...escaped(site.labels),name:e(site.name),actionsClass:'label-home-actions',homeLinks:artistShowcase?'':textLinks(information.homeLinks.filter(item=>item.url!==path&&!item.excludeOn?.includes(path)),path,'chrome'),wordmarkLight:e(site.logoAssets.wordmarkBlack),wordmarkDark:e(site.logoAssets.wordmarkWhite),accountAccess:`<a class="label-account-access" href="${e(information.accountAccess.url)}" aria-label="${e(information.accountAccess.label)}">${icon(information.accountAccess.icon,icons)}</a>`,links:site.navigation.map(n=>`<a href="${e(n.path)}">${e(n.label)}</a>`).join('')});
const footer=await fragment('footer',{name:e(site.name),year:String(new Date().getUTCFullYear()),groups:information.footerGroups.map(group=>`<section class="label-footer-group"><h2 id="footer-${e(group.id)}">${e(group.label)}</h2><nav class="information-links label-footer-group-links" aria-labelledby="footer-${e(group.id)}"${group.id==='legal'?' data-footer-preferences':''}>${textLinks(group.links.map(item=>item.social?{...item,url:site.social.find(social=>social.icon===item.social).url}:item),'','chrome')}</nav></section>`).join(''),social:links(site.social,icons,'streaming','icons-only')});
const navigation=await navigationFor('/404.html');
const organization={'@type':'Organization','@id':site.domain+'/#label',name:site.name,url:site.domain+'/',sameAs:site.social.map(profile=>profile.url),logo:site.domain+'/'+site.logoAssets.wordmark,foundingDate:site.foundingDate,description:site.description,founder:{'@id':personFor(founder)['@id']}};
const people=artists.items.map(personFor);
const leadershipPortrait=leader=>leader.portrait||(leader.artistId?artists.items.find(a=>a.id===leader.artistId)?.portrait:undefined);
const paths=[];
async function output(file,value){await mkdir(new URL('./',new URL(file,docs)),{recursive:true});await writeFile(new URL(file,docs),value);}
async function page(path,title,description,fragmentName,values,entity={}) {
  const artistShowcase=['artist','artist-platform'].includes(fragmentName);
  const navigation=await navigationFor(path,{artistShowcase});
  if(fragmentName==='artist') values.contextLinks=textLinks([{label:site.labels.allArtists,url:'/artists/'},{label:site.labels.allReleases,url:'/releases/'}]);
  if(fragmentName==='release') {
    const release=catalogue.items.find(r=>path===`/releases/${r.id}/`);
    const artist=releaseArtist(release,artists.items);
    values.contextLinks=textLinks([{label:site.labels.artistProfile,url:artistPath(artist.id)},{label:site.labels.allReleases,url:'/releases/'}]);
  }
  const content=await fragment(fragmentName,values);
  const cover=(fragmentName==='release'?catalogue.items.find(r=>path===`/releases/${r.id}/`).cover:artists.items.find(a=>path===artistPath(a.id))?.portrait)||site.shareImage;
  const pagePeople=people.map(person=>{
    const leader=fragmentName==='about'?site.aboutPage.leadership.find(l=>l.artistId&&person['@id']===site.domain+artistPath(l.artistId)+'#artist'):undefined;
    const portrait=leader&&leadershipPortrait(leader);
    return leader?{...person,jobTitle:leader.role,...(portrait?{image:{'@type':'ImageObject',contentUrl:site.domain+'/'+portrait.src,width:portrait.width,height:portrait.height,caption:portrait.alt}}:{})}:person;
  });
  const graph=[organization,...pagePeople,{'@type':'WebSite','@id':site.domain+'/#website',name:site.name,url:site.domain+'/'},{'@type':'WebPage','@id':site.domain+path,url:site.domain+path,name:title,description,isPartOf:{'@id':site.domain+'/#website'},...(cover?{primaryImageOfPage:{'@type':'ImageObject',contentUrl:site.domain+'/'+cover.src}}:{}),...entity}];
  const head=`<title>${e(title)} · ${e(site.name)}</title><meta name="description" content="${e(description)}"><link rel="canonical" href="${site.domain}${path}"><meta property="og:title" content="${e(title)}"><meta property="og:description" content="${e(description)}"><meta property="og:type" content="website"><meta property="og:url" content="${site.domain}${path}"><meta name="twitter:card" content="${cover?'summary_large_image':'summary'}">${cover?`<meta property="og:image" content="${site.domain}/${e(cover.src)}"><meta name="twitter:image" content="${site.domain}/${e(cover.src)}">`:''}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@graph':graph}).replace(/</g,'\\u003c')}</script>`;
  const pageFooter=['artist','artist-platform'].includes(fragmentName)?await fragment('footer',{name:e(site.name),year:String(new Date().getUTCFullYear()),groups:'',social:''}):footer;
  await output(path.slice(1)+'index.html',fill(shell,{head,navigation,footer:pageFooter,fragment:fragmentName,content,backgroundStyle:values.backgroundStyle || '',atmosphere:fragmentName==='artists'?'<canvas class="artist-directory-grain" aria-hidden="true"></canvas>':''}));paths.push(path);
}
const artistPlatform=await json('assets/data/artists/platform.json');
await page('/artists/profile/',artistPlatform.title,artistPlatform.description,'artist-platform',{title:e(artistPlatform.title)});
for(const nav of site.navigation) {
  const values={...escaped(site),title:e(nav.label),homeLinks:textLinks(information.homeLinks),releases:cards(catalogue.items),artistsTitle:e(roster.labels.artists),artists:artistCards(artists.items,roster.labels)};
  if(nav.fragment==='home') {
    values.proposition=e(site.proposition.text);
    values.propositionLinks=textLinks(site.proposition.links);
    values.introduction=site.introduction.map(line=>{
      if(typeof line==='string')return `<p>${e(line)}</p>`;
      if(!line.prefix||!Array.isArray(line.phrases)||line.phrases.length<2||!line.phrases.every(phrase=>typeof phrase==='string'&&phrase))throw Error('Invalid introduction statement');
      const sentence=`${line.prefix} ${line.phrases.slice(0,-1).join(', ')} and ${line.phrases.at(-1)}`;
      return `<p data-phrase-prefix="${e(line.prefix)}" data-phrases="${e(JSON.stringify(line.phrases))}" data-phrase-motion="${e(JSON.stringify(line.motion))}">${e(sentence)}</p>`;
    }).join('');
    values.featuredTitle=e(discovery.featuredTitle);
    values.latestTitle=e(discovery.latestTitle);
    const latest=catalogue.items.filter(r=>r.status==='Released').sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate))[0];
    values.latest=latest?showcaseRelease(latest,discovery.openLabel):'';
    values.artistsTitle=e(discovery.featuredArtistsLabel);
    values.artists=showcaseCarousel(discovery.featuredArtists.map(id=>{
      const artist=artists.items.find(item=>item.id===id);
      if(!artist) throw new Error('Unregistered featured artist');
      return {title:artist.name,html:artistCards([artist],roster.labels)};
    }),'featured-artist',discovery.featuredArtistsLabel,discovery.carousel);
    values.homeLinks=textLinks(information.homeLinks);
    if(!Array.isArray(discovery.featuredReleases)||new Set(discovery.featuredReleases).size!==discovery.featuredReleases.length)throw Error('Invalid featured release selection');
    values.featured=showcaseCarousel(discovery.featuredReleases.map(id=>{
      const release=catalogue.items.find(item=>item.id===id);
      if(!release||release.status!=='Released')throw Error('Unregistered or unreleased featured release');
      return {title:release.title,html:showcaseRelease(release,discovery.openLabel)};
    }),'featured-release',discovery.featuredTitle,discovery.carousel);
  }
  if(nav.fragment==='releases') {
    const released=catalogue.items.filter(r=>r.status==='Released').sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate));
    const latest=released[0];
    const labels=discovery.catalogue;
    const releaseArtists=artists.items.filter(a=>released.some(r=>r.artistId===a.id));
    Object.assign(values,{latestTitle:e(discovery.latestTitle),catalogueTitle:e(labels.title),empty:e(labels.empty),
      latest:latest?`<article><a href="/releases/${e(latest.id)}/">${image(latest.cover)}<h3>${e(latest.title)}</h3></a><div><p>${e(latest.description)}</p>${links(latest.links,icons)}<a href="/releases/${e(latest.id)}/">${e(discovery.openLabel)}</a></div></article>`:'',
      releases:discoveryCards(released,artists.items,icons),
      filters:`<label>${e(labels.search)}<input class="ui-field" type="search" name="query" autocomplete="off"></label><label>${e(labels.type)}<select class="ui-field" name="category"><option value="">${e(labels.allTypes)}</option>${labels.types.map(t=>`<option value="${e(t.value)}">${e(t.label)}</option>`).join('')}</select></label><label>${e(labels.artist)}<select class="ui-field" name="artist"><option value="">${e(labels.allArtists)}</option>${releaseArtists.map(a=>`<option value="${e(a.id)}">${e(a.name)}</option>`).join('')}</select></label>`});
  }
  if(nav.fragment==='for-artists') Object.assign(values,escaped(intake),{journeyLinks:textLinks(intake.journeyLinks),startLabel:e(intake.form.startLabel),form:intakeForm(intake.form,icons),channels:intakeJourney(intake.channels,journeyScenes)});
  if(nav.fragment==='contact') Object.assign(values,escaped(intake.contact),{
    links:links(site.contact.map(item=>({...item,label:item.url?.replace('mailto:','')||item.label})),icons,'streaming','labels'),
    scene:journeyScene('contact',journeyScenes),
    form:intakeForm({...intake.form,...intake.contact.form,startLabel:intake.contact.startLabel},icons)
  });
  if(nav.fragment==='about') {
    const ids=new Set();
    const leaders=site.aboutPage.leadership.map(leader=>{
      if(ids.has(leader.id)) throw new Error('Duplicate leadership identity');
      ids.add(leader.id);
      const identity=leader.artistId?artists.items.find(a=>a.id===leader.artistId):leader;
      if(!identity?.name||!leader.role||!leader.biography) throw new Error('Incomplete leadership identity');
      const portrait=leadershipPortrait(leader);
      return `<article class="leadership-card">${portrait?image(portrait):''}<h3>${e(identity.name)}</h3><p>${e(leader.role)}</p>${paragraphs(leader.biography)}</article>`;
    }).join('');
    const content={about:`${paragraphs(site.about)}${paragraphs(site.history)}<dl class="artist-facts"><div><dt>${e(site.foundingLabel)}</dt><dd>${e(site.foundingDate)}</dd></div></dl>${paragraphs(site.aboutPage.aboutDetails)}`,mission:paragraphs(site.principle)+paragraphs(site.aboutPage.missionDetails),leadership:paragraphs(site.aboutPage.leadershipIntroduction)+leaders};
    Object.assign(values,{tabs:site.aboutPage.tabs.map(t=>`<a href="#${e(t.id)}">${e(t.label)}</a>`).join(''),panels:site.aboutPage.tabs.map(t=>{
      if(!Object.hasOwn(content,t.id))throw new Error('Unknown About panel');
      return `<section id="${e(t.id)}"><h2>${e(t.label)}</h2>${content[t.id]}</section>`;
    }).join('')});
  }
  await page(nav.path,nav.label,nav.fragment==='about'?site.aboutPage.description:site.description,nav.fragment,values,nav.fragment==='about'?{'@type':'AboutPage',mainEntity:{'@id':organization['@id']}}:{});
}
for(const item of information.items) {
  if(item.publish===false) continue;
  if(!/^\/(?:[a-z0-9-]+\/)+$/.test(item.path)||paths.includes(item.path)) throw new Error('Invalid or duplicate information route');
  const ids=new Set();
  for(const section of item.sections) {
    if(!/^[a-z0-9-]+$/.test(section.id)||ids.has(section.id)) throw new Error('Invalid or duplicate section identifier');
    ids.add(section.id);
  }
  if(item.presentation==='journey'){
    if(!item.form||!['headline','processLabel','conversationTitle','conversationDescription','notice'].every(key=>typeof item[key]==='string'&&item[key]))throw Error('Incomplete submission journey');
    await page(item.path,item.title,item.description,'submission',{
      ...escaped(item),introduction:e(item.description),
      startLabel:e(intake.form.startLabel),
      channels:submissionJourneySteps(item.sections,intake.form.startLabel),
      journeyLinks:textLinks(item.links),
      form:intakeForm({...intake.form,defaults:{purpose:item.formPurpose}},icons)
    });
    continue;
  }
  await page(item.path,item.title,item.description,'information',{
    title:e(item.title),description:e(item.description),
    dates:item.effectiveDate?legalDates(item):['/legal/','/privacy/'].includes(item.path)?legalDates():'',
    tabs:item.presentation==='tabs'?'data-information-tabs':'',
    contents:['accordion','flow'].includes(item.presentation)?'':`<nav class="information-links" aria-label="${e(item.title)}">${item.sections.map(section=>`<a href="#${e(section.id)}">${e(section.title)}</a>`).join('')}</nav>`,
    sections:item.sections.map(section=>item.presentation==='accordion'
      ?`<details class="information-accordion" id="${e(section.id)}"><summary><span>${e(section.title)}</span>${icon('chevron-right',icons)}</summary>${paragraphs(section.text)}${section.links?.length?`<div class="information-links label-actions">${textLinks(section.links)}</div>`:''}</details>`
      :`<section id="${e(section.id)}"><h2>${e(section.title)}</h2>${paragraphs(section.text)}${section.links?.length?`<div class="information-links label-actions">${textLinks(section.links,item.path)}</div>`:''}</section>`).join('')+(item.comparison||'')+(item.afterComparison||[]).map(section=>`<section class="partnership-next-step" id="${e(section.id)}"><h2>${e(section.title)}</h2>${paragraphs(section.text)}<div class="information-links label-actions">${textLinks(section.links,item.path)}</div></section>`).join(''),
    links:textLinks(item.links,item.path),form:item.form?intakeForm({...intake.form,defaults:item.formPurpose?{purpose:item.formPurpose}:undefined},icons):''
  });
}
await page(intake.form.privacyUrl,intake.submissionPrivacy.title,intake.submissionPrivacy.description,'submission-privacy',{
  title:e(intake.submissionPrivacy.title),
  dates:legalDates(),
  sections:intake.submissionPrivacy.sections.map(s=>`<section class="artist-intake__channel"><h2>${e(s.title)}</h2><p>${e(s.text)}</p>${s.links?.length?`<div class="information-links label-actions">${textLinks(s.links)}</div>`:''}</section>`).join('')
});
for(const artist of artists.items) {
  const releases=catalogue.items.filter(r=>r.artistId===artist.id);
  const latest = releases.filter(r=>r.status==='Released').sort((a,b)=>Date.parse(b.releaseDate)-Date.parse(a.releaseDate))[0];
  artist.artistHeading = latest ? 'h2' : 'h1';
  if(paths.includes(artistPath(artist.id))||commerce.routes.reservedRoots.includes(artistPath(artist.id).split('/')[1]))throw Error('Artist username conflicts with an existing website route: '+artist.id);
  artist.username=artistPath(artist.id).split('/')[1];
  artist.latestCover=latest?.cover?'/'+latest.cover.src:'';
  artist.backgroundStyle = latest?.cover ? `--artist-cover: url('/${latest.cover.src}')` : '';
  const latestRelease = latest ? `<section class="site-section artist-latest-release" aria-label="${e(roster.labels.latestRelease)}"><h2>${e(latest.title)}</h2><p>${e(artist.name)}</p><a href="/releases/${e(latest.id)}/">${image(latest.cover)}</a><p class="reading">${e(latest.description)}</p><div class="hub__group" data-presentation="icons">${links(latest.links,icons,'hub__group-links')}</div></section>` : '';
  artist.artistHeading='h1';
  await page(artistPath(artist.id),artist.name,artist.biography,'artist',{...escaped(artist),latestRelease,yearsActive:artistYears(artist,roster.labels),portrait:artist.portrait?image(artist.portrait):'',releases:releases.length?`<section data-artist-archive><h2>${e(roster.labels.releases)}</h2><div class="catalogue">${cards(releases)}</div></section>`:'',portfolio:artist.portfolio?.length?`<section><h2>${e(roster.labels.portfolio)}</h2>${artist.portfolio.map(p=>`<article><h3><a href="${e(p.url)}">${e(p.title)}</a></h3><p>${e(p.description)}</p></article>`).join('')}</section>`:'',links:artistLinks(artist,roster.linkGroups,icons)},{'@type':'ProfilePage',mainEntity:{'@id':personFor(artist)['@id']}});
  for(const legacy of new Set([artist.id,artist.username]))await output(`artists/${legacy}/index.html`,`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="robots" content="noindex,follow"><link rel="canonical" href="${e(site.domain+artistPath(artist.id))}"><meta http-equiv="refresh" content="0;url=${e(artistPath(artist.id))}"><title>${e(artist.name)} · Artanrecords</title></head><body><a href="${e(artistPath(artist.id))}">Open ${e(artist.name)} artist profile</a></body></html>`);
}
for(const r of catalogue.items) {
  const artist=releaseArtist(r,artists.items);
  if(!artist) throw new Error('Release has no registered artist: '+r.id);
  const person=personFor(artist);
  const recordings=(r.tracks||[]).map(t=>({'@type':'MusicRecording',name:t.title,isrcCode:t.isrc,url:site.domain+`/releases/${r.id}/#track-${t.id}`,byArtist:{'@id':person['@id']},duration:t.duration?'PT'+t.duration.replace(':','M')+'S':undefined}));
  const entity={'@type':r.type==='Single'?'MusicRecording':'MusicAlbum',name:r.title,byArtist:{'@id':person['@id']},datePublished:r.releaseDate,creativeWorkStatus:r.status,image:r.cover?site.domain+'/'+r.cover.src:undefined,...(recordings.length?{track:recordings,numTracks:recordings.length}:{isrcCode:r.isrc})};
  await page(`/releases/${r.id}/`,r.title,r.description,'release',{...escaped(r),back:e(site.labels.back),backIcon:icon('back',icons),cover:image(r.cover),metadata:metadata(r,ui),links:links(r.links,icons),sections:sections(r,ui,icons),tracks:recordings.length?`<section><h2>${e(site.labels.tracks)}</h2><ol>${r.tracks.map(t=>`<li id="track-${e(t.id)}"><details><summary>${e(t.title)} <span>${e(t.duration)}</span>${icon('chevron-right',icons)}</summary>${sections(t,ui,icons)}${links(t.links,icons)}</details></li>`).join('')}</ol></section>`:''},{mainEntity:entity});
}
await output('sitemap.xml',`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">${paths.map(p=>{
  const images=catalogue.items.filter(r=>r.cover&&(p==='/'||p==='/releases/'||artists.items.some(a=>p===artistPath(a.id)&&r.artistId===a.id)||p===`/releases/${r.id}/`)).map(r=>r.cover.src);
  const portrait=artists.items.find(a=>p===artistPath(a.id))?.portrait;
  if(portrait) images.push(portrait.src);
  if(p==='/about/') images.push(...site.aboutPage.leadership.map(l=>leadershipPortrait(l)?.src).filter(Boolean));
  if(p==='/'||p==='/artists/') images.push(...artists.items.filter(a=>a.portrait).map(a=>a.portrait.src));
  return `<url><loc>${site.domain}${p}</loc>${[...new Set(images)].map(src=>`<image:image><image:loc>${e(site.domain+'/'+src)}</image:loc></image:image>`).join('')}</url>`;
}).join('')}</urlset>`);
await output('robots.txt',`User-agent: *\nAllow: /\nSitemap: ${site.domain}/sitemap.xml\n`);
await output('assets/data/artists/reserved-routes.json',JSON.stringify([...new Set([...commerce.routes.reservedRoots,...paths.map(route=>route.split('/')[1]).filter(Boolean)])].filter(route=>!artists.items.some(artist=>artistPath(artist.id)==='/'+route+'/'))));
const notFound=fill(shell,{head:`<title>${e(site.labels.notFound)} · ${e(site.name)}</title><link rel="canonical" href="${site.domain}/404.html">`,navigation,footer:'',fragment:'not-found',backgroundStyle:'',atmosphere:'',content:await fragment('not-found',{name:e(site.name)})}).replace('content="max-image-preview:large"','content="noindex,follow"');
await output('404.html',notFound.replace('<body style="">','<body class="page-404" style="">').replace('tabindex="-1" data-fragment="not-found"','tabindex="-1" class="page-404-content" data-fragment="not-found"').replace('<div data-fragment="navigation">','<div data-fragment="navigation" hidden>'));
console.log(`Generated ${paths.length} public documents, 404, sitemap and robots.`);

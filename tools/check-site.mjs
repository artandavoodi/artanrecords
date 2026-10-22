import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {artistPath,artistYears,artistLinks,escape,sections,releaseArtist} from './site/render.mjs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),docs=path.join(root,'docs');
const read=p=>readFile(path.join(root,p),'utf8');
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();}
const manifest=JSON.parse(await read('planning/source-manifest.json'));
for(const record of manifest.files)assert.equal(createHash('sha256').update(await readFile(path.join(root,record.file))).digest('hex'),record.sha256,'Shared source drift: '+record.file);
const registry=JSON.parse(await read('docs/assets/data/fragments.json'));
const site=JSON.parse(await read('docs/assets/data/site.json'));
for(const file of Object.values(registry))await stat(path.join(docs,file));
const icons=JSON.parse(await read('docs/assets/data/icons.json'));
const ui=JSON.parse(await read('docs/assets/data/music/interface.json'));
const releases=JSON.parse(await read('docs/assets/data/music/releases.json'));
const catalogueArtists=JSON.parse(await read('docs/assets/data/artists/items.json'));
for(const record of releases.items) releaseArtist(record,catalogueArtists.items);
const identityFixture={id:'stable-id',name:'New display name'};
assert.equal(releaseArtist({id:'fixture',artistId:'stable-id',artist:'Old name'},[identityFixture]),identityFixture);
assert.throws(()=>releaseArtist({id:'fixture',artistId:'unknown',artist:'New display name'},[identityFixture]));
assert.throws(()=>releaseArtist({id:'fixture',artistId:'stable-id'},[identityFixture,identityFixture]));
for(const release of releases.items) {
  const html=await read(`docs/releases/${release.id}/index.html`);
  for(const record of [release,...(release.tracks||[])]) {
    if(!record.lyrics) continue;
    assert.ok(html.includes(`id="${record.id}-lyrics"`),'Approved lyrics missing from release');
    for(const line of record.lyrics.split('\n').filter(Boolean))assert.ok(html.includes(escape(line)),'Lyric line missing');
  }
}
assert.equal(sections({id:'draft',lyrics:'Private draft',editorial:{lyrics:'draft'}},ui,icons),'');
const intake=JSON.parse(await read('docs/assets/data/artists/intake.json'));
const labelStyles=await read('docs/assets/css/layers/site/label/index.css');
const aboutPage=await read('docs/about/index.html');
for(const tab of site.aboutPage.tabs) assert.ok(aboutPage.includes(`id="${tab.id}"`),'Missing generated About topic');
assert.ok(aboutPage.includes(escape(site.aboutPage.leadership[0].biography)),'Leadership must exist in initial HTML');
assert.ok(!(await read('docs/assets/fragments/about/index.html')).includes('wordmark'),'About must not duplicate the header wordmark');
for(const leader of site.aboutPage.leadership) {
  if(!leader.portrait) continue;
  await stat(path.join(docs,leader.portrait.src));
  assert.ok(aboutPage.includes(leader.portrait.src),'Leadership portrait missing from HTML');
  assert.ok((await read('docs/sitemap.xml')).includes(leader.portrait.src),'Leadership portrait missing from image sitemap');
}
assert.ok((await read('docs/for-artists/index.html')).includes('class="information-links label-actions"'),'Journey redirects must use the shared action group');
assert.ok(labelStyles.includes('a[data-emphasis="primary"]'),'Action emphasis must be explicit, not positional');
assert.ok(labelStyles.indexOf('.label-wordmark {')<labelStyles.indexOf('.label-wordmark--dark {'),'Base logo styling must precede theme variants');
const contactPage=await read('docs/contact/index.html');
assert.ok(contactPage.includes('name="formtype" value="contact"'),'Missing dedicated contact routing');
assert.equal(contactPage.includes('data-enquiry-pending'),intake.contact.form.deploymentPending,'Contact availability differs from configuration');
const intakePage=await read('docs/for-artists/index.html');
assert.ok(intakePage.includes(`action="${intake.form.action}" method="post"`));
assert.equal((intakePage.match(/type="submit"/g)||[]).length,1);
for(const field of intake.form.fields) assert.ok(intakePage.includes(`name="${field.name}"`),'Missing application field');
assert.ok(intakePage.includes('name="email" required'));
assert.ok(intakePage.includes('name="processing_acknowledgement" value="yes" required'));
assert.ok(intakePage.includes('data-enquiry-captcha'));
assert.ok(!intakePage.includes('formsubmit.co'));
assert.ok(intakePage.includes('type="submit" disabled'));
const artists=[...JSON.parse(await read('docs/assets/data/artists/items.json')).items,...JSON.parse(await read('docs/assets/data/artists/roster.json')).items];
const roster=JSON.parse(await read('docs/assets/data/artists/roster.json'));
assert.equal(artistYears({},roster.labels),'');
assert.ok(artistYears({yearsActive:{start:2020}},roster.labels).includes('Since 2020'));
assert.ok(artistYears({yearsActive:{start:2020,end:2022}},roster.labels).includes('Since 2020'));
assert.ok(!artistLinks({links:[]},roster.linkGroups,icons).includes('<section'));
for(const artist of artists) {
  const page=await read(`docs${artistPath(artist.id)}index.html`);
  assert.ok(page.includes(`${artistPath(artist.id)}#artist`),'Missing artist schema');
  if(artistPath(artist.id)!==`/artists/${artist.id}/`)assert.ok((await read(`docs/artists/${artist.id}/index.html`)).includes('noindex,follow'),'Legacy artist route must redirect, not duplicate the profile');
  if(artist.portrait) await stat(path.join(docs,artist.portrait.src));
  for(const group of roster.linkGroups) {
    const hasLinks=artist.links.some(link=>link.category===group.id);
    assert.equal(page.includes(`aria-label="${group.label}"`),hasLinks,'Incorrect artist link grouping');
  }
}
assert.equal(new Set(icons.items.map(i=>i.id)).size,icons.items.length);
for(const item of icons.items)await stat(path.join(docs,item.src));
for(const file of await walk(docs)){
  const text=await readFile(file,'utf8');
  if(file.endsWith('.json'))JSON.parse(text);
  if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file]);
  if(file.endsWith('.css'))for(const [,target]of text.matchAll(/url\(['"]?([^)'"?]+)(?:\?[^)'" ]*)?['"]?\)/g))await stat(target.startsWith('/')?path.join(docs,target):path.resolve(path.dirname(file),target));
  if(!file.endsWith('.html')||file.includes('/fragments/'))continue;
  assert.ok(!/Artan\s+Records/i.test(text),'Obsolete public label branding: '+file);
  assert.ok(!text.includes('{{'),'Unresolved template');
  if(text.includes('http-equiv="refresh"')){
    const artist=artists.find(artist=>file===path.join(docs,`artists/${artist.id}/index.html`)&&artistPath(artist.id)!==`/artists/${artist.id}/`);
    assert.ok(artist,'Only registered legacy artist routes may redirect');
    assert.ok(text.includes('noindex,follow'));
    assert.ok(text.includes(`content="0;url=${artistPath(artist.id)}"`));
    assert.ok(text.includes(`href="${site.domain}${artistPath(artist.id)}"`));
    continue;
  }
  assert.equal((text.match(/<h1\b/g)||[]).length,1,file);
  assert.equal((text.match(/class="label-header-logo"/g)||[]).length,1,'Each page must use one shared label header: '+file);
  if(!file.endsWith('/404.html')) {
    assert.ok(text.includes('property="og:image"'),'Missing sharing image: '+file);
    assert.ok(text.includes('rel="canonical"'),'Missing canonical URL: '+file);
  }
  for(const [,name]of text.matchAll(/data-fragment="([^"]+)"/g))assert.ok(registry[name]);
  for(const [,target]of text.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
    const local=path.join(docs,target);const info=await stat(local);if(info.isDirectory())await stat(path.join(local,'index.html'));
  }
  for(const [,json]of text.matchAll(/type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const graph=JSON.parse(json)['@graph'];
    const label=graph.find(item=>item['@id']===site.domain+'/#label');
    const founder=graph.find(item=>item['@id']===label.founder['@id']);
    assert.equal(founder.name,site.founder.name);
    assert.equal(founder.alternateName,site.founder.alternateName);
  }
  const visibleMarkup=text.replace(/<script\b[^>]*>[\s\S]*?<\/script>/g,'');
  assert.ok(!visibleMarkup.includes(site.founder.alternateName),'Legal identity is authorized only in structured metadata');
}
const before=await Promise.all((await walk(docs)).filter(p=>p.endsWith('.html')).map(async p=>[p,await readFile(p,'utf8')]));
execFileSync(process.execPath,['tools/build-site.mjs'],{cwd:root});
for(const [file,content]of before)assert.equal(await readFile(file,'utf8'),content,'Non-deterministic build');
console.log('PASS: shared checksums, fragments, icons, JSON, JavaScript, CSS imports, internal links, schema, identity and deterministic build.');

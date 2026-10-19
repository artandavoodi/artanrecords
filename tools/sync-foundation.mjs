/* Explicit one-way import; never writes to the approved source repository. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const source=path.resolve(args.find(arg=>!arg.startsWith('--')) || path.join(root,'../artandavoodi'));
if(args.includes('--document-reader-only')) {
  const revision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const manifestPath=path.join(root,'planning/source-manifest.json');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const paths=['docs/assets/js/core/02-systems/document-reader.js','docs/assets/css/core/04-systems/document-reader.css',
    ...['identity/access/visibility-on','identity/access/visibility-off','navigation/chevron/chevron-down'].map(name=>'docs/registry/icons/public/assets/core/'+name+'.svg')];
  for(const file of paths) {
    const bytes=execFileSync('git',['-C',source,'show',`${revision}:${file}`]);
    await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),bytes);
    manifest.files=manifest.files.filter(record=>record.file!==file);
    manifest.files.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),sourceRepository:'artandavoodi/neuroartan-website',sourceCommit:revision});
  }
  const tokens=execFileSync('git',['-C',source,'show',`${revision}:docs/assets/css/core/01-tokens/layout.tokens.css`],{encoding:'utf8'});
  const declarations=tokens.split('\n').filter(line=>/^\s*--reader-[a-z-]+:/.test(line));
  if(declarations.length!==4)throw Error('Document reader token ownership changed');
  const file='docs/assets/css/core/01-tokens/document-reader.tokens.css';
  const bytes=Buffer.from('/* Generated from the canonical Neuroartan reader tokens. */\n:root {\n'+declarations.join('\n')+'\n}\n');
  await writeFile(path.join(root,file),bytes);
  manifest.files=manifest.files.filter(record=>record.file!==file);
  manifest.files.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),sourceRepository:'artandavoodi/neuroartan-website',sourceCommit:revision});
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');process.exit(0);
}
if(args.includes('--preference-presentation-only')){
  const revision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const file='docs/assets/css/core/04-systems/preferences-presentation.css';
  const bytes=execFileSync('git',['-C',source,'show',`${revision}:${file}`]);
  const manifestPath=path.join(root,'planning/source-manifest.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  await writeFile(path.join(root,file),bytes);manifest.files=manifest.files.filter(record=>record.file!==file);
  manifest.files.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),sourceRepository:'artandavoodi/artandavoodi',sourceCommit:revision});
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');process.exit(0);
}
if(args.includes('--content-motion-only')){
  const revision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const file='docs/assets/js/layers/site/entrances.js';
  const bytes=execFileSync('git',['-C',source,'show',`${revision}:${file}`]);
  const manifestPath=path.join(root,'planning/source-manifest.json');
  const manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  await writeFile(path.join(root,file),bytes);
  manifest.files=manifest.files.filter(record=>record.file!==file);
  manifest.files.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),sourceRepository:'artandavoodi/artandavoodi',sourceCommit:revision});
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');process.exit(0);
}
if(args.includes('--preference-icons-only')){
  const revision=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  const registryPath=path.join(root,'docs/assets/data/icons.json'),registry=JSON.parse(await readFile(registryPath,'utf8'));
  const manifestPath=path.join(root,'planning/source-manifest.json'),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  for(const [name,relative] of Object.entries({cookies:'core/interface/cookies/cookies.svg',check:'core/actions/check/check.svg',close:'core/actions/close/close.svg'})){
    const sourceFile='registry/icons/source/'+relative;
    const bytes=execFileSync('git',['-C',source,'show',`${revision}:${sourceFile}`]);
    const file=`docs/assets/icons/actions/${name}.svg`;
    await mkdir(path.dirname(path.join(root,file)),{recursive:true});await writeFile(path.join(root,file),bytes);
    manifest.files=manifest.files.filter(record=>record.file!==file);manifest.files.push({file,sha256:createHash('sha256').update(bytes).digest('hex'),sourceRepository:'artandavoodi/control-center',sourceCommit:revision,sourceFile});
    if(!registry.items.some(item=>item.id===name))registry.items.push({id:name,src:file.slice(5),alt:'',monochrome:true});
  }
  await writeFile(registryPath,JSON.stringify(registry,null,2)+'\n');await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');process.exit(0);
}
const read=async p=>JSON.parse(await readFile(path.join(source,'docs',p),'utf8'));
const records=[];
const allowed=['id','title','artistId','artist','type','category','cover','releaseDate','duration','status','format','genre','label','upc','isrc','description','story','lyrics','credits','musicalDetails','productionProcess','releaseInformation','links'];
function publicRecord(record) {
  const result=Object.fromEntries(allowed.filter(key=>record[key]!==undefined && record.editorial?.[key]!=='draft').map(key=>[key,record[key]]));
  if(record.tracks) result.tracks=record.tracks.map(publicRecord);
  return result;
}
async function copy(file) {
  if(records.some(r=>r.file===file)) return;
  const bytes=await readFile(path.join(source,file));
  await mkdir(path.dirname(path.join(root,file)),{recursive:true});
  await copyFile(path.join(source,file),path.join(root,file));
  records.push({file,sha256:createHash('sha256').update(bytes).digest('hex')});
}
async function json(file,value) {
  await mkdir(path.dirname(path.join(root,file)),{recursive:true});
  await writeFile(path.join(root,file),JSON.stringify(value,null,2)+'\n');
}
// Refresh approved catalogue fields without replacing label-owned controls or assets.
if(args.includes('--site-style-only')) {
  await copy('docs/assets/css/layers/site/site.css');
  const manifest=JSON.parse(await readFile(path.join(root,'planning/source-manifest.json'),'utf8'));
  const replaced=new Set(records.map(record=>record.file));
  manifest.files=[...manifest.files.filter(record=>!replaced.has(record.file)),...records];
  manifest.siteStyleSourceCommit=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  await json('planning/source-manifest.json',manifest);
  console.log('Synchronized shared site presentation only.');
  process.exit(0);
}
if(args.includes('--catalogue-only')) {
  const catalogue=await read('assets/data/music/releases.json');
  const current=JSON.parse(await readFile(path.join(root,'docs/assets/data/music/releases.json'),'utf8'));
  const approved=catalogue.items.filter(record=>record.status==='Released').map(publicRecord);
  if(approved.some(record=>!current.items.some(item=>item.id===record.id)))throw Error('New release assets require a full approved import');
  await json('docs/assets/data/music/releases.json',{schemaVersion:1,items:approved});
  const manifest=JSON.parse(await readFile(path.join(root,'planning/source-manifest.json'),'utf8'));
  manifest.catalogueSourceCommit=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  await json('planning/source-manifest.json',manifest);
  console.log('Synchronized approved catalogue fields only; foundation and label behavior preserved.');
  process.exit(0);
}

// Refresh registered image metadata and variants without replacing label-owned copy.
if(args.includes('--media-only')) {
  const catalogue=await read('assets/data/music/releases.json');
  const current=JSON.parse(await readFile(path.join(root,'docs/assets/data/music/releases.json'),'utf8'));
  async function media(image) {
    if(!image)return;
    for(const src of new Set([image.src,...(image.variants||[]).map(v=>v.src)]))await copy('docs/'+src.replace(/^\.\//,''));
  }
  for(const release of current.items) {
    const approved=catalogue.items.find(item=>item.id===release.id&&item.status==='Released');
    if(!approved)throw Error('Missing approved source release');
    release.cover=approved.cover;
    await media(release.cover);
  }
  await json('docs/assets/data/music/releases.json',current);
  const artist=await read('assets/data/artist/profile.json');
  const artists=JSON.parse(await readFile(path.join(root,'docs/assets/data/artists/items.json'),'utf8'));
  const identity=artists.items.find(item=>item.id==='artan-davoodi');
  if(!identity||identity.name!==artist.name)throw Error('Artist identity mismatch');
  identity.portrait=artist.portrait;
  await media(identity.portrait);
  await json('docs/assets/data/artists/items.json',artists);
  const manifest=JSON.parse(await readFile(path.join(root,'planning/source-manifest.json'),'utf8'));
  const replaced=new Set(records.map(record=>record.file));
  manifest.files=[...manifest.files.filter(record=>!replaced.has(record.file)),...records];
  manifest.mediaSourceCommit=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  await json('planning/source-manifest.json',manifest);
  console.log('Synchronized approved media only; catalogue copy and label behavior preserved.');
  process.exit(0);
}
// Refresh the shared controller without replacing label-owned navigation configuration.
if(args.includes('--menu-only')) {
  await copy('docs/assets/js/core/menu.js');
  const manifest=JSON.parse(await readFile(path.join(root,'planning/source-manifest.json'),'utf8'));
  manifest.files=manifest.files.map(record=>records.find(updated=>updated.file===record.file)||record);
  await json('planning/source-manifest.json',manifest);
  console.log('Synchronized shared menu controller only.');
  process.exit(0);
}
// Refresh selected shared controls without replacing label-owned navigation behavior.
if(args.includes('--controls-only')) {
  for(const file of ['docs/assets/css/core/01-tokens/navigation.tokens.css','docs/assets/css/layers/site/theme-menu.css','docs/assets/css/core/03-primitives/fields.css'])await copy(file);
  const manifest=JSON.parse(await readFile(path.join(root,'planning/source-manifest.json'),'utf8'));
  const replaced=new Set(records.map(record=>record.file));
  manifest.files=[...manifest.files.filter(record=>!replaced.has(record.file)),...records];
  manifest.controlsSourceCommit=execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
  await json('planning/source-manifest.json',manifest);
  console.log('Synchronized shared control tokens and presentation; label controller preserved.');
  process.exit(0);
}
for(const file of ['core/01-tokens/00-tokens-all.css','core/01-tokens/navigation.tokens.css','core/01-tokens/source/control-center.tokens.css','core/01-tokens/source/neuroartan.tokens.css','core/01-tokens/site.aliases.css','core/01-tokens/typography.tokens.css','core/02-foundation/themes.css','core/02-foundation/foundation.css','layers/site/site.css','layers/site/navigation.css']) await copy('docs/assets/css/'+file);
const catalogue=await read('assets/data/music/releases.json');
await copy('docs/assets/js/core/menu.js');
await copy('docs/assets/css/core/04-systems/startup.css');
await copy('docs/assets/css/layers/site/hub/index.css');
const site=JSON.parse(await readFile(path.join(root,'docs/assets/data/site.json'),'utf8'));
// Label identity is locally owned; foundation sync must not replace it.
// The public label catalogue includes published recordings only.
const items=catalogue.items.filter(record=>record.status==='Released').map(publicRecord);
const artist=await read('assets/data/artist/profile.json');
await json('docs/assets/data/music/releases.json',{schemaVersion:1,items});
const hub=await read('assets/data/hub.json');
const artistLinks=[...hub.links.filter(l=>l.url&&['streaming','social','email'].includes(l.category)),{label:site.labels.artistWebsite,url:site.artistWebsite,icon:'globe',category:'website'},{label:site.labels.publicHub,url:site.publicHub,icon:'globe',category:'website'},...(artist.links||[])].map((link,index)=>({...link,order:index+1}));
await json('docs/assets/data/artists/items.json',{schemaVersion:1,items:[{id:'artan-davoodi',name:artist.name,biography:artist.biography,portrait:artist.portrait,...(artist.yearsActive?{yearsActive:artist.yearsActive}:{}),links:artistLinks}]});
if(artist.portrait) await copy('docs/'+artist.portrait.src);
const ids=new Set(['home','back','chevron-right','email','globe',...items.flatMap(r=>[...(r.links||[]),...(r.tracks||[]).flatMap(t=>t.links||[])].map(l=>l.icon))]);
for(const link of site.social||[]) ids.add(link.icon);
const roster=JSON.parse(await readFile(path.join(root,'docs/assets/data/artists/roster.json'),'utf8'));
for(const link of [...artistLinks,...roster.items.flatMap(a=>a.links||[])]) ids.add(link.icon);
const icons=await read('assets/data/icons.json');
const used=icons.items.filter(i=>ids.has(i.id));
if(used.length!==ids.size) throw new Error('Missing registered icon');
for(const icon of used) await copy('docs/'+icon.src);
for(const release of items) if(release.cover) await copy('docs/'+release.cover.src);
await json('docs/assets/data/icons.json',{schemaVersion:1,items:used});
await json('docs/assets/data/music/interface.json',await read('assets/data/interface.json'));
await json('planning/source-manifest.json',{sourceRepository:'artandavoodi/artandavoodi',sourceCommit:execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),files:records});
console.log('Imported approved tokens, registered icons and public catalogue; source untouched.');

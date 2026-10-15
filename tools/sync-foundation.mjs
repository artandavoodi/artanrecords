/* Explicit one-way import; never writes to the approved source repository. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const args=process.argv.slice(2);
const source=path.resolve(args.find(arg=>!arg.startsWith('--')) || path.join(root,'../artandavoodi'));
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

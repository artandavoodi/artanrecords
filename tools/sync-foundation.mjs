/* Explicit one-way import; never writes to the approved source repository. */
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(process.argv[2] || path.join(root,'../artandavoodi'));
const read=async p=>JSON.parse(await readFile(path.join(source,'docs',p),'utf8'));
const records=[];
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
for(const file of ['core/01-tokens/00-tokens-all.css','core/01-tokens/source/control-center.tokens.css','core/01-tokens/source/neuroartan.tokens.css','core/01-tokens/site.aliases.css','core/01-tokens/typography.tokens.css','core/02-foundation/themes.css','core/02-foundation/foundation.css','layers/site/site.css','layers/site/navigation.css']) await copy('docs/assets/css/'+file);
const catalogue=await read('assets/data/music/releases.json');
await copy('docs/assets/js/core/menu.js');
const allowed=['id','title','artist','type','category','cover','releaseDate','duration','status','format','genre','label','upc','isrc','description','story','credits','musicalDetails','productionProcess','releaseInformation','links'];
function publicRecord(record) {
  const result=Object.fromEntries(allowed.filter(key=>record[key]!==undefined && record.editorial?.[key]!=='draft').map(key=>[key,record[key]]));
  if(record.tracks) result.tracks=record.tracks.map(publicRecord);
  return result;
}
const items=catalogue.items.map(publicRecord);
const artist=await read('assets/data/artist/profile.json');
await json('docs/assets/data/music/releases.json',{schemaVersion:1,items});
await json('docs/assets/data/artists/items.json',{schemaVersion:1,items:[{id:'artan-davoodi',name:artist.name,biography:artist.biography}]});
const ids=new Set(['back','chevron-right','email','globe',...items.flatMap(r=>[...(r.links||[]),...(r.tracks||[]).flatMap(t=>t.links||[])].map(l=>l.icon))]);
const icons=await read('assets/data/icons.json');
const used=icons.items.filter(i=>ids.has(i.id));
if(used.length!==ids.size) throw new Error('Missing registered icon');
for(const icon of used) await copy('docs/'+icon.src);
for(const release of items) await copy('docs/'+release.cover.src);
await json('docs/assets/data/icons.json',{schemaVersion:1,items:used});
await json('docs/assets/data/music/interface.json',await read('assets/data/interface.json'));
await json('planning/source-manifest.json',{sourceRepository:'artandavoodi/artandavoodi',sourceCommit:execFileSync('git',['-C',source,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),files:records});
console.log('Imported approved tokens, registered icons and public catalogue; source untouched.');

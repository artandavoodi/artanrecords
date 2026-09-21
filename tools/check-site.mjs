import {readFile,readdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url)),docs=path.join(root,'docs');
const read=p=>readFile(path.join(root,p),'utf8');
async function walk(dir){return (await Promise.all((await readdir(dir,{withFileTypes:true})).map(entry=>entry.isDirectory()?walk(path.join(dir,entry.name)):path.join(dir,entry.name)))).flat();}
const manifest=JSON.parse(await read('planning/source-manifest.json'));
for(const record of manifest.files)assert.equal(createHash('sha256').update(await readFile(path.join(root,record.file))).digest('hex'),record.sha256,'Shared source drift: '+record.file);
const registry=JSON.parse(await read('docs/assets/data/fragments.json'));
for(const file of Object.values(registry))await stat(path.join(docs,file));
const icons=JSON.parse(await read('docs/assets/data/icons.json'));
assert.equal(new Set(icons.items.map(i=>i.id)).size,icons.items.length);
for(const item of icons.items)await stat(path.join(docs,item.src));
for(const file of await walk(docs)){
  const text=await readFile(file,'utf8');
  if(file.endsWith('.json'))JSON.parse(text);
  if(file.endsWith('.js'))execFileSync(process.execPath,['--check',file]);
  if(file.endsWith('.css'))for(const [,target]of text.matchAll(/url\(['"]?([^)'"?]+)(?:\?[^)'" ]*)?['"]?\)/g))await stat(path.resolve(path.dirname(file),target));
  if(!file.endsWith('.html')||file.includes('/fragments/'))continue;
  assert.ok(!text.includes('{{'),'Unresolved template');
  assert.equal((text.match(/<h1\b/g)||[]).length,1,file);
  for(const [,name]of text.matchAll(/data-fragment="([^"]+)"/g))assert.ok(registry[name]);
  for(const [,target]of text.matchAll(/(?:href|src)="(\/[^"?#]*)(?:[?#][^"]*)?"/g)){
    const local=path.join(docs,target);const info=await stat(local);if(info.isDirectory())await stat(path.join(local,'index.html'));
  }
  for(const [,json]of text.matchAll(/type="application\/ld\+json">([\s\S]*?)<\/script>/g))JSON.parse(json);
  assert.ok(!text.includes('Saeed Davoodi'),'Legal identity must not be copied into public pages');
}
const before=await Promise.all((await walk(docs)).filter(p=>p.endsWith('.html')).map(async p=>[p,await readFile(p,'utf8')]));
execFileSync(process.execPath,['tools/build-site.mjs'],{cwd:root});
for(const [file,content]of before)assert.equal(await readFile(file,'utf8'),content,'Non-deterministic build');
console.log('PASS: shared checksums, fragments, icons, JSON, JavaScript, CSS imports, internal links, schema, identity and deterministic build.');

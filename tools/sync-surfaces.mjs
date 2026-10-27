import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(process.argv[2]||'');
const checking=process.argv.includes('--check');
if(!['artanrecords-docs','artanrecords-studio'].includes(target.split('/').pop()))throw Error('Choose a verified surface repository');
if(execFileSync('git',['rev-parse','--show-toplevel'],{cwd:target,encoding:'utf8'}).trim()!==target)throw Error('Target is not an independent repository');
const files={};
const transfers=[];
if(!checking){
  const owned=['docs/assets/css','docs/assets/brand','docs/assets/icons','docs/assets/js','docs/assets/data/site.json','docs/assets/data/icons.json','docs/assets/data/studio-legal.json','docs/assets/data/commerce.json','docs/assets/data/artists/reserved-routes.json','docs/assets/fragments/navigation','docs/registry','tools/ecosystem'];
  const changed=execFileSync('git',['diff','HEAD','--name-only','--',...owned],{cwd:root,encoding:'utf8'})+execFileSync('git',['ls-files','--others','--exclude-standard','--',...owned],{cwd:root,encoding:'utf8'});
  if(changed.trim())throw Error('Shared source changes must be verified and committed before propagation. No target files were replaced.');
}
async function copy(source,destination){
  const data=await readFile(resolve(root,source));
  if(checking) {
    const actual=await readFile(resolve(target,destination));
    if(!actual.equals(data)) throw Error('Shared foundation drift: '+destination);
  } else {
    let actual;try{actual=await readFile(resolve(target,destination));}catch(error){if(error.code!=='ENOENT')throw error;}
    if(actual&&!actual.equals(data)){
      let committed;try{committed=execFileSync('git',['show','HEAD:'+destination],{cwd:target,stdio:['ignore','pipe','pipe']});}catch{throw Error('Unregistered target changes require review: '+destination);}
      if(!actual.equals(committed))throw Error('Edited target differs from its shared source; preserved without replacement: '+destination);
    }
    transfers.push({destination,data});
  }
  files[destination]=createHash('sha256').update(data).digest('hex');
}
async function tree(path,destination){for(const item of await readdir(resolve(root,path),{withFileTypes:true})){if(item.name.startsWith('.'))continue;const s=path+'/'+item.name,d=destination+'/'+item.name;if(item.isDirectory())await tree(s,d);else if(item.isFile())await copy(s,d);}}
for(const name of ['css','brand','icons'])await tree('docs/assets/'+name,'assets/'+name);
await copy('docs/assets/js/core/02-systems/document-reader.js','assets/js/core/02-systems/document-reader.js');
await copy('docs/assets/data/studio-legal.json','assets/data/studio-legal.json');
await copy('docs/assets/data/commerce.json','assets/data/commerce.json');
await copy('docs/assets/data/artists/reserved-routes.json','assets/data/artists/reserved-routes.json');
await copy('docs/assets/data/artists/editor.json','assets/data/artists/editor.json');
await copy('docs/assets/data/studio-plans.json','assets/data/studio-plans.json');
await copy('docs/assets/data/partnerships.json','assets/data/partnerships.json');
await copy('tools/ecosystem/partnerships.mjs','foundation/partnerships.mjs');
await copy('tools/ecosystem/studio-plans.mjs','foundation/studio-plans.mjs');
await copy('docs/assets/js/layers/site/artist-editor-preview.js','assets/js/layers/site/artist-editor-preview.js');
await copy('docs/assets/js/layers/site/artist-design.js','assets/js/layers/site/artist-design.js');
await copy('docs/assets/data/artists/site-pages.json','assets/data/artists/site-pages.json');
await copy('docs/assets/js/core/02-systems/reorder-list.js','assets/js/core/02-systems/reorder-list.js');
await copy('docs/assets/js/layers/site/creator-routes.js','assets/js/layers/site/creator-routes.js');
for(const name of ['actions/edit/edit','actions/drag/drag','identity/access/visibility-on','identity/access/visibility-off','navigation/chevron/chevron-down','navigation/primary/home','navigation/direction/back'])await copy('docs/registry/icons/public/assets/core/'+name+'.svg','registry/icons/public/assets/core/'+name+'.svg');
for(const path of ['js/core/theme.js','js/core/menu.js','js/core/close-button.js','js/core/search.js','js/core/dialogs.js','js/core/startup.js','js/core/preference-config.js','js/layers/site/navigation.js','fragments/navigation/index.html','data/site.json','data/icons.json'])await copy('docs/assets/'+path,'assets/'+path);
for(const name of ['build.mjs','shell.html','surface.css','app.js','search.mjs'])await copy('tools/ecosystem/'+name,'foundation/'+name);
if(checking) {
  const manifest=JSON.parse(await readFile(resolve(target,'foundation-manifest.json'),'utf8'));
  for(const [file,hash] of Object.entries(files))if(manifest.files[file]!==hash)throw Error('Manifest drift: '+file);
  console.log('Verified shared foundation: '+relative(root,target));
} else {
  for(const {destination,data} of transfers){await mkdir(dirname(resolve(target,destination)),{recursive:true});await writeFile(resolve(target,destination),data);}
  await writeFile(resolve(target,'foundation-manifest.json'),JSON.stringify({source:'artandavoodi/artanrecords',commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files},null,2)+'\n');
  console.log('Synchronized approved foundation to '+relative(root,target));
}

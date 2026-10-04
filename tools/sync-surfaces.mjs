import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,relative,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const target=resolve(process.argv[2]||'');
if(!['artanrecords-docs','artanrecords-studio'].includes(target.split('/').pop()))throw Error('Choose a verified surface repository');
if(execFileSync('git',['rev-parse','--show-toplevel'],{cwd:target,encoding:'utf8'}).trim()!==target)throw Error('Target is not an independent repository');
const files={};
async function copy(source,destination){
  const data=await readFile(resolve(root,source));
  await mkdir(dirname(resolve(target,destination)),{recursive:true});
  await writeFile(resolve(target,destination),data);
  files[destination]=createHash('sha256').update(data).digest('hex');
}
async function tree(path,destination){for(const item of await readdir(resolve(root,path),{withFileTypes:true})){if(item.name.startsWith('.'))continue;const s=path+'/'+item.name,d=destination+'/'+item.name;if(item.isDirectory())await tree(s,d);else if(item.isFile())await copy(s,d);}}
for(const name of ['css','brand','icons'])await tree('docs/assets/'+name,'assets/'+name);
for(const path of ['js/core/theme.js','js/core/menu.js','js/layers/site/navigation.js','fragments/navigation/index.html','data/site.json','data/icons.json'])await copy('docs/assets/'+path,'assets/'+path);
for(const name of ['build.mjs','shell.html','surface.css','app.js'])await copy('tools/ecosystem/'+name,'foundation/'+name);
await writeFile(resolve(target,'foundation-manifest.json'),JSON.stringify({source:'artandavoodi/artanrecords',commit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),files},null,2)+'\n');
console.log('Synchronized approved foundation to '+relative(root,target));

// Brand exports remain label-owned; only registered consumer assets are mirrored.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {execFileSync} from 'node:child_process';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const check=process.argv.includes('--check');
const names=['logo/artan-records-symbol-black.svg','logo/artan-records-symbol-white.svg','logo/artan-records-wordmark-black.svg','logo/artan-records-wordmark-white.svg','presentation.css'];
const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
for(const target of ['artan-live','artandavoodi']){
  const destination=resolve(root,'..',target);
  if(execFileSync('git',['rev-parse','--show-toplevel'],{cwd:destination,encoding:'utf8'}).trim()!==destination)throw Error('Unverified brand consumer: '+target);
  for(const name of names){
    const file='docs/assets/brand/'+name;
    const source=await readFile(resolve(root,file));
    const existing=await readFile(resolve(destination,file)).catch(error=>{if(error.code==='ENOENT'&&name==='presentation.css')return null;throw error;});
    if(existing?.equals(source))continue;
    if(check)throw Error('Brand asset drift: '+target+'/'+file);
    if(existing){
      const backup=resolve(homedir(),'.codex','backups','artanrecords-brand',target,hash(existing),name);
      await mkdir(dirname(backup),{recursive:true});await writeFile(backup,existing);
      console.log('Original preserved at '+backup);
    }
    await writeFile(resolve(destination,file),source);
    console.log('Updated '+target+'/'+name);
  }
}
console.log(check?'Registered consumer brand exports match.':'Registered consumer brand exports synchronized.');

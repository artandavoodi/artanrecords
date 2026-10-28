import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';

/** Keep modular source URLs while invalidating every dependency independently. */
export async function versionRuntimeAssets(shell,docs){
 const imports={};
 const version=async path=>path+'?v='+createHash('sha256').update(await readFile(new URL(path.slice(1),docs))).digest('hex').slice(0,16);
 async function scan(path){
  for(const item of (await readdir(new URL(path.slice(1),docs),{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name))){
   const child=path+'/'+item.name;
   if(item.isDirectory())await scan(child);
   else if(item.isFile()&&item.name.endsWith('.js'))imports[child]=await version(child);
  }
 }
 await scan('/assets/js');
 const paths=[...shell.matchAll(/(?:src|href)="(\/assets\/(?:js\/[^"?]+\.js|css\/site\.generated\.css))"/g)].map(match=>match[1]);
 for(const path of new Set(paths))shell=shell.replaceAll('"'+path+'"','"'+await version(path)+'"');
 return shell.replace('<script type="module"',`<script type="importmap">${JSON.stringify({imports})}</script>\n  <script type="module"`);
}

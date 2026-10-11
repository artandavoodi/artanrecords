/* Explicit asset preparation; originals are preserved and normal builds use checked-in variants. */
import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {resolve,dirname,basename,extname,relative} from 'node:path';
import assert from 'node:assert/strict';
const config=JSON.parse(await readFile(new URL('../../planning/responsive-images.json',import.meta.url),'utf8'));
const root=await realpath(process.argv[2]);
if(!['artandavoodi','artanrecords','artan-live'].includes(basename(root))||execFileSync('git',['rev-parse','--show-toplevel'],{cwd:root,encoding:'utf8'}).trim()!==root)throw Error('Choose an approved repository root');
const docs=resolve(root,'docs');
const prepared=new Map();
const bindings=new Map();
async function visit(value) {
  if(!value||typeof value!=='object')return;
  if(typeof value.src==='string'&&value.alt&&value.src.replace(/^\.\//,'').startsWith('assets/media/')&&/\.(jpe?g|png|webp)$/i.test(value.src)) {
    const source=await realpath(resolve(docs,value.src));
    if(!source.startsWith(docs+'/'))throw Error('Image must be in the public media directory');
    if(!prepared.has(source)) {
      const metadata=execFileSync('sips',['-g','pixelWidth','-g','pixelHeight','-g','hasAlpha',source],{encoding:'utf8'});
      const width=Number(metadata.match(/pixelWidth: (\d+)/)?.[1]);
      const height=Number(metadata.match(/pixelHeight: (\d+)/)?.[1]);
      if(!width||!height)throw Error('Image dimensions unavailable');
      const alpha=/hasAlpha: yes/.test(metadata);
      const folder=resolve(dirname(source),'responsive');
      await mkdir(folder,{recursive:true});
      const variants=[];
      for(const size of config.widths.filter(size=>size<width)) {
        const output=resolve(folder,`${basename(source,extname(source))}-w${size}.${alpha?'png':'jpg'}`);
        const args=['--resampleWidth',String(size),'-s','format',alpha?'png':'jpeg'];
        if(!alpha)args.push('-s','formatOptions',String(config.jpegQuality));
        execFileSync('sips',[...args,source,'--out',output],{stdio:'ignore'});
        variants.push({src:relative(docs,output),width:size});
      }
      variants.push({src:relative(docs,source),width});
      prepared.set(source,{width,height,variants,sizes:config.sizes});
    }
    Object.assign(value,prepared.get(source));
    bindings.set(value.src,value);
  }
  for(const [key,child] of Object.entries(value))if(key!=='variants') {
    if(Array.isArray(child))for(const item of child)await visit(item);
    else await visit(child);
  }
}
// Replace only registered image objects, preserving unrelated JSON formatting and content.
function serializeImages(layout,data) {
  const replacements=[];
  const pattern=/"(?:cover|portrait|image|preview)"\s*:\s*\{/g;
  for(let match;(match=pattern.exec(layout));) {
    const start=match.index+match[0].length-1;
    let end=start,depth=0,quoted=false,escaped=false;
    for(;end<layout.length;end++) {
      const char=layout[end];
      if(quoted) { if(escaped)escaped=false;else if(char==='\\')escaped=true;else if(char==='"')quoted=false; }
      else if(char==='"')quoted=true;
      else if(char==='{')depth++;
      else if(char==='}'&&--depth===0)break;
    }
    const original=JSON.parse(layout.slice(start,end+1));
    const replacement=bindings.get(original.src);
    if(replacement) {
      const indent=layout.slice(layout.lastIndexOf('\n',start)+1,start).match(/^\s*/)[0];
      replacements.push({start,end:end+1,text:JSON.stringify(replacement,null,2).replace(/\n/g,'\n'+indent)});
    }
    pattern.lastIndex=end+1;
  }
  for(const item of replacements.reverse())layout=layout.slice(0,item.start)+item.text+layout.slice(item.end);
  assert.deepEqual(JSON.parse(layout),data,'Image preparation must not discard unrelated data changes');
  return layout;
}
for(const input of process.argv.slice(3).filter(arg=>!arg.startsWith('--'))) {
  if(!/^assets\/data\/[\w/-]+\.json$/.test(input))throw Error('Use a registered public data file');
  const file=resolve(docs,input);
  const current=await readFile(file,'utf8');
  const layout=process.argv.includes('--layout-from-head')?execFileSync('git',['show','HEAD:docs/'+input],{cwd:root,encoding:'utf8'}):current;
  const data=JSON.parse(current);
  await visit(data);
  await writeFile(file,serializeImages(layout,data));
}
console.log(`Prepared responsive variants for ${prepared.size} approved images; originals retained.`);

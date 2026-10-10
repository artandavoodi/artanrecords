import {readFile} from 'node:fs/promises';

// Flatten the governed import graph without changing source ownership or order.
export async function bundleStyles(entry, root, stack = []) {
  if(stack.includes(entry.href)) throw new Error('Circular stylesheet import');
  const source=await readFile(entry,'utf8');
  const imports=/@import\s+url\(['"]?([^'"\)]+)['"]?\);/g;
  let result='', position=0;
  for(const match of source.matchAll(imports)) {
    result+=rewriteUrls(source.slice(position,match.index),entry,root);
    result+=await bundleStyles(new URL(match[1],entry),root,[...stack,entry.href]);
    position=match.index+match[0].length;
  }
  return result+rewriteUrls(source.slice(position),entry,root);
}

function rewriteUrls(css,entry,root) {
  return css.replace(/url\(['"]?([^'"\)]+)['"]?\)/g,(match,value)=>{
    if(/^(?:data:|https?:|\/|#)/.test(value)) return match;
    const url=new URL(value,entry);
    if(!url.href.startsWith(root.href)) throw new Error('Stylesheet asset outside public root');
    return `url('/${url.href.slice(root.href.length)}')`;
  });
}

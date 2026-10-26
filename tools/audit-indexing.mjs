import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const live=process.argv.includes('--live');
const site=JSON.parse(await readFile(new URL('../docs/assets/data/site.json',import.meta.url)));
const origin=new URL(site.domain).origin;
async function read(path){
 if(!live)return readFile(new URL('../docs/'+path,import.meta.url),'utf8');
 const response=await fetch(origin+'/'+path,{signal:AbortSignal.timeout(20000),redirect:'follow'});
 assert.equal(response.status,200,'HTTP status: '+path);
 assert.ok(!/noindex/i.test(response.headers.get('x-robots-tag')||''),'Blocked HTTP header: '+path);
 return response.text();
}
const sitemap=await read('sitemap.xml'),robots=await read('robots.txt');
assert.ok(robots.includes('Sitemap: '+origin+'/sitemap.xml'));
assert.ok(!/^Disallow:\s*\/\s*$/mi.test(robots),'Site-wide crawl block');
const urls=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(match=>match[1]);
assert.equal(new Set(urls).size,urls.length,'Duplicate sitemap entries');
for(const url of urls){
 const parsed=new URL(url);assert.equal(parsed.origin,origin,'Foreign canonical host');
 assert.ok(!['/404.html','/artists/profile/'].includes(parsed.pathname),'Non-indexable route in sitemap');
 const path=parsed.pathname.slice(1)+'index.html';
 const html=await read(live?parsed.pathname.slice(1):path);
 assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),'Canonical mismatch: '+url);
 assert.ok(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/i.test(html),'Noindex in sitemap: '+url);
 assert.ok(html.includes('<meta property="og:site_name" content="'+site.name+'">'),'Missing site name: '+url);
 assert.ok(/<h1[\s>]/.test(html)&&/<meta name="description" content="[^"]+"/.test(html),'Missing indexable page content: '+url);
 const graph=JSON.parse(html.match(/<script type="application\/ld\+json">([^<]+)<\/script>/)?.[1]||'{}')['@graph'];
 assert.ok(graph?.some(entity=>entity['@type']==='WebSite'&&entity.name===site.name&&entity.url===origin+'/'),'Website identity mismatch: '+url);
 console.log('PASS '+url);
}
assert.equal(site.name,'Artanrecords','Canonical public brand');
console.log(`PASS: ${urls.length} ${live?'live':'built'} canonical pages; indexing and ranking remain Google decisions.`);

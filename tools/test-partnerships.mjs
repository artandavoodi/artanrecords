import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {partnershipPages} from './site/partnerships.mjs';
const data=JSON.parse(await readFile(new URL('../docs/assets/data/partnerships.json',import.meta.url)));
const icons=JSON.parse(await readFile(new URL('../docs/assets/data/icons.json',import.meta.url)));
const pages=partnershipPages(data,icons);
assert.equal(pages.length,4);
assert.equal(new Set(pages.map(page=>page.path)).size,4);
assert.equal(pages[0].comparison.match(/<tr>/g).length,data.comparison.rows.length+1);
assert.ok(pages.every(page=>page.sections.length>=4));
assert.ok(!JSON.stringify(pages).match(/\b(?:85|80|70|15|20|30)%/));
const unsafe=structuredClone(data); unsafe.publication.percentages=true;
assert.throws(()=>partnershipPages(unsafe,icons));
assert.ok(pages[0].comparison.includes('data-inclusion="future"'));
assert.ok(pages[0].comparison.includes('data-inclusion="excluded"'));
for(const page of pages) {
  const html=await readFile(new URL('../docs'+page.path+'index.html',import.meta.url),'utf8');
  assert.ok(html.includes('rel="canonical" href="https://artanrecords.com'+page.path+'"'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes(page.sections[0].title));
}
const sitemap=await readFile(new URL('../docs/sitemap.xml',import.meta.url),'utf8');
for(const page of pages) assert.ok(sitemap.includes('https://artanrecords.com'+page.path));
console.log('Partnership publication gates, static content and sitemap verified');

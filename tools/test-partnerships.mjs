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
for(const cell of pages[0].comparison.matchAll(/<td data-inclusion="([^"]+)">([\s\S]*?)<\/td>/g)) {
  assert.equal(cell[2].includes('class="partnership-status-icon"'),['included','excluded'].includes(cell[1]));
}
assert.equal(pages[0].links.length,0);
assert.deepEqual(pages[0].afterComparison.at(-1).links,data.nextSteps.links);
assert.equal(data.serviceSpecifications.categories.length,6);
for(const tier of data.items){
  for(const service of data.serviceSpecifications.tiers[tier.id]){
    for(const field of ['deliverable','evidence','limits'])assert.ok(service[field].length>30);
    assert.ok(pages.find(page=>page.path===`/partnerships/${tier.id}/`).sections.some(section=>section.text?.includes(service.evidence)));
  }
}
assert.ok(pages[0].comparison.includes('/assets/icons/actions/check.svg'));
assert.ok(pages[0].comparison.includes('data-partnership-dialog'));
assert.ok(pages[0].comparison.includes('class="partnership-cell-note"'));
assert.equal((pages[0].comparison.match(/<template /g)||[]).length,data.comparison.rows.length);
assert.equal((pages[0].comparison.match(/data-partnership-detail="/g)||[]).length,data.comparison.rows.length*3);
for(const row of data.comparison.rows){assert.ok(row.details.length>100);for(const page of pages.slice(1))assert.ok(page.sections.some(section=>section.text?.includes(row.details)));}
for(const route of ['referrals','submission-standards']) {
  const html=await readFile(new URL('../docs/'+route+'/index.html',import.meta.url),'utf8');
  assert.ok(html.includes('<h1>'));
  assert.ok(html.includes('https://artanrecords.com/'+route+'/'));
}
for(const page of pages) {
  const html=await readFile(new URL('../docs'+page.path+'index.html',import.meta.url),'utf8');
  assert.ok(html.includes('rel="canonical" href="https://artanrecords.com'+page.path+'"'));
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(html.includes(page.sections[0].title));
}
const sitemap=await readFile(new URL('../docs/sitemap.xml',import.meta.url),'utf8');
for(const page of pages) assert.ok(sitemap.includes('https://artanrecords.com'+page.path));
const home=await readFile(new URL('../docs/index.html',import.meta.url),'utf8');
const site=JSON.parse(await readFile(new URL('../docs/assets/data/site.json',import.meta.url),'utf8'));
assert.ok(home.includes(site.proposition.text));
assert.ok(home.includes('href="/how-we-work/"'));
for(const route of ['how-we-work','company','working-together']){
  const html=await readFile(new URL('../docs/'+route+'/index.html',import.meta.url),'utf8');
  assert.equal((html.match(/<h1\b/g)||[]).length,1);
  assert.ok(sitemap.includes('https://artanrecords.com/'+route+'/'));
}
const company=await readFile(new URL('../docs/company/index.html',import.meta.url),'utf8');
assert.ok(company.includes(site.companyDescriptions.short));
assert.ok(company.includes('financial reporting and payouts are not active'));
const graphs=[...home.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)].map(match=>JSON.parse(match[1]));
const organization=graphs.flatMap(graph=>graph['@graph']||[]).find(entity=>entity['@type']==='Organization');
assert.deepEqual(organization.sameAs,site.social.map(profile=>profile.url));
assert.equal((home.match(/class="label-footer-group"/g)||[]).length,7);
for(const path of ['https://docs.artanrecords.com/','https://docs.artanrecords.com/developers/','/help/','/partnerships/'])assert.ok(home.includes(`href="${path}"`));
const about=await readFile(new URL('../docs/about/index.html',import.meta.url),'utf8');
assert.ok(about.includes('data-header-duplicate'));
assert.ok(home.includes('data-footer-preferences'));
assert.ok(home.includes('class="label-account-access"'));
assert.ok(!home.match(/>Sign in<|>Create account</));
const help=await readFile(new URL('../docs/help/index.html',import.meta.url),'utf8');assert.ok(help.includes('href="https://docs.artanrecords.com/getting-started/"'));
console.log('Partnership publication gates, static content and sitemap verified');

import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {partnershipPages} from './site/partnerships.mjs';
import {validatePartnerships,agreementAllocation,recordingReference} from './ecosystem/partnerships.mjs';
import {validateStudioPlans,studioComparison,resolveStudioEntitlement,formatPlanPrice} from './ecosystem/studio-plans.mjs';
const data=JSON.parse(await readFile(new URL('../docs/assets/data/partnerships.json',import.meta.url)));
const icons=JSON.parse(await readFile(new URL('../docs/assets/data/icons.json',import.meta.url)));
const pages=partnershipPages(data,icons);
const plans=JSON.parse(await readFile(new URL('../docs/assets/data/studio-plans.json',import.meta.url),'utf8'));
validateStudioPlans(plans);
assert.deepEqual(plans.items.map(plan=>[plan.monthlyPrice,plan.annualPrice]),[[999,9900],[1999,19900]]);
const annualIndependent=structuredClone(plans);annualIndependent.items[0].monthlyPrice=1099;
assert.equal(studioComparison(annualIndependent).comparison.rows[1].values[0],'€99 / year');
const badPrice=structuredClone(plans);badPrice.items[0].monthlyPrice=9.99;assert.throws(()=>validateStudioPlans(badPrice));
const withPlans=partnershipPages(data,icons,plans);
assert.ok(withPlans[0].comparison.includes('Studio Pro included while the partnership is active'));
assert.ok(withPlans[0].comparison.includes('Studio included while the partnership is active'));
for(const price of ['€9.99 / month','€19.99 / month','€99 / year','€199 / year']){
 const html=await readFile(new URL('../docs/studio-plans/index.html',import.meta.url),'utf8');assert.ok(html.includes(price));
}
assert.equal(formatPlanPrice(999),'€9.99');assert.equal(formatPlanPrice(19900),'€199');
assert.deepEqual(studioComparison(plans).comparison.rows[0].values,['€9.99 / month','€19.99 / month']);
const evidence={entitlement_source:'PARTNERSHIP_INCLUDED',status:'active',agreement_status:'signed',agreement_id:'fixture',partnership_id:'fixture',entitlement_start:'2026-01-01',entitlement_end:'2027-01-01'};
for(const [tier,plan] of Object.entries(plans.partnershipInclusion)){
 const entitlement=resolveStudioEntitlement(plans,{...evidence,partnership:tier},Date.parse('2026-10-26'));
 assert.equal(entitlement.plan,plan);assert.equal(entitlement.separateChargeAllowed,false);assert.equal(entitlement.amount_charged_minor,0);
 assert.equal(entitlement.list_prices.MONTHLY,plans.items.find(item=>item.plan===plan).monthlyPrice);
}
assert.equal(resolveStudioEntitlement(plans,{...evidence,partnership:'gold',agreement_status:'draft'}),null);
assert.equal(resolveStudioEntitlement(plans,{...evidence,partnership:'gold'},Date.parse('2028-01-01')),null);
assert.deepEqual(plans.items.map(plan=>[plan.monthlyPrice,plan.annualPrice]),[[999,9900],[1999,19900]]);
assert.equal(pages.length,4);
assert.equal(new Set(pages.map(page=>page.path)).size,4);
assert.equal(pages[0].comparison.match(/<tr>/g).length,data.comparison.rows.length+1);
assert.ok(pages.every(page=>page.sections.length>=4));
assert.ok(!JSON.stringify(pages).match(/\b(?:85|80|70|15|20|30)%/));
const unsafe=structuredClone(data); unsafe.publication.percentages=true;
assert.throws(()=>partnershipPages(unsafe,icons));
assert.deepEqual(data.items.map(item=>[item.artistShare,item.labelShare]),[[85,15],[80,20],[70,30]]);
assert.equal(data.commercialTermsVersion,1);
for(const values of [[-1,101],[85,20],[101,-1],[85.5,14.5]]){
 const invalid=structuredClone(data);[invalid.items[0].artistShare,invalid.items[0].labelShare]=values;assert.throws(()=>validatePartnerships(invalid));
}
const reviewed=structuredClone(data);reviewed.publication={percentages:true,legalAccountingReview:'approved'};
const disclosed=partnershipPages(reviewed,icons);
for(const item of data.items){
 assert.ok(disclosed[0].comparison.includes(item.artistShare+'%'));
 const tier=disclosed.find(page=>page.path===`/partnerships/${item.id}/`);
 assert.ok(tier.sections.some(section=>section.text?.includes(`Artist keeps ${item.artistShare}%. Artanrecords share ${item.labelShare}%.`)));
}
assert.ok(!JSON.stringify(recordingReference(data)).match(/\b(?:85|80|70|15|20|30)%/));
const signed={status:'signed',agreementId:'fixture-agreement',version:1,effectiveDate:'2026-10-26',artistShare:90,labelShare:10};
assert.equal(agreementAllocation(data,'silver',signed).artistShare,90);
assert.equal(agreementAllocation(data,'silver').source,'default-reference');
assert.throws(()=>agreementAllocation(data,'silver',{...signed,status:'draft'}));
const commerce=JSON.parse(await readFile(new URL('../docs/assets/data/commerce.json',import.meta.url),'utf8'));
assert.ok(!JSON.stringify(commerce).match(/artistShare|labelShare/));
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

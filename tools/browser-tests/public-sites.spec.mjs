import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../../planning/browser-regression.json',import.meta.url),'utf8'));
const key=process.env.BROWSER_SITE_KEY||'records';
const site=registry[key];
if(!site)throw Error('Unknown public site');
if(key==='records')test('selected artist media refreshes and desktop link labels remain hover-only',async({page})=>{
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 const portrait='96000000-0000-0000-0000-000000000001/avatar';let published=true,version=1,shared=true,downloads=0;
 await page.route('https://hahtbepdrjkjluhespbs.supabase.co/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(published?[{username:'artandavoodi',updated_at:'2026-10-23T10:00:0'+version+'Z',fields:{artist_name:'Test artist',biography:'Saved biography '+version,spotify:'https://open.spotify.com/artist/test',...(shared?{portrait_path:portrait,header_path:portrait.replace('/avatar','/header')}:{})}}]:[])}));
 await page.route('**/storage/v1/object/authenticated/studio-headers/**',route=>route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDV8AAAAASUVORK5CYII=','base64')}));
 await page.route('**/storage/v1/object/authenticated/studio-avatars/**',route=>{downloads++;return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aDV8AAAAASUVORK5CYII=','base64')});});
 await page.goto('/artists/artandavoodi/');
 const image=page.locator('[data-artist-portrait] img');await expect(image).toBeVisible();await expect.poll(()=>image.evaluate(el=>el.naturalWidth)).toBe(1);expect(downloads).toBe(1);
 await expect(page.locator('[data-artist-header] img')).toBeVisible();await expect(page.locator('[data-artist-header]')).toHaveCSS('position','absolute');
 const link=page.locator('[data-artist-links] a[aria-label="Spotify"]'),label=link.locator('.hub__tooltip');
 await expect(label).toBeVisible();await expect(label).toHaveCSS('opacity','1');await expect(page.locator('.artist-destination-tabs')).toHaveCSS('border-bottom-width','0px');
 version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-artist-fields]')).toContainText('Saved biography 2');expect(downloads).toBe(2);
 shared=false;version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(image).toHaveCount(0);await expect(page.locator('[data-artist-fields]')).toContainText('Saved biography 3');
 published=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-public-artist]')).toBeHidden();await expect(page.locator('[data-artist-unavailable]')).toHaveText('This artist page is not public.');
});
if(key==='records')test('artist concerts show event-local time and suppress tickets for cancelled shows',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{username:'artandavoodi',updated_at:'2026-10-23T12:00:00Z',fields:{artist_name:'Test artist',biography:'A saved story.',website:'https://example.test',spotify:'https://open.spotify.com/artist/test'}}])}));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:'test-event',title:'Piano night',starts_at:'2027-01-01T19:00:00Z',timezone:'Europe/Berlin',venue:'Concert hall',city:'Berlin',country:'DE',status:'published',ticket_url:'https://tickets.example/show',ticket_price:20,currency:'EUR',announcement:'An acoustic evening.'},{id:'cancelled-event',title:'Cancelled show',starts_at:'2027-02-01T19:00:00Z',timezone:'Europe/Berlin',venue:'Concert hall',city:'Berlin',country:'DE',status:'cancelled',ticket_url:'https://tickets.example/cancelled',ticket_price:20,currency:'EUR'}])}));
 await page.goto('/artists/artandavoodi/');await page.getByRole('tab',{name:'Live',exact:true}).click();const concerts=page.locator('[data-artist-concerts]');await expect(concerts.getByRole('heading',{name:'Piano night'})).toBeVisible();await expect(concerts).toContainText('Europe/Berlin');await expect(concerts.getByRole('link',{name:'Tickets & details'})).toHaveCount(1);await expect(concerts).toContainText('Cancelled');
 await page.getByRole('tab',{name:'Explore',exact:true}).click();await expect(concerts).toBeHidden();await expect(page.getByRole('link',{name:'Website',exact:true})).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByRole('tab',{name:'Explore',exact:true})).toHaveAttribute('aria-selected','true');await expect(concerts).toBeHidden();
 await expect(page.locator('[data-artist-links]')).toContainText('Listen');await expect(page.locator('[data-artist-links]')).toContainText('Explore');
});
if(key==='records')test('approved artist snapshot replaces only artist-selected public fields',async({page})=>{
 await page.route('https://hahtbepdrjkjluhespbs.supabase.co/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{username:'artandavoodi',fields:{artist_name:'Artan Davoodi',biography:'Approved Studio biography',spotify:'https://open.spotify.com/artist/test'}}])}));
 await page.goto('/artists/artandavoodi/');
 await expect(page.locator('[data-artist-fields]')).toContainText('Approved Studio biography');
 await expect(page.locator('[data-artist-links] a')).toHaveCount(1);
 await expect(page.locator('[data-artist-links] a')).toHaveAttribute('href','https://open.spotify.com/artist/test');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',/\/artists\/artandavoodi\/$/);
 await expect(page.locator('.label-footer-group')).toHaveCount(0);
 await expect(page.getByRole('heading',{name:'Releases',exact:true})).toBeVisible();
});
test('open menu uses the shared X to minus hover without scaling the button',async({page})=>{
  test.skip(!test.info().project.name.endsWith('desktop'));
  await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
  await page.goto('/');
  const menu=page.locator('[data-menu-toggle]');
  await menu.click();
  await menu.hover();
  await expect.poll(()=>menu.locator('span').first().evaluate(el=>getComputedStyle(el).transform)).toBe('matrix(1, 0, 0, 1, 0, 0)');
  await page.mouse.move(0,0);
  await expect.poll(()=>menu.locator('span').first().evaluate(el=>getComputedStyle(el).transform)).not.toBe('matrix(1, 0, 0, 1, 0, 0)');
});
if(key==='records')test('comparison preserves readable columns and accessible contextual details',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
  await page.goto('/partnerships/');
  const account=page.locator('.label-account-access');
  await expect(account).toBeVisible();
  await expect(account).toHaveAttribute('href','https://studio.artanrecords.com/account/');
  await expect(page.locator('.site-menu__links')).not.toContainText('Sign in');
  const region=page.locator('.partnership-comparison');
  await expect(region).toHaveAttribute('data-partnership-enhanced','');
  const heading=page.locator('thead th').first();
  expect(await heading.evaluate(el=>parseFloat(getComputedStyle(el).borderBottomWidth))).toBeGreaterThan(0);
  expect(await region.locator('table').evaluate(el=>el.getBoundingClientRect().width)).toBeGreaterThan(500);
  const preview=page.locator('.partnership-cell-note').first();
  if(page.viewportSize().width<=1024)await expect(preview).toBeHidden();else await expect(preview).toBeVisible();
  await expect(page.locator('[data-partnership-detail]')).toHaveCount(57);
  const trigger=page.locator('[data-partnership-detail]').first();
  await trigger.click();
  const dialog=page.locator('[data-partnership-dialog]');
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('h2')).toContainText('Silver');
  await expect(dialog.locator('[data-partnership-detail-copy]')).toContainText('None for accepted standard releases');
  expect(await dialog.locator('[data-partnership-detail-copy] p').count()).toBeGreaterThan(2);
  const appearance=await dialog.evaluate(el=>({border:getComputedStyle(el).borderTopWidth,background:getComputedStyle(el).backgroundColor,blur:getComputedStyle(el,'::backdrop').backdropFilter}));
  expect(appearance.border).toBe('0px');expect(appearance.background).not.toBe('rgba(0, 0, 0, 0)');expect(appearance.blur).not.toBe('none');
  await expect(dialog.locator('[data-partnership-close] .global-close-button__line')).toHaveCount(2);
  if(test.info().project.name.endsWith('desktop')){
    await dialog.locator('[data-partnership-close]').hover();
    await expect.poll(()=>dialog.locator('.global-close-button__line').first().evaluate(el=>getComputedStyle(el).transform)).toMatch(/^matrix\(1, 0, 0, 1,/);
  }
  await page.getByRole('button',{name:'Close details',exact:true}).click();
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
});
if(key==='records')test('cookie notice stays readable without accepting optional storage',async({page})=>{
  await page.goto('/');
  const dialog=page.getByRole('dialog',{name:'Cookies & preferences',exact:true});
  await expect(dialog).toBeVisible();
  await dialog.getByRole('link',{name:'Legal information',exact:true}).click();
  await expect(page).toHaveURL(/\/legal\/#cookies$/);
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole('tab',{name:'Cookies and similar technologies',exact:true})).toHaveAttribute('aria-selected','true');
  const actions=page.locator('.label-actions a');
  const sizes=await actions.evaluateAll(items=>items.map(item=>getComputedStyle(item).fontSize));
  expect(new Set(sizes).size).toBe(1);
  await page.getByRole('button',{name:'Cookies & preferences',exact:true}).click();
  await expect(dialog).toBeVisible();
  await dialog.getByRole('button',{name:'Skip',exact:true}).click();
  await expect(dialog).not.toBeVisible();
});
for(const theme of ['light','dark'])test.describe(theme,()=>{
  test.beforeEach(async({page})=>{
    await page.addInitScript(({key,theme,records})=>{
      localStorage.setItem(key,theme);
      if(records)localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000}));
    },{key:site.themeKey,theme,records:['records','docs'].includes(key)});
  });
  for(const route of site.routes)test(`${route} loads without horizontal overflow`,async({page})=>{
    const response=await page.goto(route);
    expect(response.status()).toBe(200);
    await expect(page.locator('main').first()).toBeVisible({timeout:30000});
    await expect(page.getByRole('heading').first()).toBeAttached();
    await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1)).toBeTruthy();
    await expect(page.locator('link[rel="canonical"]')).toHaveCount(1);
    await expect.poll(()=>page.evaluate(()=>document.documentElement.dataset.themeEffective)).toBe(theme);
    if(key==='records')await expect(page.locator('.label-header-logo img:visible')).toHaveCount(1);
  });
  test('menu opens and closes with Escape',async({page})=>{
    await page.goto(site.menuRoute||'/');
    const toggle=page.getByRole('button',{name:site.menuName,exact:true});
    await page.locator(site.menuSelector).waitFor({state:'attached'});
    if(key==='neuro'&&!(await toggle.isVisible())) {
      await expect(page.getByRole('navigation',{name:'Primary navigation',exact:true})).toBeVisible();
      return;
    }
    await toggle.click();
    const menuToggle=page.locator(site.menuSelector);
    await expect(menuToggle).toHaveAttribute('aria-expanded','true');
    const themeControl=page.locator('[data-menu-theme]');
    if(await themeControl.count()) {
      await expect(themeControl).toBeVisible();
      const box=await themeControl.boundingBox();
      expect(box.width).toBeGreaterThanOrEqual(24);
      expect(box.height).toBeGreaterThanOrEqual(24);
    }
    await page.keyboard.press('Escape');
    await expect(menuToggle).toHaveAttribute('aria-expanded','false');
    if(await themeControl.count())await expect(themeControl).toBeHidden();
  });
});
if(key==='records')test('submission routes have intentional defaults; no enquiry is sent',async({page})=>{
  for(const [route,value] of [['/submit/','Music submission'],['/collaborate/','Collaboration']]) {
    await page.goto(route);
    await expect(page.locator('select[name="purpose"]')).toHaveValue(value);
  }
});
if(key==='artist')test('upcoming durations are labelled Unreleased',async({page})=>{
  await page.goto('/music/');
  await page.getByRole('button',{name:'Tracks',exact:true}).click();
  await page.getByRole('button',{name:'Upcoming',exact:true}).click();
  await expect(page.locator('.music-track-directory__duration')).toHaveText(Array(8).fill('Unreleased'));
  await expect(page.locator('[data-music-context] details')).toHaveCount(0);
  await expect(page.locator('.music-context__brand')).toHaveAttribute('href','https://artanrecords.com/');
  await page.goto('/music/remnant/');
  await expect(page.locator('.release-document__tracks summary span')).toHaveText(Array(8).fill('Unreleased'));
});

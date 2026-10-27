import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../../planning/browser-regression.json',import.meta.url),'utf8'));
const key=process.env.BROWSER_SITE_KEY||'records';
const site=registry[key];
if(!site)throw Error('Unknown public site');
if(key==='records')test('Studio plans reuse the partnership details dialog without activating a paid offer',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.goto('/studio-plans/');
 await expect(page.getByRole('heading',{name:'Studio Plans',exact:true})).toBeVisible();
 for(const price of ['€9.99 / month','€19.99 / month'])await expect(page.getByText(price,{exact:true})).toBeVisible();
 await expect(page.getByText('€99 / year',{exact:true})).toBeHidden();
 await page.getByRole('tab',{name:'Annual',exact:true}).click();
 for(const price of ['€99 / year','€199 / year'])await expect(page.getByText(price,{exact:true})).toBeVisible();
 await expect(page.getByText('€9.99 / month',{exact:true})).toBeHidden();
 await page.getByRole('tab',{name:'Monthly',exact:true}).click();
 await page.locator('[data-partnership-detail]').first().click();
 const dialog=page.locator('[data-partnership-dialog]');await expect(dialog).toBeVisible();
 await expect(dialog).toContainText('does not start a subscription or charge');
 await expect(dialog.getByRole('heading')).toContainText('Studio');
 await dialog.getByRole('button',{name:'Close plan details',exact:true}).click();await expect(dialog).toBeHidden();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
if(key==='records')test('public website and store guidance separates current features from planned services',async({page})=>{
 await page.goto('/artist-websites/');
 await expect(page.getByRole('heading',{name:'Your artist website and store',exact:true})).toBeVisible();
 await expect(page.locator('#availability')).toContainText('not yet available');
 await expect(page.locator('#one-store')).toContainText('artanrecords.com/{username}/shop/');
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.goto('/for-artists/');
 await expect(page.getByRole('link',{name:'Your artist website and store',exact:true})).toHaveAttribute('href',/artist-websites/);
});
test.beforeEach(async({page})=>{if(key==='records'){await page.route('**/rest/v1/studio_public_artist_content*',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));await page.route('**/rest/v1/studio_public_artist_portfolio*',route=>route.fulfill({json:[]}));}});
if(key==='records')test('artist portfolio shows only published gallery and project snapshots',async({page})=>{
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({json:[{username:'artandavoodi',fields:{artist_name:'Portfolio artist'}}]}));await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({json:[]}));
 await page.route('**/rest/v1/studio_public_artist_portfolio*',route=>route.fulfill({json:[{id:'98100000-0000-0000-0000-000000000011',kind:'gallery',details:{title:'Selected portrait',collection:'Portraits',description:'Published image caption',credits:'Photographer credit'}},{id:'98100000-0000-0000-0000-000000000012',kind:'project',details:{title:'Piano project',description:'Published project story',project_url:'https://example.test/project'}}]}));
 await page.goto('/artandavoodi/');await expect(page.locator('[data-artist-portfolio=gallery]')).toContainText('Selected portrait');await expect(page.locator('[data-artist-portfolio=project]')).toContainText('Piano project');await expect(page.locator('[data-artist-portfolio=project] a')).toHaveAttribute('href','https://example.test/project');
});
if(key==='records')test('legacy artist addresses redirect to the root-level canonical profile',async({page})=>{
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({json:[{username:'artandavoodi',fields:{artist_name:'Test artist'}}]}));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({json:[]}));
 for(const path of ['/artists/artandavoodi/','/artists/artan-davoodi/']){
  await page.goto(path);await expect(page).toHaveURL(/\/artandavoodi\/$/);
  await expect(page.locator('[data-artist-name]')).toHaveText('Test artist');
 }
});
if(key==='records')test('missing usernames and invalid paths use the shared not-found graphic',async({page})=>{
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({json:[]}));
 for(const path of ['/missingartist/','/invalid/path/','/artandavoodi/']){
  await page.goto(path);await expect(page.getByRole('heading',{name:'This page does not exist.',exact:true})).toBeVisible();
  await expect(page.locator('[data-404-hero-shader-canvas]')).toBeAttached();
  await expect(page.locator('meta[name=robots]')).toHaveAttribute('content','noindex,follow');
  await expect(page.getByRole('link',{name:'Home',exact:true})).toBeVisible();
  expect(await page.locator('body').evaluate(el=>el.scrollWidth<=innerWidth)).toBe(true);
 }
});
if(key==='records')test('artist-owned menus and footers replace company navigation without injecting markup',async({page})=>{
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({json:[{username:'newartist',fields:{artist_name:'New artist',biography:'A public biography.'}}]}));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({json:[]}));
 await page.route('**/rest/v1/studio_public_artist_navigation*',route=>route.fulfill({json:[{menu:[{label:'My music',url:'https://example.test/music'},{label:'Unsafe',url:'javascript:alert(1)'}],footer:[{label:'Contact artist',url:'https://example.test/contact'}],footer_text:'Artist-owned footer'}]}));
 await page.goto('/newartist/');await expect(page.locator('.site-menu__links a')).toHaveCount(1);await expect(page.locator('.site-menu__links a')).toHaveText('My music');await expect(page.locator('.site-footer')).toContainText('Artist-owned footer');await expect(page.locator('.site-footer a')).toHaveAttribute('href','https://example.test/contact');
});
if(key==='records')test('new approved public usernames render at root without a query string',async({page})=>{
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({json:[{username:'newartist',fields:{artist_name:'New artist',biography:'A public biography.'}}]}));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({json:[]}));
 await page.goto('/newartist/');await expect(page.locator('[data-artist-name]')).toHaveText('New artist');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',/\/newartist\/$/);
 await expect(page.locator('[data-404-title]')).toHaveCount(0);expect(new URL(page.url()).search).toBe('');
});
if(key==='records')test('shared primary colours tint destinations and withdraw cleanly',async({page})=>{
 let shared=true;
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({json:[]}));
 await page.route('**/storage/v1/object/authenticated/studio-headers/**',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')}));
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({json:[{username:'artandavoodi',updated_at:new Date().toISOString(),fields:{artist_name:'Test artist',header_path:'96000000-0000-0000-0000-000000000001/header',spotify:'https://open.spotify.com/artist/test',instagram:'https://instagram.com/test',website:'https://example.test',...(shared?{palette:['#123456','#654321','#abcdef','#112233','#445566']}: {})}}]}));
 await page.goto('/artandavoodi/');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',/\/artandavoodi\/$/);
 const root=page.locator('[data-public-artist]'),icon=root.locator('[data-artist-group=streaming] .artist-colour-icon');
 await expect(icon).toHaveCSS('background-color','rgb(18, 52, 86)');
 expect(await root.evaluate(el=>el.style.getPropertyValue('--artist-primary-2'))).toBe('#654321');
 expect(await root.evaluate(el=>el.style.getPropertyValue('--artist-primary-5'))).toBe('#445566');
 await expect.poll(()=>root.locator('[data-artist-header]').evaluate(el=>getComputedStyle(el,'::after').backgroundImage)).toContain('rgb(101, 67, 33)');
 await expect(root.locator('[data-artist-group=social] .artist-colour-icon')).toHaveCSS('background-color','rgb(18, 52, 86)');
 const navigation=page.locator('[data-fragment=navigation]');
 if(test.info().project.name.endsWith('desktop')){
  await page.locator('.artist-connections').evaluate(el=>el.scrollIntoView());
  await expect(navigation.locator('.artist-destination-tabs[data-in-header]')).toBeVisible();
  await expect(navigation).toHaveCSS('background-color','rgb(101, 67, 33)');
 }
 shared=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(root.locator('.artist-colour-icon')).toHaveCount(0);
 await expect(root.locator('[data-artist-group=streaming] img')).toHaveCount(1);
 expect(await root.evaluate(el=>el.style.getPropertyValue('--artist-primary-2'))).toBe('');
 expect(await navigation.evaluate(el=>el.style.getPropertyValue('--artist-header-ribbon'))).toBe('');
 expect(await root.locator('[data-artist-header]').evaluate(el=>getComputedStyle(el,'::after').backgroundImage)).not.toContain('rgb(101, 67, 33)');
 shared=true;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));
 await expect(icon).toHaveCSS('background-color','rgb(18, 52, 86)');
});
if(key==='records')test('artist readiness waits for media and desktop wheel scrolling centers destination content',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{username:'artandavoodi',updated_at:'2026-10-24T12:00:00Z',fields:{artist_name:'Test artist',biography:'An artist story.',palette:['#123456','#000000'],spotify:'https://open.spotify.com/artist/test',instagram:'https://instagram.com/test',website:'https://example.test',header_path:'96000000-0000-0000-0000-000000000001/header'}}])}));
 let releaseHeader;const headerReady=new Promise(resolve=>releaseHeader=resolve);
 await page.route('**/storage/v1/object/authenticated/studio-headers/**',async route=>{await headerReady;await route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')});});
 await page.goto('/artandavoodi/');await expect(page.getByRole('status',{name:'Loading Artanrecords'})).toBeVisible();await expect(page.locator('main')).toHaveJSProperty('inert',true);
 releaseHeader();await expect(page.getByRole('status',{name:'Loading Artanrecords'})).toBeHidden();await expect(page.locator('main')).toHaveJSProperty('inert',false);
 await expect(page.locator('[data-artist-palette]')).toHaveCount(0);
 const desktop=test.info().project.name.endsWith('desktop');await expect(page.locator('html')).toHaveCSS('scroll-snap-type',desktop?'y mandatory':'none');
 if(!desktop){await expect(page.locator('.artist-destination-tabs')).toBeVisible();return;}
 const intro=await page.locator('.artist-biography').boundingBox();await page.mouse.wheel(0,Math.ceil(intro.height*0.7));
 await expect.poll(()=>page.locator('.artist-connections').evaluate(el=>Math.abs(el.getBoundingClientRect().top-document.querySelector('.label-navigation').getBoundingClientRect().height))).toBeLessThan(2);
 await expect(page.locator('.label-navigation .artist-destination-tabs')).toBeVisible();
 const tabs=page.locator('.label-navigation .artist-destination-tabs');
 await page.evaluate(()=>dispatchEvent(new WheelEvent('wheel',{deltaY:12})));
 await expect(tabs).not.toHaveAttribute('data-leaving','');
 const panel=page.locator('[data-artist-group=streaming]');expect(await panel.evaluate(el=>{const rect=el.getBoundingClientRect(),header=document.querySelector('.label-navigation').getBoundingClientRect().height;return Math.abs(rect.top+rect.height/2-(innerHeight+header)/2);})).toBeLessThan(4);
 const label=panel.locator('.hub__tooltip');await page.mouse.move(0,0);await expect(label).toHaveCSS('opacity','0');await panel.getByRole('link',{name:'Spotify'}).hover();await expect(label).toHaveCSS('opacity','1');
 await expect(page.locator('[data-artist-directory]')).toHaveJSProperty('inert',true);
 await page.locator('[data-artist-archive]').evaluate(el=>el.scrollIntoView());await expect(page.locator('html')).toHaveCSS('scroll-snap-type','none');await expect(page.locator('[data-artist-archive]')).toHaveCSS('scroll-snap-align','none');
 const before=await page.evaluate(()=>scrollY);await page.mouse.wheel(0,83);await expect.poll(()=>page.evaluate(()=>scrollY)).toBeGreaterThan(before+70);const natural=await page.evaluate(()=>scrollY);await page.waitForTimeout(350);expect(Math.abs(await page.evaluate(()=>scrollY)-natural)).toBeLessThan(2);
 await page.locator('.artist-connections').evaluate(el=>el.scrollIntoView());await expect(page.locator('html')).toHaveCSS('scroll-snap-type','y mandatory');
 if(test.info().project.name==='chromium-desktop')await page.screenshot({path:'/tmp/artist-catalogue-centered.png'});
});
if(key==='records')test('embedded artist header artwork starts at the preview edge without section snapping',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{username:'artandavoodi',fields:{artist_name:'Test artist',header_path:'96000000-0000-0000-0000-000000000001/header',spotify:'https://open.spotify.com/artist/test'}}])}));
 await page.route('**/storage/v1/object/authenticated/studio-headers/**',route=>route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')}));
 await page.goto('/');
 await page.evaluate(()=>{const frame=document.createElement('iframe');frame.title='Artist preview test';frame.src='/artandavoodi/?editor-preview=1';frame.style.cssText='position:fixed;inset:0;width:100%;height:100%;border:0';document.body.replaceChildren(frame);});
 const frame=page.frameLocator('iframe');
 await expect(frame.locator('[data-public-artist]')).toHaveAttribute('data-artist-editor-preview','');
 await expect(frame.locator('[data-artist-header] img')).toBeVisible();
 const gap=()=>frame.locator('[data-artist-header]').evaluate(el=>Math.abs(el.getBoundingClientRect().top));
 await expect.poll(gap).toBeLessThan(1);
 await expect(frame.locator('[data-public-artist]')).not.toHaveAttribute('data-artist-section-mode','desktop');
 const viewport=page.viewportSize();await page.setViewportSize({width:viewport.width-100,height:viewport.height});
 await expect.poll(gap).toBeLessThan(1);
});
if(key==='records')test('selected artist media refreshes and desktop link labels remain hover-only',async({page})=>{
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 const portrait='96000000-0000-0000-0000-000000000001/avatar';let published=true,version=1,shared=true,downloads=0;
 await page.route('https://hahtbepdrjkjluhespbs.supabase.co/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(published?[{username:'artandavoodi',updated_at:'2026-10-23T10:00:0'+version+'Z',fields:{artist_name:'Test artist',biography:'Saved biography '+version,spotify:'https://open.spotify.com/artist/test',...(shared?{portrait_path:portrait,header_path:portrait.replace('/avatar','/header')}:{})}}]:[])}));
 await page.route('**/storage/v1/object/authenticated/studio-headers/**',route=>route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')}));
 await page.route('**/storage/v1/object/authenticated/studio-avatars/**',route=>{downloads++;return route.fulfill({status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')});});
 await page.goto('/artandavoodi/');
 const image=page.locator('[data-artist-portrait] img');await expect(image).toBeVisible();await expect.poll(()=>image.evaluate(el=>el.naturalWidth)).toBe(1);expect(downloads).toBe(1);
 await expect(page.locator('[data-artist-header] img')).toBeVisible();await expect(page.locator('[data-artist-header]')).toHaveCSS('position','absolute');
 if(test.info().project.name.endsWith('desktop')){
  expect(Math.abs((await page.locator('[data-artist-header]').boundingBox()).y)).toBeLessThanOrEqual(1);
  await expect(page.locator('.artist-destination-tabs')).toBeHidden();
  await page.locator('.artist-connections').evaluate(el=>el.scrollIntoView());
  await expect(page.locator('.label-navigation .artist-destination-tabs')).toBeVisible();
  await expect(page.locator('.label-header-logo')).toBeHidden();
  await page.locator('.artist-latest-release').evaluate(el=>el.scrollIntoView());
  await expect(page.locator('.artist-destination-tabs')).toBeHidden();
 }
 const link=page.locator('[data-artist-links] a[aria-label="Spotify"]'),label=link.locator('.hub__tooltip');
 await expect(label).toHaveCSS('opacity',test.info().project.name.endsWith('desktop')?'0':'1');await expect(page.locator('.artist-destination-tabs')).toHaveCSS('border-bottom-width','0px');
 version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-artist-fields]')).toContainText('Saved biography 2');expect(downloads).toBe(2);
 shared=false;version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(image).toHaveCount(0);await expect(page.locator('[data-artist-fields]')).toContainText('Saved biography 3');
 published=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-public-artist]')).toBeHidden();await expect(page.locator('[data-404-title]')).toHaveText('This page does not exist.');
});
if(key==='records')test('shared artist logo replaces only catalogue header imagery and restores company identity on withdrawal',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 const path='96000000-0000-0000-0000-000000000001/logo';let shared=false,published=true,version=1,fail=false,downloads=0,releaseImage;
 const ready=new Promise(resolve=>releaseImage=resolve);
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(published?[{username:'artandavoodi',updated_at:'2026-10-24T12:00:0'+version+'Z',fields:{artist_name:'Test artist',biography:'Artist biography.',spotify:'https://open.spotify.com/artist/test',...(shared?{logo_path:path}:{})}}]:[])}));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:'[]'}));
 await page.route('**/storage/v1/object/authenticated/studio-logos/**',async route=>{downloads++;await ready;await route.fulfill(fail?{status:404,contentType:'application/json',body:'{}'}:{status:200,contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=','base64')});});
 await page.goto('/artandavoodi/');await expect(page.locator('html')).not.toHaveAttribute('data-page-loading');
 const header=page.locator('.label-header-logo'),company=header.locator('.label-wordmark');await expect(company).toHaveCount(2);const height=await page.locator('.label-navigation').evaluate(el=>el.getBoundingClientRect().height),motion=await header.evaluate(el=>getComputedStyle(el).transitionDuration);
 shared=true;version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>downloads).toBe(1);await expect(company).toHaveCount(2);releaseImage();
 await expect(header).toHaveAttribute('data-artist-logo','');await expect(header.locator('img')).toHaveCount(1);await expect(company).toHaveCount(0);await expect(header).toHaveAttribute('href','/');await expect(header).toHaveAttribute('aria-label','Test artist · Artanrecords');await expect(page.locator('main [data-artist-logo]')).toHaveCount(0);expect(await header.evaluate(el=>getComputedStyle(el).transitionDuration)).toBe(motion);expect(Math.abs(await page.locator('.label-navigation').evaluate(el=>el.getBoundingClientRect().height)-height)).toBeLessThanOrEqual(1);
 if(test.info().project.name.endsWith('desktop')){await page.locator('.artist-connections').evaluate(el=>el.scrollIntoView());await expect(header).toBeHidden();await expect(page.locator('.label-navigation .artist-destination-tabs')).toBeVisible();await page.evaluate(()=>window.scrollTo(0,0));await expect(header).toBeVisible();await expect(header).toHaveCSS('opacity','1');await expect(header).toHaveAttribute('data-artist-logo','');}
 shared=false;version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(company).toHaveCount(2);await expect(header).not.toHaveAttribute('data-artist-logo');await expect(header).toHaveAttribute('aria-label','Artanrecords');expect(downloads).toBe(1);
 shared=true;fail=true;version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect.poll(()=>downloads).toBe(2);await expect(company).toHaveCount(2);await expect(header).not.toHaveAttribute('data-artist-logo');
 fail=false;version++;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(header).toHaveAttribute('data-artist-logo','');published=false;await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.locator('[data-public-artist]')).toBeHidden();await expect(company).toHaveCount(2);
 await page.goto('/about/');await expect(page.locator('.label-header-logo .label-wordmark')).toHaveCount(2);await expect(page.locator('[data-artist-logo]')).toHaveCount(0);
});
if(key==='records')test('artist concerts show event-local time and suppress tickets for cancelled shows',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('**/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{username:'artandavoodi',updated_at:'2026-10-23T12:00:00Z',fields:{artist_name:'Test artist',biography:'A saved story.',website:'https://example.test',spotify:'https://open.spotify.com/artist/test'}}])}));
 await page.route('**/rest/v1/studio_public_concerts*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{id:'test-event',title:'Piano night',starts_at:'2027-01-01T19:00:00Z',timezone:'Europe/Berlin',venue:'Concert hall',city:'Berlin',country:'DE',status:'published',ticket_url:'https://tickets.example/show',ticket_price:20,currency:'EUR',announcement:'An acoustic evening.'},{id:'cancelled-event',title:'Cancelled show',starts_at:'2027-02-01T19:00:00Z',timezone:'Europe/Berlin',venue:'Concert hall',city:'Berlin',country:'DE',status:'cancelled',ticket_url:'https://tickets.example/cancelled',ticket_price:20,currency:'EUR'}])}));
 await page.goto('/artandavoodi/');await expect(page.locator('[data-public-artist]')).toHaveAttribute('data-artist-section-mode',/desktop|natural/);await page.locator('.artist-connections').evaluate(el=>el.scrollIntoView());
 const live=page.getByRole('tab',{name:'Live',exact:true});await expect(live).toBeVisible();
 if(test.info().project.name.endsWith('desktop')){const box=await live.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);}else await live.click();
 const concerts=page.locator('[data-artist-concerts]');await expect(concerts.getByRole('heading',{name:'Piano night'})).toBeVisible();await expect(concerts).toContainText('Europe/Berlin');await expect(concerts.getByRole('link',{name:'Tickets & details'})).toHaveCount(1);await expect(concerts).toContainText('Cancelled');
 const explore=page.getByRole('tab',{name:'Explore',exact:true});await expect(explore).toBeVisible();
 if(test.info().project.name.endsWith('desktop')){const box=await explore.boundingBox();await page.mouse.click(box.x+box.width/2,box.y+box.height/2);}else await explore.click();
 await expect(concerts).toBeHidden();await expect(page.getByRole('link',{name:'Website',exact:true})).toBeVisible();
 await page.evaluate(()=>window.dispatchEvent(new Event('focus')));await expect(page.getByRole('tab',{name:'Explore',exact:true})).toHaveAttribute('aria-selected','true');await expect(concerts).toBeHidden();
 await expect(page.locator('.artist-destination-tabs')).toContainText('Listen');await expect(page.locator('.artist-destination-tabs')).toContainText('Explore');
});
if(key==='records')test('approved artist snapshot replaces only artist-selected public fields',async({page})=>{
 await page.route('https://hahtbepdrjkjluhespbs.supabase.co/rest/v1/studio_artist_pages*',route=>route.fulfill({status:200,contentType:'application/json',body:JSON.stringify([{username:'artandavoodi',fields:{artist_name:'Artan Davoodi',biography:'Approved Studio biography',spotify:'https://open.spotify.com/artist/test'}}])}));
 await page.goto('/artandavoodi/');
 await expect(page.locator('[data-artist-fields]')).toContainText('Approved Studio biography');
 await expect(page.locator('[data-artist-links] a')).toHaveCount(1);
 await expect(page.locator('[data-artist-links] a')).toHaveAttribute('href','https://open.spotify.com/artist/test');
 await expect(page.locator('link[rel=canonical]')).toHaveAttribute('href',/\/artandavoodi\/$/);
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
  const comparison=readFileSync(new URL('../../docs/partnerships/index.html',import.meta.url),'utf8');
  await expect(page.locator('[data-partnership-detail]')).toHaveCount([...comparison.matchAll(/data-partnership-detail="/g)].length);
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

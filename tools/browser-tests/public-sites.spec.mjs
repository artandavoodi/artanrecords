import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../../planning/browser-regression.json',import.meta.url),'utf8'));
const key=process.env.BROWSER_SITE_KEY||'records';
const site=registry[key];
if(!site)throw Error('Unknown public site');
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
    },{key:site.themeKey,theme,records:key==='records'});
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

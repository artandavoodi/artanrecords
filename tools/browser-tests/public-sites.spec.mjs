import {test,expect} from '@playwright/test';
import {readFileSync} from 'node:fs';
const registry=JSON.parse(readFileSync(new URL('../../planning/browser-regression.json',import.meta.url),'utf8'));
const key=process.env.BROWSER_SITE_KEY||'records';
const site=registry[key];
if(!site)throw Error('Unknown public site');
for(const theme of ['light','dark'])test.describe(theme,()=>{
  test.beforeEach(async({page})=>{
    await page.addInitScript(({key,theme})=>localStorage.setItem(key,theme),{key:site.themeKey,theme});
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
  await page.goto('/music/remnant/');
  await expect(page.locator('.release-document__tracks summary span')).toHaveText(Array(8).fill('Unreleased'));
});

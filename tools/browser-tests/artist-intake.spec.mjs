import {test,expect} from '@playwright/test';
test('public intake keeps manual entry, optional artist discovery and readable review guidance',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('https://www.google.com/recaptcha/**',route=>route.abort());
 let searchPayload;await page.route('https://i.scdn.co/image/fixture',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8S8AAAAASUVORK5CYII=','base64')}));
 await page.route('**/functions/v1/artist-discovery',route=>{searchPayload=route.request().postDataJSON();return route.fulfill({json:{artists:[{provider:'apple',id:'123',name:'Fixture Artist',url:'https://music.apple.com/us/artist/fixture/123',image:null},{provider:'spotify',id:'7zUiATkwf1InOGR2J1NG7t',name:'Fixture Artist',url:'https://open.spotify.com/artist/7zUiATkwf1InOGR2J1NG7t',image:'https://i.scdn.co/image/fixture'}]}});});
 await page.goto('/submit/#artist-conversation');const form=page.locator('[data-enquiry] form');if(!await form.isVisible())await page.locator('[data-enquiry] > summary').click();
 await expect(form.locator('[type=submit]')).toHaveText('Submit');await expect(form.getByText('Prefer email?',{exact:true})).toHaveCount(0);
 await form.locator('[name=artist]').fill('A new artist');await form.locator('[data-artist-query]').fill('Fixture');await form.locator('[data-artist-search]').click();
 expect(await form.locator('[data-artist-provider]').count()).toBe(0);await expect(form.getByRole('link',{name:'Fixture Artist',exact:true})).toHaveCount(2);expect(searchPayload).toEqual({provider:'all',query:'Fixture'});await expect(form.locator('[data-artist-results] .artist-discovery__portrait')).toBeVisible();await form.getByRole('button',{name:'Select Fixture Artist on apple'}).click();
 const selected=JSON.parse(await form.locator('[name=streaming_profiles]').inputValue());expect(selected).toEqual([{provider:'apple',id:'123',name:'Fixture Artist',url:'https://music.apple.com/us/artist/fixture/123'}]);
 await expect(form.locator('[name=artist]')).toHaveValue('A new artist');await expect(form.locator('[data-artist-status]')).toContainText('listening reference');
 await form.locator('.artist-enquiry__review > summary').click();await expect(form.getByText(/We aim to respond within 14 working days/)).toBeVisible();
 expect(await page.locator('body').evaluate(node=>node.scrollWidth<=innerWidth)).toBe(true);
});

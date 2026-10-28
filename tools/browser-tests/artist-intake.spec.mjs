import {test,expect} from '@playwright/test';
test('public intake keeps manual entry, optional artist discovery and readable review guidance',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('https://www.google.com/recaptcha/**',route=>route.abort());
 let searchPayload;await page.route('https://i.scdn.co/image/fixture',route=>route.fulfill({contentType:'image/png',body:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a8S8AAAAASUVORK5CYII=','base64')}));
 await page.route('**/functions/v1/artist-discovery',route=>{searchPayload=route.request().postDataJSON();return route.fulfill({json:{artists:[{provider:'apple',id:'123',name:'Fixture Artist',url:'https://music.apple.com/us/artist/fixture/123',image:null},{provider:'spotify',id:'7zUiATkwf1InOGR2J1NG7t',name:'Fixture Artist',url:'https://open.spotify.com/artist/7zUiATkwf1InOGR2J1NG7t',image:'https://i.scdn.co/image/fixture'}]}});});
 await page.goto('/submit/#artist-conversation');const form=page.locator('[data-enquiry] form');if(!await form.isVisible())await page.locator('[data-enquiry] > summary').click();
 await expect(form.locator('[type=submit]')).toHaveText('Submit');await expect(form.getByText('Prefer email?',{exact:true})).toHaveCount(0);
 await expect(form.getByRole('button',{name:'Search artists',exact:true})).toHaveText('');
 await form.locator('[data-artist-query]').fill('Clear me');await expect(form.locator('[data-artist-clear] .global-close-button__line')).toHaveCount(2);await form.getByRole('button',{name:'Clear artist search'}).click();await expect(form.locator('[data-artist-query]')).toHaveValue('');await expect(form.locator('[data-artist-clear]')).toBeHidden();
 await form.locator('[name=artist]').fill('A new artist');await form.locator('[data-artist-query]').fill('Fixture');await form.locator('[data-artist-search]').click();
 expect(await form.locator('[data-artist-provider]').count()).toBe(0);await expect(form.getByRole('link',{name:'Fixture Artist',exact:true})).toHaveCount(2);expect(searchPayload).toEqual({provider:'all',query:'Fixture'});await expect(form.locator('[data-artist-results] .artist-discovery__portrait')).toBeVisible();await form.getByRole('button',{name:'Select Fixture Artist on apple'}).click();
 const selected=JSON.parse(await form.locator('[name=streaming_profiles]').inputValue());expect(selected).toEqual([{provider:'apple',id:'123',name:'Fixture Artist',url:'https://music.apple.com/us/artist/fixture/123'}]);
 await expect(form.locator('[data-artist-query]')).toHaveValue('');await expect(form.locator('[data-artist-results]')).toBeEmpty();await expect(form.locator('[data-artist-clear]')).toBeHidden();
 await form.locator('[data-artist-query]').fill('Fixture');await form.locator('[data-artist-search]').click();await form.getByRole('button',{name:'Select Fixture Artist on spotify'}).click();await expect(form.locator('[data-artist-selected] article')).toHaveCount(1);expect(JSON.parse(await form.locator('[name=streaming_profiles]').inputValue())[0].provider).toBe('spotify');
 await expect(form.locator('[name=artist]')).toHaveValue('A new artist');await expect(form.locator('[data-artist-status]')).toContainText('listening reference');
 await form.locator('.artist-enquiry__review > summary').click();await expect(form.getByText(/We aim to respond within 14 working days/)).toBeVisible();
 expect(await page.locator('body').evaluate(node=>node.scrollWidth<=innerWidth)).toBe(true);
});
for(const accepted of [true,false])test('submission stays on Artanrecords and '+(accepted?'shows only a verified receipt':'preserves fields when the server rejects it'),async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('artanrecords-preferences',JSON.stringify({choice:'allow',version:1,expires:Date.now()+86400000})));
 await page.route('https://www.google.com/recaptcha/api.js*',route=>route.fulfill({contentType:'application/javascript',body:'window.grecaptcha={render:(node,options)=>{const input=document.createElement("input");input.type="hidden";input.name="g-recaptcha-response";input.value="fixture-token-not-real";node.append(input);options.callback();},reset:()=>{}};window.artanEnquiryCaptchaReady();'}));
 let received;
 await page.route('**/functions/v1/enquiry-submit',route=>{received=route.request().postDataJSON();return route.fulfill({status:accepted?200:400,json:{accepted,reference:accepted?'98700000-0000-4000-8000-000000000003':null}});});
 await page.goto('/submit/#artist-conversation');const form=page.locator('[data-enquiry] form');if(!await form.isVisible())await page.locator('[data-enquiry] > summary').click();
 for(const [name,value] of Object.entries({name:'Test artist',artist:'Test artist',email:'qa@example.invalid',message:'Integration fixture only'}))await form.locator('[name='+name+']').fill(value);
 await form.locator('[name=processing_acknowledgement]').check();await form.getByRole('button',{name:'Submit',exact:true}).click();
 expect(received.artist).toBe('Test artist');expect(received['g-recaptcha-response']).toBe('fixture-token-not-real');await expect(page).toHaveURL(/\/submit\/#artist-conversation$/);
 if(accepted){await expect(page.locator('[data-enquiry-receipt]')).toContainText('Your submission has been received');await expect(form).toBeHidden();}
 else{await expect(page.locator('[data-enquiry-receipt]')).toHaveCount(0);await expect(form.locator('[name=message]')).toHaveValue('Integration fixture only');await expect(form.locator('[data-enquiry-status]')).toContainText('not accepted');}
});

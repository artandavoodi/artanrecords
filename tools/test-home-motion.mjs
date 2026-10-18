import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
// Optional storage remains disabled until a valid, unexpired Allow choice.
const startup=await readFile(new URL('../docs/assets/js/core/startup.js',import.meta.url),'utf8');
for(const choice of [null,{choice:'allow',version:1},{choice:'allow',version:1,expires:0},{choice:'skip',version:1,expires:Date.now()+86400000},{choice:'allow',version:1,expires:Date.now()+86400000}]){
  const values=new Map([['choice',JSON.stringify(choice)],['theme','dark']]);
  const root={dataset:{}};
  const window={ArtanRecordsPreferenceConfig:{choiceKey:'choice',themeKey:'theme',version:1,validDays:180},addEventListener(){}};
  vm.runInNewContext(startup,{document:{documentElement:root},window,localStorage:{getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)}});
  assert.equal(root.dataset.themeEffective,choice?.choice==='allow'&&Number.isFinite(choice.expires)&&choice.expires>Date.now()?'dark':'light');
  window.ArtanRecordsPreferences.choose('skip');
  assert.equal(values.has('theme'),false);
  window.ArtanRecordsPreferences.saveTheme('dark');
  assert.equal(values.has('theme'),false);
  window.ArtanRecordsPreferences.choose('allow');
  window.ArtanRecordsPreferences.saveTheme('dark');
  assert.equal(values.get('theme'),'dark');
}
const source=await readFile(new URL('../docs/assets/js/layers/site/home-introduction.js',import.meta.url),'utf8');
let observed=0,callback,progress;
const attributes=new Set();
const hero={
  getBoundingClientRect(){return {top:-300,height:800};},
  style:{setProperty(name,value){progress=Number(value);}},
  toggleAttribute(name,on){if(on)attributes.add(name);else attributes.delete(name);}
};
const home={ready:false,hasAttribute(){return this.ready;},setAttribute(){this.ready=true;},querySelector(selector){return selector==='.label-introduction'?hero:null;},querySelectorAll(){return [hero];}};
const reduced={matches:false,addEventListener(){}};
const context=vm.createContext({
  document:{querySelector(){return home;}},window:{IntersectionObserver:true},
  matchMedia(){return reduced;},addEventListener(){},requestAnimationFrame(){return 1;},
  IntersectionObserver:class {constructor(fn){callback=fn;}observe(){observed++;}}
});
vm.runInContext(source.replace(/export /g,''),context);
vm.runInContext('bindHomeIntroduction()',context);
assert.equal(progress,0.5);
assert.equal(vm.runInContext('homeScrollProgress(100,800)',context),0);
assert.equal(vm.runInContext('homeScrollProgress(-1000,800)',context),1);
assert.equal(vm.runInContext('homeTailIsFree(700,800)',context),false);
assert.equal(vm.runInContext('homeTailIsFree(600,800)',context),true);
assert.equal(vm.runInContext('homeTailIsFree(700,800,true)',context),true);
assert.equal(vm.runInContext('homeTailIsFree(801,800,true)',context),false);
assert.equal(vm.runInContext('phraseFrame(["artists","recordings"],0,{hold:2200,type:65,erase:35})',context),'artists');
assert.equal(vm.runInContext('phraseFrame(["artists","recordings"],2445,{hold:2200,type:65,erase:35})',context),'');
assert.equal(vm.runInContext('phraseFrame(["artists","recordings"],2510,{hold:2200,type:65,erase:35})',context),'r');
for(const on of [true,false,true]){
  callback([{target:hero,isIntersecting:on}]);
  assert.equal(attributes.has('data-home-visible'),on);
}
vm.runInContext('bindHomeIntroduction()',context);
assert.equal(observed,1);
home.ready=false;
reduced.matches=true;
vm.runInContext('bindHomeIntroduction()',context);
assert.equal(progress,0,'Reduced motion must not apply scroll-linked displacement');
console.log('PASS: homepage motion is bounded, reversible and binds once.');

const homepage=await readFile(new URL('../docs/index.html',import.meta.url),'utf8');
assert.doesNotMatch(homepage,/home-atmosphere|feGaussianBlur/,'The removed scroll-blur effect must not return');

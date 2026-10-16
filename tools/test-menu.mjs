import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';

const source=await readFile(new URL('../docs/assets/js/core/menu.js',import.meta.url),'utf8');
for(const snap of ['none','y mandatory']){
  const attributes=new Set(),events={},clicks={};
  const element={hidden:false,inert:false,offsetWidth:20,clientWidth:350,
    style:{setProperty(){}},setAttribute(){},toggleAttribute(){},
    addEventListener(name,callback){clicks[name]=callback;},
    querySelector(){return null;},querySelectorAll(){return [];},
    getBoundingClientRect(){return {height:80};}};
  const toggle={...element,addEventListener(name,callback){clicks[`toggle-${name}`]=callback;}};
  const menu={...element};
  const root={removeAttribute(name){attributes.delete(name);},setAttribute(name){attributes.add(name);},
    toggleAttribute(name,value){if(value)attributes.add(name);else attributes.delete(name);}};
  const window={scrollY:0,addEventListener(name,callback){events[name]=callback;},
    visualViewport:{addEventListener(name,callback){events[`viewport-${name}`]=callback;}}};
  const firstSection={getBoundingClientRect(){return {top:120-window.scrollY};}};
  const document={documentElement:root,body:{toggleAttribute(){}},addEventListener(){},querySelectorAll(){return [];},
    querySelector(selector){
      if(selector==='[data-menu-toggle]')return toggle;
      if(selector==='[data-menu]')return menu;
      if(selector.includes('site-navigation'))return element;
      if(selector==='main[data-fragment="home"] > section')return firstSection;
      return null;
    }};
  const context=vm.createContext({document,window,getComputedStyle(){return {scrollSnapType:snap,scrollPaddingBlockStart:'0px'};},requestAnimationFrame(callback){callback();}});
  vm.runInContext(source.replace(/export /g,''),context);
  vm.runInContext('bindMenu({openLabel:"Open",closeLabel:"Close",persistentHeader:true})',context);
  assert.equal(attributes.has('data-header-drawer'),false);
  window.scrollY=40;events.scroll();
  assert.equal(attributes.has('data-header-drawer'),snap==='none','Touch scrolling must not inherit the desktop snap offset');
  window.scrollY=200;events.scroll();
  assert.equal(attributes.has('data-header-drawer'),true);
  clicks['toggle-click']();clicks['toggle-click']();
  assert.equal(attributes.has('data-header-drawer'),true,'Closing the menu must preserve the scrolled drawer');
  window.scrollY=0;events['viewport-resize']();
  assert.equal(attributes.has('data-header-drawer'),false);
}
console.log('PASS: mobile first-scroll drawer, desktop snap offset, menu close and viewport restoration.');

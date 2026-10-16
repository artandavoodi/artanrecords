import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../docs/assets/js/layers/site/artist-journey.js',import.meta.url),'utf8');
const attributes=new Set();
let focus;
const step={
  toggleAttribute(name,enabled){if(enabled)attributes.add(name);else attributes.delete(name);},
  getBoundingClientRect(){return {top:820};},
  style:{setProperty(name,value){focus=Number(value);}}
};
let callback,observed=0,frame;
const events={};
const heroValues={};
const hero={getBoundingClientRect(){return {height:1000};},style:{setProperty(name,value){heroValues[name]=Number(value);}}};
const journey={
  ready:false,
  hasAttribute(){return this.ready;},
  setAttribute(){this.ready=true;},
  querySelectorAll(){return [step];},
  querySelector(){return hero;}
};
const context=vm.createContext({
  innerHeight:1000,
  scrollY:0,
  matchMedia(){return {matches:false,addEventListener(){}};},
  addEventListener(name,handler){events[name]=handler;},
  requestAnimationFrame(handler){frame=handler;return 1;},
  window:{IntersectionObserver:true},
  document:{querySelector(){return journey;}},
  IntersectionObserver:class {
    constructor(handler){callback=handler;}
    observe(target){assert.equal(target,step);observed++;}
  }
});
vm.runInContext(source.replace(/export /g,''),context);
vm.runInContext('bindArtistJourney()',context);
assert.equal(observed,1);
assert.equal(focus,0);
assert.equal(heroValues['--journey-hero-focus'],0);
context.scrollY=600;
events.scroll();frame();
assert.equal(heroValues['--journey-hero-focus'],1);
assert.equal(heroValues['--journey-hero-exit'],0);
context.scrollY=1000;
events.scroll();frame();
assert.equal(heroValues['--journey-hero-exit'],1);
context.scrollY=0;
events.scroll();frame();
assert.equal(heroValues['--journey-hero-focus'],0);
assert.equal(heroValues['--journey-hero-exit'],0);
assert.equal(vm.runInContext('journeyFocusProgress(820,1000)',context),0);
assert.equal(vm.runInContext('journeyFocusProgress(400,1000)',context),1);
assert.equal(vm.runInContext('journeyFocusProgress(610,1000)',context),0.5);
assert.equal(vm.runInContext('journeyFocusProgress(-100,1000)',context),1);
for(const visible of [false,true,false,true]){
  callback([{target:step,isIntersecting:visible}]);
  assert.equal(attributes.has('data-visible'),visible,'Reveals must reverse and replay');
}
vm.runInContext('bindArtistJourney()',context);
assert.equal(observed,1,'Repeated initialization must not duplicate observers');
console.log('PASS: artist step reveals reverse, replay and bind once.');

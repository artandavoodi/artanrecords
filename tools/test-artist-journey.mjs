import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
const source=await readFile(new URL('../docs/assets/js/layers/site/artist-journey.js',import.meta.url),'utf8');
const attributes=new Set();
const step={toggleAttribute(name,enabled){if(enabled)attributes.add(name);else attributes.delete(name);}};
let callback,observed=0;
const journey={
  ready:false,
  hasAttribute(){return this.ready;},
  setAttribute(){this.ready=true;},
  querySelectorAll(){return [step];}
};
const context=vm.createContext({
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
for(const visible of [false,true,false,true]){
  callback([{target:step,isIntersecting:visible}]);
  assert.equal(attributes.has('data-visible'),visible,'Reveals must reverse and replay');
}
vm.runInContext('bindArtistJourney()',context);
assert.equal(observed,1,'Repeated initialization must not duplicate observers');
console.log('PASS: artist step reveals reverse, replay and bind once.');

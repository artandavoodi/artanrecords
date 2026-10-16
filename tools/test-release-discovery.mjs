import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {discoveryCards} from './site/render.mjs';

const json=async path=>JSON.parse(await readFile(new URL(path,import.meta.url),'utf8'));
const catalogue=await json('../docs/assets/data/music/releases.json');
const artists=await json('../docs/assets/data/artists/items.json');
const icons=await json('../docs/assets/data/icons.json');
const markup=discoveryCards(catalogue.items,artists.items,icons);
for(const release of catalogue.items){
  assert.ok(markup.includes(`href="/releases/${release.id}/"`));
  assert.ok(markup.includes('class="release-card__artist"'));
  for(const link of release.links)assert.ok(markup.includes(`aria-label="${link.label}"`));
}
const page=await readFile(new URL('../docs/releases/index.html',import.meta.url),'utf8');
const header=page.slice(0,page.indexOf('<main'));
assert.doesNotMatch(header,/Submit your music/);
const home=await readFile(new URL('../docs/index.html',import.meta.url),'utf8');
assert.match(home.slice(0,home.indexOf('<main')),/Submit your music/);

const attributes=new Set(),events={},elements={query:{value:''},category:{value:''},artist:{value:''}};
const cards=catalogue.items.map(release=>({dataset:{releaseSearch:`${release.title} ${release.artist}`,releaseCategory:release.category,releaseArtist:release.artistId},removeAttribute(){},toggleAttribute(name,value){this.visible=value;}}));
const form={elements,hidden:true,addEventListener(name,callback){events[name]=callback;}};
const empty={hidden:true};
const section={hasAttribute(name){return attributes.has(name);},setAttribute(name){attributes.add(name);},querySelector(selector){return selector==='form'?form:empty;},querySelectorAll(){return cards;}};
let intersection,observed=0;
const context=vm.createContext({document:{querySelector(){return section;}},window:{IntersectionObserver:true},IntersectionObserver:class{constructor(callback){intersection=callback;}observe(){observed++;}}});
const source=await readFile(new URL('../docs/assets/js/layers/site/releases.js',import.meta.url),'utf8');
vm.runInContext(source.replace(/export /g,''),context);
vm.runInContext('bindReleaseDiscovery()',context);
assert.equal(form.hidden,false);
assert.equal(cards.filter(card=>!card.hidden).length,cards.length);
elements.query.value='dream Artan';events.input();
assert.equal(cards.filter(card=>!card.hidden).length,1);
elements.category.value='albums';events.change();
assert.equal(empty.hidden,false);
elements.query.value='';elements.category.value='';events.input();
assert.equal(empty.hidden,true);
intersection([{target:cards[0],isIntersecting:true}]);assert.equal(cards[0].visible,true);
intersection([{target:cards[0],isIntersecting:false}]);assert.equal(cards[0].visible,false);
vm.runInContext('bindReleaseDiscovery()',context);
assert.equal(observed,cards.length,'Initialization must not duplicate observers');
console.log('PASS: catalog identities, platform labels, contextual header, combined filters and reversible entrances.');

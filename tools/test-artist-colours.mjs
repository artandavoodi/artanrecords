import assert from 'node:assert/strict';
import {artistColourProperties} from '../docs/assets/js/layers/site/artist-colours.js';
const palette=['#123456','#654321','#ABCDEF'];
const legacy=artistColourProperties({palette});assert.equal(legacy['--artist-icon-colour'],palette[0]);assert.equal(legacy['--artist-header-fade'],palette[1]);assert.equal(legacy['--artist-header-ribbon'],palette[1]);
const assigned=artistColourProperties({palette,palette_assignments:{icons:2,header_fade:null,header_ribbon:0}});assert.equal(assigned['--artist-primary-1'],palette[0]);assert.equal(assigned['--artist-icon-colour'],palette[2]);assert.equal(assigned['--artist-header-fade'],null);assert.equal(assigned['--artist-header-ribbon'],palette[0]);
assert.equal(artistColourProperties({palette,palette_assignments:{logo:2}})['--artist-logo-colour'],palette[2]);
assert.equal(artistColourProperties({palette,palette_assignments:{logo:9}})['--artist-logo-colour'],null);
assert.ok(Object.values(artistColourProperties({})).every(value=>value===null));assert.equal(artistColourProperties({palette:['url(evil)']})['--artist-icon-colour'],null);
console.log('PASS: artist colour assignment, legacy defaults, invalid values and private-palette fallback.');

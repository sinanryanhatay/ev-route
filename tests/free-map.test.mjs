import test from 'node:test';
import assert from 'node:assert/strict';
import {parseCoordinates} from '../dist/free-map.mjs';
test('coordinate input preserves latitude/longitude and supports negatives',()=>{assert.deepEqual(parseCoordinates('41.2, 29.03'),{lat:41.2,lng:29.03});assert.deepEqual(parseCoordinates(' -33.86, 151.2 '),{lat:-33.86,lng:151.2});});
test('addresses, malformed and out-of-range coordinates never create pins',()=>{for(const v of ['Urla Belediyesi','91, 29','40, -181','40,29,30','NaN,29','',null])assert.equal(parseCoordinates(v),null);});

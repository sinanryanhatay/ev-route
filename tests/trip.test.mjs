import test from 'node:test';
import assert from 'node:assert/strict';
import {estimateTrip} from '../dist/trip.mjs';
import {DEFAULTS} from '../dist/engine.mjs';
const road={distance:250000,duration:10800};
test('road units and charging deficit preserve reserve target',()=>{const s={...DEFAULTS,battery:50};const t=estimateTrip(road,s);assert.equal(t.km,250);assert.equal(t.minutes,180);assert.ok(t.arrival<0);assert.ok(t.chargingNeeded>0);assert.ok(Math.abs(s.capacity*s.battery/100+t.chargingNeeded-t.energy-s.capacity*t.floor/100)<1e-9);assert.ok(t.rangeToReserve<t.rangeToEmpty);});
test('short trips need no extra charging and settings change consumption',()=>{const r={distance:10000,duration:1200};const t=estimateTrip(r,DEFAULTS);assert.equal(t.chargingNeeded,0);assert.ok(t.arrival>t.floor);assert.ok(estimateTrip(r,{...DEFAULTS,speed:140}).energy>t.energy);assert.ok(estimateTrip(r,{...DEFAULTS,luggage:300}).energy>t.energy);});
test('starting below reserve has zero reserve range, never negative range',()=>{const t=estimateTrip(road,{...DEFAULTS,battery:10});assert.equal(t.rangeToReserve,0);assert.ok(t.chargingNeeded>t.energy);});
test('invalid road data or settings do not produce metrics',()=>{assert.throws(()=>estimateTrip({distance:NaN,duration:0},DEFAULTS));assert.throws(()=>estimateTrip(road,{...DEFAULTS,capacity:0}));});
test('negative buffer and invalid occupants cannot weaken reserve calculations',()=>{
 for(const change of [{buffer:-5},{reserve:10},{people:0},{people:2.5},{luggage:-10}])assert.throws(()=>estimateTrip(road,{...DEFAULTS,...change}));
});

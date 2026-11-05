import test from 'node:test';
import assert from 'node:assert/strict';
import {formatDuration,summarizePlan} from '../dist/summary.mjs';
test('duration rounds across hour boundary without displaying 1h 60m',()=>{assert.equal(formatDuration(119.8),'2h 0m');assert.equal(formatDuration(Infinity),'Unknown');});
test('trip summary adds charging time and cost without hiding unknown durations',()=>{const p={duration:120,stops:[{minutes:30,cost:200,kwh:20},{minutes:40,cost:300,kwh:30}]};assert.deepEqual(summarizePlan(p),{charging:70,total:190,cost:500,addedEnergy:50,stopCount:2});p.stops[0].minutes=null;assert.equal(summarizePlan(p).total,null);p.stops[0].minutes=Infinity;assert.equal(summarizePlan(p).charging,null);assert.equal(summarizePlan({duration:60,stops:[]}).total,60);});

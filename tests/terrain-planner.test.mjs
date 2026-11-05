import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULTS} from '../dist/engine.mjs';
import {sampleRoad,terrainEnergy} from '../dist/terrain.mjs';
import {parseStations,eligibleStations,parsePower} from '../dist/chargers.mjs';
import {planCharging,meetsReserve} from '../dist/planner.mjs';
import {exportTrip} from '../dist/export.mjs';
const road=(km,rise=0)=>({distance:km*1000,duration:km*60,geometry:{type:'LineString',coordinates:[[29,40],[29.1,40]]},profile:[{km:0,elevation:0},{km:km/2,elevation:rise},{km,elevation:0}]});
test('terrain raises energy for a hill and checks every sample reserve',()=>{const flat=terrainEnergy(road(100),DEFAULTS),hill=terrainEnergy(road(100,1000),DEFAULTS);assert.ok(hill.energy>flat.energy);assert.equal(hill.ascent,1000);assert.equal(hill.descent,1000);assert.equal(meetsReserve({minimum:19.99},20),false);});
test('route sampling retains endpoints and road distance',()=>{const r=road(30);const samples=sampleRoad(r);assert.equal(samples[0].km,0);assert.equal(samples.at(-1).km,30);assert.ok(samples.length<=100);});
test('charger filters never assume unknown network, connector or DC power',()=>{const raw=[{type:'node',id:1,lat:40,lon:29,tags:{operator:'ZES','socket:type2_combo':'2','socket:type2_combo:output':'180 kW'}},{type:'node',id:2,lat:40,lon:29,tags:{operator:'ZES'}},{type:'node',id:3,lat:40,lon:29,tags:{operator:'Trugo',access:'private','socket:type2_combo':'2','socket:type2_combo:output':'180 kW'}}];const s=parseStations(raw);assert.equal(s.length,2);assert.equal(eligibleStations(s,DEFAULTS).length,1);assert.equal(parsePower('150000 W; 180 kW'),180);assert.equal(parsePower('unknown'),0);const u=new URL(exportTrip('A','B',s.slice(0,1)).full);assert.equal(u.searchParams.has('waypoint_place_ids'),false);});
test('actual legs are rechecked and charging jumps preserve the floor',async()=>{const a={lat:40,lng:29},b={lat:40,lng:30},c={lat:40,lng:29.1};const stations=[{osmId:'node/1',name:'Real mapped fixture',network:'ZES',location:c,ccs:true,power:100,progress:100}];let calls=0;const services={fetchStations:async()=>stations,terrainRoad:async r=>r,fetchRoad:async()=>{calls++;return road(100,100);}};const p=await planCharging(a,b,road(300),DEFAULTS,{services});assert.equal(p.stops.length,1);assert.ok(p.minimum>=25);assert.equal(p.stops[0].target,100);assert.equal(calls,2);assert.equal(p.distance,200);});
test('insufficient data or initial reserve cannot create an exportable plan',async()=>{await assert.rejects(planCharging({},{},road(300),{...DEFAULTS,battery:10}),/Starting battery/);await assert.rejects(planCharging({lat:40,lng:29},{lat:40,lng:30},road(300),DEFAULTS,{services:{fetchStations:async()=>[]}}),/none/);});

test('EPDK-derived registry preserves dated specifications without treating prices as live',async()=>{
 const {parseRegistry,eligibleStations}=await import('../dist/chargers.mjs');
 const rows=parseRegistry({guncellendi:'2026-11-05',sayfa:'https://esarjradar.com/bursa-sarj-istasyonlari/',istasyonlar:[{epdkNo:'ŞRJ/1',ad:'Test ZES',operator:'zes',enlem:40,boylam:29,gucKw:400,soketler:['CCS2'],soketSayisi:4,fiyat:{dc:1}}]});
 assert.equal(rows[0].power,400);assert.equal(rows[0].updated,'2026-11-05');assert.equal(rows[0].socketCount,4);assert.equal(rows[0].cost,undefined);assert.equal(eligibleStations(rows,{networks:['ZES'],fastOnly:true}).length,1);
});

test('city address endpoints keep original route tolerance while charger endpoints remain strict',async()=>{
 const a={lat:41.006381,lng:28.9758715},b={lat:36.8522547,lng:28.2742661},c={lat:40.8,lng:29};const requests=[];
 const services={fetchStations:async()=>[{osmId:'city-regression',name:'Reachable charger',network:'ZES',location:c,ccs:true,power:100,progress:100}],terrainRoad:async r=>r,fetchRoad:async(from,to,options)=>{requests.push(options);if(from===a&&options.startSnap<132.3)throw Error('No driving route found near these points.');return road(100);}};
 // Destination is intentionally distant; fixture leg distances need a near destination to reach the final check.
 const dest={lat:40.7,lng:29.1};const p=await planCharging(a,dest,road(300),DEFAULTS,{services});assert.equal(p.stops.length,1);assert.equal(requests[0].startSnap,1000);assert.equal(requests[0].endSnap,100);assert.equal(requests[1].startSnap,100);assert.equal(requests[1].endSnap,1000);assert.ok(p.minimum>=25);
});
test('road access failures are distinguished from a battery reserve failure',async()=>{
 const services={fetchStations:async()=>[{osmId:'bad-road',name:'Bad road',network:'ZES',location:{lat:40,lng:29.1},ccs:true,power:100,progress:100}],terrainRoad:async r=>r,fetchRoad:async()=>{throw Error('No driving route found near these points.');}};
 await assert.rejects(planCharging({lat:40,lng:29},{lat:39,lng:28},road(300),DEFAULTS,{services}),/road-access failures/);
});

test('OSRM request carries independent address and charger search radiuses',async()=>{
 const {fetchRoad}=await import('../dist/trip.mjs');const original=globalThis.fetch;const urls=[];
 globalThis.fetch=async url=>{urls.push(new URL(url));return {ok:true,json:async()=>({code:'Ok',routes:[road(1)]})};};
 try{await fetchRoad({lat:41,lng:29},{lat:40,lng:29},{maxSnap:100,startSnap:1000});await fetchRoad({lat:40,lng:29},{lat:37,lng:28},{maxSnap:100,endSnap:1000});assert.equal(urls[0].searchParams.get('radiuses'),'1000;100');assert.equal(urls[1].searchParams.get('radiuses'),'100;1000');}finally{globalThis.fetch=original;}
});

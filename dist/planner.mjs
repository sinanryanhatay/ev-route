import {fetchRoad} from './trip.mjs';
import {terrainRoad,terrainEnergy,distance} from './terrain.mjs';
import {fetchStations,eligibleStations} from './chargers.mjs';
import {chargeMinutes,consumption} from './engine.mjs';
export function meetsReserve(energy,floor){return energy.minimum>=floor-1e-8;}
export async function planCharging(origin,destination,direct,s,{signal,onStatus=()=>{},excluded=[],services={}}={}){
 const loadRoad=services.fetchRoad||fetchRoad,loadTerrain=services.terrainRoad||terrainRoad,loadStations=services.fetchStations||fetchStations;
 const floor=Math.max(20,s.reserve)+s.buffer;
 if(!Number.isFinite(floor)||floor>=100||!Number.isFinite(s.battery)||!Number.isFinite(consumption(s))||s.capacity<=0)throw Error('Check the vehicle and reserve settings.');
 if(s.networks.some(n=>!Number.isFinite(Number(s.tariffs[n]))||Number(s.tariffs[n])<=0))throw Error('Enter a positive assumed tariff for each chosen network.');
 if(s.battery<floor)throw Error(`Starting battery is below the ${floor}% planning floor. Charge before departure.`);
 let here=origin,soc=s.battery,progress=0,km=0,minutes=0,energyTotal=0,ascent=0,descent=0,checks=0;
 const stops=[],trace=[{km:0,soc}],geometry=[];let pool;
 const roadCache=new Map();
 async function getLeg(a,b){const key=[a.lat,a.lng,b.lat,b.lng].join(',');if(roadCache.has(key))return roadCache.get(key);if(++checks>24)throw Error('The bounded search could not complete a reserve-safe plan. Try more networks or a higher starting charge.');const road=await loadTerrain(await loadRoad(a,b,{signal,maxSnap:100}),{signal});roadCache.set(key,road);return road;}
 function append(road,ev){for(const p of ev.trace.slice(1))trace.push({km:km+p.km,soc:p.soc});geometry.push(...road.geometry.coordinates);km+=road.distance/1000;minutes+=road.duration/60;energyTotal+=ev.energy;ascent+=ev.ascent;descent+=ev.descent;soc=ev.arrival;}
 for(let step=0;step<=6;step++){
  signal?.throwIfAborted();onStatus(`Checking terrain and reserve for leg ${step+1}…`);
  const range=(soc-floor)/100*s.capacity/consumption(s)*100;
  const endRoad=step===0?direct:distance(here,destination)<=range*1.1?await getLeg(here,destination):null,end=endRoad?terrainEnergy(endRoad,s,soc):null;
  if(end&&meetsReserve(end,floor)){append(endRoad,end);return {stops,trace,distance:km,duration:minutes,energy:energyTotal,ascent,descent,arrival:soc,minimum:Math.min(...trace.map(p=>p.soc)),floor,geometry:{type:'LineString',coordinates:geometry},stationCount:pool?.length||0};}
  if(step===6)break;
  if(!pool){onStatus('Finding real mapped charging stations along the route…');const all=await loadStations(direct,{signal});pool=eligibleStations(all,s).filter(p=>!excluded.includes(p.osmId));if(!pool.length)throw Error(`Found ${all.length} mapped stations, but none with a selected network and the required connector/power. Try disabling fast-only or enabling more networks. Unknown specifications are not assumed.`);}
  // Forward, bounded greedy search. Each accepted leg is road-routed and terrain-checked.
  const candidates=pool.filter(p=>p.progress>progress+2&&p.progress-progress<=range*.9&&!stops.some(x=>x.osmId===p.osmId)&&distance(here,p.location)<=range*1.1).sort((a,b)=>b.progress-a.progress);
  const spread=[];for(const c of candidates){if(!spread.some(x=>Math.abs(x.progress-c.progress)<8))spread.push(c);if(spread.length===8)break;}
  let selected;
  for(const candidate of spread){onStatus(`Checking access and terrain to ${candidate.name}…`);let leg;try{leg=await getLeg(here,candidate.location);}catch(e){if(e.message.startsWith('No driving route'))continue;throw e;}const ev=terrainEnergy(leg,s,soc);if(meetsReserve(ev,floor)){selected={candidate,leg,ev};break;}}
  if(!selected)throw Error(`No reserve-safe next stop found (${pool.length} eligible stations; ${spread.length} candidate checks; estimated level-road reach ${Math.round(range)} km) after ${stops.length} selected stop(s)${stops.length?' (last: '+stops.at(-1).name+')':''}. Free coverage may be incomplete. Increase starting charge, reduce speed or allow more networks. No complete itinerary is available.`);
  const {candidate,leg,ev}=selected;append(leg,ev);const target=100,kwh=(target-soc)/100*s.capacity;
  const stop={...candidate,km,arrival:soc,target,kwh,minutes:candidate.power?chargeMinutes(soc,target,candidate.power,s,candidate.chargeKind)+5:null,cost:kwh/.92*s.tariffs[candidate.network]};stops.push(stop);soc=target;trace.push({km,soc});here=candidate.location;progress=candidate.progress;
 }
 throw Error('Trip needs more than six stops; shorten the trip into sections. No complete plan was exported.');
}

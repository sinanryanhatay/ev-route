import {consumption,payload} from './engine.mjs';
export function estimateTrip(road,s){
 if(!Number.isFinite(road.distance)||road.distance<=0||!Number.isFinite(road.duration)||road.duration<0)throw Error('The road service returned an invalid route.');
 for(const key of ['battery','reserve','buffer','capacity','speed','baseConsumption','headwind','temperature','people','personWeight','luggage'])if(!Number.isFinite(Number(s[key])))throw Error('Check your vehicle settings.');
 if(s.capacity<=0||s.battery<0||s.battery>100||s.reserve<0||s.buffer<0||s.reserve+s.buffer>=100||s.speed<60||s.speed>140||s.baseConsumption<=0||payload(s)<0||!Number.isFinite(payload(s)))throw Error('Check your battery, reserve, speed and payload settings.');
 const km=road.distance/1000,rate=consumption(s),energy=km*rate/100,available=s.capacity*s.battery/100,floor=s.reserve+s.buffer;
 const arrival=s.battery-energy/s.capacity*100;
 return {km,minutes:road.duration/60,rate,energy,arrival,floor,payload:payload(s),rangeToReserve:Math.max(0,(available-s.capacity*floor/100)/rate*100),rangeToEmpty:available/rate*100,chargingNeeded:Math.max(0,energy+s.capacity*floor/100-available)};
}
export async function fetchRoad(a,b,{signal,maxSnap=1000,startSnap=maxSnap,endSnap=maxSnap}={}){
 const coords=[a,b].map(p=>`${p.lng},${p.lat}`).join(';');
 const response=await fetch(`https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson&steps=false&radiuses=${startSnap};${endSnap}`,{signal});
 const data=await response.json(),road=data.routes?.[0];
 if(!response.ok&&!['NoSegment','NoRoute'].includes(data.code))throw Error('Road routing is temporarily unavailable. Please retry.');
 if(data.code!=='Ok'||!road?.geometry?.coordinates?.length)throw Error('No driving route found near these points. Choose points closer to a road.');
 return road;
}

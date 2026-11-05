import {sampleRoad,distance} from './terrain.mjs';
const normal=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
export function parsePower(value){const values=String(value||'').split(';').map(v=>{const m=v.trim().match(/^(\d+(?:\.\d+)?)\s*(kW|W)$/i);return m?Number(m[1])*(m[2].toLowerCase()==='w'?.001:1):0;});return Math.max(0,...values);}
export function parseStations(elements){return elements.flatMap(e=>{const t=e.tags||{},p=e.center||e;if(!Number.isFinite(p.lat)||!Number.isFinite(p.lon)||['private','no'].includes(t.access)||t['disused:amenity']||t.operational_status==='out_of_order')return [];const raw=[t.operator,t.brand,t.network,t.name].filter(Boolean).join(' '),n=normal(raw);const network=n.includes('trugo')?'Trugo':n.includes('lumicle')?'Lumicle':n.includes('astor')?'Astor':/\bzes\b|zorlu/.test(n)?'ZES':/\bwat\b|watt/.test(n)?'WAT':null;const ccs=t['socket:type2_combo']!=='0'&&(Number.parseInt(t['socket:type2_combo'])>0||parsePower(t['socket:type2_combo:output'])>0);const ac=t['socket:type2']!=='0'&&(Number.parseInt(t['socket:type2'])>0||parsePower(t['socket:type2:output'])>0);return [{osmId:`${e.type}/${e.id}`,name:t.name||t.brand||t.operator||'Mapped charging station',network,location:{lat:p.lat,lng:p.lon},ccs,ac,power:parsePower(t[ccs?'socket:type2_combo:output':'socket:type2:output']),connector:ccs?'CCS2':ac?'Type 2':'Unknown',hours:t.opening_hours||'Hours not mapped',access:t.access||'Access not mapped',source:`https://www.openstreetmap.org/${e.type}/${e.id}`}];});}
export function parseRegistry(data){return (data.istasyonlar||[]).flatMap(r=>{
 const n=normal(r.operator),network=n.includes('trugo')?'Trugo':n.includes('lumicle')?'Lumicle':n.includes('astor')?'Astor':/zes|zorlu/.test(n)?'ZES':/wat/.test(n)?'WAT':null;
 if(!Number.isFinite(r.enlem)||!Number.isFinite(r.boylam)||!r.epdkNo)return [];
 const plugs=(r.soketler||[]).map(normal),ccs=plugs.some(x=>x.includes('ccs')),ac=plugs.some(x=>/type.?2|tip.?2/.test(x));
 return [{osmId:'epdk:'+r.epdkNo,name:r.ad,network,location:{lat:r.enlem,lng:r.boylam},ccs,ac,power:Math.max(0,Number(r.gucKw)||0),connector:ccs?'CCS2':ac?'Type 2':'Unknown',socketCount:r.soketSayisi,updated:data.guncellendi,hours:'Confirm opening hours',access:'Confirm public access in operator app',source:data.sayfa||'https://esarjradar.com/veri/'}];
 });}
let cached;
export async function fetchStations(road,{signal}={}){
 const samples=sampleRoad(road,200),key=JSON.stringify(samples);
 if(cached?.key===key&&Date.now()-cached.time<900000)return cached.value;
 const index=await (await fetch('./province-bounds.json',{signal})).json();
 const provinces=index.provinces.filter(p=>samples.some(x=>x.lat>=p.bounds[0]-.2&&x.lat<=p.bounds[2]+.2&&x.lng>=p.bounds[1]-.25&&x.lng<=p.bounds[3]+.25));
 if(!provinces.length)throw Error('Station coverage is currently limited to Turkey.');
 let cursor=0;const rows=[];
 await Promise.all(Array.from({length:Math.min(3,provinces.length)},async()=>{while(cursor<provinces.length){const p=provinces[cursor++],res=await fetch(p.url,{signal});if(!res.ok)throw Error('Station service unavailable. Retry later; no incomplete itinerary is exported.');const data=await res.json();if(!Array.isArray(data.istasyonlar)||!data.guncellendi)throw Error('Station feed is incomplete.');rows.push(...parseRegistry(data));}}));
 const value=[...new Map(rows.map(r=>[r.osmId,r])).values()].map(st=>{let best=Infinity,progress=0;for(const p of samples){const d=distance(p,st.location);if(d<best){best=d;progress=p.km;}}return {...st,progress,offset:best};}).filter(st=>st.offset<9);
 cached={key,time:Date.now(),value};return value;
}
export function eligibleStations(stations,s){return stations.filter(p=>p.network&&s.networks.includes(p.network)&&(s.fastOnly?p.ccs&&p.power>=50:p.ccs||p.ac));}

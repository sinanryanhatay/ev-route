import {validateVehicle} from './vehicles.mjs';
export function catalogMatches(rows,{brand,model,year}={}){return rows.filter(r=>(!brand||r.brand===brand)&&(!model||r.model===model)&&(!year||r.year===Number(year)));}
export function catalogProfile(row){if(!row||!row.catalogId)throw Error('Select a catalogue variant.');const p={...row,id:null,name:`${row.brand} ${row.model} ${row.trim}`.slice(0,80)};validateVehicle(p);return p;}

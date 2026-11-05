"""Build the pinned, free catalogue. Usage: python3 import-vehicles.py /path/to/open-ev-data-v1.24.0.json"""
import json,sys,pathlib,math
root=pathlib.Path(__file__).parent
raw=json.loads(pathlib.Path(sys.argv[1]).read_text());rows=[]
for v in raw['vehicles']:
 if not set(v.get('markets',[])).intersection({'TR','DE','GB','FR','IT','PT','NL','ES','NO','SE'}):continue
 b=v.get('battery',{});c=v.get('charging',{});mass=v.get('weights',{}).get('curb_weight_kg');cap=b.get('pack_capacity_kwh_net');dc=c.get('dc',{}).get('max_power_kw');ac=c.get('ac',{}).get('max_power_kw');ports=[p.get('connector') for p in v.get('charge_ports',[])]
 if 'ccs2' not in ports or not all(isinstance(x,(int,float)) and math.isfinite(x) and x>0 for x in [mass,cap,dc,ac]):continue
 if not(500<=mass<=5000 and 5<=cap<=250 and dc<=500 and ac<=43):continue
 dims=v.get('dimensions',{});cd=v.get('body',{}).get('drag_coefficient_cd');width=dims.get('width_mm');height=dims.get('height_mm');area=cd*width*height/1e6*.84 if all(isinstance(x,(int,float)) and x>0 for x in [cd,width,height]) else .70
 # Reference estimate at 130 km/h, 20 C, 75 kg driver, no wind. Not WLTP consumption.
 rate=round((.5*1.225*area*(130/3.6)**2+(mass+75)*9.81*.01)/36/.90+.7/130*100,1)
 trim=' · '.join(dict.fromkeys(x for x in [v.get('trim',{}).get('name'),v.get('variant',{}).get('name'),v.get('powertrain',{}).get('drivetrain','').upper()] if x))
 rows.append(dict(catalogId=v['unique_code'],brand=v['make']['name'],model=v['model']['name'],year=v['year'],trim=trim,capacity=cap,capacityNote='Usable capacity from community dataset',curbMass=mass,maxDcPower=dc,maxAcPower=ac,dcConnector='CCS2',acConnector='Type2',baseConsumption=rate,consumptionNote='Estimated reference at 130 km/h; uses '+('listed dimensions and drag coefficient' if area!=.70 else 'assumed drag area 0.70 m²')+'. Your trip speed slider adjusts this value.',source='OpenEV Data v1.24.0 (community records)',sourceUrl='https://github.com/open-ev-data/open-ev-data-dataset/releases/tag/v1.24.0',sourceDate=raw['generated_at'][:10],markets=v.get('markets',[])))
rows.append(dict(catalogId='byd:atto3:2025:design:tr',brand='BYD',model='ATTO 3',year=2025,trim='Design · Turkey · 60.48 kWh',capacity=60.48,capacityNote='BYD lists 60.48 kWh battery capacity without a separate usable figure; used as a planning estimate.',curbMass=1750,maxDcPower=110,maxAcPower=11,dcConnector='CCS2',acConnector='Type2',baseConsumption=23,consumptionNote='23 kWh/100 km is an EV Route highway reference estimate at 130 km/h, not BYD’s 16.0 WLTP combined figure. Your trip speed slider adjusts it.',source='BYD Türkiye technical brochure, 1 July 2025',sourceUrl='https://www.bydauto.com.tr/storage/pdf/atto3-teknik-ozellikler-1-temmuz.pdf',sourceDate='2025-07-01',markets=['TR']))
rows.sort(key=lambda r:(r['brand'],r['model'],-r['year'],r['trim']))
assert len({r['catalogId'] for r in rows})==len(rows)
(root/'dist/vehicle-catalog.json').write_text(json.dumps({'version':'OpenEV v1.24.0 + BYD TR 2025','imported':'2026-11-05','vehicles':rows},ensure_ascii=False,separators=(',',':')))
print(len(rows),'variants,',len(set(r['brand'] for r in rows)),'brands')

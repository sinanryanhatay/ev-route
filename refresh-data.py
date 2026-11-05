import json,subprocess,concurrent.futures,datetime,pathlib
ROOT=pathlib.Path(__file__).resolve().parent/'dist'
def read(url):
 return json.loads(subprocess.check_output(['curl','-fsS','--max-time','40',url]))
index=read('https://esarjradar.com/api/iller.json')
def one(p):
 d=read(p['istasyonlar']);rows=d['istasyonlar'];coords=[s for s in rows if isinstance(s.get('enlem'),(int,float)) and isinstance(s.get('boylam'),(int,float))]
 return {'slug':p['slug'],'url':p['istasyonlar'],'source':d.get('sayfa'),'updated':d['guncellendi'],'bounds':[min(s['enlem'] for s in coords),min(s['boylam'] for s in coords),max(s['enlem'] for s in coords),max(s['boylam'] for s in coords)]}
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as ex: provinces=list(ex.map(one,index['iller']))
ROOT.joinpath('province-bounds.json').write_text(json.dumps({'source':'https://esarjradar.com/veri/','updated':index['guncellendi'],'provinces':provinces},ensure_ascii=False))
prices=read('https://www.sarjkac.com/api/prices');ROOT.joinpath('tariff-reference.json').write_text(json.dumps(prices,ensure_ascii=False))
print('Refreshed province search bounds:',len(provinces),'Price snapshot:',prices.get('updatedAt'))

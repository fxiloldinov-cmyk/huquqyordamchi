"""Download only the Lex.uz image URLs inventoried from the supplied source HTML."""
import pathlib,json,subprocess,hashlib,concurrent.futures,datetime
from urllib.parse import urlparse
root=pathlib.Path(__file__).resolve().parent.parent;p=root/'data/review/yhq-annex-elements.json';data=json.loads(p.read_text());out=root/'data/review/yhq-assets';out.mkdir(exist_ok=True)
def get(item):
 if item['kind']!='image' or not item.get('url'):return item
 u=urlparse(item['url'])
 if u.scheme!='https' or u.hostname!='lex.uz':return item
 target=out/(item['id']+'.image');proc=subprocess.run(['curl','--max-time','25','-sS','-o',str(target),'-w','%{http_code} %{content_type} %{url_effective}',item['url']],capture_output=True,text=True)
 item['downloadedAt']=datetime.datetime.now(datetime.timezone.utc).isoformat();item['downloadResult']=proc.stdout
 if proc.returncode==0 and proc.stdout.startswith('200 image/'):
  raw=target.read_bytes();item['assetFile']=str(target.relative_to(root));item['assetSha256']=hashlib.sha256(raw).hexdigest();item['assetBytes']=len(raw)
 else:target.unlink(missing_ok=True);item['assetFile']=None
 return item
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:data['items']=list(pool.map(get,data['items']))
p.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print('downloaded',sum(bool(x.get('assetFile')) for x in data['items']),'images; legal interpretation remains pending')

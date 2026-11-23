"""Inventory supplied HTML images/tables; do not infer sign meanings from pictures."""
import pathlib,json,hashlib,datetime
from bs4 import BeautifulSoup
from urllib.parse import urljoin,urlparse
root=pathlib.Path(__file__).resolve().parent.parent
src=root/'data/sources/yhq-172-owner.html';raw=src.read_bytes();soup=BeautifulSoup(raw,'html.parser');items=[]
for index,el in enumerate(soup.find_all(['img','table']),1):
 kind='image' if el.name=='img' else 'table';u=urljoin('https://lex.uz',el.get('src','')) if kind=='image' else None
 if u and (urlparse(u).scheme!='https' or urlparse(u).hostname!='lex.uz'):u=None
 prev=el.find_previous(['p','div']);context=prev.get_text(' ',strip=True)[-700:] if prev else ''
 items.append({'id':f'yhq-element-{index:03}','kind':kind,'sourceFile':str(src.relative_to(root)),'sourceSha256':hashlib.sha256(raw).hexdigest(),'url':u,'sourceText':el.get_text(' ',strip=True) if kind=='table' else el.get('alt') or None,'context':context,'elementSha256':hashlib.sha256(str(el).encode()).hexdigest(),'status':'pending','lawyerReview':'kutilmoqda','meaning':None,'indexedForAnswers':False})
out=root/'data/review/yhq-annex-elements.json';out.write_text(json.dumps({'generatedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'scope':'Elements present in supplied owner HTML only; complete official annex coverage is not established.','items':items},ensure_ascii=False,indent=2)+'\n')
print(len(items),'elements:',sum(x['kind']=='image' for x in items),'images;',sum(x['kind']=='table' for x in items),'tables')

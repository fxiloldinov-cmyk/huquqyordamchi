"""Compare captured official HTML with local indexed text; stage differences for review."""
import json,pathlib,subprocess,sys,hashlib,datetime,re
from bs4 import BeautifulSoup
root=pathlib.Path(__file__).resolve().parent.parent
manifest=json.loads((root/'data/laws/manifest.json').read_text())
out=root/'data/review'; candidates=out/'candidates'; candidates.mkdir(parents=True,exist_ok=True)
registry_path=root/'data/source-status.json'
registry=json.loads(registry_path.read_text())
def preserve(path,folder):
 if path.exists():
  raw=path.read_bytes();dest=out/folder/hashlib.sha256(raw).hexdigest();dest.parent.mkdir(parents=True,exist_ok=True);dest.write_bytes(raw)
rows=[]
for doc,m in manifest.items():
 local=json.loads((root/'data/laws'/m['file']).read_text()); snap=out/'snapshots'/f'{doc}.html'
 if not snap.exists():continue
 audit=registry['documents'].get(doc,{})
 snapshot_sha=hashlib.sha256(snap.read_bytes()).hexdigest()
 if audit.get('state') in ['fetch-error','http-error','identity-unverified'] or snapshot_sha!=audit.get('remoteSha256'):
  rows.append({'doc':doc,'result':'snapshot-unverified','textCompared':False,'sourceSha256':snapshot_sha,'problems':['current-fetch-not-verified']})
  print(doc,'snapshot-unverified');continue
 preserve(out/(doc+'.comparison.json'),'comparison-history/'+doc)
 candidate=candidates/pathlib.Path(m['file']).name
 preserve(candidate,'candidate-history/'+doc)
 soup=BeautifulSoup(snap.read_text(),'html.parser')
 for toolbar in soup.select('.lx_elem2'):toolbar.decompose()
 clean=out/'snapshots'/f'{doc}.clean.html';clean.write_text(str(soup))
 cmd=[sys.executable,str(root/'scripts/import_lexuz.py'),str(clean),str(candidate),'--doc',doc,'--lex-id',str(local.get('lexId') or ''),'--name',local['name']]
 if doc=='yhq':cmd+=['--start-at','Yoʻl harakati qoidalari','--end-before','Yoʻl belgilari']
 if doc=='ypx975':cmd+=['--start-at','Yoʻl-patrul xizmati xodimlarining yoʻl harakati qatnashchilari bilan oʻzaro munosabatlari hamda maxsus moslamalardan foydalanishi tartibi toʻgʻrisida']
 proc=subprocess.run(cmd,capture_output=True,text=True)
 clean.unlink(missing_ok=True)
 row={'doc':doc,'status':'pending','lawyerReview':'kutilmoqda','source':local.get('url'),'sourceSha256':hashlib.sha256(snap.read_bytes()).hexdigest(),'checkedAt':datetime.datetime.now(datetime.timezone.utc).isoformat(),'localAsOf':local.get('asOf'),'textCompared':False,'effectiveDateVerified':False}
 if proc.returncode:
  row.update(result='parser-failed',error=(proc.stderr or proc.stdout)[-1500:]); candidate.unlink(missing_ok=True)
 else:
  fresh=json.loads(candidate.read_text());o={a['art']:a for a in local['articles']};n={a['art']:a for a in fresh['articles']}
  canonical=lambda a:json.dumps({'title':a.get('title'),'parts':a['parts'],'changes':a.get('changes',[])},sort_keys=True,ensure_ascii=False)
  added=sorted(n.keys()-o.keys());removed=sorted(o.keys()-n.keys());changed=sorted(k for k in n.keys()&o.keys() if canonical(n[k])!=canonical(o[k]))
  problems=[]
  if not n:problems.append('no-articles')
  if fresh.get('kind')!=local.get('kind'):problems.append('kind-mismatch')
  match=re.search(r'muammolar: (\d+)',proc.stdout)
  if match and int(match.group(1)):problems.append('importer-warnings:'+match.group(1))
  if len(n)<.95*len(o):problems.append('article-count-drop')
  if fresh.get('asOf') and local.get('asOf') and fresh['asOf']<local['asOf']:problems.append('older-publication')
  if len(n)!=len(fresh['articles']):problems.append('duplicate-articles')
  row.update(candidateSha256=hashlib.sha256(candidate.read_bytes()).hexdigest(),result='indexed-text-differs' if added or removed or changed else 'indexed-text-matches',textCompared=not problems,candidateAsOf=fresh.get('asOf'),added=added,removed=removed,changed=changed,problems=problems,candidate=str(candidate.relative_to(root)))
  row['amendments']=[{'art':a['art'],'sourceNote':note,'publishedAt':None,'effectiveFrom':None,'dateReview':'kutilmoqda'} for a in fresh['articles'] for note in a.get('changes',[])]
  if problems:
   candidate.unlink();row['candidate']=None;row['result']='parser-rejected'
  elif not added and not removed and not changed:candidate.unlink();row['candidate']=None
 (out/(doc+'.comparison.json')).write_text(json.dumps(row,ensure_ascii=False,indent=2)+'\n')
 rows.append({k:v for k,v in row.items() if k!='amendments'})
 print(doc,row['result'],len(row.get('changed',[])),'changed',row.get('problems',[]))
(out/'text-comparison.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n')

for row in rows:
 audit=registry['documents'].get(row['doc'],{})
 if row['textCompared']:
  audit.update(textCompared=True,indexedTextMatches=row['result']=='indexed-text-matches',textComparisonScope='indexed-title-parts-changes',changedArticles=sorted(set(row.get('added',[])+row.get('removed',[])+row.get('changed',[]))),comparisonSourceSha256=row['sourceSha256'])
  if row['result']=='indexed-text-differs' and audit.get('state')!='newer-publication':audit['state']='indexed-text-differs'
registry_path.write_text(json.dumps(registry,ensure_ascii=False,indent=2)+'\n')
# Keep queue and public inventory consistent with the richer indexed-text comparison.
queue_path=out/'source-queue.json';queue=json.loads(queue_path.read_text());bydoc={x['doc']:x for x in queue['items']}
for row in rows:
 if row['result'] in ['indexed-text-differs','parser-rejected','parser-failed','snapshot-unverified']:
  item=bydoc.setdefault(row['doc'],{'doc':row['doc'],'status':'pending','lawyerReview':'kutilmoqda'})
  item.update(textComparison=row['result'],changed=row.get('changed',[]),candidate=row.get('candidate'),candidateSha256=row.get('candidateSha256'),problems=row.get('problems',[]))
queue['items']=list(bydoc.values());queue_path.write_text(json.dumps(queue,ensure_ascii=False,indent=2)+'\n')
inv_path=out/'inventory.json';inventory=json.loads(inv_path.read_text())
for item in inventory:item.update(registry['documents'].get(item['doc'],{}))
inv_path.write_text(json.dumps(inventory,ensure_ascii=False,indent=2)+'\n')

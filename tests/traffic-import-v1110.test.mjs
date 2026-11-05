import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {createHash} from 'node:crypto';import {execFileSync} from 'node:child_process';
import {retrieve,LAWS,articleInfo,sourcesPayload} from '../netlify/shared/rag.mjs';
test('both owner uploads are indexed separately with original source hashes and band units',()=>{
 for(const [key,count]of [['yhq',191],['ypx975',62]]){const d=LAWS[key];assert.equal(d.articles.length,count);assert.equal(new Set(d.articles.map(a=>a.art)).size,count);assert.equal(d.kind,'band');assert.equal(createHash('sha256').update(fs.readFileSync(d.provenance.file)).digest('hex'),d.provenance.sha256);const r=retrieve(key==='yhq'?'YHQ 117':'YPX975 6');assert.ok(r.provided[key].size);assert.ok(sourcesPayload('',r).passages.some(p=>p.code===d.short&&p.label.includes('-band')))}
 assert.equal(LAWS.yhq.asOf,'2026-10-30');assert.equal(LAWS.ypx975.asOf,'2024-07-17');assert.ok(LAWS.ypx975.repealed.includes('9'));assert.equal(articleInfo('9','ypx975').repealed,true);
 assert.ok(LAWS.yhq.articles.some(a=>a.art==='12-1'));assert.ok(LAWS.yhq.articles.some(a=>a.art==='117'&&a.parts[0].startsWith('117.')));
});
// Python o‘rnatilmagan kompyuterda (masalan, Windows Store yorlig‘i) bu tekshiruv o‘tkazib yuboriladi; CI’da ishlaydi.
const noPython=(()=>{try{execFileSync('python3',['--version'],{stdio:'pipe'});return false}catch{return 'python3 topilmadi'}})();
test('imported parts equal the selected source blocks; no main-band text was invented or omitted',{skip:noPython},()=>{
 const code=`import runpy,json,re\nfrom pathlib import Path\nm=runpy.run_path('scripts/import_yhq.py');B=m['Blocks']\nfor doc,start,end in [('yhq','Yoʻl harakati qoidalari','Yoʻl belgilari'),('ypx975','Yoʻl-patrul xizmati xodimlarining yoʻl harakati qatnashchilari bilan oʻzaro munosabatlari hamda maxsus moslamalardan foydalanishi tartibi toʻgʻrisida',None)]:\n d=json.loads(Path('data/laws/'+doc+'.json').read_text());p=B();p.feed(Path(d['provenance']['file']).read_text());b=p.blocks;a=next(i for i,(_,t)in enumerate(b)if t==start);z=next(i for i,(_,t)in enumerate(b)if t==end)if end else len(b);original=[t for k,t in b[a+1:z]if k in ['ACT_TEXT','CLAUSE_DEFAULT']and t];actual=[t for x in d['articles']for t in x['parts']];assert actual==original,doc\nprint('source equality passed')`;
 assert.match(execFileSync('python3',['-c',code],{encoding:'utf8'}),/source equality passed/);
});

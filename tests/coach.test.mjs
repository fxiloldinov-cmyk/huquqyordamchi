import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/coach.mjs';
import {SCENARIOS,RUBRIC,structureCheck} from '../netlify/shared/coach.mjs';
const origin='https://example.test';
const req=(method,body,o=origin)=>new Request(origin+'/api/coach',{method,headers:{origin:o,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{})});
test('coach scenarios are fictional and never contain invented reviewed legal answers',async()=>{assert.equal(SCENARIOS.length,30);assert.equal(new Set(SCENARIOS.map(x=>x.id)).size,30);assert.equal(RUBRIC.length,5);for(const s of SCENARIOS){assert.equal(s.fictional,true);assert.equal(s.expectedLegalAnswer,null);assert.equal(s.lawyerReview,'kutilmoqda');assert.ok(s.text.length>=40);}const res=await handler(req('GET'),{ip:'coach-a'});assert.equal(res.status,200);assert.equal((await res.json()).scenarios.length,30);});
test('worksheet presence checklist cannot reward a fabricated legal assertion as legal accuracy',()=>{const check=structureCheck({issue:'Qonun o‘ylab topilgan',rule:'99999-modda',facts:'  '});assert.equal(check.filled,2);assert.equal(check.legalAccuracyAssessed,false);assert.equal(check.officialGrade,false);assert.equal('score'in check,false);assert.equal(check.fields.find(x=>x.id==='facts').filled,false);});
test('coach POST validates data and origin without calling AI',async()=>{let res=await handler(req('POST',{worksheet:{issue:'savol',rule:'norma'}}),{ip:'coach-b'});assert.equal(res.status,200);assert.equal((await res.json()).filled,2);for(const worksheet of [[],null,{issue:35},{issue:'x'.repeat(8001)}]){res=await handler(req('POST',{worksheet}),{ip:'coach-c'});assert.equal(res.status,400);}res=await handler(req('POST',{worksheet:{}},'https://evil.test'),{ip:'coach-d'});assert.equal(res.status,403);});

test('coach browser parser decodes actual encoded RAG sources and hides incomplete control markers',async()=>{
 const fs=await import('node:fs');const vm=await import('node:vm');
 const {retrieve,sourcesMarker}=await import('../netlify/shared/rag.mjs');
 const browserSource=fs.readFileSync(new URL('../public/coach.js',import.meta.url),'utf8');
 const actualParser=browserSource.match(/function clean\(raw\)\{[^\n]+/)[0];
 const parse=vm.runInNewContext('('+actualParser+')');
 const marker=sourcesMarker('Qarz qaytarish masalasi.',retrieve('FK 735-modda qarz qaytarish'));
 const out=parse('Javob.\n'+marker+'⁣HK:END⁣');
 assert.equal(out.text,'Javob.\n');assert.ok(out.payload.passages.length>0);
 assert.ok(out.payload.passages.some(p=>p.url&&p.asOf));
 assert.equal(parse('Matn⁣HK:SRC:%7B').text,'Matn');
 assert.equal(parse('Matn⁣HK:SRC:%broken⁣').payload,null);
 assert.equal(parse('Matn⁣HK:CONT:%7B%7D⁣').text,'Matn');
});

test('IRAC labels disclose a presence-only check and only actual provider buttons promise AI',async()=>{
 const fs=await import('node:fs/promises');const html=await fs.readFile(new URL('../public/coach.html',import.meta.url),'utf8');
 assert.match(html,/<title>IRAC ish varag‘i \(tuzilish tekshiruvi\)/);
 assert.match(html,/faqat matn mavjudligini sanaydi/);assert.match(html,/id="check"[^>]*>To‘ldirilgan maydonlarni sanash/);
 assert.match(html,/id="review"[^>]*>AI: javobimga fikr olish/);assert.ok(!/Learning Coach|O‘QUV MURABBIYI/.test(html));
 const original=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('network forbidden')};
 try{const r=await handler(req('POST',{worksheet:{issue:'masala'}}),{ip:'irac-offline'});assert.equal((await r.json()).legalAccuracyAssessed,false);assert.equal(calls,0)}finally{globalThis.fetch=original}
});

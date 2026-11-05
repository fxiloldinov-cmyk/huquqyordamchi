import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import international from '../netlify/functions/international.mjs';
import { internationalInput, internationalPrompt } from '../netlify/shared/international.mjs';
process.env.HK_DEV_MEMORY_STORE='1';
process.env.HK_INTERNATIONAL_ENABLED='1';
const origin='https://international.test';
const req=(body,method='POST',headers={})=>new Request(origin+'/api/international',{method,headers:{origin,'content-type':'application/json',...headers},...(method==='POST'?{body:JSON.stringify(body)}:{})});
const valid={type:'travel',topic:'purchase',facts:'I bought a defective product in a shop in Uzbekistan and want a refund.',consent:true,lang:'en'};
let seq=0;
const ctx=()=>({ip:'international-'+seq++});

test('international validates product, topic, consent, date and payload before AI',async()=>{
 for(const patch of [{type:'admin'},{type:'__proto__'},{topic:'constructor'},{topic:'not-real'},{consent:false},{facts:'short'},{facts:'x'.repeat(6001)},{contract:'x'.repeat(12001)},{eventDate:'2026-02-30'},{eventDate:'not a date'}]) {
  const res=await international(req({...valid,...patch}),ctx());assert.equal(res.status,400,JSON.stringify(patch).slice(0,120));
 }
 assert.equal((await international(req(valid,'POST',{origin:'https://evil.test'}),ctx())).status,403);
});

test('international GET describes available products honestly without AI',async()=>{
 const r=await international(req(null,'GET'),ctx());assert.equal(r.status,200);const d=await r.json();assert.equal(d.payments,'disabled');assert.equal(d.languages.length,5);assert.ok(d.topics.business.includes('contracts'));assert.match(d.notice,/incomplete/);
});

test('international masks identifiers, ignores travel contract and overrides answer language',()=>{
 const input=internationalInput({...valid,facts:'Contact person at test@example.com bought a defective item from this shop.',contract:'confidential',lang:'de'}).value;
 assert.ok(!input.facts.includes('test@example.com'));assert.equal(input.contract,'');assert.match(internationalPrompt(input),/German/);
 assert.match(internationalPrompt({...input,topic:'visa'}),/COVERAGE LIMIT/);
 assert.match(internationalPrompt({...input,type:'business',topic:'contracts'}),/not illegal/);
});

test('international fails clearly without a configured AI key',async()=>{
 const old={key:process.env.GEMINI_API_KEY,alias:process.env.API_KEY};delete process.env.GEMINI_API_KEY;delete process.env.API_KEY;
 try{assert.equal((await international(req(valid),ctx())).status,503)}finally{for(const [k,v]of [['GEMINI_API_KEY',old.key],['API_KEY',old.alias]])if(v===undefined)delete process.env[k];else process.env[k]=v}
});

test('international reuses source retrieval, streamed result and independent source marker',async()=>{
 const old={key:process.env.GEMINI_API_KEY,fetch:globalThis.fetch};process.env.GEMINI_API_KEY='test-only';let sent;
 globalThis.fetch=async(url,opts)=>{sent=JSON.parse(opts.body);return new Response('data: '+JSON.stringify({candidates:[{content:{parts:[{text:'Shartnoma majburiyatlari tekshirilsin. FK 236-modda.'}]},finishReason:'STOP'}]})+'\n')};
 try{
  const r=await international(req({...valid,type:'business',topic:'contracts',parties:'Uzbek seller and German buyer',jurisdiction:'Uzbekistan',contract:'Payment due according to the agreement.',lang:'fr'}),ctx());
  assert.equal(r.status,200);const text=await r.text();assert.match(text,/HK:SRC:/);assert.match(text,/Manba tekshiruvi/);assert.match(sent.system_instruction.parts[0].text,/French/);assert.match(sent.system_instruction.parts[0].text,/untrusted data/);assert.match(sent.contents[0].parts[0].text,/German buyer/);assert.equal(sent.tools,undefined);
 }finally{globalThis.fetch=old.fetch;if(old.key===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=old.key}
});

test('international UI has complete five-language labels and no automatic input persistence',()=>{
 const s=fs.readFileSync(new URL('../public/international.js',import.meta.url),'utf8');
 const a=s.indexOf('const K ='),b=s.indexOf('const TOPICS=');
 const context=vm.createContext({});vm.runInContext(s.slice(a,b)+';globalThis.lengths = Object.entries(rows).map(([k,v])=>[k,v.length,K.length,v.every(x=>typeof x==="string")]);',context);
 for(const [lang,length,wanted,strings]of context.lengths){assert.equal(length,wanted,lang);assert.ok(strings)}
 assert.ok(!/localStorage|sessionStorage|innerHTML/.test(s));assert.match(s,/searchParams.*product|URLSearchParams\(location.search\).*product/);assert.match(s,/p\.asOf/);
});

test('international scenario corpus contains 100 unscored questions awaiting expert review',()=>{
 const corpus=JSON.parse(fs.readFileSync(new URL('../eval/international-scenarios.json',import.meta.url),'utf8'));
 assert.equal(corpus.cases.length,100);assert.equal(new Set(corpus.cases.map(x=>x.id)).size,100);
 assert.equal(new Set(corpus.cases.map(x=>x.domain)).size,5);
 for(const c of corpus.cases){assert.equal(c.lawyerReview,'pending');assert.equal(c.expectedArticles,null);assert.equal(c.expectedConclusion,null);assert.equal(c.usedForScoring,false);assert.ok(c.question.length>50)}
});

test('international panel reads the actual structured passage label and edition schema',async()=>{
 const {retrieve,sourcesPayload}=await import('../netlify/shared/rag.mjs');
 const payload=sourcesPayload('FK 236-modda',retrieve('shartnoma majburiyat FK 236-modda'));
 assert.ok(payload.passages.length>0);
 for(const p of payload.passages){assert.ok(p.label);assert.ok(Object.hasOwn(p,'asOf'))}
 const ui=fs.readFileSync(new URL('../public/international.js',import.meta.url),'utf8');assert.match(ui,/p\.label\|\|p\.doc/);assert.match(ui,/p\.asOf/);assert.ok(!ui.includes('p.edition'));
});

test('limited topics reject unrelated local matches without provider or quota use',async()=>{
 const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('network forbidden')};
 try{for(const [type,topic]of [['travel','visa'],['travel','registration'],['travel','documents'],['business','investment']]){
 const r=await international(req({...valid,type,topic}),ctx());assert.equal(r.status,200);assert.match(await r.text(),/Bu mavzu bo‘yicha ma’lumot bazada yo‘q/);
 }assert.equal(calls,0)}finally{globalThis.fetch=old}
});
test('contract form has a visible confidentiality warning in each supported language',()=>{
 const html=fs.readFileSync(new URL('../public/international.html',import.meta.url),'utf8');
 assert.match(html,/<p class="notice" id="contract-warning" data-i="contractWarning">Maxfiy hujjatlarni, haqiqiy ism va rekvizitlarni kiritmang/);
});

test('international defaults off and rejects GET and POST before any provider call',async()=>{
 const old=process.env.HK_INTERNATIONAL_ENABLED,fetch0=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;throw Error('forbidden')};
 try{for(const flag of [undefined,'0','true']){if(flag===undefined)delete process.env.HK_INTERNATIONAL_ENABLED;else process.env.HK_INTERNATIONAL_ENABLED=flag;
 for(const method of ['GET','POST'])assert.equal((await international(req(valid,method),ctx())).status,404);
 }assert.equal(calls,0)}finally{process.env.HK_INTERNATIONAL_ENABLED=old;globalThis.fetch=fetch0}
});

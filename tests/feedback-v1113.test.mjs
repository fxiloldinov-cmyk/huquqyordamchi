// TEST ONLY: barcha ma'lumotlar soxta, Gemini chaqiruvi mock.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
process.env.HK_DEV_MEMORY_STORE='1';
import {resetMemoryStore,openStore} from '../netlify/shared/store.mjs';
import feedback from '../netlify/functions/feedback.mjs';
import chat from '../netlify/functions/chat.mjs';
import features from '../netlify/functions/features.mjs';
import {issueResponse,newResponseId,dailyStats,toCsv,validateFeedback} from '../netlify/shared/feedback.mjs';
import {main as statsMain} from '../scripts/stats.mjs';
import {main as exportMain} from '../scripts/export-feedback.mjs';
let n=0;const ctx=()=>({ip:'fb-test-'+n++});
const req=(path,body)=>new Request('https://fb.test'+path,{method:'POST',headers:{origin:'https://fb.test','content-type':'application/json'},body:JSON.stringify(body)});
async function withFlag(fn){const old=process.env.HK_FEEDBACK_ENABLED;process.env.HK_FEEDBACK_ENABLED='1';resetMemoryStore();try{await fn()}finally{if(old===undefined)delete process.env.HK_FEEDBACK_ENABLED;else process.env.HK_FEEDBACK_ENABLED=old;resetMemoryStore()}}
test('o‘chiq holat: /api/feedback 503, features feedback=false, chat javob ID bermaydi',async()=>{
 delete process.env.HK_FEEDBACK_ENABLED;
 assert.equal((await feedback(req('/api/feedback',{responseId:'a'.repeat(22),rating:'foydali'}),ctx())).status,503);
 assert.equal((await (await features(new Request('https://fb.test/api/features'))).json()).feedback,false);
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='TEST-ONLY-key';
 try{globalThis.fetch=async()=>new Response('data: '+JSON.stringify({candidates:[{content:{parts:[{text:'TEST ONLY javob'}]},finishReason:'STOP'}]})+'\n\n');
  const r=await chat(req('/api/chat',{messages:[{role:'user',content:'Mehnat shartnomasi bekor qilinishi'}]}),ctx());assert.equal(r.status,200);assert.equal(r.headers.get('X-HK-Response-Id'),null);await r.text();
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('yoqilgan: chat tasodifiy javob ID beradi, omborda savol matni yo‘q; bitta javobga bitta baho',async()=>withFlag(async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='TEST-ONLY-key';const secret='MAXFIY_SAVOL_TEST_ONLY ish haqi kechikdi';let ids=[];
 try{globalThis.fetch=async()=>new Response('data: '+JSON.stringify({candidates:[{content:{parts:[{text:'TEST ONLY javob'}]},finishReason:'STOP'}]})+'\n\n');
  for(let i=0;i<2;i++){const r=await chat(req('/api/chat',{messages:[{role:'user',content:secret}]}),ctx());ids.push(r.headers.get('X-HK-Response-Id'));await r.text();}
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
 assert.match(ids[0],/^[A-Za-z0-9_-]{22}$/);assert.notEqual(ids[0],ids[1]);
 const ok=await feedback(req('/api/feedback',{responseId:ids[0],rating:'xato',reason:'eskirgan',comment:'Tel: +998 90 123 45 67, email test@example.com'}),ctx());assert.equal(ok.status,200);
 assert.equal((await feedback(req('/api/feedback',{responseId:ids[0],rating:'foydali'}),ctx())).status,409);
 const st=await openStore('feedback');const all=JSON.stringify([await st.get('r_'+ids[0]),await st.get('f_'+ids[0])]);
 assert.ok(!all.includes('MAXFIY_SAVOL'));assert.ok(!all.includes('ish haqi'));assert.ok(!all.includes('123 45 67'));assert.ok(!all.includes('test@example.com'));
 const rec=await st.get('f_'+ids[0]);assert.match(rec.comment,/\[telefon yashirildi\]/);assert.match(rec.comment,/\[email yashirildi\]/);assert.equal(rec.reason,'eskirgan');assert.ok(Array.isArray(rec.sources));
}));
test('yaroqsiz kirishlar va mavjud bo‘lmagan javob ID',async()=>withFlag(async()=>{
 for(const b of [{responseId:'qisqa',rating:'foydali'},{responseId:'a'.repeat(22),rating:'zo‘r'},{responseId:'a'.repeat(22),rating:'xato'},{responseId:'a'.repeat(22),rating:'xato',reason:'boshqa',comment:'x'.repeat(501)},{responseId:'a'.repeat(22),rating:'foydali',reason:'boshqa'}])assert.equal((await feedback(req('/api/feedback',b),ctx())).status,400,JSON.stringify(b).slice(0,60));
 assert.equal((await feedback(req('/api/feedback',{responseId:'b'.repeat(22),rating:'foydali'}),ctx())).status,404);
}));
test('tezlik chegarasi: bir IP’dan daqiqasiga 6 ta',async()=>withFlag(async()=>{
 const ids=[];for(let i=0;i<7;i++){const id=newResponseId();await issueResponse(id,{sources:['mk:131']});ids.push(id);}
 const fixed={ip:'fb-same-ip'};const codes=[];for(const id of ids)codes.push((await feedback(req('/api/feedback',{responseId:id,rating:'foydali'}),fixed)).status);
 assert.deepEqual(codes.slice(0,6),[200,200,200,200,200,200]);assert.equal(codes[6],429);
}));
test('statistika va CSV: kunlik ulushlar, formula in’ektsiyasi zararsizlanadi',async()=>withFlag(async()=>{
 const t=Date.parse('2026-11-08T10:00:00Z');const st=await openStore('feedback');
 const a=newResponseId(),b=newResponseId(),c=newResponseId();await issueResponse(a,{sources:['mk:131']},{now:t});await issueResponse(b,{sources:[]},{now:t});await issueResponse(c,{sources:['ok:96']},{now:t});
 const {recordFeedback}=await import('../netlify/shared/feedback.mjs');
 await recordFeedback({responseId:a,rating:'foydali'},{now:t});await recordFeedback({responseId:b,rating:'xato',reason:'notogri_modda',comment:'=HYPERLINK("x")'},{now:t});
 const rows=await statsMain(['--json'],{store:st});assert.equal(rows.length,1);assert.equal(rows[0].responses,3);assert.equal(rows[0].noSourceShare,0.333);assert.equal(rows[0].ratings,2);assert.equal(rows[0].usefulShare,0.5);assert.equal(rows[0].reasons.notogri_modda,1);
 const out=new URL('../tests/.tmp-feedback.csv',import.meta.url);try{await exportMain([out.pathname.replace(/^\/(\w:)/,'$1')],{store:st});const csv=fs.readFileSync(out,'utf8');assert.match(csv,/^day,t,rating,reason,comment,sources,noSource\n/);assert.match(csv,/"'=HYPERLINK/);}finally{fs.rmSync(out,{force:true})}
 assert.deepEqual(dailyStats([],[]),[]);assert.equal(toCsv([]),'day,t,rating,reason,comment,sources,noSource\n');assert.throws(()=>validateFeedback(null));
}));
test('interfeys: tugmalar faqat flag va javob ID bo‘lsa; savol matni yuborilmaydi; SW va sitemap’da yo‘q',()=>{
 const js=fs.readFileSync(new URL('../public/feedback.js',import.meta.url),'utf8');
 assert.match(js,/f\?\.feedback===true/);assert.match(js,/JSON\.stringify\(\{responseId,rating,reason,comment\}\)/);assert.doesNotMatch(js,/localStorage|setInterval|Notification/);
 assert.match(fs.readFileSync(new URL('../public/app.js',import.meta.url),'utf8'),/HKFeedback\?\.attach\(bubble, responseId\)/);
 assert.doesNotMatch(fs.readFileSync(new URL('../public/sw.js',import.meta.url),'utf8'),/feedback/);
});

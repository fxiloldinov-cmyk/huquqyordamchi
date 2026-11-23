// TEST ONLY: foydalanuvchilar, sinflar va kazus matnlari soxta; email yuborilmaydi, AI chaqirilmaydi.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {randomUUID} from 'node:crypto';
process.env.HK_DEV_MEMORY_STORE='1';
import {resetMemoryStore,openStore} from '../netlify/shared/store.mjs';
import {createUser,createSession} from '../netlify/shared/auth.mjs';
import {newCode,normCode,MAX_STUDENTS,MAX_CLASSES} from '../netlify/shared/classroom.mjs';
import classroom from '../netlify/functions/classroom.mjs';
import {main as grantMain,parseArgs} from '../scripts/grant-teacher.mjs';
let ipN=0;
async function user(tag,{verified=true}={}){const u={id:randomUUID(),email:`${tag}-${randomUUID().slice(0,6)}@test-only.example`,name:'TEST ONLY '+tag,emailVerified:verified,createdAt:new Date().toISOString(),password:'x'};await createUser({...u});const token=await createSession({...u});return {...u,cookie:'hk_session='+token};}
const grant=async u=>grantMain(['--email',u.email],{store:await openStore('teachers')});
const post=(u,body)=>classroom(new Request('https://cls.test/api/classroom',{method:'POST',headers:{origin:'https://cls.test','content-type':'application/json',...(u?{cookie:u.cookie}:{})},body:JSON.stringify(body)}),{ip:'cls-'+ipN++});
const get=(u,q)=>classroom(new Request('https://cls.test/api/classroom?'+new URLSearchParams(q),{headers:u?{cookie:u.cookie}:{}}),{ip:'cls-'+ipN++});
const json=async r=>({status:r.status,body:await r.json()});
async function on(fn){const old=process.env.HK_CLASSROOM_ENABLED;process.env.HK_CLASSROOM_ENABLED='1';resetMemoryStore();try{await fn()}finally{if(old===undefined)delete process.env.HK_CLASSROOM_ENABLED;else process.env.HK_CLASSROOM_ENABLED=old;resetMemoryStore()}}
// Bitta ustoz, bitta sinf, bitta topshiriq, bitta talaba javobi.
async function setup(){
 const t=await user('ustoz');await grant(t);const cls=(await json(await post(t,{op:'create-class',title:'TEST ONLY sinf'}))).body;
 const a=(await json(await post(t,{op:'add-assignment',classId:cls.id,title:'TEST ONLY topshiriq',kazus:'TEST ONLY kazus: A va B o‘rtasida soxta nizo.'}))).body;
 const s=await user('talaba');assert.equal((await post(s,{op:'join',code:cls.code})).status,200);
 assert.equal((await post(s,{op:'submit',classId:cls.id,aid:a.id,answer:'TEST ONLY javob. Tel +998 90 123 45 67'})).status,200);
 return {t,cls,a,s};
}
test('o‘chiq holat: API 503, features classroom=false',async()=>{
 delete process.env.HK_CLASSROOM_ENABLED;
 assert.equal((await post(null,{op:'join',code:'ABCDEFGH'})).status,503);assert.equal((await get(null,{op:'me'})).status,503);
 const features=(await import('../netlify/functions/features.mjs')).default;assert.equal((await (await features(new Request('https://cls.test/api/features'))).json()).classroom,false);
});
test('rollar: ustoz roli faqat qo‘lda va tasdiqlangan email bilan',async()=>on(async()=>{
 const plain=await user('oddiy');assert.equal((await post(plain,{op:'create-class',title:'X'})).status,403);
 const unverified=await user('tasdiqlanmagan',{verified:false});await grant(unverified);
 assert.equal((await post(unverified,{op:'create-class',title:'X'})).status,403);assert.equal((await json(await get(unverified,{op:'me'}))).body.teacher,false);
 const t=await user('ustoz');await grant(t);assert.equal((await json(await get(t,{op:'me'}))).body.teacher,true);assert.equal((await post(t,{op:'create-class',title:'TEST ONLY'})).status,200);
 await grantMain(['--email',t.email,'--revoke'],{store:await openStore('teachers')});assert.equal((await post(t,{op:'create-class',title:'TEST ONLY 2'})).status,403);
 assert.throws(()=>parseArgs(['--email','yaroqsiz']));assert.throws(()=>parseArgs(['--plan','pro']));
}));
test('kirish kodi: tasodifiy, 8 belgi, qayta yaratilganda eskisi ishlamaydi',async()=>on(async()=>{
 const codes=new Set(Array.from({length:500},newCode));assert.equal(codes.size,500);for(const c of codes)assert.match(c,/^[A-HJ-NP-Z2-9]{8}$/);assert.equal(normCode('abcd-efgh'),'ABCDEFGH');
 const t=await user('ustoz');await grant(t);const cls=(await json(await post(t,{op:'create-class',title:'TEST ONLY'}))).body;
 const fresh=(await json(await post(t,{op:'rotate-code',classId:cls.id}))).body.code;assert.notEqual(fresh,cls.code);
 const s=await user('talaba');assert.equal((await post(s,{op:'join',code:cls.code})).status,404);assert.equal((await post(s,{op:'join',code:fresh.toLowerCase()})).status,200);
 assert.equal((await post(s,{op:'join',code:'!!'})).status,400);assert.equal((await post(t,{op:'join',code:fresh})).status,409);
}));
test('kirish nazorati: boshqa sinf ustozi, boshqa talaba va tizimga kirmagan foydalanuvchi ishni ko‘rmaydi',async()=>on(async()=>{
 const {t,cls,a,s}=await setup();
 const other=await user('boshqa-ustoz');await grant(other);await post(other,{op:'create-class',title:'TEST ONLY boshqa'});
 const outsider=await user('boshqa-talaba');
 const q={classId:cls.id,aid:a.id};
 // tizimga kirmagan
 for(const op of ['me','class','assignment','submissions'])assert.equal((await get(null,{op,...q})).status,401,op);
 assert.equal((await post(null,{op:'submit',...q,answer:'x'})).status,401);
 // boshqa sinf ustozi
 for(const op of ['class','assignment','submissions'])assert.equal((await get(other,{op,...q})).status,404,op);
 for(const body of [{op:'review',...q,studentId:s.id,comment:'x'},{op:'add-assignment',classId:cls.id,title:'x',kazus:'x'},{op:'delete-class',classId:cls.id},{op:'rotate-code',classId:cls.id}])assert.equal((await post(other,body)).status,404,body.op);
 // boshqa talaba (sinfga a’zo emas) va sinfdosh
 for(const op of ['class','assignment','submissions'])assert.equal((await get(outsider,{op,...q})).status,404,op);
 assert.equal((await post(outsider,{op:'submit',...q,answer:'x'})).status,404);
 const mate=await user('sinfdosh');await post(mate,{op:'join',code:cls.code});
 assert.equal((await get(mate,{op:'submissions',...q})).status,404);
 const mateView=(await json(await get(mate,{op:'assignment',...q}))).body;assert.equal(mateView.mine,null);assert.ok(!JSON.stringify(mateView).includes('TEST ONLY javob'));
 assert.equal((await post(mate,{op:'review',...q,studentId:s.id,comment:'x'})).status,404);
 // talabaning o‘zi va o‘z ustozi
 const mine=(await json(await get(s,{op:'assignment',...q}))).body;assert.match(mine.mine.answer,/TEST ONLY javob/);assert.match(mine.mine.answer,/\[telefon yashirildi\]/);assert.equal(mine.code,undefined);
 const list=(await json(await get(t,{op:'submissions',...q}))).body;assert.equal(list.submissions.length,1);assert.equal(list.submissions[0].studentId,s.id);
 assert.equal((await post(t,{op:'review',...q,studentId:s.id,comment:'TEST ONLY izoh',grade:'4'})).status,200);
 const after=(await json(await get(s,{op:'assignment',...q}))).body.mine;assert.equal(after.comment,'TEST ONLY izoh');assert.equal(after.grade,'4');
 // noma’lum amal va prototip kalitlari
 assert.equal((await post(t,{op:'__proto__'})).status,400);assert.equal((await post(t,{op:'constructor'})).status,400);
 for(const op of ['__proto__','constructor','toString'])assert.equal((await get(t,{op})).status,400,op);
}));
test('cheklovlar: 60 talaba, 10 sinf, matn uzunliklari, muddat, qayta topshirish',async()=>on(async()=>{
 const t=await user('ustoz');await grant(t);const ids=[];
 for(let i=0;i<MAX_CLASSES;i++)ids.push((await json(await post(t,{op:'create-class',title:'TEST ONLY '+i}))).body);
 assert.equal((await post(t,{op:'create-class',title:'ortiqcha'})).status,409);
 const cls=ids[0];const st=await openStore('classroom');
 await st.update('c_'+cls.id,c=>({...c,students:Array.from({length:MAX_STUDENTS},()=>randomUUID())}));
 const late=await user('kechikkan');assert.equal((await post(late,{op:'join',code:cls.code})).status,409);
 const c2=ids[1];assert.equal((await post(t,{op:'add-assignment',classId:c2.id,title:'x',kazus:'k'.repeat(4001)})).status,400);
 const past=(await json(await post(t,{op:'add-assignment',classId:c2.id,title:'TEST ONLY eski',kazus:'TEST ONLY',dueAt:'2020-01-01T00:00:00Z'}))).body;
 const open=(await json(await post(t,{op:'add-assignment',classId:c2.id,title:'TEST ONLY ochiq',kazus:'TEST ONLY',dueAt:'2099-01-01T00:00:00Z'}))).body;
 assert.equal((await post(t,{op:'add-assignment',classId:c2.id,title:'x',kazus:'x',dueAt:'ertaga'})).status,400);
 const s=await user('talaba');await post(s,{op:'join',code:c2.code});
 assert.equal((await post(s,{op:'submit',classId:c2.id,aid:past.id,answer:'TEST ONLY'})).status,409);
 assert.equal((await post(s,{op:'submit',classId:c2.id,aid:open.id,answer:'a'.repeat(8001)})).status,400);
 assert.equal((await post(s,{op:'submit',classId:c2.id,aid:open.id,answer:'TEST ONLY 1'})).status,200);
 assert.equal((await json(await post(s,{op:'submit',classId:c2.id,aid:open.id,answer:'TEST ONLY 2'}))).body.answer,'TEST ONLY 2');
}));
test('o‘chirish oqimlari: talaba o‘z ishini o‘chiradi, sinfdan chiqadi; ustoz sinfni o‘chirsa javoblar ham o‘chadi',async()=>on(async()=>{
 const {t,cls,a,s}=await setup();const st=await openStore('classroom');const q={classId:cls.id,aid:a.id};
 assert.equal((await post(s,{op:'delete-submission',...q})).status,200);assert.equal(await st.get(`s_${cls.id}_${a.id}_${s.id}`),null);
 await post(s,{op:'submit',...q,answer:'TEST ONLY qayta'});assert.equal((await post(s,{op:'leave',classId:cls.id})).status,200);
 assert.equal(await st.get(`s_${cls.id}_${a.id}_${s.id}`),null);assert.equal((await get(s,{op:'class',classId:cls.id})).status,404);assert.equal((await json(await get(s,{op:'me'}))).body.enrolled.length,0);
 const s2=await user('talaba2');await post(s2,{op:'join',code:cls.code});await post(s2,{op:'submit',...q,answer:'TEST ONLY'});
 assert.equal((await post(t,{op:'delete-class',classId:cls.id})).status,200);
 for(const k of [`s_${cls.id}_${a.id}_${s2.id}`,`a_${cls.id}_${a.id}`,'c_'+cls.id,'k_'+cls.code])assert.equal(await st.get(k),null,k);
 assert.equal((await json(await get(s2,{op:'me'}))).body.enrolled.length,0);assert.equal((await json(await get(t,{op:'me'}))).body.teaching.length,0);
}));
test('interfeys: flag bo‘lmasa havola yashirin; AI baho bermaydi; sitemap va SW’da yo‘q',()=>{
 const html=fs.readFileSync(new URL('../public/classroom.html',import.meta.url),'utf8');assert.match(html,/faqat o‘zbekcha/i);assert.match(html,/AI baho qo‘ymaydi/);
 const js=fs.readFileSync(new URL('../public/classroom.js',import.meta.url),'utf8');assert.match(js,/flags\?\.classroom!==true/);assert.doesNotMatch(js,/api\/(chat|kazus)/);
 const coach=fs.readFileSync(new URL('../public/classroom-coach.js',import.meta.url),'utf8');assert.match(coach,/faqat tuzilish/);assert.doesNotMatch(coach,/api\/(chat|kazus)/);
 const idx=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');assert.match(idx,/href="\/classroom\.html" data-classroom hidden/);
 for(const f of ['sw.js','sitemap.xml'])assert.doesNotMatch(fs.readFileSync(new URL('../public/'+f,import.meta.url),'utf8'),/classroom/);
 assert.doesNotMatch(fs.readFileSync(new URL('../netlify/shared/classroom.mjs',import.meta.url),'utf8'),/sendMail|gemini/i);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {legal,isAllowedOrigin,guardJsonPost,pipeGeminiStream,dedupeSources,lexLinkFor,extractCandidate} from '../netlify/shared/common.mjs';
import search, {normalizeResult} from '../netlify/functions/search.mjs';
import chat from '../netlify/functions/chat.mjs';
import kazus from '../netlify/functions/kazus.mjs';
import {parseRss} from '../netlify/functions/news.mjs';
const root=new URL('../',import.meta.url);
const read=p=>fs.readFileSync(new URL(p,root),'utf8');
const ctx=vm.createContext({HK_LEGAL:legal,HKCore,URL,localDate:()=> '2026-10-29',norm:HKCore.norm,SITUATIONS:legal.situations});
vm.runInContext(read('public/features.js').split('// ---- Aqlli qidiruv UI')[0],ctx);
vm.runInContext(read('public/templates.js'),ctx);
const run=s=>vm.runInContext(s,ctx);
let sequence=0;
const req=(body,extra={})=>new Request('https://example.test/api/chat',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json',...extra},body:JSON.stringify(body)});
const scope=()=>({scope:'test-'+sequence++});
test('Cyrillic and Latin query resolve the same article',()=>{
 for(const q of ['JK 168','ЖК 168'])assert.equal(run(`localArticleSearch(${JSON.stringify(q)})`)[0].doc,'jk');
 assert.equal(run('localArticleSearch("МК 160")')[0].art,'160');
 assert.ok(run('localArticleSearch("алимент")').some(a=>a.doc==='ok'));
});
test('same article number in a different code is never verified',()=>{
 assert.equal(run('findVerified("Jinoyat-protsessual kodeksi","160")'),undefined);
 assert.equal(run('findVerified("Mehnat kodeksi","160")').doc,'mk');
 assert.equal(run('findVerified("Fuqarolik protsessual kodeksi","1135")'),undefined);
 assert.equal(HKCore.resolveDoc('O‘zbekiston Respublikasi Mehnat kodeksi',legal.docs),'mk');
});
test('known article corrections survive generated catalogue build',()=>{
 assert.match(legal.articles.find(a=>a.doc==='mk'&&a.art==='333').title,/kechik|muddat/i);
 assert.ok(legal.articles.find(a=>a.doc==='mk'&&a.art==='560'));
 assert.ok(legal.articles.find(a=>a.doc==='fk2'&&a.art==='1135'));
 const generated=vm.createContext({});vm.runInContext(read('public/legal-data.js'),generated);
 assert.deepEqual(JSON.parse(JSON.stringify(generated.HK_LEGAL)),legal);
});
test('alimony varies by children and blocks disputed order procedure',()=>{
 const t=ctx.HKExtraTemplates.aliment_sud;
 for(const [count,share]of [['1','1/4'],['2','1/3'],['3','1/2']])assert.ok(t.generate({child_count:count,eligible:'clear'}).includes(share+' qismi'));
 assert.ok(t.block({eligible:'dispute'}));assert.ok(t.block({}));assert.equal(t.block({eligible:'clear'}),null);
});
test('traffic template blocks wrong court procedure; restoration stays optional',()=>{
 const t=ctx.HKExtraTemplates.jarima_shikoyat;
 assert.ok(t.block({issuer_type:'court'}));assert.equal(t.block({issuer_type:'organ'}),null);
 assert.ok(!t.generate({}).includes('Shu asoslarda'));
 assert.ok(t.generate({restore:'Kasallik hujjati ilovada'}).includes('Kasallik hujjati ilovada'));
});
test('divorce optional violence clause and fraud fact-sensitive wording',()=>{
 const d=ctx.HKExtraTemplates.nikoh_ajrashish;
 assert.ok(!d.generate({}).includes('tayinlamaslikni'));
 assert.ok(d.generate({violence:'yes'}).includes('tayinlamaslikni'));
 assert.ok(ctx.HKExtraTemplates.firibgarlik.generate({}).includes('mavjud yoki mavjud emasligini'));
});
test('long previous answer does not break next chat request',()=>{
 const src=read('public/app.js');
 const fn=src.slice(src.indexOf('function historyForRequest()'),src.indexOf('// ASK FUNCTION'));
 const h=vm.createContext({MAX_HISTORY:20,MAX_TOTAL_CHARS:28000,history:[{role:'user',content:'old'},{role:'assistant',content:'a'.repeat(18000)},{role:'user',content:'Davom eting'}]});
 vm.runInContext(fn,h);const out=vm.runInContext('historyForRequest()',h);
 assert.equal(out.length,3);assert.ok(out.every(x=>x.content.length<=8000));assert.equal(out.at(-1).content,'Davom eting');
});
test('origin comparison rejects spoofed forwarding and different port',()=>{
 const old=process.env.ALLOWED_ORIGINS;delete process.env.ALLOWED_ORIGINS;
 try{assert.equal(isAllowedOrigin(req({})),true);assert.equal(isAllowedOrigin(req({},{origin:'https://evil.test','x-forwarded-host':'evil.test'})),false);assert.equal(isAllowedOrigin(req({},{origin:'https://example.test:8443'})),false);}finally{if(old===undefined)delete process.env.ALLOWED_ORIGINS;else process.env.ALLOWED_ORIGINS=old;}
});
test('JSON guard handles bad JSON and actual oversized body',async()=>{
 assert.equal((await guardJsonPost(new Request('https://example.test/api',{method:'POST',headers:{origin:'https://example.test','content-type':'application/json'},body:'{'}),{},scope())).error.status,400);
 assert.equal((await guardJsonPost(req({x:'a'.repeat(97000)}),{},scope())).error.status,413);
 assert.equal((await guardJsonPost(req({ok:true},{'content-type':'text/plain'}),{},scope())).error.status,415);
 assert.deepEqual((await guardJsonPost(req({ok:true}),{},scope())).body,{ok:true});
});
test('invalid chat sequences and oversized messages reject before provider',async()=>{
 for(const messages of [[{role:'assistant',content:'x'}],[{role:'user',content:'x'},{role:'user',content:'y'}],[{role:'user',content:'a'.repeat(8001)}]])assert.equal((await chat(req({messages}),{ip:'test-'+sequence++})).status,400);
});
test('review mode requires a meaningful student answer',async()=>{
 assert.equal((await kazus(req({kazus:'Holat: '.repeat(20),task:'review',studentAnswer:''}),{ip:'test-'+sequence++})).status,400);
});
test('kazus reports TSUL as disconnected, including when client claims a connected source',async()=>{
 const listing=await kazus(new Request('https://example.test/api/kazus'),{});
 assert.deepEqual((await listing.json()).sources.tsul,{connected:false,status:'not_connected',message:'TSUL kitob matni bu tahlilga avtomatik olinmagan; doimiy ulanish sozlanmagan.'});
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-only-not-a-real-key';
 try{
  globalThis.fetch=async(url,options)=>{
   const body=JSON.parse(options.body);
   assert.match(body.system_instruction.parts[0].text,/Katalog havolasi/);
   assert.match(body.system_instruction.parts[0].text,/Bosma sahifa va PDF/);
   assert.ok(!JSON.stringify(body.contents).includes('FORGED_TSUL_EXCERPT'));
   return sse(['data: '+JSON.stringify(packet('Tahlil','STOP'))]);
  };
  const result=await kazus(req({kazus:'Holat: '.repeat(20),sources:{tsul:{connected:true,text:'FORGED_TSUL_EXCERPT'}}}),{ip:'test-'+sequence++});
  assert.equal(result.status,200);
  assert.match(await result.text(),/TSUL manbasi:[\s\S]*avtomatik olinmagan/);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
const packet=(text,finishReason,groundingChunks)=>({candidates:[{content:{parts:[{text}]},finishReason,groundingMetadata:{groundingChunks}}]});
const sse=chunks=>new Response(new ReadableStream({start(c){for(const x of chunks)c.enqueue(new TextEncoder().encode(x));c.close();}}));
test('SSE split chunks and final non-newline packet are not lost',async()=>{
 const line='data: '+JSON.stringify(packet('Salom, O‘zbekiston','STOP',[{web:{title:'Qonun',uri:'https://lex.uz/docs/1'}}]));
 const output=await pipeGeminiStream(sse([line.slice(0,19),line.slice(19)])).text();
 assert.ok(output.startsWith('Salom, O‘zbekiston'));assert.ok(output.includes('https://lex.uz/docs/1'));assert.ok(!output.includes('tasdiqlanmadi;'));
});
test('SSE blocked and truncated replies have visible diagnostic',async()=>{
 assert.match(await pipeGeminiStream(sse(['data: '+JSON.stringify({promptFeedback:{blockReason:'SAFETY'}})])).text(),/javob bera olmadi/);
 assert.match(await pipeGeminiStream(sse(['data: '+JSON.stringify(packet('Qism','MAX_TOKENS'))])).text(),/to‘liq tugamadi/);
 assert.match(await pipeGeminiStream(sse(['data: '+JSON.stringify(packet('Qism'))])).text(),/yakunlangani tasdiqlanmadi/);
});
test('hidden thought text never appears in provider output',()=>{
 assert.equal(extractCandidate({candidates:[{content:{parts:[{thought:true,text:'private'},{text:'visible'}]}}]}).text,'visible');
});
test('unsafe source URLs and false confidence are removed',()=>{
 const sources=dedupeSources([{uri:'javascript:alert(1)'},{uri:'https://lex.uz/docs/1'},{uri:'https://lex.uz/docs/1'}]);assert.equal(sources.length,1);
 const result=normalizeResult({natijalar:[{hujjat:'Not a real law',modda:'168',ishonch:'yuqori'}]},[]);
 assert.equal(result.googleQidiruv,false);assert.equal(result.natijalar[0].ishonch,'tekshirish kerak');assert.equal(result.natijalar[0].hujjatTasdiqlangan,false);
 assert.equal(lexLinkFor('Fuqarolik protsessual kodeksi').docKey,'fpk');
});
test('RSS parser ignores off-domain links, cleans markup and reads dates',()=>{
 const xml='<rss><item><title><![CDATA[<b>Yangi hujjat</b>]]></title><link>https://lex.uz/docs/123</link><description>Vazirning buyrug‘i Qabul qilingan sana 20.10.2026. Kuchga kirish sanasi 21.10.2026</description></item><item><title>Evil</title><link>https://lex.uz.evil.test/a</link></item></rss>';
 const list=parseRss(xml);assert.equal(list.length,1);assert.equal(list[0].title,'Yangi hujjat');assert.equal(list[0].adopted,'20.10.2026');
});
test('all four news categories contain actual archived documents',()=>{
 const source=read('public/ui.js');
 vm.runInContext(source.slice(source.indexOf('  function typeOf(item)'),source.indexOf('  // "Oʻzbekiston')),ctx);
 const archive=JSON.parse(read('public/data/news.json'));
 for(const type of ['qonun','farmon','qaror','buyruq'])assert.ok(archive.items.some(item=>ctx.typeOf(item)===type),type);
 assert.equal(ctx.typeOf({organ:'Vazirning buyrug‘i',title:'Qonun va farmonlar ijrosi'}),'buyruq');
});
test('chat explain request includes selected code, search tool and source output',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-only-not-a-real-key';
 try{
  globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);assert.match(body.system_instruction.parts[0].text,/QONUNNI SODDA TILDA/);assert.ok(body.tools[0].google_search);assert.ok(options.signal);return sse(['data: '+JSON.stringify(packet('Sodda izoh','STOP',[{web:{title:'MK',uri:'https://lex.uz/docs/6257288'}}]))]);};
  const result=await chat(req({task:'explain',codeId:legal.codes.find(c=>c[0]==='MK')[3],messages:[{role:'user',content:'160-moddani tushuntiring'}]}),{ip:'test-'+sequence++});
  assert.equal(result.status,200);assert.match(await result.text(),/Sodda izoh[\s\S]*https:\/\/lex.uz/);
 }finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('provider search errors never silently fall back to ungrounded generation',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-only-not-a-real-key';let calls=0;
 try{globalThis.fetch=async()=>{calls++;return new Response('{}',{status:400});};const result=await search(req({query:'Aliment miqdori qanday?'}),{ip:'test-'+sequence++});assert.equal(result.status,502);assert.equal(calls,1);}
 finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});
test('search returns detailed steps and verified source metadata',async()=>{
 const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY;process.env.GEMINI_API_KEY='test-only-not-a-real-key';
 try{globalThis.fetch=async()=>new Response(JSON.stringify(packet(JSON.stringify({xulosa:'Namuna izoh',natijalar:[{hujjat:'Mehnat kodeksi',modda:'333',nima_uchun:'Kechikkan ish haqi'}],qadamlar:['Hujjatlarni yig‘ing'],dalillar:['Hisob-kitob varaqasi']}),'STOP',[{web:{title:'MK',uri:'https://lex.uz/docs/6257288'}}])));const result=await search(req({query:'Maosh kechiksa nima qilaman?'}),{ip:'test-'+sequence++});assert.equal(result.status,200);const body=await result.json();assert.equal(body.qadamlar.length,1);assert.equal(body.dalillar.length,1);assert.equal(body.googleQidiruv,true);assert.equal(body.natijalar[0].docKey,'mk');}
 finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;}
});

test('redactPII hides personal identifiers but keeps amounts, articles and dates', async () => {
 const {redactPII}=await import('../netlify/shared/common.mjs');
 const hide=['Tel: +998 90 123-45-67','telefonim 901234567','aloqa uchun: 93 555 12 34','(90) 123-45-67','Karta 8600 1234 5678 9012','9860123456789012','JSHSHIR 31234567890123','Pasport AA1234567','pasport aa1234567','ID AD 1234567','email: aziza.k@mail.uz'];
 const leaks=['123-45-67','901234567','555 12 34','8600 1234','9860123456789012','31234567890123','AA1234567','aa1234567','AD 1234567','aziza.k@mail.uz'];
 const out=redactPII(hide.join('. '));
 for (const leak of leaks) assert.ok(!out.includes(leak), 'leak: '+leak);
 const keepText='Da’vo summasi 901234567 so‘m. Jarima 3 800 000 so‘m, 1234567890123456 so‘m, 45 000 000 sum, $901234567. Qaror 2026-10-29, JK 278-2, MK 560-modda, 8 500 000 so‘m, 12.10.2026. Aziza Karimova, Chilonzor tumani.';
 assert.equal(redactPII(keepText), keepText);
});

test('SEO build creates a static page, sitemap entry and canonical for every situation', async () => {
 const {execFileSync}=await import('node:child_process');
 execFileSync(process.execPath,['scripts/build-data.mjs'],{env:{...process.env,SITE_URL:'https://huquqyordamchi.netlify.app'}});
 const sitemap=read('public/sitemap.xml');
 assert.match(read('public/robots.txt'),/Sitemap: https:\/\/huquqyordamchi\.netlify\.app\/sitemap\.xml/);
 for (const s of legal.situations) {
  assert.match(s.slug,/^[a-z0-9-]+$/);
  const url=`https://huquqyordamchi.netlify.app/vaziyat/${s.slug}/`;
  assert.ok(sitemap.includes(`<loc>${url}</loc>`),s.slug);
  const html=read(`public/vaziyat/${s.slug}/index.html`);
  assert.ok(html.includes(`<link rel="canonical" href="${url}">`),s.slug);
  assert.ok(html.includes('<h1>'+s.title.replace(/&/g,'&amp;').replace(/'/g,'&#39;')+'</h1>'),s.slug);
  for (const m of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/g)) JSON.parse(m[1]);
 }
});

// ---- v10.5: model zaxirasi, xato xabarlari, kazus davomi ----
const withKey=async(fn)=>{const oldFetch=globalThis.fetch,oldKey=process.env.GEMINI_API_KEY,oldModel=process.env.GEMINI_MODEL;process.env.GEMINI_API_KEY='test-only-not-a-real-key';delete process.env.GEMINI_MODEL;try{await fn()}finally{globalThis.fetch=oldFetch;if(oldKey===undefined)delete process.env.GEMINI_API_KEY;else process.env.GEMINI_API_KEY=oldKey;if(oldModel!==undefined)process.env.GEMINI_MODEL=oldModel;delete process.env.HK_DEADLINE_MS;}};
const kazusText='Aziza 2024-yildan MChJda o‘qituvchi. Kasallik davrida shtat qisqarishi sababli bo‘shatildi. Huquqiy baho bering.';

test('default model is a current one and an unavailable model falls back to the next', async () => withKey(async () => {
 const urls=[];
 globalThis.fetch=async(url,options)=>{urls.push(String(url));const body=JSON.parse(options.body);
  if(urls.length===1)return new Response(JSON.stringify({error:{status:'NOT_FOUND',message:'models/gemini-3.8-flash is not found for API version v1beta'}}),{status:404});
  assert.equal(body.generationConfig.thinkingConfig.thinkingLevel,'low');
  return sse(['data: '+JSON.stringify(packet('Javob','STOP'))]);};
 const res=await chat(req({messages:[{role:'user',content:'Aliment qancha?'}]}),{ip:'test-'+sequence++});
 assert.equal(res.status,200);assert.match(await res.text(),/^Javob/);
 assert.match(urls[0],/models\/gemini-3\.8-flash:/);assert.match(urls[1],/models\/gemini-flash-latest:/);
}));

test('rejected thinking setting is retried without it; invalid API key gives a clear admin message', async () => withKey(async () => {
 let calls=0;
 globalThis.fetch=async(url,options)=>{calls++;const body=JSON.parse(options.body);
  if(body.generationConfig.thinkingConfig)return new Response(JSON.stringify({error:{message:'Invalid JSON payload received. Unknown name "thinkingLevel" at generation_config.thinking_config'}}),{status:400});
  return sse(['data: '+JSON.stringify(packet('OK','STOP'))]);};
 let res=await chat(req({messages:[{role:'user',content:'Savol matni'}]}),{ip:'test-'+sequence++});
 assert.equal(res.status,200);assert.equal(calls,2);
 globalThis.fetch=async()=>new Response(JSON.stringify({error:{message:'API key not valid. Please pass a valid API key.'}}),{status:400});
 res=await chat(req({messages:[{role:'user',content:'Savol matni'}]}),{ip:'test-'+sequence++});
 assert.equal(res.status,503);assert.match((await res.json()).error,/GEMINI_API_KEY/);
}));

test('kazus stops safely before the platform limit and asks the browser to continue, keeping sources', async () => withKey(async () => {
 process.env.HK_DEADLINE_MS='300';
 globalThis.fetch=async()=>new Response(new ReadableStream({start(c){c.enqueue(new TextEncoder().encode('data: '+JSON.stringify(packet('Birinchi qism matni ','',[{web:{title:'MK',uri:'https://lex.uz/docs/-6257288'}}]))+'\n'));/* oqim ochiq qoladi */}}));
 const res=await kazus(req({kazus:kazusText,fan:'mehnat'}),{ip:'test-'+sequence++});
 assert.equal(res.status,200);const out=await res.text();
 assert.ok(out.startsWith('Birinchi qism matni'));
 const m=out.match(/⁣HK:CONT:([^⁣]*)⁣/);assert.ok(m,'continuation marker');
 assert.equal(JSON.parse(decodeURIComponent(m[1]))[0].uri,'https://lex.uz/docs/-6257288');
 assert.ok(!out.includes('HK:END'));
}));

test('kazus continuation sends the partial answer back as model text, skips search and ends with sources', async () => withKey(async () => {
 globalThis.fetch=async(url,options)=>{const body=JSON.parse(options.body);
  assert.equal(body.tools,undefined);
  const last=body.contents.at(-1),prev=body.contents.at(-2);
  assert.equal(prev.role,'model');assert.equal(prev.parts[0].text,'Birinchi qism matni ');
  assert.equal(last.role,'user');assert.match(last.parts[0].text,/to‘xtagan joydan davom/);
  return sse(['data: '+JSON.stringify(packet('ikkinchi qism.','STOP'))]);};
 const res=await kazus(req({kazus:kazusText,fan:'mehnat',continuation:{round:1,partial:'Birinchi qism matni ',sources:[{title:'MK',uri:'https://lex.uz/docs/-6257288'},{title:'bad',uri:'javascript:alert(1)'}]}}),{ip:'test-'+sequence++});
 assert.equal(res.status,200);const out=await res.text();
 assert.ok(out.startsWith('ikkinchi qism.'));assert.ok(out.includes('https://lex.uz/docs/-6257288'));assert.ok(!out.includes('javascript:'));
 assert.ok(out.endsWith('⁣HK:END⁣'));
 const bad=await kazus(req({kazus:kazusText,continuation:{round:9,partial:'x'.repeat(50)}}),{ip:'test-'+sequence++});assert.equal(bad.status,400);
}));

// ---- v10.6: RAG (Mehnat kodeksi + Plenum 26-son) ----
const rag = await import('../netlify/shared/rag.mjs');
const AZIZA = 'Aziza 2024-yil 15-maydan MChJda ingliz tili o‘qituvchisi sifatida nomuayyan muddatli mehnat shartnomasi asosida ishlaydi. 2026-yil 5-oktabrda ish beruvchi undan o‘z xohishiga ko‘ra ishdan bo‘shash haqida ariza yozishni talab qiladi. 8–16-oktabr kunlari Aziza vaqtincha mehnatga layoqatsiz bo‘lib, elektron kasallik varaqasi rasmiylashtiriladi. Direktor 12-oktabr kuni uning mehnat shartnomasini shtat qisqarishi sababli bekor qiladi. Aziza oldindan yozma ogohlantirilmagan va unga boshqa ish taklif qilinmagan. 20-oktabrda Aziza buyruq nusxasini oladi. Azizaga oxirgi ish haqi va foydalanilmagan ta’til uchun kompensatsiya to‘lanmagan. Qanday talablar bilan, qayerga va qanday muddatda murojaat qilishi mumkin?';

test('law base is complete and matches verified article numbers', () => {
 const {mk, plenum26} = rag.LAWS;
 assert.equal(mk.articles.length, 593); assert.deepEqual(mk.articles.map(a => a.art), Array.from({length: 593}, (_, i) => String(i + 1)));
 assert.ok(mk.asOf >= '2026-10-15');
 const t = n => mk.articles[n - 1].title;
 assert.match(t(161), /ish beruvchining tashabbusiga/); assert.match(t(163), /taqiqlash/); assert.match(t(165), /ogohlantirish/);
 assert.match(t(560), /sudga murojaat qilish muddatlari/); assert.match(t(562), /sud xarajatlaridan ozod/);
 assert.equal(plenum26.kind, 'band'); assert.equal(plenum26.articles.filter(a => a.art !== '0').length, 74); assert.equal(plenum26.asOf, '2023-11-20');
 // Katalogdagi MK sarlavhalari rasmiy matn bilan bir xil
 const n = s => HKCore.norm(s);
 for (const a of legal.articles.filter(a => a.doc === 'mk')) assert.equal(n(a.title), n(t(+a.art)), 'MK ' + a.art);
});

test('retrieval finds the key provisions for a multi-issue labour kazus and stays out of other topics', () => {
 const r = rag.retrieve(AZIZA, {k: 12, budget: 18000, force: true});
 for (const n of ['161', '163', '165', '172', '173', '560']) assert.ok(r.provided.has(n), 'MK ' + n);
 assert.ok(r.bands.size >= 2); assert.match(r.block, /\[MK 163-modda\./); assert.match(r.block, /\[Plenum 26-son, \d+-band\]/);
 assert.deepEqual([...rag.retrieve('MK 560 nima deydi?', {k: 3}).provided][0], '560');
 assert.deepEqual([...rag.retrieve('Kasal bo‘lib yotganimda ishdan bo‘shatishdi', {k: 5}).provided][0], '163');
 assert.equal(rag.retrieve('Aliment miqdori qancha?').block, '');
});

test('citation report confirms given articles and flags unknown or unsupplied ones', () => {
 const rep = rag.citationReport('MK 163-modda 1-qism 3-band; MK 165 va 173-moddalari; MK 562; MK 999. Plenumning 26-son qarori 22-bandi va 80-bandi.', new Set(['163', '165', '173']), {bands: new Set(['22']), eventDate: '2026-10-12'});
 assert.match(rep, /✅ Mehnat kodeksi[^\n]*MK 163, MK 165, MK 173/);
 assert.match(rep, /⚠️ Kodeksda bor[^\n]*MK 562/); assert.match(rep, /❌ Mehnat kodeksida bunday modda yo‘q: MK 999/);
 assert.match(rep, /✅ Plenum[^\n]*22-band/); assert.match(rep, /❌ Plenum 26-son qarorida bunday band yo‘q: 80-band/);
 assert.match(rep, /Voqea sanasi \(2026-10-12\)/);
});

test('kazus sends official passages to the AI and appends the citation check', async () => withKey(async () => {
 let sys = '';
 globalThis.fetch = async (url, options) => { sys = JSON.parse(options.body).system_instruction.parts[0].text; return sse(['data: ' + JSON.stringify(packet('Bo‘shatish MK 163-modda 1-qism 3-bandiga zid. MK 999 ham bor.', 'STOP'))]); };
 const res = await kazus(req({kazus: AZIZA, fan: 'mehnat', eventDate: '2026-10-12'}), {ip: 'test-' + sequence++});
 assert.equal(res.status, 200); const out = await res.text();
 assert.match(sys, /TASDIQLANGAN MANBA PARCHALARI/); assert.match(sys, /\[MK 163-modda\. Mehnat shartnomasini ish beruvchining tashabbusiga ko/);
 assert.match(out, /Manba tekshiruvi[\s\S]*✅[^\n]*MK 163[\s\S]*❌[^\n]*MK 999/);
}));

test('chat on a non-labour topic gets no labour passages; search marks official MK titles and fake articles', async () => withKey(async () => {
 let sys = '';
 globalThis.fetch = async (url, options) => { sys = JSON.parse(options.body).system_instruction.parts[0].text; return sse(['data: ' + JSON.stringify(packet('Aliment haqida javob', 'STOP'))]); };
 const res = await chat(req({messages: [{role: 'user', content: 'Aliment miqdori qancha bo‘ladi?'}]}), {ip: 'test-' + sequence++});
 await res.text(); assert.ok(!sys.includes('TASDIQLANGAN MANBA PARCHALARI'));
 const out = normalizeResult({natijalar: [{hujjat: 'Mehnat kodeksi', modda: '163', modda_nomi: 'noto‘g‘ri nom'}, {hujjat: 'Mehnat kodeksi', modda: '999'}]}, [], rag.retrieve('Kasallik davrida bo‘shatish', {k: 4}));
 assert.equal(out.natijalar[0].rasmiyMatn, 'berilgan'); assert.match(out.natijalar[0].moddaNomi, /taqiqlash/);
 assert.equal(out.natijalar[1].rasmiyMatn, 'yoq'); assert.ok(out.rasmiyParchalar.moddalar.some(m => m.art === '163'));
}));

// ---- v10.7: /api/status diagnostikasi va kalit xatolari ----
// Soxta kalitlar ish vaqtida yig'iladi: repozitoriyda haqiqiy kalit shaklidagi satr bo'lmasin (GitHub push protection).
const fakeKey = tag => ['AI', 'za', 'Sy'].join('') + tag.repeat(Math.ceil(33 / tag.length)).slice(0, 33);
const status = (await import('../netlify/functions/status.mjs')).default;
const gErr = (code, statusText, reason, message) => new Response(JSON.stringify({error: {code, status: statusText, message, details: reason ? [{'@type': 'type.googleapis.com/google.rpc.ErrorInfo', reason}] : []}}), {status: code});
const getStatus = async () => (await status(new Request('https://example.test/api/status'), {ip: 'test-' + sequence++})).json();

test('status explains a missing key, a leaked key and a referrer-restricted key without exposing it', async () => withKey(async () => {
 delete process.env.GEMINI_API_KEY;
 let s = await getStatus(); assert.equal(s.ok, false); assert.equal(s.sabab, 'kalit_yoq'); assert.match(s.xabar, /qayta deploy/);
 process.env.GEMINI_API_KEY = fakeKey('LEAKED');
 let calls = 0;
 globalThis.fetch = async () => { calls++; return gErr(403, 'PERMISSION_DENIED', null, 'Your API key was reported as leaked. Please use another API key.'); };
 s = await getStatus(); assert.equal(s.sabab, 'kalit_oshkor'); assert.equal(calls, 1, 'kalit xatosida boshqa modellar sinalmaydi');
 assert.ok(!JSON.stringify(s).includes('LEAKEDLEAKED'));
 globalThis.fetch = async () => gErr(403, 'PERMISSION_DENIED', 'API_KEY_HTTP_REFERRER_BLOCKED', 'Requests from referer <empty> are blocked.');
 s = await getStatus(); assert.equal(s.sabab, 'kalit_cheklovi');
 globalThis.fetch = async () => gErr(400, 'INVALID_ARGUMENT', 'API_KEY_INVALID', 'API key not valid. Please pass a valid API key.');
 s = await getStatus(); assert.equal(s.sabab, 'kalit_notogri');
 globalThis.fetch = async () => gErr(403, 'PERMISSION_DENIED', 'SERVICE_DISABLED', 'Generative Language API has not been used in project 123 before or it is disabled.');
 s = await getStatus(); assert.equal(s.sabab, 'api_yoqilmagan');
}));

test('status cleans a quoted key with spaces, falls back past an unavailable model and reports the working one', async () => withKey(async () => {
 const CLEAN = fakeKey('CLEAN'); process.env.GEMINI_API_KEY = '  "' + CLEAN + '"\n';
 const keys = [];
 globalThis.fetch = async (url, options) => { keys.push(options.headers['x-goog-api-key']); if (String(url).includes('gemini-3.8-flash')) return gErr(404, 'NOT_FOUND', null, 'models/gemini-3.8-flash is not found'); return new Response(JSON.stringify(packet('ok', 'STOP')), {status: 200}); };
 const s = await getStatus();
 assert.equal(s.ok, true); assert.equal(s.ishlaganModel, 'gemini-flash-latest'); assert.equal(s.kalit.tozalangan, true); assert.equal(s.kalit.odatiyFormat, true);
 assert.ok(keys.every(k => k === CLEAN));
 assert.ok(!JSON.stringify(s).includes('CLEANCLEAN'));
}));

test('chat shows the specific admin reason for a leaked key instead of a generic error', async () => withKey(async () => {
 let calls = 0;
 globalThis.fetch = async () => { calls++; return gErr(403, 'PERMISSION_DENIED', null, 'Your API key was reported as leaked.'); };
 const res = await chat(req({messages: [{role: 'user', content: 'Savol matni'}]}), {ip: 'test-' + sequence++});
 assert.equal(res.status, 503); assert.match((await res.json()).error, /oshkor/); assert.equal(calls, 1);
}));

test('Situations: unique ids/slugs, known group and icon, every cited MK article exists in the official text', () => {
 const appJs = read('public/app.js');
 const icons = new Set([...appJs.split('function getSvgIcon')[1].split('return icons')[0].matchAll(/^\s+([a-z]+):\s*`/gm)].map(m => m[1]));
 const mk = new Set(JSON.parse(read('data/laws/mk.json')).articles.map(a => a.art));
 const groups = ['Mehnat', 'Oila', 'Uy va pul', 'Xarid va internet', 'Davlat va ijtimoiy'];
 const ids = new Set(), slugs = new Set();
 assert.ok(legal.situations.length >= 32);
 for (const s of legal.situations) {
  assert.ok(!ids.has(s.id) && !slugs.has(s.slug), `takror: ${s.id}`); ids.add(s.id); slugs.add(s.slug);
  assert.ok(groups.includes(s.group), `guruh yo'q: ${s.id}`);
  assert.ok(icons.has(s.icon), `ikonka yo'q: ${s.icon}`);
  assert.ok(s.steps.length >= 3 && s.laws.length >= 1 && s.qs.length >= 2, `to'liq emas: ${s.id}`);
  const text = JSON.stringify(s);
  for (const m of text.matchAll(/MK (\d+)(?:, (\d+))?(?:, (\d+))?-modda/g))
   for (const n of m.slice(1).filter(Boolean)) assert.ok(mk.has(n), `${s.id}: MK ${n} rasmiy matnda yo'q`);
 }
});

test('Homepage shows 12 situations first, group chips filter the list', () => {
 const html = read('public/index.html');
 assert.match(html, /id="sit-groups"/); assert.match(html, /id="sit-more"/);
 const app = read('public/app.js');
 assert.match(app, /const SIT_PREVIEW = 12;/);
 assert.match(app, /!sitGroup \|\| s\.group === sitGroup/);
});

test('v11: Hidoya logo, Kazus ustaxonasi menu, language switcher, motion and public offer are wired in', () => {
 const html = read('public/index.html');
 assert.ok(!html.includes('<span class="brand-icon">§</span>'), 'eski § logotipi qolmasin');
 assert.match(html, /class="hidoya"/); assert.match(read('public/assets/favicon.svg'), /M17 59V33C17 22 25 15 32 11/);
 assert.match(html, /data-view="kazus">Kazus ustaxonasi<\/a><\/nav>/);
 for (const l of ['uz', 'cy', 'ru', 'en']) assert.match(html, new RegExp(`data-lang="${l}"`));
 assert.match(html, /<script src="motion\.js"><\/script><script src="consent\.js"><\/script><script src="accounts\.js"><\/script><script src="i18n\.js"><\/script>/);
 assert.match(html, /href="\/oferta\/">Ommaviy oferta<\/a>/);
 const oferta = read('public/oferta/index.html');
 assert.match(oferta, /369-modda/); assert.match(oferta, /370-modda/); assert.match(oferta, /Ijrochi rekvizitlari/);
 assert.match(read('public/sitemap.xml'), /\/oferta\/<\/loc>/);
 assert.match(read('public/vaziyat/otalikni-belgilash/index.html'), /<script src="\/i18n\.js"><\/script>/);
});

test('v11: Latin→Cyrillic transliteration and ru/en dictionary cover the main interface', () => {
 const src = read('public/i18n.js');
 const box = {};
 vm.runInNewContext(src.match(/const APOS[\s\S]*?function toCyr[\s\S]*?\n  }\n/)[0].replace(/\bconst /g, 'var ') + ';this.toCyr=toCyr;', box);
 assert.equal(box.toCyr('O‘zbekiston Respublikasi Konstitutsiyasi'), 'Ўзбекистон Республикаси Конституцияси');
 assert.equal(box.toCyr('yo‘l-yo‘riq, ma’lumot, ketsa'), 'йўл-йўриқ, маълумот, кетса');
 assert.equal(box.toCyr('YaTT, MChJ, FHDYo, elektron'), 'ЯТТ, МЧЖ, ФҲДЁ, электрон');
 assert.equal(box.toCyr('Lex.uz va AI yordamchi'), 'Lex.uz ва AI ёрдамчи');
 for (const k of ['Aqlli qidiruv', 'Kazus ustaxonasi', 'Huquqingizni biling.', 'Ommaviy oferta', 'Barcha vaziyatlarni ko‘rsatish', 'Mehnat'])
  assert.ok(src.includes(`"${k}": [`), `lug'atda yo'q: ${k}`);
 for (const s of legal.situations) assert.ok(src.includes(`"${s.title}": [`), `vaziyat sarlavhasi tarjimasiz: ${s.title}`);
});

test('v11: chosen interface language reaches the AI system prompt', async () => {
 const oldFetch = globalThis.fetch, oldKey = process.env.GEMINI_API_KEY; process.env.GEMINI_API_KEY = 'test-only-not-a-real-key';
 try {
  let sys = '';
  globalThis.fetch = async (url, options) => { sys = JSON.parse(options.body).system_instruction.parts[0].text; return sse(['data: ' + JSON.stringify(packet('Ответ', 'STOP'))]); };
  await (await chat(req({messages: [{role: 'user', content: 'Как взыскать алименты?'}], lang: 'ru'}), {ip: 'test-' + sequence++})).text();
  assert.match(sys, /JAVOB TILI: .*rus tilida/);
  await (await chat(req({messages: [{role: 'user', content: 'Aliment qanday undiriladi?'}]}), {ip: 'test-' + sequence++})).text();
  assert.ok(!sys.includes('JAVOB TILI'));
 } finally { globalThis.fetch = oldFetch; if (oldKey === undefined) delete process.env.GEMINI_API_KEY; else process.env.GEMINI_API_KEY = oldKey; }
});

test('v11.1: accounts — register, session cookie, saved items, logout, lockout; password stored only as scrypt hash', async () => {
 process.env.HK_DEV_MEMORY_STORE = '1';
 const {default: auth} = await import('../netlify/functions/auth.mjs');
 const {default: account} = await import('../netlify/functions/account.mjs');
 const {resetMemoryStore, openStore} = await import('../netlify/shared/store.mjs');
 const {userKey} = await import('../netlify/shared/auth.mjs');
 resetMemoryStore();
 const O = 'https://example.test';
 const R = (path, method = 'GET', body, cookie) => new Request(O + path, {method, headers: {origin: O, 'content-type': 'application/json', ...(cookie ? {cookie} : {})}, ...(body ? {body: JSON.stringify(body)} : {})});
 const call = async (fn, path, method, body, cookie) => { const r = await fn(R(path, method, body, cookie), {ip: 'acc-' + sequence++}); return {s: r.status, c: r.headers.get('set-cookie'), j: await r.json()}; };
 let r = await call(auth, '/api/auth/register', 'POST', {email: 'Talaba@Mail.uz', password: 'parol1234', name: 'Talaba', acceptOferta: true});
 assert.equal(r.s, 201); assert.match(r.c, /^hk_session=[\w-]{40,}; Path=\/; HttpOnly; SameSite=Lax; Max-Age=\d+; Secure$/);
 const stored = await (await openStore('users')).get(userKey('talaba@mail.uz'));
 assert.match(stored.pass, /^scrypt\$16384\$8\$1\$/); assert.ok(!JSON.stringify(stored).includes('parol1234'));
 assert.equal((await call(auth, '/api/auth/register', 'POST', {email: 'x@mail.uz', password: 'parol1234'})).s, 400, 'ofertasiz ro‘yxat yo‘q');
 const ck = r.c.split(';')[0];
 assert.equal((await call(auth, '/api/auth/me', 'GET', null, ck)).j.user.email, 'talaba@mail.uz');
 assert.equal((await call(account, '/api/account/items', 'POST', {op: 'add', type: 'kazus', title: 'Aziza', text: 'Tahlil '.repeat(10)}, ck)).s, 201);
 const list = (await call(account, '/api/account/items', 'GET', null, ck)).j.items; assert.equal(list.length, 1);
 assert.equal((await call(account, '/api/account/items', 'GET', null, 'hk_session=soxta')).s, 401);
 await call(auth, '/api/auth/logout', 'POST', {}, ck);
 assert.equal((await call(auth, '/api/auth/me', 'GET', null, ck)).j.user, null, 'chiqqandan keyin sessiya ishlamaydi');
 assert.equal((await call(auth, '/api/auth/login', 'POST', {email: 'talaba@mail.uz', password: 'xato1234'})).j.error, 'Email yoki parol noto‘g‘ri.');
 for (let i = 0; i < 8; i++) await call(auth, '/api/auth/login', 'POST', {email: 'talaba@mail.uz', password: 'xato' + i + 'abcd'});
 assert.equal((await call(auth, '/api/auth/login', 'POST', {email: 'talaba@mail.uz', password: 'parol1234'})).s, 429, 'ko‘p xatodan keyin vaqtincha bloklanadi');
 const cross = await auth(new Request(O + '/api/auth/login', {method: 'POST', headers: {origin: 'https://yomon.example', 'content-type': 'application/json'}, body: '{}'}), {ip: 'acc-x'});
 assert.equal(cross.status, 403, 'begona saytdan so‘rov rad etiladi');
});

test('v11.1: cookie consent gates remembered language and theme; banner and account UI are wired', () => {
 const html = read('public/index.html');
 assert.match(html, /id="account-btn"/); assert.match(html, /id="auth-dialog"/); assert.match(html, /id="view-account"/);
 assert.match(html, /id="kazus-save"/); assert.match(html, /id="chat-save"/); assert.match(html, /data-cookie-settings>Cookie sozlamalari/);
 assert.match(read('public/consent.js'), /Hammasini qabul qilish/);
 assert.match(read('public/i18n.js'), /HK_CONSENT\.allowed\("prefs"\)[^\n]*localStorage\.setItem\("hk-lang"/);
 assert.match(read('public/ui.js'), /HK_CONSENT\.allowed\("prefs"\)[^\n]*localStorage\.setItem\("hk-theme"/);
 assert.match(read('public/app.js'), /\['chat','kazus','explain','account'\]/);
 assert.match(read('public/vaziyat/otalikni-belgilash/index.html'), /consent\.js/);
});

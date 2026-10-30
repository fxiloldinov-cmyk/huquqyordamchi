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

test('redactPII hides phone, card, JSHSHIR and passport but keeps articles and amounts', async () => {
 const {redactPII}=await import('../netlify/shared/common.mjs');
 const out=redactPII('Tel: +998 90 123-45-67, 901234567. Karta 8600 1234 5678 9012. JSHSHIR 31234567890123. Pasport AA1234567. JK 278-2, MK 560-modda, 8 500 000 so‘m, 2026-10-29.');
 for (const leak of ['123-45-67','901234567','8600 1234','31234567890123','AA1234567']) assert.ok(!out.includes(leak), leak);
 for (const keep of ['278-2','560-modda','8 500 000','2026-10-29']) assert.ok(out.includes(keep), keep);
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

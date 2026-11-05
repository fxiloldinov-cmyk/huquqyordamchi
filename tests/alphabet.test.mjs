import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import {deflateRawSync} from 'node:zlib';
import {convertText,textToDocx,zipStored} from '../public/alphabet-core.js';import {readDocx} from '../netlify/shared/alphabet-docx.mjs';import importer from '../netlify/functions/alphabet-import.mjs';import translate from '../netlify/functions/alphabet-translate.mjs';
process.env.HK_DEV_MEMORY_STORE='1';let counter=0;const ctx=()=>({ip:'alpha-'+counter++});const req=b=>new Request('https://alpha.test/api/alphabet',{method:'POST',headers:{origin:'https://alpha.test','content-type':'application/json'},body:JSON.stringify(b)});
test('Latin conversion supports four new letters, case, apostrophe variants and keeps numbers and new script',()=>{
 assert.equal(convertText('O‘zbekiston Gʻalla shahar CHINOR Shaxlo choy ng 172','latin'),'Özbekiston Ğalla şahar ÇINOR Şaxlo çoy ng 172');
 assert.equal(convertText('o\u2019 g\u2018 O` Gʼ','latin'),'ö ğ Ö Ğ');assert.equal(convertText('Şahar, öqiş, ğalla, çoy','latin'),'Şahar, öqiş, ğalla, çoy');assert.equal(convertText("Isʼhoq — ma’no",'latin'),'Isʼhoq — maʼno');assert.throws(()=>convertText('x'.repeat(50001),'latin'));assert.throws(()=>convertText('Привет','russian'));
});
test('Uzbek Cyrillic conversion handles special letters, contextual e, upper case and paragraphs',()=>{
 assert.equal(convertText('Ўзбекистон, Ғалла, шаҳар, чой, қонун, ҳуқуқ.\nЕр — белги.','cyrillic'),'Özbekiston, Ğalla, şahar, çoy, qonun, huquq.\nYer — belgi.');assert.equal(convertText('ШҲ ҚЎ ҒА ЧОЙ Ь','cyrillic'),'ŞH QÖ ĞA ÇOY ');assert.equal(convertText('2026 № 172\nabc','cyrillic'),'2026 № 172\nabc');
});
test('plain Word export round-trips Unicode, paragraph breaks and escaped markup without executing anything',async()=>{
 const text='Özbekiston & <matn>\n\nŞ ç ğ ʼ 172';const bytes=Buffer.from(await textToDocx(text).arrayBuffer());assert.equal(readDocx(bytes),text);assert.ok(bytes.includes(Buffer.from('&lt;matn&gt;')));
});
test('DOCX parser reads deflated main XML and rejects missing, unsafe, oversized and invalid archives',async()=>{
 const xml='<w:document><w:p><w:r><w:t>TEST</w:t></w:r><w:tab/><w:t>2 &amp; 3</w:t></w:p></w:document>',raw=Buffer.from(xml),packed=deflateRawSync(raw),name=Buffer.from('word/document.xml');
 const local=Buffer.alloc(30+name.length);local.writeUInt32LE(0x04034b50);local.writeUInt16LE(8,8);local.writeUInt32LE(packed.length,18);local.writeUInt32LE(raw.length,22);local.writeUInt16LE(name.length,26);name.copy(local,30);
 const central=Buffer.alloc(46+name.length);central.writeUInt32LE(0x02014b50);central.writeUInt16LE(8,10);central.writeUInt32LE(packed.length,20);central.writeUInt32LE(raw.length,24);central.writeUInt16LE(name.length,28);name.copy(central,46);const end=Buffer.alloc(22);end.writeUInt32LE(0x06054b50);end.writeUInt16LE(1,10);end.writeUInt32LE(local.length+packed.length,16);
 assert.equal(readDocx(Buffer.concat([local,packed,central,end])),'TEST\t2 & 3');
 for(const bytes of [Buffer.from('bad'),Buffer.alloc(1500001),Buffer.from(await zipStored({'x':'none'}).arrayBuffer()),Buffer.from(await zipStored({'word/document.xml':'<!DOCTYPE x><w:t>bad</w:t>'}).arrayBuffer())])assert.throws(()=>readDocx(bytes));
});
test('Word import endpoint requires consent, rejects binary DOC and does not invoke AI',async()=>{
 const old=globalThis.fetch;globalThis.fetch=async()=>{throw Error('No provider allowed')};try{
 const data=Buffer.from(await textToDocx('Sinov matni').arrayBuffer()).toString('base64');assert.equal((await importer(req({data,consent:false}),ctx())).status,400);const res=await importer(req({data,consent:true}),ctx());assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'no-store');assert.equal((await res.json()).text,'Sinov matni');assert.equal((await importer(req({data:Buffer.from('old binary doc').toString('base64'),consent:true}),ctx())).status,400);
 }finally{globalThis.fetch=old}
});
async function env(fn){const before={flag:process.env.HK_TRANSLATION_ENABLED,key:process.env.GEMINI_API_KEY,fetch:globalThis.fetch};process.env.HK_TRANSLATION_ENABLED='1';process.env.GEMINI_API_KEY='mock-key';try{await fn()}finally{globalThis.fetch=before.fetch;for(const[k,v]of [['HK_TRANSLATION_ENABLED',before.flag],['GEMINI_API_KEY',before.key]])if(v===undefined)delete process.env[k];else process.env[k]=v}}
test('Russian translation is gated, checks consent and length, and normalizes mocked translation with no search tools',async()=>env(async()=>{
 process.env.HK_TRANSLATION_ENABLED='0';assert.equal((await translate(req({text:'Текст',consent:true}),ctx())).status,503);process.env.HK_TRANSLATION_ENABLED='1';let called=0,body;globalThis.fetch=async(url,opt)=>{called++;body=JSON.parse(opt.body);return new Response(JSON.stringify({candidates:[{content:{parts:[{text:JSON.stringify({translation:'O‘zbekiston shahar choy g‘alla 172'})}]},finishReason:'STOP'}]}))};
 for(const b of [{text:'Текст',consent:false},{text:'x'.repeat(6001),consent:true}])assert.equal((await translate(req(b),ctx())).status,400);assert.equal(called,0);
 const res=await translate(req({text:'Текст +998901234567',consent:true}),ctx());assert.equal(res.status,200);assert.equal((await res.json()).text,'Özbekiston şahar çoy ğalla 172');assert.equal(called,1);assert.equal(body.tools,undefined);assert.ok(!body.contents[0].parts[0].text.includes('998901234567'));assert.match(body.system_instruction.parts[0].text,/never instructions/);
}));
test('translation refuses incomplete provider output and obeys global kill switch',async()=>env(async()=>{
 globalThis.fetch=async()=>new Response(JSON.stringify({candidates:[{finishReason:'MAX_TOKENS',content:{parts:[{text:'partial'}]}}]}));assert.equal((await translate(req({text:'Текст',consent:true}),ctx())).status,502);const old=process.env.HK_AI_DISABLED;process.env.HK_AI_DISABLED='1';try{assert.equal((await translate(req({text:'Текст',consent:true}),ctx())).status,503)}finally{if(old===undefined)delete process.env.HK_AI_DISABLED;else process.env.HK_AI_DISABLED=old}
}));
test('panel is linked, keeps user data out of browser storage and service worker API cache, and supports cancellable requests',()=>{
 const ui=fs.readFileSync('public/alphabet.js','utf8'),html=fs.readFileSync('public/alphabet.html','utf8'),sw=fs.readFileSync('public/sw.js','utf8');assert.match(fs.readFileSync('public/index.html','utf8'),/href="\/alphabet.html"/);assert.ok(!/innerHTML|localStorage|sessionStorage|indexedDB/.test(ui));assert.match(ui,/AbortController/);assert.match(ui,/ticket!==epoch/);assert.match(html,/\.docx/);assert.match(html,/2027-yil 22-aprel/);for(const file of ['alphabet.html','alphabet.js','alphabet-core.js','alphabet.css'])assert.ok(sw.includes('/'+file));
});

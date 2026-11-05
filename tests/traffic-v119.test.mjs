import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {trafficQuestion,trafficCoverageNotice,loadTrafficRules} from '../netlify/shared/traffic.mjs';
import search from '../netlify/functions/search.mjs';
import chat from '../netlify/functions/chat.mjs';
import kazus from '../netlify/functions/kazus.mjs';
import international from '../netlify/functions/international.mjs';
const ROOT=new URL('../',import.meta.url),O='https://example.test';
const R=(path,body)=>new Request(O+path,{method:'POST',headers:{origin:O,'content-type':'application/json'},body:JSON.stringify(body)});
test('missing traffic rules still block all endpoints in an isolated source tree',async()=>{
 for(const q of ['YPX yo‘l belgisiga ko‘ra meni to‘xtatdi','ЙПХ йўл белгиси бўйича савол','YHQ 3-band','road signs and traffic rules','ДПС остановила возле дорожного знака'])assert.equal(trafficQuestion(q),true,q);
 assert.match(trafficCoverageNotice('YPX yo‘l belgisi',{yhq:null}),/bazada bu qoida yo‘q/);
 await fs.mkdir(new URL('.work-v119/',ROOT),{recursive:true});const dir=await fs.mkdtemp(new URL('.work-v119/no-traffic-',ROOT));
 try{for(const name of ['netlify','public','data','package.json'])await fs.cp(new URL(name,ROOT),dir+'/'+name,{recursive:true});
 await fs.rm(dir+'/data/laws/yhq.json');await fs.rm(dir+'/data/laws/ypx975.json');
 const out=execFileSync(process.execPath,['--input-type=module','-e',`import assert from 'node:assert/strict';import search from './netlify/functions/search.mjs';import chat from './netlify/functions/chat.mjs';import kazus from './netlify/functions/kazus.mjs';import international from './netlify/functions/international.mjs';
 process.env.HK_INTERNATIONAL_ENABLED='1';let calls=0;globalThis.fetch=async()=>{calls++;throw Error('forbidden')};const q='YPX yo‘l belgisiga ko‘ra haydovchini to‘xtatdi. Qaysi qoida qo‘llanishini tushuntiring.';const R=(p,b)=>new Request('https://example.test'+p,{method:'POST',headers:{origin:'https://example.test','content-type':'application/json'},body:JSON.stringify(b)});
 assert.match((await(await search(R('/api/search',{query:q}),{})).json()).xulosa,/bazada bu qoida yo‘q/);
 for(const [h,p,b]of [[chat,'/api/chat',{messages:[{role:'user',content:q}]}],[kazus,'/api/kazus',{kazus:q}],[international,'/api/international',{type:'travel',topic:'transport',facts:q,consent:true}]])assert.match(await(await h(R(p,b),{})).text(),/bazada bu qoida yo‘q/);
 assert.equal(calls,0);console.log('blocked without sources');`],{cwd:dir,encoding:'utf8'});assert.match(out,/blocked without sources/);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});
// Python o‘rnatilmagan kompyuterda bu tekshiruv o‘tkazib yuboriladi; CI’da ishlaydi.
const noPython=(()=>{try{execFileSync('python3',['--version'],{stdio:'pipe'});return false}catch{return 'python3 topilmadi'}})();
test('importer requires section boundaries and preserves synthetic input bytes',{skip:noPython},async()=>{
 const m=JSON.parse(await fs.readFile(new URL('data/laws/manifest.json',ROOT)));assert.equal(m.yhq.status,'imported');assert.ok(m.yhq.articles>0);
 await fs.mkdir(new URL('.work-v119/',ROOT),{recursive:true});const dir=await fs.mkdtemp(new URL('.work-v119/traffic-import-',ROOT));
 try{
 const src=dir+'/input.doc',out=dir+'/output.json';
 // Format sinovi. Quyidagi markerlar huquqiy qoida mazmuni emas.
 await fs.writeFile(src,'<div class="ACT_TITLE">IMPORT_TEST_DOCUMENT</div><div class="PUBLICATION_ORIGIN">01.11.2026-y.</div><div class="ACT_TEXT">1. WRONG_SECTION_ROW</div><div class="ACT_TEXT">IMPORT_TEST_START</div><div class="ACT_TEXT">1. IMPORT_TEST_ROW_A</div><div class="ACT_TEXT">2. IMPORT_TEST_ROW_B</div>');
 assert.throws(()=>execFileSync('python3',['scripts/import_lexuz.py',src,out,'--doc','yhq'],{cwd:ROOT,stdio:'pipe'}));
 execFileSync('python3',['scripts/import_lexuz.py',src,out,'--doc','yhq','--lex-id','-1','--start-at','IMPORT_TEST_START'],{cwd:ROOT,stdio:'pipe'});
 const data=JSON.parse(await fs.readFile(out));assert.equal(data.kind,'band');assert.deepEqual(data.articles.map(a=>a.parts),[['1. IMPORT_TEST_ROW_A'],['2. IMPORT_TEST_ROW_B']]);
 assert.equal(loadTrafficRules(out).articles.length,2);
 await fs.mkdir(dir+'/data/laws',{recursive:true});await fs.copyFile(out,dir+'/data/laws/yhq.json');
 const check=execFileSync(process.execPath,['--input-type=module','-e',`import {retrieve,sourcesPayload} from ${JSON.stringify(new URL('netlify/shared/rag.mjs',ROOT).href)}; const r=retrieve('YHQ 1'); const p=sourcesPayload('YHQ 1-band',r);console.log(JSON.stringify({found:r.provided.yhq?.has('1'),label:p.passages.find(p=>p.code==='YHQ')?.label}));`],{cwd:dir,encoding:'utf8'});
 const loaded=JSON.parse(check);assert.equal(loaded.found,true);assert.match(loaded.label,/1-band/);
 data.articles=[];await fs.writeFile(out,JSON.stringify(data));assert.equal(loadTrafficRules(out),null);
 }finally{await fs.rm(dir,{recursive:true,force:true})}
});

test('traffic follow-up coverage notice retains missing-source semantics',()=>{
 assert.match(trafficCoverageNotice('YPX yol belgisi haqida savol bor\nShu holatni tushuntiring.',{yhq:null}),/bazada bu qoida yo‘q/);
});

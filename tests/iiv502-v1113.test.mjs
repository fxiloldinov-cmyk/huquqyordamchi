import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import os from 'node:os';import path from 'node:path';import {createHash} from 'node:crypto';
import {parseBands,cleanLines} from '../scripts/import-band-text.mjs';
import {loadBandLaw,notInForce} from '../netlify/shared/traffic.mjs';
import {LAWS} from '../netlify/shared/rag.mjs';
const sha=f=>createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const doc=JSON.parse(fs.readFileSync(new URL('../data/pending/iiv502.json',import.meta.url),'utf8'));
test('IIV 502: 118 band, manba xeshlari va qayta import natijasi bir xil',()=>{
 assert.equal(doc.articles.length,118);assert.deepEqual(doc.articles.map(a=>a.art),Array.from({length:118},(_,i)=>String(i+1)));
 assert.equal(sha(doc.provenance.file),doc.provenance.sha256);assert.equal(sha(doc.provenance.pdf),doc.provenance.pdfSha256);assert.equal(doc.provenance.annexImagesInterpreted,false);
 const again=parseBands(fs.readFileSync(doc.provenance.file,'utf8'),doc.provenance.bounds);assert.deepEqual(again,doc.articles);
 assert.equal(new Set(doc.articles.map(a=>a.bob)).size,7);assert.ok(doc.articles.find(a=>a.art==='19').parts.join(' ').includes('332¹-moddasi'));
 const all=doc.articles.flatMap(a=>a.parts).join('\n');assert.doesNotMatch(all,/QMMB|ILOVA|===== PAGE/);assert.equal(doc.articles.at(-1).parts.length,1);
});
test('import: sahifa pastki yozuvi tashlanadi, daraja raqamlari qo‘shiladi',()=>{
 assert.deepEqual(cleanLines('Kodeksning 332\n1\n-moddasi\n7\nQMMB: 10/26/3969/1107-son\n06.11.2026-y.\n128\n10\n, 131'),['Kodeksning 332¹-moddasi','128¹⁰, 131']);
});
test('lex.uz havolasisiz hujjat javoblarda ishlatilmaydi; havola va tasdiqlangan yuridik ko‘rik bo‘lgandagina ulanadi',()=>{
 assert.equal(doc.url,null);assert.equal(LAWS.iiv502,undefined);assert.equal(loadBandLaw('iiv502'),null);
 const tmp=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'iiv502-')),'iiv502.json');fs.writeFileSync(tmp,JSON.stringify({...doc,lexId:'-1',url:'https://lex.uz/docs/-1'}));
 assert.equal(loadBandLaw('iiv502',tmp),null);assert.equal(doc.effectiveFrom,null);assert.equal(doc.proposedEffectiveFrom,'2027-01-07');
 fs.writeFileSync(tmp,JSON.stringify({...doc,lexId:'-1',url:'https://lex.uz/docs/-1',effectiveFrom:'2027-01-07',effectiveDateVerified:true,legalReview:{status:'approved'}}));
 const law=loadBandLaw('iiv502',tmp);assert.equal(law.short,'IIV502');
 assert.match(notInForce(law,'2026-12-01'),/HALI KUCHGA KIRMAGAN: 2027-01-07/);assert.equal(notInForce(law,'2027-01-07'),'');assert.equal(notInForce({...law,effectiveFrom:undefined},'2026-12-01'),'');
 fs.writeFileSync(tmp,JSON.stringify({...doc,url:'https://lex.uz/docs/-1',effectiveFrom:'2027 yanvar'}));assert.equal(loadBandLaw('iiv502',tmp),null);
});
test('qamrov sahifasi tekshirilmagan hujjatni "ulanmagan" ro‘yxatida ko‘rsatadi',()=>{
 const cov=JSON.parse(fs.readFileSync(new URL('../public/coverage.json',import.meta.url),'utf8'));
 assert.ok(cov.notConnected.some(n=>n.name===doc.name&&/lex\.uz havolasi hali yo‘q/.test(n.why)));assert.ok(!cov.docs.some(d=>d.doc==='iiv502'));
});

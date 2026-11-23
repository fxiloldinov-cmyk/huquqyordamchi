// Codex qayta auditi birlashtirilgandan keyingi tuzatishlar (docs/AUDIT_CODEX_ZIP_2026_11_08_UZ.md, 2–6-bandlar).
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {sourceMetadata,publicSourceMetadata,integrityLabel,lawContentHash} from '../netlify/shared/source-integrity.mjs';
import {retrieve,sourcesPayload,LAWS} from '../netlify/shared/rag.mjs';
const status=JSON.parse(fs.readFileSync(new URL('../data/source-status.json',import.meta.url),'utf8'));
test('egasining umumiy tasdig‘i saytda "yurist ko‘rigidan o‘tgan" deb ko‘rsatilmaydi',()=>{
 for(const id of ['mk','jk','fk1']){const m=sourceMetadata(LAWS[id]);assert.doesNotMatch(integrityLabel(m),/yurist ko‘rigidan o‘tgan/);assert.equal('textReview' in publicSourceMetadata(LAWS[id]),false);}
 const p=sourcesPayload('MK 163-modda.',retrieve('MK 163-modda',{k:1}));assert.ok(p.passages.length);
 for(const x of p.passages){assert.equal('textReview' in x,false);assert.doesNotMatch(x.integrityNote||'',/yurist ko‘rigidan o‘tgan/);}
 const cov=fs.readFileSync(new URL('../public/coverage.json',import.meta.url),'utf8');assert.doesNotMatch(cov,/"textReview"/);
});
test('kodeks xeshi keshlanadi, lekin moddalar almashsa qayta hisoblanadi',()=>{
 const law={doc:'x',asOf:'2026-01-01',url:'https://lex.uz/docs/-1',articles:[{art:'1',parts:['a']}]};
 const h1=lawContentHash(law);assert.equal(lawContentHash(law),h1);
 law.articles=[{art:'1',parts:['b']}];assert.notEqual(lawContentHash(law),h1);
 const t=process.hrtime.bigint();for(let i=0;i<50;i++)lawContentHash(LAWS.sk);assert.ok(Number(process.hrtime.bigint()-t)/1e6<200,'50 ta chaqiruv keshdan tez qaytsin');
});
test('bazadagi har bir qonun matni tekshirilgan xeshga mos (aks holda build to‘xtaydi)',()=>{
 for(const f of fs.readdirSync(new URL('../data/laws/',import.meta.url)).filter(f=>f.endsWith('.json')&&f!=='manifest.json')){
  const law=JSON.parse(fs.readFileSync(new URL('../data/laws/'+f,import.meta.url),'utf8')),a=status.documents?.[law.doc];
  if(a){assert.equal(a.localAsOf,law.asOf,law.doc);assert.equal(a.localContentSha256,lawContentHash(law),law.doc);}
 }
 assert.match(fs.readFileSync(new URL('../scripts/build-data.mjs',import.meta.url),'utf8'),/Manba holati eskirgan[\s\S]*process\.exit\(1\)/);
});
test('kazus: sana berilmasa AI’ga "null" emas, "ko‘rsatilmagan" boradi',()=>{
 const src=fs.readFileSync(new URL('../netlify/functions/kazus.mjs',import.meta.url),'utf8');
 assert.match(src,/Voqea sanasi: \$\{eventDate \|\| "ko‘rsatilmagan"\}/);assert.doesNotMatch(src,/Voqea sanasi: \$\{eventDate\}\\n/);
});
test('saqlangan ishda manba cheklovi, tashqi havolalar va izohlar yo‘qolmaydi',async()=>{
 process.env.HK_DEV_MEMORY_STORE='1';
 const src=fs.readFileSync(new URL('../netlify/functions/cases.mjs',import.meta.url),'utf8');
 for(const k of ['withheld','externalSources','integrityNote','eventDate'])assert.ok(src.includes(k),k);
 assert.match(src,/origin: "external-search", verified: false/);
});
test('Windows yo‘llari: tasdiqlash skriptlari URL.pathname emas, fileURLToPath ishlatadi',()=>{
 for(const f of ['approve-law-review.mjs','check-law-updates.mjs']){const s=fs.readFileSync(new URL('../scripts/'+f,import.meta.url),'utf8');assert.doesNotMatch(s,/new URL\([^)]*\)\.pathname[,;)]|target\.pathname/,f);assert.match(s,/fileURLToPath/,f);}
});

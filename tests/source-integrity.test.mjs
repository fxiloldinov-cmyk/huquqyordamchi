import test from 'node:test';
import assert from 'node:assert/strict';
import {validLegalDate,sourceOrigin,applicability,sourceMetadata,publicSourceMetadata,integrityLabel,lawContentHash,passageRestriction} from '../netlify/shared/source-integrity.mjs';
import {publicationDate,auditDocument} from '../scripts/source-audit.mjs';
import {retrieve,sourcesPayload,claimChecks,articleInfo,changeDates,retrievalNotice,LAWS} from '../netlify/shared/rag.mjs';
import {normalizeResult} from '../netlify/functions/search.mjs';
const law={doc:'sample',url:'https://lex.uz/docs/-12',asOf:'2026-01-01',articles:[{art:'1',parts:['Matn.'],changes:[]}]};

test('legal dates reject impossible dates and preserve leap days',()=>{
 for(const value of ['2026-02-29','2026-13-01','2026-00-12','2026-04-31','2026-1-01','not-a-date'])assert.equal(validLegalDate(value),false,value);
 assert.equal(validLegalDate('2024-02-29'),true);
});
test('an exact Lex.uz document URL is distinguished from search and hostile hosts',()=>{
 assert.equal(sourceOrigin(law.url),'lex-document-link');
 for(const url of ['https://lex.uz.evil.example/docs/-12','https://evil.example/?lex.uz/docs/-12','https://lex.uz/search/all?searchtitle=test','http://lex.uz/docs/-12','https://user:password@lex.uz/docs/-12','javascript:alert(1)'])assert.equal(sourceOrigin(url),'external-unverified');
});
test('publication extraction ignores dates in other acts, future notices and invalid calendar dates',()=>{
 const html='<p>04.11.2026-y.</p><div class="PUBLICATION_ORIGIN"><div>12.09.2026-y.; 31.02.2026-y.; 01.01.2099-y.</div></div>';
 assert.equal(publicationDate(html,'2026-11-08'),'2026-09-12');
 assert.equal(publicationDate('<p>04.11.2026-y.</p>'),null);
});
test('HTTP 200 and a matching date cannot certify a search page or legal conclusion',async()=>{
 const search=await auditDocument(law,{fetcher:async()=>({ok:true,status:200,url:'https://lex.uz/search/all',text:async()=>'<title>Qidiruv</title>'})});
 assert.equal(search.state,'identity-unverified');
 const good=await auditDocument(law,{fetcher:async()=>({ok:true,status:200,url:law.url,text:async()=>'<div class="ACT_TITLE">Act</div><div class="PUBLICATION_ORIGIN">01.01.2026-y.</div>'})});
 assert.equal(good.state,'publication-date-matches');assert.equal(good.textCompared,false);assert.equal(good.effectiveDateVerified,false);
});
test('date applicability distinguishes publication, effectivity and absent historical text',()=>{
 // Nusxa sanasidan oldingi voqea butun hujjatni yopmaydi; o‘zgartirilgan moddalar rag.mjs da alohida cheklanadi.
 assert.equal(applicability(law,'2025-12-31'),'effective-date-unverified');
 assert.equal(applicability({...law,effectiveFrom:'2027-01-01'},'2026-12-31'),'not-yet-effective');
 assert.equal(applicability({...law,effectiveFrom:'2026-01-01',effectiveTo:'2026-03-01',effectiveDateVerified:true},'2026-03-01'),'expired');
 assert.equal(applicability(law,'2026-03-01'),'effective-date-unverified');
 assert.equal(applicability(law,'2026-02-30'),'invalid-event-date');
});
test('old-event retrieval withholds only articles amended after the event; unchanged articles of the same code stay available',()=>{
 const ev='2026-10-14';
 const amended=LAWS.mk.articles.find(a=>changeDates(a).some(d=>d>ev)),plain=LAWS.mk.articles.find(a=>!a.changes.length&&a.parts.join(' ').length>200);
 assert.ok(amended&&plain,'MK da voqeadan keyin o‘zgargan va o‘zgarmagan modda topilsin');
 const r=retrieve(`MK ${amended.art}-modda`,{k:1,eventDate:ev});
 assert.equal(r.provided.mk.has(amended.art),false);assert.ok(r.withheld.some(w=>w.reason==='historical-text-unavailable'&&w.art===amended.art));
 assert.ok(!r.block.includes(`[MK ${amended.art}-modda`));assert.match(retrievalNotice(r),new RegExp(`${amended.art}[^)]*-modda`));
 const p=sourcesPayload(`MK ${amended.art}-modda asosida bo‘shatish mumkin emas.`,r);assert.equal(p.claims[0].given,false);assert.equal(p.claims[0].reviewed,false);
 // MK tahriri 2026-10-15; voqea undan bir kun oldin bo‘lsa ham o‘zgarmagan modda beriladi (avval butun MK yashirinardi).
 const ok=retrieve(`MK ${plain.art}-modda`,{k:1,eventDate:ev});assert.equal(ok.provided.mk.has(plain.art),true);assert.ok(!ok.withheld.some(w=>w.art===plain.art));
});
test('known newer publication warns instead of blacking out the whole code; differing articles stay blocked',()=>{
 const registry={documents:{sample:{localAsOf:law.asOf,localContentSha256:lawContentHash(law),checkedAt:new Date().toISOString(),state:'newer-publication'}}};
 assert.equal(passageRestriction(law,null,'1',registry),null);
 const m=sourceMetadata(law,null,registry);assert.equal(m.freshness,'newer-publication');assert.match(integrityLabel(m),/yangi nashr bor/);
 assert.match(retrievalNotice({withheld:[],stale:['Namuna kodeksi']}),/yangiroq tahrir chiqqan: Namuna kodeksi/);
 const r=retrieve('JK 169-modda',{k:1});assert.equal(r.provided.jk.has('169'),true);
 const c=claimChecks('JK 169-modda asosida javobgarlik belgilanishi mumkin.',r.provided).claims[0];assert.equal(c.given,true);assert.equal(c.reviewed,false);
});
test('expired audits and a changed local text do not inherit a prior verification',()=>{
 const audit={documents:{sample:{localAsOf:law.asOf,localContentSha256:lawContentHash(law),checkedAt:'2026-11-01T00:00:00Z',state:'publication-date-matches',textCompared:true}}};
 const current=sourceMetadata(law,null,audit,Date.parse('2026-11-02T00:00:00Z'));assert.equal(current.freshness,'publication-date-matches');assert.equal(current.verified,false);assert.equal(current.legalConclusionReviewed,false);
 assert.equal(sourceMetadata(law,null,audit,Date.parse('2026-11-10T00:00:00Z')).freshness,'check-expired');
 assert.equal(sourceMetadata({...law,articles:[]},null,audit,Date.parse('2026-11-02T00:00:00Z')).freshness,'local-content-changed');
});
test('a quotation found in a different paragraph does not validate the cited paragraph',()=>{
 const a=LAWS.mk.articles.find(a=>a.art==='163');
 // Choose text from a distinct paragraph, requiring the wrong first paragraph to fail.
 const parts=a.parts.filter(p=>p.length>35);const q=parts.at(-1).slice(0,80);
 const c=claimChecks(`MK 163-modda 1-qism: «${q}».`,{mk:new Set(['163'])}).claims[0];
 if(!parts[0].includes(q))assert.equal(c.quote.found,false);
});
test('search quotation and conclusion checks stay independent of catalog matches',()=>{
 const r=normalizeResult({natijalar:[{hujjat:'Mehnat kodeksi',modda:'163',nima_uchun:'Xodim huquqi.',iqtibos:'Bunday iqtibos qonunda mavjud emas xyz123.'}]},[],retrieve('MK 163-modda'));
 assert.equal(r.natijalar[0].articleExists,true);assert.equal(r.natijalar[0].iqtibosTekshiruvi.found,false);assert.equal(r.natijalar[0].legalConclusionReviewed,false);
 assert.equal(r.natijalar[0].origin,'local-database');assert.ok(articleInfo('163').integrity);
});
test('offline ranking candidates cannot be serialized as answer evidence',()=>{
 assert.throws(()=>sourcesPayload('',retrieve('JK 169-modda',{auditCandidates:true})),/Offline candidates/);
});

test('same publication date does not hide differences; an approved replacement clears only its own restriction',()=>{
 const registry={documents:{sample:{localAsOf:law.asOf,localContentSha256:lawContentHash(law),checkedAt:new Date().toISOString(),state:'indexed-text-differs',changedArticles:['1']}}};
 assert.equal(passageRestriction(law,null,'1',registry),'indexed-text-differs');
 assert.equal(passageRestriction(law,null,'2',registry),null);
 const meta=sourceMetadata(LAWS.fk1);assert.equal(meta.indexedTextMatches,true);assert.deepEqual(meta.changedArticles,[]);assert.equal(meta.textReview?.status,'approved');
 const r=retrieve('FK 288-modda',{k:1});assert.equal(r.provided.fk.has('288'),true);
});

test('approval rejects a changed candidate hash, absent reviewer and incomplete amendment review',async()=>{
 const {validateReview}=await import('../scripts/approve-law-review.mjs');
 const candidate={...law,asOf:'2026-02-01',articles:[{art:'1',title:'Norma',parts:['O‘zgartirilgan huquqiy matn.'],changes:[]}]},raw=Buffer.from(JSON.stringify(candidate));
 const errors=validateReview({status:'pending',doc:law.doc,amendments:[]},candidate,raw,law).join(' ');
 assert.match(errors,/Yurist/);assert.match(errors,/xesh/);assert.match(errors,/Kuchga kirish/);assert.match(errors,/o‘zgartirish sanalari/);
});

test('an approved candidate is promoted with an archive and its source/effective-date evidence',async()=>{
 const {mkdtemp,mkdir,writeFile,readFile,rm,readdir}=await import('node:fs/promises');
 const {tmpdir}=await import('node:os'),{join}=await import('node:path'),{pathToFileURL}=await import('node:url');
 const {createHash}=await import('node:crypto'),{gunzipSync}=await import('node:zlib');
 const {approveReview}=await import('../scripts/approve-law-review.mjs');
 const dir=await mkdtemp(join(tmpdir(),'legal-approval-')),root=pathToFileURL(dir+'/');
 const hash=b=>createHash('sha256').update(b).digest('hex');
 try{
  for(const folder of ['data/laws','data/review/candidates','data/review/snapshots'])await mkdir(join(dir,folder),{recursive:true});
  const old={...law,kind:'modda',name:'Sinov hujjati',articles:[{art:'1',title:'Norma',parts:['Avvalgi sinov huquqiy matni.'],changes:[]}]};
  const fresh={...old,asOf:'2026-02-01',publishedAt:'2026-02-01',articles:[{art:'1',title:'Norma',parts:['Yangilangan sinov huquqiy matni.'],changes:[]}]};
  const raw=JSON.stringify(fresh),snapshot='<div class="ACT_TITLE">Sinov hujjati</div>';
  const review={doc:'sample',candidateFile:'sample.json',candidateSha256:hash(raw),sourceUrl:law.url,sourceSha256:hash(snapshot),status:'approved',reviewer:'Sinov yuristi',reviewedAt:'2026-11-08',effectiveDateVerified:true,effectiveFrom:'2026-02-01',amendments:[{art:'1',publishedAt:'2026-02-01',effectiveFrom:'2026-02-01',reviewed:true}]};
  await writeFile(join(dir,'data/laws/sample.json'),JSON.stringify(old));
  await writeFile(join(dir,'data/laws/manifest.json'),JSON.stringify({sample:{file:'sample.json'}}));
  await writeFile(join(dir,'data/source-status.json'),JSON.stringify({documents:{sample:{remotePublishedAt:'2026-02-01',checkedAt:new Date().toISOString()}}}));
  await writeFile(join(dir,'data/review/candidates/sample.json'),raw);await writeFile(join(dir,'data/review/snapshots/sample.html'),snapshot);
  await writeFile(join(dir,'data/review/sample.comparison.json'),JSON.stringify({doc:'sample',textCompared:true,problems:[],candidateSha256:hash(raw),sourceSha256:hash(snapshot)}));
  await approveReview(review,root);
  const active=JSON.parse(await readFile(join(dir,'data/laws/sample.json'),'utf8'));
  assert.equal(active.legalReview.status,'approved');assert.equal(active.effectiveDateVerified,true);assert.equal(active.effectiveFrom,'2026-02-01');
  const archives=await readdir(join(dir,'data/laws/archive/sample'));assert.equal(archives.length,1);
  assert.deepEqual(JSON.parse(gunzipSync(await readFile(join(dir,'data/laws/archive/sample',archives[0])))),old);
  const status=JSON.parse(await readFile(join(dir,'data/source-status.json'),'utf8'));assert.equal(status.documents.sample.state,'publication-date-matches');
 }finally{await rm(dir,{recursive:true,force:true});}
});

test('legal today uses the user-facing Tashkent calendar across UTC midnight',async()=>{
 const {todayLegalDate}=await import('../netlify/shared/source-integrity.mjs');
 assert.equal(todayLegalDate(new Date('2026-11-07T20:00:00Z')),'2026-11-08');
});

test('known text discrepancies remain blocked after the freshness check expires',()=>{
 const registry={documents:{sample:{localAsOf:law.asOf,localContentSha256:lawContentHash(law),checkedAt:'2026-01-02T00:00:00Z',state:'indexed-text-differs',changedArticles:['1']}}};
 assert.equal(sourceMetadata(law,null,registry,Date.parse('2026-11-08T00:00:00Z')).freshness,'indexed-text-differs');
});

test('user-confirmed source review does not invent effectivity dates or certify AI conclusions',()=>{
 for(const doc of ['jk','fk1']){
  const meta=sourceMetadata(LAWS[doc]);assert.equal(meta.textReview?.status,'approved');assert.equal(meta.textReview.evidenceType,'user-attestation');
  assert.equal(meta.effectiveDateVerified,false);assert.equal(meta.effectiveFrom,null);assert.equal(meta.legalConclusionReviewed,false);
 }
 assert.equal(LAWS.jk.asOf,'2026-11-04');
 const changed={...LAWS.jk,articles:[]};assert.equal(sourceMetadata(changed).textReview,null);assert.equal(passageRestriction(changed),'local-content-changed');
});

test('source-text approval still rejects wrong hashes and incomplete comparison evidence',async()=>{
 const {validateTextApproval}=await import('../scripts/apply-text-attestation.mjs');
 const {createHash}=await import('node:crypto'),sha=b=>createHash('sha256').update(b).digest('hex');
 const candidate={...law,kind:'modda',articles:[{art:'1',title:'Norma',parts:['Tekshirilgan sinov huquqiy matni.'],changes:[]}]};
 const raw=Buffer.from(JSON.stringify(candidate)),snapshot=Buffer.from('<div>Rasmiy manba nusxasi</div>');
 const approval={doc:law.doc,status:'approved',scope:'source-text',evidenceType:'user-attestation',evidence:'Yurist matnni tekshirdi',attestedAt:new Date().toISOString(),candidateSha256:sha(raw),sourceSha256:sha(snapshot)};
 const comparison={doc:law.doc,source:law.url,textCompared:true,problems:[],candidateSha256:sha(raw),sourceSha256:sha(snapshot)};
 assert.deepEqual(validateTextApproval(approval,candidate,raw,candidate,comparison,snapshot),[]);
 assert.ok(validateTextApproval({...approval,candidateSha256:'0'.repeat(64)},candidate,raw,candidate,comparison,snapshot).some(e=>e.includes('hash')));
 assert.ok(validateTextApproval(approval,candidate,raw,candidate,{...comparison,textCompared:false},snapshot).some(e=>e.includes('comparison')));
 assert.ok(validateTextApproval({...approval,evidence:''},candidate,raw,candidate,comparison,snapshot).some(e=>e.includes('attestation')));
});

test('a repeat audit keeps source-text approval separate from unresolved technical evidence',async()=>{
 const {sourceQueueItem}=await import('../scripts/source-audit.mjs');
 const audit={state:'publication-unknown',localContentSha256:'abc',textReview:{status:'approved',approvedContentSha256:'abc',scope:'source-text'}};
 const item=sourceQueueItem('sample',audit);assert.equal(item.status,'technical-evidence-pending');assert.equal(item.lawyerReview,'source-text-confirmed-by-user');assert.equal(item.reason,'publication-unknown');
 assert.equal(sourceQueueItem('sample',{...audit,localContentSha256:'different'}).lawyerReview,'kutilmoqda');
});

test('conflicting publication dates never authorize an indexed passage',()=>{
 const registry={documents:{sample:{localAsOf:law.asOf,localContentSha256:lawContentHash(law),checkedAt:new Date().toISOString(),state:'date-conflict'}}};
 assert.equal(passageRestriction(law,null,'1',registry),'source-date-conflict');
});

test('a repeat remote fetch archives the prior source snapshot before replacing it',async()=>{
 const {mkdtemp,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {pathToFileURL}=await import('node:url');const {createHash}=await import('node:crypto');
 const dir=await mkdtemp(join(tmpdir(),'source-snapshots-')),snapshotDir=pathToFileURL(dir+'/');
 const first='<div class="ACT_TITLE">First</div><div class="PUBLICATION_ORIGIN">01.01.2026-y.</div>',second=first.replace('First','Second');
 try{
  const fetcher=html=>async()=>({ok:true,status:200,url:law.url,text:async()=>html});
  await auditDocument(law,{fetcher:fetcher(first),snapshotDir});await auditDocument(law,{fetcher:fetcher(second),snapshotDir});
  assert.equal(await readFile(new URL('sample.html',snapshotDir),'utf8'),second);
  const hash=createHash('sha256').update(first).digest('hex');assert.equal(await readFile(new URL('archive/sample/'+hash+'.html',snapshotDir),'utf8'),first);
 }finally{await rm(dir,{recursive:true,force:true})}
});

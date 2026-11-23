// Explicit local promotion after the user supplies a completed legal review.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {resolve,relative} from 'node:path';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {validLegalDate,sourceOrigin,lawContentHash} from '../netlify/shared/source-integrity.mjs';
import {validateLaw} from './check-law-updates.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function validateReview(review,candidate,raw,old) {
  const errors=[];
  if(review.status!=='approved'||typeof review.reviewer!=='string'||!review.reviewer.trim()||!validLegalDate(review.reviewedAt))errors.push('Yurist, tasdiq holati va haqiqiy tekshiruv sanasi kerak.');
  if(review.doc!==candidate.doc||review.doc!==old.doc)errors.push('Hujjat ID mos emas.');
  if(review.candidateSha256!==sha(raw))errors.push('Tekshirilgan nomzod xeshi mos emas.');
  if(sourceOrigin(review.sourceUrl)!=='lex-document-link'||review.sourceUrl!==candidate.url)errors.push('Rasmiy hujjat havolasi mos emas.');
  if(review.effectiveDateVerified!==true||!validLegalDate(review.effectiveFrom))errors.push('Kuchga kirish sanasini yurist tasdiqlashi kerak.');
  if(review.effectiveTo!=null&&(!validLegalDate(review.effectiveTo)||review.effectiveTo<=review.effectiveFrom))errors.push('Amal qilish sanalari noto‘g‘ri.');
  if(!/^[a-f0-9]{64}$/.test(review.sourceSha256||''))errors.push('Rasmiy manba nusxasining SHA-256 xeshi kerak.');
  const oldById=new Map(old.articles.map(a=>[a.art,a]));
  const affected=candidate.articles.filter(a=>!oldById.has(a.art)||JSON.stringify({title:a.title,parts:a.parts,changes:a.changes})!==JSON.stringify({title:oldById.get(a.art).title,parts:oldById.get(a.art).parts,changes:oldById.get(a.art).changes})).map(a=>a.art);
  for(const art of affected)if(!(review.amendments||[]).some(a=>a.art===art&&a.reviewed===true))errors.push(art+'-modda uchun o‘zgartirish sanalari tekshiruvi kerak.');
  const removed=old.articles.filter(a=>!candidate.articles.some(n=>n.art===a.art));
  for(const a of removed)if(!(review.removedArticles||[]).some(x=>x.art===a.art&&x.reviewed===true&&validLegalDate(x.effectiveTo)))errors.push(a.art+'-moddaning chiqarilishi tasdiqlanmagan.');
  if(!Array.isArray(review.amendments))errors.push('O‘zgartirishlar tekshiruvi ro‘yxati kerak (bo‘lmasa bo‘sh ro‘yxat).');
  for(const a of review.amendments||[])if(!candidate.articles.some(x=>x.art===a.art)||!validLegalDate(a.publishedAt)||!validLegalDate(a.effectiveFrom)||a.reviewed!==true)errors.push('O‘zgartirish sanalari yoki modda ID tasdiqlanmagan.');
  errors.push(...validateLaw(candidate,old));
  return errors;
}
export async function approveReview(review, root = new URL('../',import.meta.url)) {
  // URL.pathname Windows’da "/C:/..." beradi; fileURLToPath har ikki tizimda to‘g‘ri yo‘l qaytaradi.
  const rootPath=fileURLToPath(new URL(root));
  const manifestPath=new URL('data/laws/manifest.json',root),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
  const spec=manifest[review.doc];if(!spec)throw new Error('Noma’lum hujjat.');
  const candidatePath=resolve(rootPath,'data/review/candidates',review.candidateFile||'');
  if(!review.candidateFile||relative(resolve(rootPath,'data/review/candidates'),candidatePath).startsWith('..'))throw new Error('Nomzod fayl yo‘li noto‘g‘ri.');
  const raw=await readFile(candidatePath),candidate=JSON.parse(raw);
  const currentPath=new URL('data/laws/'+spec.file,root),oldRaw=await readFile(currentPath),old=JSON.parse(oldRaw);
  const errors=validateReview(review,candidate,raw,old);if(errors.length)throw new Error(errors.join('\n'));
  const comparison=JSON.parse(await readFile(new URL(`data/review/${review.doc}.comparison.json`,root),'utf8'));
  if(comparison.doc!==review.doc||comparison.textCompared!==true||comparison.problems?.length||comparison.candidateSha256!==sha(raw)||comparison.sourceSha256!==review.sourceSha256)throw new Error('Nomzodning texnik solishtirish hisoboti mos emas yoki muammoli.');
  const snapshot=await readFile(new URL(`data/review/snapshots/${review.doc}.html`,root));
  if(sha(snapshot)!==review.sourceSha256)throw new Error('Tekshirilgan rasmiy manba nusxasi o‘zgargan.');
  const archive=new URL(`data/laws/archive/${review.doc}/`,root);await mkdir(archive,{recursive:true});
  await writeFile(new URL(`${old.asOf}-${sha(oldRaw).slice(0,16)}.json.gz`,archive),gzipSync(oldRaw));
  const fresh={...candidate,effectiveFrom:review.effectiveFrom,effectiveTo:review.effectiveTo||null,effectiveDateVerified:true,amendments:review.amendments,legalReview:{status:'approved',reviewer:review.reviewer,reviewedAt:review.reviewedAt,sourceSha256:review.sourceSha256}};
  const next=JSON.stringify(fresh)+'\n';
  const activePath=spec.file.startsWith('../pending/')?new URL(`data/laws/${review.doc}.json`,root):currentPath;
  const temp=new URL(activePath.href+'.tmp');await writeFile(temp,next);await rename(temp,activePath);
  manifest[review.doc]={...spec,file:spec.file.startsWith('../pending/')?review.doc+'.json':spec.file,status:'reviewed',publishedAt:fresh.publishedAt||fresh.asOf,importedAt:fresh.importedAt,effectiveFrom:fresh.effectiveFrom,articles:fresh.articles.length,sha256:sha(next).slice(0,16),legalReview:fresh.legalReview};
  await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
  const statusPath=new URL('data/source-status.json',root),status=JSON.parse(await readFile(statusPath,'utf8'));
  const audit=status.documents[review.doc]||{};
  status.documents[review.doc]={...audit,localAsOf:fresh.asOf,localSha256:sha(next),localContentSha256:lawContentHash(fresh),textCompared:true,indexedTextMatches:true,changedArticles:[],state:audit.remotePublishedAt===fresh.asOf?'publication-date-matches':'unverified'};
  await writeFile(statusPath,JSON.stringify(status,null,2)+'\n');
  const receipts=new URL('data/review/approvals/',root);await mkdir(receipts,{recursive:true});
  await writeFile(new URL(`${review.doc}-${review.reviewedAt}.json`,receipts),JSON.stringify({...review,promotedAt:new Date().toISOString(),promotedSha256:sha(next)},null,2)+'\n');
  // The queue is an operational view; retain the approval receipt as durable evidence.
  const queuePath=new URL('data/review/source-queue.json',root);
  try{const q=JSON.parse(await readFile(queuePath,'utf8'));q.items=q.items.filter(i=>i.doc!==review.doc);await writeFile(queuePath,JSON.stringify(q,null,2)+'\n')}catch(e){if(e.code!=='ENOENT')throw e}
  console.log(review.doc+': ko‘rib chiqilgan nusxa saqlandi; endi npm run build va npm test ishlating.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const file=process.argv[process.argv.indexOf('--review')+1];if(!process.argv.includes('--review')||!file)throw new Error('--review <fayl.json> kerak.');await approveReview(JSON.parse(await readFile(file,'utf8')));}

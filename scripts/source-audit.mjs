// Read-only remote audit; legal texts are never promoted by this command.
import {readFile, writeFile, mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {sourceOrigin, validLegalDate, lawContentHash, todayLegalDate} from '../netlify/shared/source-integrity.mjs';
const ROOT = new URL('../', import.meta.url);
const sha = b => createHash('sha256').update(b).digest('hex');
const decode = t => t.replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(+n)).replace(/&nbsp;/g,' ').replace(/&amp;/g,'&');
export function publicationText(html) {
  const texts = []; let depth = 0, active = null;
  for (const token of String(html).matchAll(/<[^>]+>|[^<]+/g)) {
    const t = token[0];
    if (/^<div(?:\s|>)/i.test(t)) {
      depth++;
      if (/class\s*=\s*["'][^"']*\bPUBLICATION_ORIGIN\b/i.test(t)) active = depth;
    } else if (/^<\/div\s*>/i.test(t)) { if (active === depth) active = null; depth--; }
    else if (active !== null && !t.startsWith('<')) texts.push(decode(t));
  }
  return texts.join(' ');
}
export function publicationDate(html, today = todayLegalDate()) {
  const dates = [...publicationText(html).matchAll(/(\d{2})\.(\d{2})\.(\d{4})/g)].map(([,d,m,y])=>`${y}-${m}-${d}`);
  return dates.filter(d => validLegalDate(d) && d <= today).sort().at(-1) || null;
}
export async function auditDocument(law, {fetcher = fetch, now = new Date(), snapshotDir = null} = {}) {
  const result = {localAsOf: law.asOf || null, checkedAt: now.toISOString(), remotePublishedAt: null, state: 'identity-unverified', textCompared: false, effectiveDateVerified: false};
  if (sourceOrigin(law.url) !== 'lex-document-link') return result;
  try {
    const res = await fetcher(law.url, {headers:{'Accept-Language':'uz'}, signal:AbortSignal.timeout(25000)});
    result.httpStatus = res.status; result.finalUrl = res.url || law.url;
    if (!res.ok) return {...result, state:'http-error'};
    const html = await res.text();
    result.remoteSha256 = sha(html);
    const title = decode((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)||[])[1]||'').replace(/<[^>]+>/g,'').trim();
    result.pageTitle = title;
    if (sourceOrigin(result.finalUrl) !== 'lex-document-link' || !/class\s*=\s*["'][^"']*\bACT_TITLE\b/i.test(html)) return result;
    // IDs must stay on the requested document; a redirect to another act is not identity evidence.
    if (new URL(result.finalUrl).pathname.split('/').filter(Boolean).at(-1) !== new URL(law.url).pathname.split('/').filter(Boolean).at(-1)) return result;
    result.remotePublishedAt = publicationDate(html, todayLegalDate(now));
    if (snapshotDir) {
      await mkdir(snapshotDir,{recursive:true});
      const target=new URL(`${law.doc}.html`,snapshotDir);
      try { const previous=await readFile(target);if(sha(previous)!==result.remoteSha256){const archive=new URL(`archive/${law.doc}/`,snapshotDir);await mkdir(archive,{recursive:true});await writeFile(new URL(sha(previous)+'.html',archive),previous);} } catch(e){if(e.code!=='ENOENT')throw e}
      await writeFile(target,html);
    }
    result.state = !result.remotePublishedAt ? 'publication-unknown' : !validLegalDate(law.asOf) ? 'local-date-unknown' : result.remotePublishedAt > law.asOf ? 'newer-publication' : result.remotePublishedAt === law.asOf ? 'publication-date-matches' : 'date-conflict';
    return result;
  } catch (e) { return {...result, state:'fetch-error', error:e.name}; }
}
export function sourceQueueItem(doc,audit) {
 const reviewed=audit.textReview?.status==='approved' && audit.textReview.approvedContentSha256===audit.localContentSha256;
 return {doc,reason:audit.state,status:reviewed?'technical-evidence-pending':'pending',lawyerReview:reviewed?'source-text-confirmed-by-user':'kutilmoqda',...(reviewed?{sourceTextReview:audit.textReview}:{}),remotePublishedAt:audit.remotePublishedAt,checkedAt:audit.checkedAt};
}
export async function runAudit() {
  const manifest = JSON.parse(await readFile(new URL('data/laws/manifest.json',ROOT),'utf8'));
  const previous = JSON.parse(await readFile(new URL('data/source-status.json',ROOT),'utf8'));
  const documents = {}, inventory = [], queue = [];
  await mkdir(new URL('data/review/', ROOT),{recursive:true});
  const entries = Object.entries(manifest); let cursor = 0;
  await Promise.all(Array.from({length:3},async()=>{while(cursor<entries.length){
    const [id,m] = entries[cursor++];
    const raw = await readFile(new URL('data/laws/'+m.file,ROOT)); const law = JSON.parse(raw);
    let check = await auditDocument(law,{snapshotDir:new URL('data/review/snapshots/',ROOT)});
    const old = previous.documents?.[id];
    if ((['fetch-error','http-error'].includes(check.state) || check.state==='publication-date-matches') && ['newer-publication','indexed-text-differs'].includes(old?.state) && old.localContentSha256===lawContentHash(law)) check = {...old,lastAttempt:check};
    documents[id] = {...check, localSha256:sha(raw), localContentSha256:lawContentHash(law), ...(old?.textReview?.approvedContentSha256===lawContentHash(law)?{textReview:old.textReview}:{})};
    inventory.push({doc:id,name:law.name,file:m.file,url:law.url||null,asOf:law.asOf||null,publishedAt:law.publishedAt||null,manifestPublishedAt:m.publishedAt||null,effectiveFrom:law.effectiveFrom||null,proposedEffectiveFrom:law.proposedEffectiveFrom||null,effectiveDateVerified:law.effectiveDateVerified===true,importedAt:law.importedAt||null,autoUpdate:m.autoUpdate===true,monitoring:sourceOrigin(law.url)==='lex-document-link'?'weekly-page-audit':'manual',contentUpdate:'legal-review-required',status:m.status||'indexed',units:law.articles?.length||0,scope:law.provenance?.scope||'indexed-text',...documents[id]});
    if(check.state!=='publication-date-matches')queue.push(sourceQueueItem(id,documents[id]));
  }}));
  const sort = (a,b)=>a.doc.localeCompare(b.doc); inventory.sort(sort);queue.sort(sort);
  await writeFile(new URL('data/source-status.json',ROOT),JSON.stringify({version:1,documents},null,2)+'\n');
  await writeFile(new URL('data/review/inventory.json',ROOT),JSON.stringify(inventory,null,2)+'\n');
  await writeFile(new URL('data/review/source-queue.json',ROOT),JSON.stringify({generatedAt:new Date().toISOString(),items:queue},null,2)+'\n');
  const report = `# Manbalar auditi\n\n${new Date().toISOString()}\n\nNashr sanasi tengligi matn yoki huquqiy xulosa tasdig‘i emas. Kuchga kirish va tarixiy tahrirlar alohida tekshiriladi.\n\n|Hujjat|Import|Bazadagi nashr|Rasmiy nashr|Natija|\n|---|---|---|---|---|\n`+inventory.map(x=>`|${x.name}|${x.importedAt||'noma’lum'}|${x.asOf||'noma’lum'}|${x.remotePublishedAt||'noma’lum'}|${x.state}|`).join('\n')+'\n';
  await writeFile(new URL('law-update-report.md',ROOT),report);
  console.log(report);
  return {inventory,queue};
}
if(process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) await runAudit();

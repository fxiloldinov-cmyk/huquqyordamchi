// Apply the user's confirmation of source-text review without inventing date review.
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {pathToFileURL} from 'node:url';
import {lawContentHash,todayLegalDate,sourceOrigin} from '../netlify/shared/source-integrity.mjs';
import {validateLaw} from './check-law-updates.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export function validateTextApproval(approval,candidate,raw,old,comparison,snapshot) {
 const errors=[];
 if(approval.status!=='approved'||approval.scope!=='source-text'||approval.evidenceType!=='user-attestation'||!approval.evidence?.trim()||!Number.isFinite(Date.parse(approval.attestedAt)))errors.push('Explicit source-text attestation required');
 if(approval.doc!==old.doc||approval.doc!==candidate.doc)errors.push('Document ID mismatch');
 if(approval.candidateSha256!==sha(raw)||comparison.candidateSha256!==sha(raw))errors.push('Candidate hash mismatch');
 if(comparison.doc!==candidate.doc||comparison.textCompared!==true||comparison.problems?.length)errors.push('Technical comparison incomplete');
 if(comparison.sourceSha256!==sha(snapshot)||approval.sourceSha256!==sha(snapshot))errors.push('Source snapshot hash mismatch');
 if(sourceOrigin(candidate.url)!=='lex-document-link'||candidate.url!==comparison.source)errors.push('Official document URL mismatch');
 errors.push(...validateLaw(candidate,old));
 return errors;
}
export async function applyTextApproval(approval,root=new URL('../',import.meta.url)) {
 // Fixed candidate path: no caller-controlled path traversal or arbitrary writes.
 const manifestPath=new URL('data/laws/manifest.json',root),manifest=JSON.parse(await readFile(manifestPath,'utf8'));
 const spec=manifest[approval.doc];if(!spec||!/^[a-z0-9-]+$/.test(approval.doc))throw new Error('Unknown document');
 if(spec.file.startsWith('../pending/'))throw new Error('A pending source needs official identity and date evidence before activation');
 const currentPath=new URL('data/laws/'+spec.file,root),oldRaw=await readFile(currentPath),old=JSON.parse(oldRaw);
 const raw=await readFile(new URL('data/review/candidates/'+spec.file,root)),candidate=JSON.parse(raw);
 const comparison=JSON.parse(await readFile(new URL(`data/review/${approval.doc}.comparison.json`,root),'utf8'));
 const snapshot=await readFile(new URL(`data/review/snapshots/${approval.doc}.html`,root));
 const errors=validateTextApproval(approval,candidate,raw,old,comparison,snapshot);if(errors.length)throw new Error(errors.join('\n'));
 const archive=new URL(`data/laws/archive/${approval.doc}/`,root);await mkdir(archive,{recursive:true});
 await writeFile(new URL(`${old.asOf}-${sha(oldRaw).slice(0,16)}.json.gz`,archive),gzipSync(oldRaw));
 const fresh={...candidate,effectiveFrom:null,effectiveDateVerified:false,legalReview:{status:'approved',scope:'source-text',evidenceType:approval.evidenceType,attestedAt:approval.attestedAt,reviewer:null,reviewedAt:null,sourceSha256:approval.sourceSha256}};
 // A review of a previous edition's effective date cannot certify the new edition.
 fresh.effectiveFrom=null;fresh.effectiveTo=null;
 const next=JSON.stringify(fresh)+'\n',temp=new URL(currentPath.href+'.tmp');await writeFile(temp,next);await rename(temp,currentPath);
 manifest[approval.doc]={...spec,status:'text-reviewed',publishedAt:fresh.publishedAt||fresh.asOf,importedAt:fresh.importedAt,articles:fresh.articles.length,repealed:(fresh.repealed||[]).length,sha256:sha(next).slice(0,16),effectiveFrom:null,effectiveDateVerified:false,legalReview:fresh.legalReview};
 await writeFile(manifestPath,JSON.stringify(manifest,null,2)+'\n');
 const statusPath=new URL('data/source-status.json',root),status=JSON.parse(await readFile(statusPath,'utf8')),audit=status.documents[approval.doc]||{};
 status.documents[approval.doc]={...audit,localAsOf:fresh.asOf,localSha256:sha(next),localContentSha256:lawContentHash(fresh),textCompared:true,indexedTextMatches:true,changedArticles:[],textReview:{...fresh.legalReview,approvedContentSha256:lawContentHash(fresh)},state:audit.remotePublishedAt===fresh.asOf?'publication-date-matches':'unverified'};
 await writeFile(statusPath,JSON.stringify(status,null,2)+'\n');
 const receipts=new URL('data/review/approvals/',root);await mkdir(receipts,{recursive:true});
 await writeFile(new URL(`${approval.doc}-${todayLegalDate()}-text.json`,receipts),JSON.stringify({...approval,promotedAt:new Date().toISOString(),promotedSha256:sha(next)},null,2)+'\n');
 const queuePath=new URL('data/review/source-queue.json',root);const queue=JSON.parse(await readFile(queuePath,'utf8'));
 queue.items=queue.items.filter(i=>i.doc!==approval.doc);await writeFile(queuePath,JSON.stringify(queue,null,2)+'\n');
 return {doc:approval.doc,asOf:fresh.asOf,sha256:sha(next),dateReview:'not-established'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){const i=process.argv.indexOf('--attestation');if(i<0||!process.argv[i+1])throw new Error('--attestation <file.json> required');console.log(await applyTextApproval(JSON.parse(await readFile(process.argv[i+1],'utf8'))));}

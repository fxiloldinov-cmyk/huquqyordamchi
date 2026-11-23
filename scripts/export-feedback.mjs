// Faqat administrator terminali. Baholarni CSV'ga eksport qiladi (savol va javob matni omborda yo‘q).
// node scripts/export-feedback.mjs feedback.csv
// NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN faqat muhitdan olinadi.
import {writeFileSync} from 'node:fs';import {pathToFileURL} from 'node:url';
import {readAll,toCsv} from '../netlify/shared/feedback.mjs';
import {blobsStore} from '../netlify/shared/store.mjs';
export async function adminStore(name){
 if(!process.env.NETLIFY_SITE_ID||!process.env.NETLIFY_AUTH_TOKEN)throw new Error('NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN muhitda bo‘lishi kerak.');
 const {getStore}=await import('@netlify/blobs');
 const raw=getStore({name,siteID:process.env.NETLIFY_SITE_ID,token:process.env.NETLIFY_AUTH_TOKEN,consistency:'strong'});
 return blobsStore({getStore:()=>raw},name);
}
export async function main([out='feedback.csv']=[],{store}={}){
 const {feedback}=await readAll(store||await adminStore('feedback'));
 writeFileSync(out,toCsv(feedback.sort((a,b)=>a.t-b.t)));
 console.log(`${feedback.length} ta baho → ${out}`);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(e=>{console.error('Eksport bajarilmadi:',e.message);process.exitCode=1});

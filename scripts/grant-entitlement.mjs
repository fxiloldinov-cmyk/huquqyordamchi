// Faqat administrator terminali. Hech qanday deploy yoki to‘lov chaqiruvi yo‘q.
// node scripts/grant-entitlement.mjs --email user@example.com --plan pro --expiresAt 2026-12-01T00:00:00Z
// NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN faqat muhitdan olinadi. Ularni argumentga yozmang.
import {pathToFileURL} from 'node:url';
import {writeGrant,validateGrant} from '../netlify/shared/entitlements.mjs';
import {blobsStore} from '../netlify/shared/store.mjs';
export function parseArgs(args){
 const out={};for(let i=0;i<args.length;i+=2){const key=args[i]?.replace(/^--/,'');if(!['email','plan','expiresAt'].includes(key)||args[i]!==`--${key}`||!args[i+1]||Object.hasOwn(out,key))throw new Error('Argumentlar: --email --plan --expiresAt');out[key]=args[i+1];}return out;
}
export async function main(args){
 const input=parseArgs(args);validateGrant(input);
 if(!process.env.NETLIFY_SITE_ID||!process.env.NETLIFY_AUTH_TOKEN)throw new Error('NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN muhitda bo‘lishi kerak.');
 const {getStore}=await import('@netlify/blobs');
 const raw=getStore({name:'entitlements',siteID:process.env.NETLIFY_SITE_ID,token:process.env.NETLIFY_AUTH_TOKEN,consistency:'strong'});
 await writeGrant(input,{store:blobsStore({getStore:()=>raw},'entitlements')});
 console.log('Grant Blobs omboriga yozildi. Deploy bajarilmadi.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(()=>{console.error('Grant yozilmadi: argumentlar, muhit va ombor ruxsatini tekshiring.');process.exitCode=1});

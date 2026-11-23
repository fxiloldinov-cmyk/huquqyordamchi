// Faqat administrator terminali. Ustoz rolini email bo‘yicha beradi yoki olib qo‘yadi.
// node scripts/grant-teacher.mjs --email ustoz@example.com [--revoke]
// Rol faqat email tasdiqlangan hisobda ishlaydi (emailVerified). NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN faqat muhitdan.
import {pathToFileURL} from 'node:url';
import {grantTeacher} from '../netlify/shared/classroom.mjs';
import {normEmail,validEmail} from '../netlify/shared/auth.mjs';
import {adminStore} from './export-feedback.mjs';
export function parseArgs(args){
 const out={revoke:false};for(let i=0;i<args.length;i++){if(args[i]==='--revoke'){out.revoke=true;continue;}if(args[i]==='--email'&&args[i+1]&&!out.email){out.email=normEmail(args[++i]);continue;}throw new Error('Argumentlar: --email <email> [--revoke]');}
 if(!out.email||!validEmail(out.email))throw new Error('Email noto‘g‘ri.');return out;
}
export async function main(args,{store}={}){
 const {email,revoke}=parseArgs(args);
 await grantTeacher(email,{store:store||await adminStore('teachers'),revoke});
 console.log(revoke?'Ustoz roli olib qo‘yildi.':'Ustoz roli yozildi. Email tasdiqlanmagan bo‘lsa, rol ishlamaydi. Deploy bajarilmadi.');
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(e=>{console.error('Rol yozilmadi:',e.message);process.exitCode=1});

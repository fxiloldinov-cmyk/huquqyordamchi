import {readFile,writeFile,mkdir} from 'node:fs/promises';
const root=new URL('../',import.meta.url),dir=new URL('data/review/',root);
await mkdir(dir,{recursive:true});
const {cases}=JSON.parse(await readFile(new URL('eval/cases.json',root),'utf8'));
let previous=[];try{previous=JSON.parse(await readFile(new URL('legal-cases.json',dir),'utf8')).cases||[]}catch(e){if(e.code!=='ENOENT')throw e}
const saved=new Map(previous.map(c=>[c.id,c]));
const rows=cases.map(c=>({id:c.id,question:c.question,eventDate:c.eventDate||null,expectedSources:c.expectSources,exceptionsToCheck:c.mustNot,questionsToAsk:c.mustAsk,lawyerReview:c.lawyerReview,reviewer:null,reviewedAt:null,confirmedSources:[],confirmedEffectiveDates:[],exceptions:null,lawyerNotes:null,...(saved.get(c.id)||{}),id:c.id,question:c.question,eventDate:c.eventDate||null,expectedSources:c.expectSources}));
await writeFile(new URL('legal-cases.json',dir),JSON.stringify({note:'Kutilgan manbalar tavsiya; yurist tasdig‘i emas. Bo‘sh kataklar noma’lum.',cases:rows},null,2)+'\n');
for(const row of rows){row.sourceTextReviewStatus=row.sourceTextReview?.status||'kutilmoqda';row.sourceTextReviewEvidence=row.sourceTextReview?.evidenceType||'';}
const fields=['sourceTextReviewStatus','sourceTextReviewEvidence','id','question','eventDate','expectedSources','exceptionsToCheck','questionsToAsk','lawyerReview','reviewer','reviewedAt','confirmedSources','confirmedEffectiveDates','exceptions','lawyerNotes'];
const cell=v=>'"'+String(Array.isArray(v)?v.join('; '):v??'').replace(/"/g,'""')+'"';
await writeFile(new URL('legal-cases.csv',dir),'\uFEFF'+fields.map(cell).join(',')+'\r\n'+rows.map(r=>fields.map(k=>cell(r[k])).join(',')).join('\r\n')+'\r\n');
console.log(rows.length+' ta holat: data/review/legal-cases.csv va legal-cases.json');

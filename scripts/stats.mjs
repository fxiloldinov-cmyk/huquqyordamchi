// Faqat administrator terminali. Kunlik jamlama: baholar soni, "foydali" ulushi, sabablar taqsimoti,
// manbasiz javoblar ulushi (RAG manba bermagan javoblar — "bilmayman" holatining taxminiy ko‘rsatkichi, AI matni tahlil qilinmaydi).
// node scripts/stats.mjs [--json]
import {pathToFileURL} from 'node:url';
import {readAll,dailyStats,REASONS} from '../netlify/shared/feedback.mjs';
import {adminStore} from './export-feedback.mjs';
export async function main(args=[],{store}={}){
 const {responses,feedback}=await readAll(store||await adminStore('feedback'));
 const rows=dailyStats(responses,feedback);
 if(args.includes('--json')){console.log(JSON.stringify(rows,null,1));return rows;}
 const pct=v=>v==null?'—':Math.round(v*100)+'%';
 console.log(['kun','javoblar','manbasiz','baholar','foydali',...REASONS].join('\t'));
 for(const r of rows)console.log([r.day,r.responses,pct(r.noSourceShare),r.ratings,pct(r.usefulShare),...REASONS.map(k=>r.reasons[k])].join('\t'));
 return rows;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)main(process.argv.slice(2)).catch(e=>{console.error('Statistika olinmadi:',e.message);process.exitCode=1});

import {todayLegalDate} from './source-integrity.mjs';
// YHQ matni mavjud bo‘lmaganda MJtK sanksiyasi qoidaning o‘rnini bosmaydi.
import {readFileSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import '../../public/legal-core.js';
export const TRAFFIC_TOPIC=/(\byhq\b|\bypx\b|\byhxx\b|yo'?l harakati|yo'?l belgi|svetofor|qizil chiroq|traffic rules?|road signs?|traffic police)/g;
export function trafficQuestion(query){TRAFFIC_TOPIC.lastIndex=0;const hit=TRAFFIC_TOPIC.test(HKCore.norm(query))||/дорожн\w*\s+(знак|движен)|гибдд|дпс/i.test(query);TRAFFIC_TOPIC.lastIndex=0;return hit;}
export function loadBandLaw(doc,file){
 const candidates=file?[file]:[path.join(process.cwd(),'data/laws/'+doc+'.json'),fileURLToPath(new URL('../../data/laws/'+doc+'.json',import.meta.url))];
 for(const candidate of [...new Set(candidates)]){
  let law;try{law=JSON.parse(readFileSync(candidate,'utf8'))}catch{continue}
  if(doc==='iiv502' && (law.legalReview?.status!=='approved' || law.effectiveDateVerified!==true))return null;
  if(law.doc!==doc||law.kind!=='band'||!/^https:\/\/lex\.uz\/docs\/-?\d+$/.test(law.url||'')||!/^\d{4}-\d{2}-\d{2}$/.test(law.asOf||'')||law.effectiveFrom!=null&&!/^\d{4}-\d{2}-\d{2}$/.test(law.effectiveFrom)||!Array.isArray(law.articles)||!law.articles.length)return null;
  const seen=new Set();for(const a of law.articles){if(typeof a.art!=='string'||seen.has(a.art)||!/^\d+(?:[.-]\d+)*$/.test(a.art)||!Array.isArray(a.parts)||!a.parts.length||a.parts.some(p=>typeof p!=='string'||!p.trim()))return null;seen.add(a.art);a.changes??=[];a.title??='';}
  return {...law,short:{yhq:'YHQ',ypx975:'YPX975',iiv502:'IIV502'}[doc]||doc.toUpperCase()};
 }
 return null;
}
export const loadTrafficRules=file=>loadBandLaw('yhq',file);
export const trafficLaw=loadTrafficRules();
export const inspectorLaw=loadBandLaw('ypx975');
// IIV 502-son yo‘riqnoma (YHQ buzilishiga doir ma’muriy ishlar). lex.uz havolasi bo‘lmaguncha data/pending’da turadi va bu yerda null bo‘ladi.
export const adminProcLaw=loadBandLaw('iiv502');
// Hali kuchga kirmagan hujjat bandini amaldagi qoida sifatida ko‘rsatmaymiz.
export const notInForce=(law,today=todayLegalDate())=>law?.effectiveFrom&&today<law.effectiveFrom?`⚠️ HALI KUCHGA KIRMAGAN: ${law.effectiveFrom} dan kuchga kiradi. Shu sanagacha bu band amaldagi tartib emas.`:'';
// YHQ ilovalari (belgilar, chiziqlar rasmlari, jadvallar) indekslanmagan: belgi haqidagi savolda buni ochiq aytamiz.
const SIGN_TOPIC=/(yo'?l belgi|belgisi|\bbelgi\b|chizi[qg]|razmetka|road signs?|road markings?)/;
export function signQuestion(query){return SIGN_TOPIC.test(HKCore.norm(query))||/знак|разметк/i.test(query);}
export const trafficAnnexNotice=(query,{yhq=trafficLaw}={})=>yhq&&trafficQuestion(query)&&signQuestion(query)?`Cheklov: YHQ ilovalari (yo‘l belgilari va yo‘l chiziqlari rasmlari, jadvallar) bazada indekslanmagan — faqat asosiy qoidalar matni bor. Belgi yoki chiziqning aniq ma’nosini asl ilovadan tekshiring: ${yhq.url}`:null;
export const trafficCoverageNotice=(query,{yhq=trafficLaw}={})=>trafficQuestion(query)&&!yhq?'YHQ bo‘yicha bazada bu qoida yo‘q. Yo‘l harakati qoidalari matni yuklanmagan. MJtKdagi jarima moddasi YHQ matnini almashtirmaydi.':null;

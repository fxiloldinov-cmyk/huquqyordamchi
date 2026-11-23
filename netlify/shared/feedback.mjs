// Javobga baho (HK_FEEDBACK_ENABLED). So‘rov matni va javob matni SAQLANMAYDI.
// "r_<id>" — chat javobi berilganda yoziladi: vaqt, RAG bergan manba id'lari, manbasiz javobmi.
// "f_<id>" — baho: bitta javobga bitta baho (onlyIfNew), izoh redactPII'dan o‘tadi.
import {randomBytes} from 'node:crypto';
import {openStore} from './store.mjs';
import {redactPII} from './common.mjs';
export const RATINGS=['foydali','xato'];
export const REASONS=['notogri_modda','eskirgan','tushunarsiz','boshqa'];
export const REASON_LABELS={notogri_modda:'Noto‘g‘ri modda',eskirgan:'Eskirgan ma’lumot',tushunarsiz:'Tushunarsiz',boshqa:'Boshqa'};
export const MAX_COMMENT=500,RESPONSE_TTL=30*86400000;
export const newResponseId=()=>randomBytes(16).toString('base64url');
export const validResponseId=id=>typeof id==='string'&&/^[A-Za-z0-9_-]{22}$/.test(id);
const day=t=>new Date(t).toISOString().slice(0,10);
// rag.provided: {kod: Set(modda)} → ["mk:131", ...] (manba id'lari, matnsiz)
export const sourceIds=provided=>Object.entries(provided||{}).flatMap(([c,s])=>[...(s||[])].map(a=>`${c}:${a}`)).slice(0,40);
export async function issueResponse(id,{sources=[]}={},{store,now=Date.now()}={}){
 const st=store||await openStore('feedback');
 await st.set('r_'+id,{t:now,day:day(now),sources:sources.slice(0,40),noSource:!sources.length});
}
export class FeedbackError extends Error{constructor(msg,status){super(msg);this.status=status;}}
export function validateFeedback(body){
 const {responseId,rating,reason,comment}=body||{};
 if(!validResponseId(responseId))throw new FeedbackError('Javob identifikatori noto‘g‘ri.',400);
 if(!RATINGS.includes(rating))throw new FeedbackError('Baho: foydali yoki xato.',400);
 if(rating==='xato'&&!REASONS.includes(reason))throw new FeedbackError('Sababni tanlang.',400);
 if(rating==='foydali'&&reason!=null&&reason!=='')throw new FeedbackError('“Foydali” bahosiga sabab kerak emas.',400);
 if(comment!=null&&(typeof comment!=='string'||comment.length>MAX_COMMENT))throw new FeedbackError(`Izoh ${MAX_COMMENT} belgidan oshmasin.`,400);
 return {responseId,rating,reason:rating==='xato'?reason:null,comment:redactPII(String(comment||'').replace(/\u0000/g,'').trim())};
}
export async function recordFeedback(body,{store,now=Date.now()}={}){
 const f=validateFeedback(body);const st=store||await openStore('feedback');
 const issued=await st.get('r_'+f.responseId);
 if(!issued||now-issued.t>RESPONSE_TTL)throw new FeedbackError('Bu javob topilmadi yoki baholash muddati o‘tgan.',404);
 const rec={t:now,day:day(now),rating:f.rating,reason:f.reason,comment:f.comment,sources:issued.sources||[],noSource:Boolean(issued.noSource)};
 if(!await st.setIf('f_'+f.responseId,rec,null))throw new FeedbackError('Bu javobga baho allaqachon berilgan.',409);
 return rec;
}
// Kunlik jamlama: baholar soni, "foydali" ulushi, sabablar, manbasiz javoblar ulushi ("bilmayman" o‘rnidagi taxminiy ko‘rsatkich).
export function dailyStats(responses,feedback){
 const out={};const row=d=>out[d]??={day:d,responses:0,noSource:0,ratings:0,useful:0,reasons:Object.fromEntries(REASONS.map(r=>[r,0]))};
 for(const r of responses){const x=row(r.day);x.responses++;if(r.noSource)x.noSource++;}
 for(const f of feedback){const x=row(f.day);x.ratings++;if(f.rating==='foydali')x.useful++;else if(f.reason in x.reasons)x.reasons[f.reason]++;}
 return Object.values(out).sort((a,b)=>a.day<b.day?-1:1).map(x=>({...x,usefulShare:x.ratings?+(x.useful/x.ratings).toFixed(3):null,noSourceShare:x.responses?+(x.noSource/x.responses).toFixed(3):null}));
}
const csvCell=v=>{const s=Array.isArray(v)?v.join(' '):v==null?'':String(v);return /^[=+\-@\t\r]/.test(s)?`"'${s.replace(/"/g,'""')}"`:/[",\n\r]/.test(s)?`"${s.replace(/"/g,'""')}"`:s;};
export function toCsv(feedback){
 const cols=['day','t','rating','reason','comment','sources','noSource'];
 return [cols.join(','),...feedback.map(f=>cols.map(c=>csvCell(c==='t'?new Date(f.t).toISOString():f[c])).join(','))].join('\n')+'\n';
}
// Administrator skriptlari uchun: ombordagi barcha yozuvlar.
export async function readAll(store){
 const load=async p=>{const out=[];for(const k of await store.list(p)){const v=await store.get(k);if(v)out.push(v);}return out;};
 return {responses:await load('r_'),feedback:await load('f_')};
}

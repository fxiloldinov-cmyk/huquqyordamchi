// Pilot tariflari: narxlar gipoteza; pul qabul qilinmaydi. Server rejimi ixtiyoriy.
import { currentUser, normEmail } from './auth.mjs';
import { openStore } from './store.mjs';
import { jsonError } from './common.mjs';
import { readGrant } from './entitlements.mjs';
export const freeRequests=()=>{const n=Number(process.env.HK_FREE_REQUESTS);return Number.isSafeInteger(n)&&n>0?n:2};
export const PLANS = Object.freeze([
 {id:'free',name:'Bepul',priceUZS:0,get requests(){return freeRequests()},maxChars:3000,maxOutputTokens:4000},
 {id:'student',name:'Student',priceUZS:19000,requests:10,maxChars:6000,maxOutputTokens:8000},
 {id:'pro',name:'Pro Student',priceUZS:39000,requests:30,maxChars:6000,maxOutputTokens:12000},
]);
export const plansEnabled=()=>process.env.HK_KAZUS_PLANS_ENABLED==='1';
export const monthKey=(now=Date.now())=>new Date(now+5*3600000).toISOString().slice(0,7);
export async function entitlement(user,now=Date.now()) {
 if(user?.emailVerified !== true)return PLANS[0];
 // Ombor xatosida fallback ishlatilmaydi. Faqat yozuv mavjud bo‘lmaganda eski sozlama o‘qiladi.
 let grant=await readGrant(user.email);
 if(grant===null){
  let conf={};try{conf=JSON.parse(process.env.HK_PILOT_ENTITLEMENTS||'{}');}catch{throw new Error('PilotConfiguration');}
  if(!conf||typeof conf!=='object'||Array.isArray(conf))throw new Error('PilotConfiguration');
  grant=Object.hasOwn(conf,normEmail(user.email))?conf[normEmail(user.email)]:null;
 }
 const valid=grant&&typeof grant.expiresAt==='string'&&Date.parse(grant.expiresAt)>now;
 return PLANS.find(p=>p.id===(valid?grant.plan:'free'))||PLANS[0];
}
export async function planStatus(user,now=Date.now()) {
 const enabled=plansEnabled(),period=monthKey(now),plan=enabled?await entitlement(user,now):PLANS[0];
 const u=enabled?await (await openStore('kazus-usage')).get('u_'+user.id):null;
 const used=u?.period===period?u.used:0;
 return {enabled,paymentEnabled:false,period,plan,used,remaining:enabled?Math.max(0,plan.requests-used):null,
 unit:'AI so‘rovi (davom va qayta urinish ham hisoblanadi)',priceStatus:'Sinov narxi — to‘lov qabul qilinmaydi'};
}
export async function reserveKazus(user,now=Date.now()) {
 const plan=await entitlement(user,now),period=monthKey(now);let allowed=false,used=0;
 await (await openStore('kazus-usage')).update('u_'+user.id,(cur)=>{
  used=cur?.period===period?cur.used:0;allowed=used<plan.requests;
  if(!allowed)return undefined;
  used++;return {period,used};
 });
 return {allowed,used,plan,period};
}
export async function guardKazusPlan(req,chars) {
 if(!plansEnabled())return {maxOutputTokens:12000};
 try {
  const cur=await currentUser(req);
  if(!cur)return {error:jsonError('Kazus pilotidan foydalanish uchun hisobingizga kiring.',401)};
  const plan=await entitlement(cur.user);
  if(chars>plan.maxChars)return {error:jsonError(`Ushbu tarifda kazus ${plan.maxChars} belgidan oshmasin.`,413)};
  const r=await reserveKazus(cur.user);
  if(!r.allowed)return {error:jsonError('Ushbu oy uchun Kazus AI so‘rovlari tugadi. Tarif va foydalanish bo‘limini ko‘ring.',429)};
  return {maxOutputTokens:plan.maxOutputTokens};
 }catch{return {error:jsonError('Kazus tarifi yoki hisoblagichi vaqtincha ishlamayapti.',503)}}
}

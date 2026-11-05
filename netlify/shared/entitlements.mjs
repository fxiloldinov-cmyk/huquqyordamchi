// Grantlar hisobdan alohida saqlanadi. Kalitda emailning o‘zi yozilmaydi.
import {normEmail,validEmail,sha256} from './auth.mjs';
import {openStore} from './store.mjs';
export const entitlementKey=email=>'e_'+sha256(normEmail(email));
export function validateGrant({email,plan,expiresAt},now=Date.now()) {
 const normalized=normEmail(email);
 if(!validEmail(normalized))throw new Error('Email noto‘g‘ri.');
 if(!['free','student','pro'].includes(plan))throw new Error('Plan: free, student yoki pro bo‘lsin.');
 if(typeof expiresAt!=='string'||!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z$/.test(expiresAt)||!Number.isFinite(Date.parse(expiresAt))||new Date(expiresAt).toISOString()!==expiresAt.replace(/Z$/,expiresAt.includes('.')?'Z':'.000Z')||Date.parse(expiresAt)<=now)throw new Error('expiresAt kelajakdagi UTC ISO sana bo‘lsin.');
 return {key:entitlementKey(normalized),record:{schema:1,plan,expiresAt:new Date(expiresAt).toISOString(),updatedAt:new Date(now).toISOString()}};
}
export async function writeGrant(input,{store,now=Date.now()}={}) {
 const {key,record}=validateGrant(input,now);
 const target=store||await openStore('entitlements');
 await target.set(key,record);
 return record;
}
export async function readGrant(email) {
 return (await openStore('entitlements')).get(entitlementKey(email));
}

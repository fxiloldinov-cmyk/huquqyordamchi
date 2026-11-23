import {guardJsonPost,jsonResponse,jsonError,clientIp} from '../shared/common.mjs';
import {feedbackEnabled} from '../shared/features.mjs';
import {recordFeedback,FeedbackError} from '../shared/feedback.mjs';
import {hit} from '../shared/limits.mjs';
import {sha256} from '../shared/auth.mjs';
import {StoreUnavailable,StoreConflict} from '../shared/store.mjs';
export const config={path:'/api/feedback'};
export default async(req,ctx)=>{
 if(!feedbackEnabled())return jsonError('Baholash hozir o‘chirilgan.',503);
 const {body,error}=await guardJsonPost(req,ctx,{scope:'feedback',perMinute:6,perHour:120,maxBytes:4000});if(error)return error;
 try{
  // Bir nechta funksiya nusxasida ham umumiy chegara: IP xeshi bo‘yicha daqiqasiga 6 ta.
  const lim=await hit('fb-ip:'+sha256('ip:'+clientIp(req,ctx)).slice(0,24),6,60000);
  if(!lim.allowed)return jsonError('Juda ko‘p baho yuborildi. Bir daqiqadan keyin urinib ko‘ring.',429);
  await recordFeedback(body);
  return jsonResponse({ok:true});
 }catch(e){
  if(e instanceof FeedbackError)return jsonError(e.message,e.status);
  if(e instanceof StoreConflict)return jsonError('Hozir so‘rovlar ko‘p. Qayta urinib ko‘ring.',429);
  if(e instanceof StoreUnavailable)return jsonError('Baholash xizmati vaqtincha ishlamayapti.',503);
  console.error('feedback: xato —',e?.name||'error');return jsonError('Baho saqlanmadi.',500);
 }
};

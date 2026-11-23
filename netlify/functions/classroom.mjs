// Ustoz-talaba rejimi API. Hamma amal tizimga kirgan foydalanuvchi uchun; flag o‘chiq bo‘lsa 503.
//   GET  /api/classroom?op=me | class&classId= | assignment&classId=&aid= | submissions&classId=&aid=
//   POST /api/classroom {op:"create-class"|"rotate-code"|"add-assignment"|"join"|"leave"|"delete-class"|"submit"|"delete-submission"|"review", ...}
import {guardJsonPost,jsonResponse,jsonError,isAllowedOrigin,isRateLimited,clientIp} from '../shared/common.mjs';
import {classroomEnabled} from '../shared/features.mjs';
import {currentUser} from '../shared/auth.mjs';
import {OPS,GETS,ClassroomError} from '../shared/classroom.mjs';
import {StoreUnavailable,StoreConflict} from '../shared/store.mjs';
export const config={path:'/api/classroom'};
const errorOut=e=>{
 if(e instanceof ClassroomError)return jsonError(e.message,e.status);
 if(e instanceof StoreConflict)return jsonError('Hozir o‘zgarishlar ko‘p. Qayta urinib ko‘ring.',429);
 if(e instanceof StoreUnavailable)return jsonError('Sinf xizmati vaqtincha ishlamayapti.',503);
 console.error('classroom: xato —',e?.name||'error');return jsonError('Amal bajarilmadi.',500);
};
export default async(req,ctx)=>{
 if(!classroomEnabled())return jsonError('Ustoz-talaba rejimi hozir o‘chirilgan.',503);
 try{
  if(req.method==='GET'){
   if(req.headers.get('origin')&&!isAllowedOrigin(req))return jsonError('Ruxsat etilmagan manba.',403);
   if(isRateLimited('classroom-get:'+clientIp(req,ctx),60,600))return jsonError('So‘rovlar limiti tugadi.',429);
   const cur=await currentUser(req);if(!cur)return jsonError('Hisobingizga kiring.',401);
   const p=new URL(req.url).searchParams;const op=p.get('op')||'me',fn=Object.hasOwn(GETS,op)?GETS[op]:null;if(!fn)return jsonError('Noma’lum amal.',400);
   return jsonResponse(await fn(cur.user,{classId:p.get('classId'),aid:p.get('aid')}));
  }
  const {body,error}=await guardJsonPost(req,ctx,{scope:'classroom',perMinute:30,perHour:300,maxBytes:40000});if(error)return error;
  const cur=await currentUser(req);if(!cur)return jsonError('Hisobingizga kiring.',401);
  const fn=Object.hasOwn(OPS,body.op)?OPS[body.op]:null;if(!fn)return jsonError('Noma’lum amal.',400);
  // Kodni taxmin qilishga qarshi: qo‘shilish urinishlari IP bo‘yicha alohida cheklanadi.
  if(body.op==='join'&&isRateLimited('classroom-join:'+clientIp(req,ctx),5,30))return jsonError('Juda ko‘p urinish. Keyinroq qayta urinib ko‘ring.',429);
  return jsonResponse(await fn(cur.user,body));
 }catch(e){return errorOut(e)}
};

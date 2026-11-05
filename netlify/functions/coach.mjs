import {guardJsonPost,jsonResponse,jsonError,isAllowedOrigin} from '../shared/common.mjs';
import {RUBRIC,SCENARIOS,structureCheck} from '../shared/coach.mjs';
export const config={path:'/api/coach'};
export default async(req,ctx)=>{
 if(req.method==='GET'){if(req.headers.get('origin')&&!isAllowedOrigin(req))return jsonError('Ruxsat etilmagan manba.',403);return jsonResponse({rubric:RUBRIC,scenarios:SCENARIOS,legalReview:'kutilmoqda'});}
 const{body,error}=await guardJsonPost(req,ctx,{scope:'coach',perMinute:30,perHour:200,maxBytes:50000});if(error)return error;
 if(!body.worksheet||typeof body.worksheet!=='object'||Array.isArray(body.worksheet))return jsonError('Ish varag‘i noto‘g‘ri.',400);
 for(const value of Object.values(body.worksheet))if(typeof value!=='string'||value.length>8000)return jsonError('Har bir maydon matn bo‘lsin va 8000 belgidan oshmasin.',400);
 return jsonResponse(structureCheck(body.worksheet));
};

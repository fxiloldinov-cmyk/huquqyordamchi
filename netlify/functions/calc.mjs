// Kalkulyatorlar API (HK_CALC_ENABLED). Faqat lawyerReview="tasdiqlangan" yozuvlar (build natijasi calc-approved.json).
//   GET  /api/calc               → tasdiqlangan kalkulyatorlar ro‘yxati
//   POST /api/calc {id, inputs}  → natija, formula va manba havolasi. Hisob serverda, aniq kasrlarda.
import {guardJsonPost,jsonResponse,jsonError,isAllowedOrigin} from '../shared/common.mjs';
import {calcEnabled} from '../shared/features.mjs';
import {compute,CalcError} from '../shared/calc.mjs';
import data from '../shared/calc-approved.json' with {type:'json'};
export const config={path:'/api/calc'};
export const approvedCalcs=(d=data)=>(d.calculators||[]).filter(c=>c.lawyerReview==='tasdiqlangan');
const view=c=>({id:c.id,title:c.title,inputs:c.inputs,formula:c.formula,unit:c.unit,rounding:c.rounding,sourceRef:c.sourceRef,source:c.source||null});
const NOTE='Hisob-kitob yo‘naltiruvchi, rasmiy xulosa emas.';
export default async(req,ctx)=>{
 if(!calcEnabled())return jsonError('Kalkulyatorlar hozir o‘chirilgan.',503);
 const list=approvedCalcs();
 if(req.method==='GET'){if(req.headers.get('origin')&&!isAllowedOrigin(req))return jsonError('Ruxsat etilmagan manba.',403);return jsonResponse({calculators:list.map(view),note:NOTE});}
 const {body,error}=await guardJsonPost(req,ctx,{scope:'calc',perMinute:30,perHour:600,maxBytes:4000});if(error)return error;
 const calc=list.find(c=>c.id===body.id);if(!calc)return jsonError('Kalkulyator topilmadi.',404);
 try{return jsonResponse({...compute(calc,body.inputs,{holidays:data.holidays}),formula:calc.formula,sourceRef:calc.sourceRef,source:calc.source||null,note:NOTE});}
 catch(e){if(e instanceof CalcError)return jsonError(e.message,400);return jsonError('Hisoblab bo‘lmadi.',500);}
};

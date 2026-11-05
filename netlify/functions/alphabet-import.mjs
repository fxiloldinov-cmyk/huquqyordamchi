import {guardJsonPost,jsonResponse,jsonError} from '../shared/common.mjs';
import {readDocx} from '../shared/alphabet-docx.mjs';
export const config={path:'/api/alphabet-import'};
export default async(req,ctx)=>{
 const {body,error}=await guardJsonPost(req,ctx,{scope:'alphabet-import',perMinute:6,perHour:30,maxBytes:2010000});if(error)return error;
 if(body.consent!==true||typeof body.data!=='string'||body.data.length>2000000||!body.data.length||body.data.length%4||!/^[A-Za-z0-9+/]*={0,2}$/.test(body.data))return jsonError('Rozilik va DOCX fayli kerak.',400);
 try{return jsonResponse({text:readDocx(Buffer.from(body.data,'base64'))})}catch{return jsonError('Word fayli o‘qilmadi. Oddiy .docx yoki matn kiriting; eski .doc qo‘llanmaydi.',400)}finally{body.data=''}
};

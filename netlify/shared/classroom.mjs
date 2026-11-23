// Ustoz-talaba rejimi (HK_CLASSROOM_ENABLED). AI baho qo‘ymaydi, email yuborilmaydi.
// Kalitlar ("classroom" ombori):
//   c_<classId>                  sinf: egasi (ustoz uid), nom, kirish kodi, talabalar, topshiriqlar ro‘yxati
//   k_<KOD>                      kirish kodi → classId
//   tc_<uid> / sc_<uid>          ustoz va talaba sinflari ro‘yxati
//   a_<classId>_<aid>            topshiriq
//   s_<classId>_<aid>_<uid>      talaba javobi (+ ustoz izohi va ixtiyoriy bahosi)
// Kirish nazorati: har bir amal sessiyadagi foydalanuvchi va sinf yozuvidagi egasi/talabalar ro‘yxati bo‘yicha tekshiriladi.
// Talaba ishini faqat o‘zi va shu sinf ustozi ko‘radi.
import {randomBytes,randomUUID} from 'node:crypto';
import {openStore} from './store.mjs';
import {sha256,normEmail} from './auth.mjs';
import {redactPII} from './common.mjs';
export const MAX_STUDENTS=60,MAX_CLASSES=10,MAX_ASSIGNMENTS=100,MAX_KAZUS=4000,MAX_ANSWER=8000,MAX_COMMENT=4000,MAX_TITLE=120,MAX_GRADE=20;
const CODE_ABC='ABCDEFGHJKMNPQRSTUVWXYZ23456789';
export class ClassroomError extends Error{constructor(msg,status){super(msg);this.status=status;}}
const fail=(m,s)=>{throw new ClassroomError(m,s)};
// 8 belgi, 31 harfli alifbo (O/0, I/1, L chiqarilgan): ~8.5·10^11 variant; qo‘shilish IP bo‘yicha cheklanadi.
export function newCode(){let s='';while(s.length<8)for(const v of randomBytes(16))if(v<248&&s.length<8)s+=CODE_ABC[v%31];return s;}
export const normCode=c=>String(c||'').toUpperCase().replace(/[\s-]/g,'');
const validId=id=>typeof id==='string'&&/^[0-9a-f-]{36}$/.test(id);
const text=(s,n,label)=>{if(typeof s!=='string'||!s.trim())fail(`${label} kiritilmagan.`,400);if(s.length>n)fail(`${label} ${n} belgidan oshmasin.`,400);return redactPII(s.replace(/\u0000/g,'').trim());};
export const teacherKey=email=>'t_'+sha256(normEmail(email));
export async function grantTeacher(email,{store,revoke=false,now=Date.now()}={}){const st=store||await openStore('teachers');if(revoke){await st.delete(teacherKey(email));return null;}const rec={schema:1,grantedAt:new Date(now).toISOString()};await st.set(teacherKey(email),rec);return rec;}
// Ustoz huquqi: qo‘lda berilgan yozuv VA tasdiqlangan email. Ikkalasidan biri bo‘lmasa — oddiy foydalanuvchi.
export async function isTeacher(user){if(!user||user.emailVerified!==true)return false;return Boolean(await (await openStore('teachers')).get(teacherKey(user.email)));}
const S=()=>openStore('classroom');
const listAdd=(key,id,max,msg)=>async st=>{await st.update(key,cur=>{const ids=cur?.ids||[];if(ids.includes(id))return undefined;if(max&&ids.length>=max)fail(msg,409);return {ids:[...ids,id]};});};
const listRemove=async(st,key,id)=>{await st.update(key,cur=>cur?.ids?.includes(id)?{ids:cur.ids.filter(x=>x!==id)}:undefined);};
async function loadClass(st,classId){if(!validId(classId))fail('Sinf topilmadi.',404);const c=await st.get('c_'+classId);if(!c)fail('Sinf topilmadi.',404);return c;}
// Ruxsat yo‘q va mavjud emas bir xil javob beradi (404) — boshqa sinf borligi oshkor bo‘lmasin.
async function ownClass(st,user,classId){const c=await loadClass(st,classId);if(c.teacherId!==user.id)fail('Sinf topilmadi.',404);return c;}
async function memberClass(st,user,classId){const c=await loadClass(st,classId);if(!c.students.includes(user.id))fail('Sinf topilmadi.',404);return c;}
const classSummary=c=>({id:c.id,title:c.title,createdAt:c.createdAt,students:c.students.length,assignments:c.assignments.length});
const assignmentView=a=>({id:a.id,title:a.title,kazus:a.kazus,dueAt:a.dueAt,createdAt:a.createdAt});
const own=s=>s&&{answer:s.answer,submittedAt:s.submittedAt,comment:s.comment||'',grade:s.grade||'',reviewedAt:s.reviewedAt||null};
export async function overview(user){
 const st=await S();const teacher=await isTeacher(user);
 const load=async key=>{const out=[];for(const id of (await st.get(key))?.ids||[]){const c=await st.get('c_'+id);if(c)out.push(c);}return out;};
 return {teacher,teaching:teacher?(await load('tc_'+user.id)).map(c=>({...classSummary(c),code:c.code})):[],enrolled:(await load('sc_'+user.id)).filter(c=>c.students.includes(user.id)).map(c=>({id:c.id,title:c.title,assignments:c.assignments.length}))};
}
export async function createClass(user,{title},{now=Date.now()}={}){
 if(!await isTeacher(user))fail('Sinf yaratish uchun ustoz huquqi va tasdiqlangan email kerak.',403);
 const st=await S();const t=text(title,MAX_TITLE,'Sinf nomi');const id=randomUUID();
 await listAdd('tc_'+user.id,id,MAX_CLASSES,`Bitta ustozda ko‘pi bilan ${MAX_CLASSES} ta sinf.`)(st);
 let code;for(let i=0;i<5&&!code;i++){const c=newCode();if(await st.setIf('k_'+c,{classId:id},null))code=c;}
 if(!code){await listRemove(st,'tc_'+user.id,id);fail('Kirish kodini yaratib bo‘lmadi. Qayta urinib ko‘ring.',503);}
 const c={id,teacherId:user.id,title:t,code,students:[],assignments:[],createdAt:new Date(now).toISOString()};await st.set('c_'+id,c);
 return {...classSummary(c),code};
}
export async function rotateCode(user,{classId}){
 const st=await S();const c=await ownClass(st,user,classId);let code;
 for(let i=0;i<5&&!code;i++){const k=newCode();if(await st.setIf('k_'+k,{classId},null))code=k;}if(!code)fail('Yangi kod yaratilmadi.',503);
 await st.update('c_'+classId,cur=>cur&&{...cur,code});await st.delete('k_'+c.code);return {code};
}
export async function addAssignment(user,{classId,title,kazus,dueAt},{now=Date.now()}={}){
 const st=await S();await ownClass(st,user,classId);
 const due=dueAt==null||dueAt===''?null:typeof dueAt==='string'&&Number.isFinite(Date.parse(dueAt))?new Date(dueAt).toISOString():fail('Muddat sanasi noto‘g‘ri.',400);
 const a={id:randomUUID(),classId,title:text(title,MAX_TITLE,'Sarlavha'),kazus:text(kazus,MAX_KAZUS,'Kazus matni'),dueAt:due,createdAt:new Date(now).toISOString()};
 await st.update('c_'+classId,cur=>{if(!cur)fail('Sinf topilmadi.',404);if(cur.assignments.length>=MAX_ASSIGNMENTS)fail(`Sinfda ko‘pi bilan ${MAX_ASSIGNMENTS} ta topshiriq.`,409);return {...cur,assignments:[...cur.assignments,a.id]};});
 await st.set(`a_${classId}_${a.id}`,a);return assignmentView(a);
}
export async function joinClass(user,{code}){
 const st=await S();const k=normCode(code);if(!/^[A-Z0-9]{8}$/.test(k))fail('Kod noto‘g‘ri.',400);
 const ref=await st.get('k_'+k);if(!ref)fail('Bunday kodli sinf topilmadi.',404);
 let title='';
 await st.update('c_'+ref.classId,cur=>{if(!cur||cur.code!==k)fail('Bunday kodli sinf topilmadi.',404);if(cur.teacherId===user.id)fail('O‘z sinfingizga talaba sifatida qo‘shila olmaysiz.',409);title=cur.title;if(cur.students.includes(user.id))return undefined;if(cur.students.length>=MAX_STUDENTS)fail(`Sinf to‘lgan (${MAX_STUDENTS} talaba).`,409);return {...cur,students:[...cur.students,user.id]};});
 await listAdd('sc_'+user.id,ref.classId)(st);return {id:ref.classId,title};
}
async function deleteSubmissions(st,c,uids){for(const aid of c.assignments)for(const uid of uids)await st.delete(`s_${c.id}_${aid}_${uid}`);}
// Talaba chiqsa, uning shu sinfdagi javoblari ham o‘chiriladi (ustozda qolmaydi).
export async function leaveClass(user,{classId}){
 const st=await S();const c=await memberClass(st,user,classId);
 await st.update('c_'+classId,cur=>cur&&cur.students.includes(user.id)?{...cur,students:cur.students.filter(x=>x!==user.id)}:undefined);
 await deleteSubmissions(st,c,[user.id]);await listRemove(st,'sc_'+user.id,classId);return {ok:true};
}
export async function deleteClass(user,{classId}){
 const st=await S();const c=await ownClass(st,user,classId);
 await deleteSubmissions(st,c,c.students);for(const aid of c.assignments)await st.delete(`a_${classId}_${aid}`);
 for(const uid of c.students)await listRemove(st,'sc_'+uid,classId);
 await st.delete('k_'+c.code);await st.delete('c_'+classId);await listRemove(st,'tc_'+user.id,classId);return {ok:true};
}
async function loadAssignment(st,c,aid){if(!validId(aid)||!c.assignments.includes(aid))fail('Topshiriq topilmadi.',404);const a=await st.get(`a_${c.id}_${aid}`);if(!a)fail('Topshiriq topilmadi.',404);return a;}
export async function getClass(user,{classId}){
 const st=await S();const c=await loadClass(st,classId);const owner=c.teacherId===user.id;if(!owner&&!c.students.includes(user.id))fail('Sinf topilmadi.',404);
 const assignments=[];for(const aid of c.assignments){const a=await st.get(`a_${classId}_${aid}`);if(a)assignments.push({...assignmentView(a),...(owner?{}:{submitted:Boolean(await st.get(`s_${classId}_${aid}_${user.id}`))})});}
 return {...classSummary(c),role:owner?'teacher':'student',...(owner?{code:c.code}:{}),assignments};
}
export async function getAssignment(user,{classId,aid}){
 const st=await S();const c=await loadClass(st,classId);const owner=c.teacherId===user.id;if(!owner&&!c.students.includes(user.id))fail('Topshiriq topilmadi.',404);
 const a=await loadAssignment(st,c,aid);return {...assignmentView(a),classTitle:c.title,role:owner?'teacher':'student',...(owner?{}:{mine:own(await st.get(`s_${classId}_${aid}_${user.id}`))||null})};
}
export async function submit(user,{classId,aid,answer},{now=Date.now()}={}){
 const st=await S();const c=await memberClass(st,user,classId);const a=await loadAssignment(st,c,aid);
 if(a.dueAt&&now>Date.parse(a.dueAt))fail('Topshirish muddati tugagan.',409);
 const body=text(answer,MAX_ANSWER,'Javob');
 const r=await st.update(`s_${classId}_${aid}_${user.id}`,cur=>({uid:user.id,name:user.name||'',email:user.email,answer:body,submittedAt:new Date(now).toISOString(),comment:cur?.comment||'',grade:cur?.grade||'',reviewedAt:cur?.reviewedAt||null}));
 return own(r.value);
}
export async function deleteSubmission(user,{classId,aid}){const st=await S();const c=await memberClass(st,user,classId);await loadAssignment(st,c,aid);await st.delete(`s_${classId}_${aid}_${user.id}`);return {ok:true};}
export async function listSubmissions(user,{classId,aid}){
 const st=await S();const c=await ownClass(st,user,classId);const a=await loadAssignment(st,c,aid);const out=[];
 for(const uid of c.students){const s=await st.get(`s_${classId}_${aid}_${uid}`);if(s)out.push({studentId:uid,name:s.name,email:s.email,...own(s)});}
 return {assignment:assignmentView(a),students:c.students.length,submissions:out};
}
export async function review(user,{classId,aid,studentId,comment,grade},{now=Date.now()}={}){
 const st=await S();const c=await ownClass(st,user,classId);await loadAssignment(st,c,aid);if(!c.students.includes(studentId))fail('Javob topilmadi.',404);
 const cm=comment==null||comment===''?'':text(comment,MAX_COMMENT,'Izoh');
 if(grade!=null&&(typeof grade!=='string'||grade.length>MAX_GRADE))fail(`Baho ${MAX_GRADE} belgidan oshmasin.`,400);
 const r=await st.update(`s_${classId}_${aid}_${studentId}`,cur=>{if(!cur)fail('Javob topilmadi.',404);return {...cur,comment:cm,grade:String(grade||'').trim(),reviewedAt:new Date(now).toISOString()};});
 return own(r.value);
}
export const OPS={'create-class':createClass,'rotate-code':rotateCode,'add-assignment':addAssignment,join:joinClass,leave:leaveClass,'delete-class':deleteClass,submit,'delete-submission':deleteSubmission,review};
export const GETS={me:overview,class:getClass,assignment:getAssignment,submissions:listSubmissions};

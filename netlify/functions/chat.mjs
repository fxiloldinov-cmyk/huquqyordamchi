import {redactPII,guardJsonPost,jsonError,geminiConfig,callGeminiResilient,providerError,pipeGeminiStream,LEGAL_RULES,SEARCH_OFF_NOTE,sourceTail,legal} from '../shared/common.mjs';
import {retrieve,citationReport} from '../shared/rag.mjs';
export const config={path:'/api/chat',rateLimit:{windowLimit:10,windowSize:60,aggregateBy:['ip','domain']}};
export default async(req,ctx)=>{
 const startedAt=Date.now();
 const {body,error}=await guardJsonPost(req,ctx,{scope:'chat',perMinute:10,perHour:60});if(error)return error;
 if(!Array.isArray(body.messages)||!body.messages.length||body.messages.length>20)return jsonError('1–20 ta xabar yuboring.',400);
 let count=0;const contents=[];
 for(const item of body.messages){if(!item||!['user','assistant'].includes(item.role)||typeof item.content!=='string'||!item.content.trim()||item.content.length>8000)return jsonError('Xabar formati yoki hajmi noto‘g‘ri.',400);count+=item.content.length;if(count>30000)return jsonError('Suhbat juda uzun. Yangi suhbat boshlang.',400);contents.push({role:item.role==='assistant'?'model':'user',parts:[{text:redactPII(item.content.trim())}]});}
 if(contents[0].role!=='user'||contents.at(-1).role!=='user'||contents.some((m,i)=>i>0&&m.role===contents[i-1].role))return jsonError('Suhbat rollari navbatma-navbat kelishi kerak.',400);
 const {apiKey,models,thinkingLevel}=geminiConfig();if(!apiKey)return jsonError('AI xizmati hozir ulanmagan. Katalog va hujjat namunalari ishlaydi.',503);
 const selected=legal.codes.find(c=>c[3]===body.codeId);
 const explain=body.task==='explain'&&selected?`\nQONUNNI SODDA TILDA TUSHUNTIRISH. Faqat ${selected[1]} (https://lex.uz/docs/${selected[3]}) doirasida ishlang. Tuzilma: 1)Oddiy ma’nosi; 2)Kimga tegishli; 3)Aniq modda/qism va manba; 4)Kundalik misol; 5)Amaliy qadamlar; 6)Istisno va aniqlashtirish. Foydalanuvchi qo‘ygan matnni rasmiy matn deb tekshirmasdan tasdiqlamang.`:'';
 const rag=retrieve(contents.at(-1).parts[0].text,{k:6,budget:10000,force:selected?.[0]==='MK'});
 const prompt=LEGAL_RULES+rag.block+explain+(body.mode==='student'?'\nTalaba uchun masala, norma, tahlil, xulosa tartibida yozing.':'\nSodda tilda vaziyat, qonuniy asos, amaliy qadamlar, kerakli hujjatlar va ochiq savollarni tushuntiring.');
 try{const r=await callGeminiResilient({apiKey,models,thinkingLevel,allowNoSearch:true,stream:true,signal:req.signal,timeoutMs:58000,body:{system_instruction:{parts:[{text:prompt}]},contents,tools:[{google_search:{}}],generationConfig:{temperature:0.1,maxOutputTokens:6000}}});if(!r.ok)return providerError(r);if(!r.upstream.body)return jsonError('AI javobi kelmadi.',502);return pipeGeminiStream(r.upstream,{deadlineAt:startedAt+50000,prefix:r.searchDropped?SEARCH_OFF_NOTE:'',onEnd:(src,text)=>sourceTail(src)+citationReport(text,rag.provided,{bands:rag.bands})});}catch(e){return jsonError(e.name==='TimeoutError'?'AI javobini kutish vaqti tugadi. Qayta urinib ko‘ring.':'AI bilan ulanish uzildi.',502);}
};

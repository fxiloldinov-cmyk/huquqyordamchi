import {trafficCoverageNotice} from '../shared/traffic.mjs';
import { guardJsonPost, jsonError, jsonResponse, isAllowedOrigin, geminiConfig, callGeminiResilient, providerError, pipeGeminiStream, LEGAL_RULES } from '../shared/common.mjs';
import { retrieve, citationReport, sourcesMarker } from '../shared/rag.mjs';
import { internationalEnabled } from '../shared/features.mjs';
import { guardAi } from '../shared/limits.mjs';
import { INTERNATIONAL_TOPICS, internationalInput, internationalPrompt } from '../shared/international.mjs';

export const config = { path: '/api/international', rateLimit: { windowLimit: 8, windowSize: 60, aggregateBy: ['ip','domain'] } };
export default async (req, ctx) => {
 if(!internationalEnabled())return jsonError('Bu bo‘lim o‘chirilgan.',404);
 if (req.method === 'GET') {
  if (req.headers.get('origin') && !isAllowedOrigin(req)) return jsonError('Ruxsat etilmagan manba.',403);
  return jsonResponse({ topics: Object.fromEntries(Object.entries(INTERNATIONAL_TOPICS).map(([key,v])=>[key,Object.keys(v)])), languages: ['en','de','uz','ru','fr'], payments: 'disabled', notice: 'Visa, registration, consular and investment coverage is incomplete. No official eligibility decision.' });
 }
 const started = Date.now();
 const {body,error} = await guardJsonPost(req,ctx,{scope:'international',perMinute:8,perHour:40,maxBytes:80000});
 if (error) return error;
 let checked; try { checked = internationalInput(body); } catch { return jsonError('Sana yoki maydon noto‘g‘ri.',400); }
 if (checked.error) return jsonError(checked.error,400);
 const input = checked.value;
 const trafficNotice=trafficCoverageNotice(input.facts+' '+input.contract);if(trafficNotice)return new Response(trafficNotice,{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 const topic = INTERNATIONAL_TOPICS[input.type][input.topic];
 const rag = retrieve(`${input.facts}\n${input.contract}\n${topic.query}`, {k:10,budget:16000,force:topic.force,eventDate:input.eventDate});
 // Umumiy kodeksdagi tasodifiy moslik maxsus viza/investitsiya manbasi bo‘la olmaydi.
 const relevant = topic.coverage === 'limited' ? rag.passages.filter(p => (topic.sourceDocs || []).includes(p.doc)) : rag.passages;
 if(!relevant.length){
  const extra={en:'No information on this topic is available in the local database. AI was not called.',de:'Zu diesem Thema liegen keine Informationen in der lokalen Datenbank vor. Die KI wurde nicht aufgerufen.',ru:'По этой теме в локальной базе нет данных. ИИ не вызывался.',fr:'La base locale ne contient pas d’informations sur ce sujet. L’IA n’a pas été appelée.'};
  return new Response('Bu mavzu bo‘yicha ma’lumot bazada yo‘q. AI chaqirilmadi.'+(input.lang==='uz'?'':'\n'+extra[input.lang]),{headers:{'Content-Type':'text/plain; charset=utf-8','Cache-Control':'no-store'}});
 }
 const {apiKey,models,thinkingLevel} = geminiConfig();
 if (!apiKey) return jsonError('AI xizmati hozir ulanmagan. / AI service is not configured.',503);
 const limited = await guardAi(req,ctx,'international'); if (limited) return limited;
 try {
  const r = await callGeminiResilient({apiKey,models,thinkingLevel,stream:true,signal:req.signal,timeoutMs:58000,body:{system_instruction:{parts:[{text:LEGAL_RULES+'\n'+internationalPrompt(input)+rag.block}]},contents:[{role:'user',parts:[{text:JSON.stringify(input)}]}],generationConfig:{temperature:0.1,maxOutputTokens:6000}}});
  if (!r.ok) return providerError(r);
  if (!r.upstream.body) return jsonError('AI javobi kelmadi.',502);
  return pipeGeminiStream(r.upstream,{deadlineAt:started+48000,onEnd:(sources,text)=>citationReport(text,rag.provided,{bands:rag.bands,bandsBy:rag.bandsBy,eventDate:input.eventDate})+sourcesMarker(text,rag,{eventDate:input.eventDate})});
 } catch { return jsonError('AI bilan ulanish uzildi. / AI connection interrupted.',502); }
};

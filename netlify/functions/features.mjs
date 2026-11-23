import {voiceEnabled} from '../shared/voice.mjs';
import {internationalEnabled,feedbackEnabled,classroomEnabled,calcEnabled} from '../shared/features.mjs';
import {plansEnabled} from '../shared/plans.mjs';
import {jsonResponse} from '../shared/common.mjs';
import {approvedCalcs} from './calc.mjs';
export const config={path:'/api/features'};
export default async req=>req.method==='GET'?jsonResponse({international:internationalEnabled(),voice:voiceEnabled(),plans:plansEnabled(),translation:process.env.HK_TRANSLATION_ENABLED==='1',feedback:feedbackEnabled(),classroom:classroomEnabled(),calc:calcEnabled()&&approvedCalcs().length>0}):new Response('Method Not Allowed',{status:405,headers:{Allow:'GET'}});

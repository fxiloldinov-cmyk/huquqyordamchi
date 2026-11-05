import {voiceEnabled} from '../shared/voice.mjs';
import {internationalEnabled} from '../shared/features.mjs';
import {plansEnabled} from '../shared/plans.mjs';
import {jsonResponse} from '../shared/common.mjs';
export const config={path:'/api/features'};
export default async req=>req.method==='GET'?jsonResponse({international:internationalEnabled(),voice:voiceEnabled(),plans:plansEnabled()}):new Response('Method Not Allowed',{status:405,headers:{Allow:'GET'}});

import { jsonResponse,jsonError,isAllowedOrigin } from '../shared/common.mjs';
import { currentUser } from '../shared/auth.mjs';
import { PLANS,plansEnabled,planStatus } from '../shared/plans.mjs';
export const config={path:'/api/plans'};
export default async(req)=>{
 if(req.method!=='GET')return new Response('Method Not Allowed',{status:405,headers:{Allow:'GET'}});
 if(req.headers.get('origin')&&!isAllowedOrigin(req))return jsonError('Ruxsat etilmagan manba.',403);
 try{
  const cur=await currentUser(req);
  return jsonResponse({plans:PLANS,enabled:plansEnabled(),paymentEnabled:false,status:cur?await planStatus(cur.user):null,
   note:'Narxlar sinov gipotezasi. Onlayn to‘lov ulanmagan. Pilot tarifi faqat administrator server sozlamasida beriladi.'});
 }catch{return jsonError('Tarif xizmati vaqtincha ishlamayapti.',503)}
};

// v11.11: tariflar havolasi flag ortida, YHQ ilovalari cheklovi, Coach sinov belgisi, ovoz maxfiyligi.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import features from '../netlify/functions/features.mjs';
import {trafficAnnexNotice,trafficLaw} from '../netlify/shared/traffic.mjs';
import {retrieve} from '../netlify/shared/rag.mjs';
const read=p=>fs.readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('plans link is hidden until HK_KAZUS_PLANS_ENABLED=1',async()=>{
 const old=process.env.HK_KAZUS_PLANS_ENABLED;
 try{
  delete process.env.HK_KAZUS_PLANS_ENABLED;assert.equal((await(await features(new Request('https://x.test/api/features'))).json()).plans,false);
  process.env.HK_KAZUS_PLANS_ENABLED='1';assert.equal((await(await features(new Request('https://x.test/api/features'))).json()).plans,true);
 }finally{if(old===undefined)delete process.env.HK_KAZUS_PLANS_ENABLED;else process.env.HK_KAZUS_PLANS_ENABLED=old}
 assert.match(read('public/index.html'),/<a href="\/plans\.html" data-plans hidden>/);
 assert.match(read('public/suite.js'),/flags\?\.plans===true/);
 assert.match(read('public/premium.css'),/\[data-plans\]\[hidden\]/);
 assert.ok(!read('public/coach.html').includes('href="/plans.html"'));
 assert.match(read('public/plans.html'),/name="robots" content="noindex"/);
 assert.match(read('public/plans.js'),/if\(!d\.enabled\)\{status\.textContent='Pilot tariflar hozir faol emas/);
 assert.ok(!read('public/sitemap.xml').includes('plans.html'));
});

test('sign and marking questions state that YHQ annexes are not indexed',()=>{
 assert.ok(trafficLaw,'YHQ bazada bo‘lishi kerak');
 for(const q of ["YHQ bo'yicha yo'l belgisi 3.1 nimani anglatadi?",'йўл белгиси YHQ','ДПС остановила возле дорожного знака','YHQ yo‘l chizig‘ini kesib o‘tdim'])assert.match(trafficAnnexNotice(q),/indekslanmagan.*lex\.uz/s,q);
 for(const q of ['YHQ 117-band tezlik',"Ishdan bo'shatildim",'svetofor qizil chiroqda o‘tdim'])assert.equal(trafficAnnexNotice(q),null,q);
 assert.match(retrieve("YHQ yo'l belgisi 3.1 nimani anglatadi?").block,/indekslanmagan/);
 assert.ok(!/indekslanmagan/.test(retrieve('YHQ 117-band tezlik').block));
});

test('coach is marked as beta and voice warns that audio is not masked',()=>{
 assert.match(read('public/coach.html'),/Sinov rejimi\.<\/b> O‘quv vaziyatlari/);
 assert.match(read('public/index.html'),/IRAC ish varag‘i · sinov/);
 const v=read('public/voice.js');
 assert.match(v,/chet eldagi Google Gemini serveriga/);
 assert.match(v,/not masked in audio/);
 assert.equal(read('.env.example').match(/^HK_VOICE_ENABLED=(.*)$/m)?.[1]?.trim()??'0','0');
});

test('new home-page texts have ru/en translations',()=>{
 const i18n=read('public/i18n.js');
 for(const s of ['Vazifangizga mos yordamchi','O‘zbekistonga sayohat','Biznes va shartnomalar','Tuzilishni tekshirish','Asos topish →','Huquqiy savolingiz'])assert.ok(i18n.includes(`"${s}": [`),s);
});

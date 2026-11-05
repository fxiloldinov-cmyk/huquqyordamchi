(() => {
 'use strict';
 const $=id=>document.getElementById(id), KEY='hk-coach-v118';
 const ids=['kazus','fan','eventDate','facts','parties','issue','rule','application','alternative','conclusion','answer','revision','reflection'];
 const sheetIds=['facts','parties','issue','rule','application','alternative','conclusion'];
 const titles={facts:'Muhim faktlar',parties:'Tomonlar va yetishmayotgan faktlar',issue:'I · Masala',rule:'R · Norma',application:'A · Qo‘llash',alternative:'Muqobil dalil',conclusion:'C · Xulosa'};
 let catalog=[],busy=false,controller=null,feedback='',sources=null;
 const status=text=>{$('status').textContent=text;};
 const snapshot=()=>({version:1,at:new Date().toISOString(),fields:Object.fromEntries(ids.map(id=>[id,$(id).value])),selfCheck:[...document.querySelectorAll('#rubric input')].map(el=>({id:el.value,checked:el.checked})),feedback,sources});
 const download=(name,text,type)=>{const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 function clean(raw){let payload=null;const text=raw.replace(/⁣HK:SRC:([^⁣]*)⁣/g,(_,json)=>{try{payload=JSON.parse(decodeURIComponent(json))}catch{}return '';}).replace(/⁣HK:(?:CONT:[^⁣]*|END)⁣/g,'').replace(/⁣HK:[^⁣]*$/,'');return{text,payload};}
 function showSources(payload){$('sources').replaceChildren();if(!payload)return;const heading=document.createElement('h3');heading.textContent='Tahlilga berilgan manbalar — xulosa tasdiqlangan degani emas';$('sources').append(heading);for(const p of (payload.passages||[]).slice(0,30)){let url;try{url=new URL(p.url);if(url.protocol!=='https:'||!['lex.uz','www.lex.uz'].includes(url.hostname))continue;}catch{continue;}const a=document.createElement('a');a.href=url.href;a.target='_blank';a.rel='noopener';a.textContent=`${p.label||p.doc||'Rasmiy parcha'}${p.art&&!p.label?' · '+p.art+(p.kind==='plenum'?'-band':'-modda'):''}${p.asOf?' · '+p.asOf:''}`;$('sources').append(a);}}
 function restore(data){if(!data||data.version!==1||!data.fields)return;for(const id of ids)if(typeof data.fields[id]==='string')$(id).value=data.fields[id].slice(0,Number($(id).maxLength)>0?$(id).maxLength:8000);feedback=typeof data.feedback==='string'?data.feedback.slice(0,240000):'';sources=data.sources&&typeof data.sources==='object'?data.sources:null;$('feedback').textContent=feedback;showSources(sources);for(const c of data.selfCheck||[]){const el=[...document.querySelectorAll('#rubric input')].find(e=>e.value===c.id);if(el)el.checked=c.checked===true;}}
 async function json(path,body){const r=await fetch(path,{method:body?'POST':'GET',credentials:'same-origin',headers:body?{'Content-Type':'application/json'}:{},body:body?JSON.stringify(body):undefined});const d=await r.json();if(!r.ok)throw new Error(d.error||'So‘rov bajarilmadi.');return d;}
 async function ai(task,revision=false){
  if(busy)return;
  if(!$('consent').checked){status('AI xizmatiga yuborish uchun rozilik belgisini qo‘ying.');return;}
  const kazus=$('kazus').value.trim(),answer=$(revision?'revision':'answer').value.trim();
  if(kazus.length<40){status('Kazus kamida 40 belgi bo‘lsin.');return;}
  if(task==='review'&&answer.length<40){status('O‘z javobingiz kamida 40 belgi bo‘lsin.');return;}
  busy=true;controller=new AbortController();['hint','review','review-revision','assemble','load-scenario'].forEach(id=>$(id).disabled=true);$('stop').hidden=false;feedback='';sources=null;showSources(null);$('feedback').textContent='';status('AI tayyorlamoqda…');
  try{
   const res=await fetch('/api/kazus',{method:'POST',credentials:'same-origin',signal:controller.signal,headers:{'Content-Type':'application/json'},body:JSON.stringify({task,kazus,studentAnswer:answer,fan:$('fan').value,eventDate:$('eventDate').value,mode:'standart',lang:'uz'})});
   if(!res.ok){let d={};try{d=await res.json()}catch{}throw new Error(d.error||'AI so‘rovi bajarilmadi.');}
   if(!res.body)throw new Error('Javob oqimi kelmadi.');
   const reader=res.body.getReader(),decoder=new TextDecoder();let raw='';
   for(;;){const{done,value}=await reader.read();if(done)break;raw+=decoder.decode(value,{stream:true});$('feedback').textContent=clean(raw).text;}
   raw+=decoder.decode();const parsed=clean(raw);feedback=parsed.text;sources=parsed.payload;$('feedback').textContent=feedback;showSources(sources);
   const incomplete=/⁣HK:CONT:/.test(raw);status(incomplete?'Javob vaqt chegarasida uzildi. Bu qisman javob; qolganini mavjud Kazus Ustaxonasida davom ettirishingiz mumkin.':'AI fikri tayyor. Manbalarni ochib tekshiring; bu rasmiy baho emas.');
  }catch(e){feedback=$('feedback').textContent;status(e.name==='AbortError'?'To‘xtatildi. Ko‘rinayotgan matn qisman javob.':e.message);}
  finally{busy=false;controller=null;['hint','review','review-revision','assemble','load-scenario'].forEach(id=>$(id).disabled=false);$('stop').hidden=true;}
 }
 $('hint').onclick=()=>ai('hint');$('review').onclick=()=>ai('review');$('review-revision').onclick=()=>ai('review',true);$('stop').onclick=()=>controller?.abort();
 $('assemble').onclick=()=>{const text=sheetIds.map(id=>`${titles[id]}\n${$(id).value.trim()||'[hali to‘ldirilmagan]'}`).join('\n\n');if(text.length>8000){status('Yig‘ilgan matn 8000 belgidan oshdi. Maydonlarni qisqartiring.');return;}$('answer').value=text;status('Ish varag‘i dastlabki javobga olindi. Yuborishdan oldin tahrirlang.');};
 $('compare').onclick=()=>{const a=$('answer').value,b=$('revision').value;$('before').textContent=a;$('after').textContent=b;$('comparison').textContent=!a.trim()||!b.trim()?'Solishtirish uchun ikkala javobni yozing.':a===b?'Matnlar bir xil.':`Matnlar farq qiladi: ${a.length} → ${b.length} belgi. Hajm o‘zgarishi sifat yoki huquqiy to‘g‘rilik bahosi emas. O‘zgartirish sababini yozing.`;};
 $('check').onclick=()=>{const filled=sheetIds.filter(id=>$(id).value.trim()).length;$('check-result').textContent=`${filled}/7 maydon to‘ldirilgan. Faqat mavjud matn sanaldi; mazmun, normaning to‘g‘riligi va sifat tekshirilmadi.`;};
 $('load-scenario').onclick=()=>{const s=catalog.find(x=>x.id===$('scenario').value);if(!s){status('Mashqni tanlang yoki o‘z kazusingizni yozing.');return;}$('kazus').value=s.text;$('fan').value=s.fan;status('To‘qima mashq olindi. Oldingi ish varag‘i saqlanib turibdi; yangi vaziyatga moslab o‘zgartiring.');};
 $('save-local').onclick=()=>{if(!$('local').checked){status('Qurilmada saqlash uchun rozilik belgisini qo‘ying.');return;}try{localStorage.setItem(KEY,JSON.stringify(snapshot()));status('Shu qurilmada nusxa saqlandi. Umumiy qurilmada ish tugagach uni o‘chiring.');}catch{status('Brauzer xotirasiga saqlab bo‘lmadi. JSON faylni yuklashingiz mumkin.');}};
 $('delete-local').onclick=()=>{try{localStorage.removeItem(KEY);$('local').checked=false;status('Qurilmadagi saqlangan nusxa o‘chirildi. Hozirgi maydonlar va yuklangan JSON nusxalari o‘zgarmadi.');}catch{status('Brauzer xotirasini ochib bo‘lmadi.');}};
 $('local').onchange=()=>{if(!$('local').checked)try{localStorage.removeItem(KEY);status('Qurilmadagi nusxa o‘chirildi.');}catch{status('Qurilma xotirasidagi nusxani o‘chirib bo‘lmadi.');}};
 $('export').onclick=()=>download('HuquqYordamchi_IRAC.json',JSON.stringify(snapshot(),null,2),'application/json');
 $('save-account').onclick=async()=>{if(busy){status('Avval AI javobi tugashini kuting.');return;}const text=JSON.stringify(snapshot(),null,2);if(text.length>60000){status('Ish nusxasi hisobga saqlash chegarasidan oshdi. JSON faylni yuklang.');return;}$('save-account').disabled=true;try{await json('/api/auth/me');const c=await json('/api/account/cases',{op:'create',title:'IRAC ish varag‘i: '+$('kazus').value.slice(0,60),kind:'kazus',soha:$('fan').value,eventDate:$('eventDate').value||null});await json('/api/account/cases',{op:'append',id:c.case.id,entry:{task:'note',question:$('kazus').value,answer:text,sources}});status('Nusxa hisobingizdagi “Ishlarim”ga saqlandi.');}catch(e){status(e.message+' Hisobga bosh sahifa orqali kirishingiz mumkin.');}finally{$('save-account').disabled=false;}};
 $('theme').onclick=()=>document.body.classList.toggle('dark');
 async function init(){try{const [data,kazus]=await Promise.all([json('/api/coach'),json('/api/kazus')]);catalog=data.scenarios;for(const [id,title]of Object.entries(kazus.fanlar||{})){if(id==='boshqa')continue;const o=new Option(title,id);$('fan').add(o);}for(const s of catalog)$('scenario').add(new Option(s.title,s.id));for(const r of data.rubric){const label=document.createElement('label');label.className='check';const input=document.createElement('input');input.type='checkbox';input.value=r.id;label.append(input,document.createTextNode(r.title+' · '+r.prompt));$('rubric').append(label);}try{const raw=localStorage.getItem(KEY);if(raw){restore(JSON.parse(raw));$('local').checked=true;status('Oldin rozilik bilan saqlangan qurilma nusxasi ochildi.');}}catch{status('Saqlangan nusxani o‘qib bo‘lmadi.');}}catch{status('Mashqlar ro‘yxati yuklanmadi. Ish varag‘ini to‘ldirish, solishtirish va JSON eksporti ishlaydi.');}}
 init();
})();

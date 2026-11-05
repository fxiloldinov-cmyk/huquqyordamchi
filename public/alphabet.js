import {convertText,latinToNew,textToDocx} from './alphabet-core.js';
const $=id=>document.getElementById('alpha-'+id),input=$('input'),output=$('output'),mode=$('mode');let controller=null,epoch=0,busy=false;
const status=text=>$('status').textContent=text;
function cancel(){epoch++;controller?.abort();controller=null;busy=false;$('run').disabled=false;$('stop').hidden=true;}
function invalidate(){cancel();output.value='';status('');$('count').textContent=input.value.length+' / 50000';}
input.addEventListener('input',invalidate);output.addEventListener('input',()=>{cancel();status('Natija tahrirlandi.');});
mode.addEventListener('change',()=>{invalidate();const russian=mode.value==='russian';$('translation-consent-row').hidden=!russian;$('translation-consent').checked=false;$('mode-note').textContent=russian?'Ruscha rejim — mashina tarjimasi. 6000 belgigacha; internet va serverdagi tarjima xizmati kerak. Natijadagi mazmun, ismlar va raqamlarni tekshiring.':'Lotin/kirill o‘girish brauzerda bajariladi. Matn serverga yuborilmaydi. Shaxsiy ism, havola va maxsus atamalarni tekshiring.';});
async function post(url,body){const res=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),signal:controller.signal,cache:'no-store'});const value=await res.json();if(!res.ok)throw Error(value.error||value.message||'So‘rov bajarilmadi.');return value;}
$('file').addEventListener('change',async()=>{
 invalidate();const file=$('file').files[0];if(!file)return;const ticket=epoch;
 try{
  if(file.size>1500000)throw Error('Fayl 1,5 MB dan oshmasin.');const ext=file.name.split('.').pop().toLowerCase();let text;
  if(ext==='txt'){text=new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer());}
  else if(ext==='docx'){
   if(!$('file-consent').checked)throw Error('Avval DOCX faylini serverga yuborish roziligini belgilang, so‘ng faylni qayta tanlang.');
   if(!navigator.onLine)throw Error('DOCX faylini o‘qish uchun internet kerak.');
   controller=new AbortController();busy=true;$('run').disabled=true;$('stop').hidden=false;status('Word matni olinmoqda…');
   const bytes=new Uint8Array(await file.arrayBuffer());if(ticket!==epoch)return;let binary='';for(let i=0;i<bytes.length;i+=16384)binary+=String.fromCharCode(...bytes.subarray(i,i+16384));
   text=(await post('/api/alphabet-import',{data:btoa(binary),consent:true})).text;
  }else throw Error('Faqat .docx yoki UTF-8 .txt faylini tanlang.');
  if(ticket!==epoch)return;if(typeof text!=='string'||text.length>50000)throw Error('Matn 50000 belgidan oshmasin.');input.value=text;$('count').textContent=text.length+' / 50000';status('Matn olindi. Yozuv turini tekshirib, o‘girish tugmasini bosing.');
 }catch(e){if(ticket===epoch)status(e.name==='AbortError'?'Bekor qilindi.':e.message)}finally{if(ticket===epoch){cancel();$('file').value='';}}
});
$('form').addEventListener('submit',async e=>{e.preventDefault();cancel();output.value='';const ticket=epoch;if(!input.value.trim()){status('Matn kiriting.');return}
 try{
  if(mode.value!=='russian'){output.value=convertText(input.value,mode.value);status('Matn o‘girildi. Natijani tekshiring.');return}
  if(input.value.length>6000)throw Error('Ruscha tarjima uchun 6000 belgigacha kiriting.');if(!$('translation-consent').checked)throw Error('Tarjima uchun rozilikni belgilang.');if(!navigator.onLine)throw Error('Tarjima uchun internet kerak.');
  controller=new AbortController();busy=true;$('run').disabled=true;$('stop').hidden=false;status('O‘zbekchaga tarjima qilinmoqda…');const value=await post('/api/alphabet-translate',{text:input.value,consent:true});if(ticket!==epoch)return;output.value=latinToNew(value.text);status('Mashina tarjimasi olindi. Mazmun va raqamlarni tekshiring.');
 }catch(e){if(ticket===epoch)status(e.name==='AbortError'?'Bekor qilindi.':e.message)}finally{if(ticket===epoch)cancel();}
});
$('stop').onclick=()=>{cancel();status('Bekor qilindi.');};$('clear').onclick=()=>{cancel();input.value='';output.value='';$('file').value='';$('file-consent').checked=false;$('translation-consent').checked=false;$('count').textContent='0 / 50000';status('Matn tozalandi.');};
function result(){if(!output.value.trim()){status('Avval natija oling.');return false}return true}
$('copy').onclick=async()=>{if(!result())return;try{await navigator.clipboard.writeText(output.value);status('Nusxalandi.')}catch{output.focus();output.select();status('Matn belgilandi. Ctrl+C orqali nusxalang.')}};
function download(blob,name){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
$('txt').onclick=()=>{if(result())download(new Blob([output.value],{type:'text/plain;charset=utf-8'}),'yangi-alifbo.txt')};$('docx').onclick=()=>{if(result())download(textToDocx(output.value),'yangi-alifbo.docx')};
addEventListener('pagehide',cancel);addEventListener('offline',()=>{if(busy){cancel();status('Internet uzildi. Lotin/kirill matnini brauzerda o‘girish mumkin.')}});

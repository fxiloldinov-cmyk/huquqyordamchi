// AI javobiga baho: "Foydali" / "Xato bor". Faqat HK_FEEDBACK_ENABLED=1 va server javob ID bergan bo‘lsa ko‘rinadi.
// Savol matni yuborilmaydi: faqat javob ID, baho, sabab va ixtiyoriy izoh. Ikki marta so‘ralmaydi, eslatma chiqmaydi.
(()=>{
 const REASONS=[['notogri_modda','Noto‘g‘ri modda'],['eskirgan','Eskirgan ma’lumot'],['tushunarsiz','Tushunarsiz'],['boshqa','Boshqa']];
 const on=fetch('/api/features',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(f=>f?.feedback===true).catch(()=>false);
 const send=async(responseId,rating,reason,comment)=>{const r=await fetch('/api/feedback',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({responseId,rating,reason,comment})});if(r.ok)return '';try{return (await r.json()).error||'Baho saqlanmadi.'}catch{return 'Baho saqlanmadi.'}};
 async function attach(el,responseId){
  if(!el||!responseId||!/^[A-Za-z0-9_-]{22}$/.test(responseId)||!await on)return;
  const box=document.createElement('div');box.className='fb-box';
  box.innerHTML='<span class="fb-q">Javob foydali bo‘ldimi?</span> <button type="button" class="fb-btn" data-fb="foydali">Foydali</button> <button type="button" class="fb-btn" data-fb="xato">Xato bor</button><form class="fb-form" hidden><label>Sabab <select name="reason">'+REASONS.map(([v,l])=>`<option value="${v}">${l}</option>`).join('')+'</select></label><label>Izoh (ixtiyoriy) <textarea name="comment" maxlength="500" rows="2" placeholder="Shaxsiy ma’lumot yozmang"></textarea></label><button type="submit" class="fb-btn">Yuborish</button></form><span class="fb-status" role="status"></span>';
  el.after(box);
  const status=box.querySelector('.fb-status'),form=box.querySelector('form');
  const done=async(rating,reason,comment)=>{box.querySelectorAll('button,select,textarea').forEach(b=>b.disabled=true);status.textContent='Yuborilmoqda…';const err=await send(responseId,rating,reason,comment);status.textContent=err||'Rahmat, bahoingiz saqlandi.';if(!err)form.hidden=true;};
  box.addEventListener('click',e=>{const b=e.target.closest('[data-fb]');if(!b)return;if(b.dataset.fb==='foydali')done('foydali',null,'');else{form.hidden=false;form.querySelector('select').focus();}});
  form.addEventListener('submit',e=>{e.preventDefault();done('xato',form.reason.value,form.comment.value.trim().slice(0,500));});
 }
 globalThis.HKFeedback={attach};
})();

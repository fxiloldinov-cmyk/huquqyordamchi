(async()=>{
 const status=document.querySelector('#plan-status'),cards=document.querySelector('#plan-cards');
 try{
  const r=await fetch('/api/plans',{credentials:'same-origin',cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.error||'Tariflar yuklanmadi.');
  // Pilot yoqilmagan bo‘lsa narx kartalari ko‘rsatilmaydi: ommaviy oferta bo‘yicha xizmat bepul.
  if(!d.enabled){status.textContent='Pilot tariflar hozir faol emas. HuquqYordamchi bepul ishlaydi; pullik xizmat faqat ommaviy oferta yangilangandan keyin joriy etiladi.';return;}
  for(const p of d.plans){const el=document.createElement('article');el.className='suite-card plan-card';
   const h=document.createElement('h2');h.textContent=p.name;
   const price=document.createElement('div');price.className='plan-price';price.textContent=new Intl.NumberFormat('uz-UZ').format(p.priceUZS)+' so‘m';
   const desc=document.createElement('p');desc.textContent='Oyiga · sinov narxi';
   const ul=document.createElement('ul');for(const v of [p.requests+' ta AI so‘rovi / oy',p.maxChars+' belgigacha kazus']){const li=document.createElement('li');li.textContent=v;ul.append(li)}
   const a=document.createElement('a');a.className='btn btn-ghost';a.href='/coach.html';a.textContent='O‘quv ustaxonasiga o‘tish';el.append(h,price,desc,ul,a);cards.append(el);
  }
  status.textContent=!d.enabled?'Pilot tarif limitlari hali yoqilmagan. Onlayn to‘lov ulanmagan.':!d.status?'Foydalanish hisobini ko‘rish uchun asosiy saytda hisobingizga kiring.':`${d.status.plan.name}: bu oy ${d.status.used} ta so‘rov ishlatilgan, ${d.status.remaining} ta qolgan. To‘lov ulanmagan.`;
 }catch(e){status.textContent=e.message+' Sahifani qayta yuklang.'}
})();

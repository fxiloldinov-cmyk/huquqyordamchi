// Bosh sahifadagi tezkor savol mavjud aqlli qidiruvdan foydalanadi.
(()=>{
 // Kartalar dastlab yashirin. Flag olinmasa ham yashirin qoladi.
 fetch('/api/features',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(flags=>{
  if(flags?.international===true)document.querySelectorAll('[data-international]').forEach(el=>{el.hidden=false});
  // Tariflar havolasi faqat HK_KAZUS_PLANS_ENABLED=1 bo‘lsa ko‘rinadi; sayt hozir bepul.
  if(flags?.plans===true)document.querySelectorAll('[data-plans]').forEach(el=>{el.hidden=false});
  // v11.13: sinf va kalkulyator havolalari faqat o‘z flagi yoqilganda.
  if(flags?.classroom===true)document.querySelectorAll('[data-classroom]').forEach(el=>{el.hidden=false});
  if(flags?.calc===true)document.querySelectorAll('[data-calc]').forEach(el=>{el.hidden=false});
 }).catch(()=>{});
 // Hero ostidagi qator: raqamlar build paytida hisoblangan coverage.json dan (qo'lda yozilmaydi)
 const meta=document.querySelector('#hero-meta');
 const META={uz:(l,a)=>`Lex.uz’dagi ${l} ta kodeks va qonun · ${a} modda · Bepul · Ro‘yxatdan o‘tmasdan`,cy:(l,a)=>`Lex.uz’даги ${l} та кодекс ва қонун · ${a} модда · Бепул · Рўйхатдан ўтмасдан`,ru:(l,a)=>`Кодексов и законов с Lex.uz: ${l} · статей: ${a} · Бесплатно · Без регистрации`,en:(l,a)=>`${l} codes and laws from Lex.uz · ${a} articles · Free · No sign-up`};
 let totals=null;const drawMeta=()=>{if(!meta||!totals)return;const f=META[globalThis.HK_I18N?.lang]||META.uz;meta.textContent=f(totals.laws,String(totals.articles).replace(/\B(?=(\d{3})+(?!\d))/g,' '));};
 if(meta)fetch('/coverage.json').then(r=>r.ok?r.json():null).then(c=>{const t=c?.totals;if(!t?.laws||!t?.articles)return;totals=t;drawMeta();}).catch(()=>{});
 document.addEventListener('click',(e)=>{if(e.target.closest('[data-lang]'))setTimeout(drawMeta,50);});
 const form=document.querySelector('#hero-question');if(!form)return;
 form.addEventListener('submit',(e)=>{e.preventDefault();const input=document.querySelector('#hero-query');const q=input.value.trim();if(!q)return;const target=document.querySelector('#smart-query');target.value=q;document.querySelector('#qidiruv').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.querySelector('#smart-search').requestSubmit();});
})();

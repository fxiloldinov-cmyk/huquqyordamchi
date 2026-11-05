// Bosh sahifadagi tezkor savol mavjud aqlli qidiruvdan foydalanadi.
(()=>{
 // Kartalar dastlab yashirin. Flag olinmasa ham yashirin qoladi.
 fetch('/api/features',{cache:'no-store'}).then(r=>r.ok?r.json():null).then(flags=>{
  if(flags?.international===true)document.querySelectorAll('[data-international]').forEach(el=>{el.hidden=false});
  // Tariflar havolasi faqat HK_KAZUS_PLANS_ENABLED=1 bo‘lsa ko‘rinadi; sayt hozir bepul.
  if(flags?.plans===true)document.querySelectorAll('[data-plans]').forEach(el=>{el.hidden=false});
 }).catch(()=>{});
 const form=document.querySelector('#hero-question');if(!form)return;
 form.addEventListener('submit',(e)=>{e.preventDefault();const input=document.querySelector('#hero-query');const q=input.value.trim();if(!q)return;const target=document.querySelector('#smart-query');target.value=q;document.querySelector('#qidiruv').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});document.querySelector('#smart-search').requestSubmit();});
})();

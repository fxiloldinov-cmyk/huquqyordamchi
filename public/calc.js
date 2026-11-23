// Kalkulyatorlar sahifasi: flag o‘chiq yoki tasdiqlangan yozuv yo‘q bo‘lsa bo‘lim ko‘rinmaydi. Hisob serverda.
(()=>{
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const empty=document.getElementById('calc-empty'),section=document.getElementById('calc-section'),list=document.getElementById('calc-list');
 const inputType=t=>t==='date'?'date':'text';
 fetch('/api/features',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(async flags=>{
  if(flags?.calc!==true){empty.textContent='Bu bo‘lim hozircha mavjud emas.';return;}
  let d;try{const r=await fetch('/api/calc',{cache:'no-store'});if(!r.ok)throw 0;d=await r.json();}catch{empty.textContent='Bu bo‘lim hozircha mavjud emas.';return;}
  if(!d.calculators?.length){empty.textContent='Bu bo‘lim hozircha mavjud emas.';return;}
  empty.hidden=true;section.hidden=false;
  list.innerHTML=d.calculators.map(c=>`<form class="card" data-id="${esc(c.id)}"><h2>${esc(c.title)}</h2>${c.inputs.map(i=>`<label>${esc(i.label)}<input name="${esc(i.key)}" type="${inputType(i.type)}" ${i.type==='date'?'':'inputmode="decimal"'} required></label>`).join('')}<button class="primary">Hisoblash</button><div class="out" role="status" aria-live="polite"></div><p class="small">Formula: <code>${esc(c.formula)}</code> · Asos: ${c.source?.url?`<a href="${esc(c.source.url)}" target="_blank" rel="noopener">${esc(c.sourceRef)} ↗</a>`:esc(c.sourceRef)}${c.source?.title?` — ${esc(c.source.title)}`:''}</p></form>`).join('');
  list.addEventListener('submit',async e=>{e.preventDefault();const f=e.target,out=f.querySelector('.out');const inputs=Object.fromEntries([...f.querySelectorAll('input')].map(i=>[i.name,i.value.trim()]));out.textContent='Hisoblanmoqda…';
   try{const r=await fetch('/api/calc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({id:f.dataset.id,inputs})});const x=await r.json();if(!r.ok)throw new Error(x.error||'Hisoblab bo‘lmadi.');
    out.innerHTML=`<p class="result">${esc(x.value)} ${x.unit==='date'?'':esc(x.unit)}</p><p class="small">Formula: <code>${esc(x.formula)}</code> · Asos: ${x.source?.url?`<a href="${esc(x.source.url)}" target="_blank" rel="noopener">${esc(x.sourceRef)} ↗</a>`:esc(x.sourceRef)}</p><p class="notice">${esc(x.note)}</p>`;}catch(err){out.textContent=err.message;}});
 });
})();

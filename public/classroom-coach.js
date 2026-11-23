// IRAC ish varag‘ini sinf topshirig‘i bilan ochish: /coach.html?topshiriq=<classId>.<aid>
// Flag o‘chiq yoki parametr yo‘q bo‘lsa hech narsa qilmaydi. AI chaqirilmaydi; baho faqat ustozdan.
(()=>{
 const ref=new URLSearchParams(location.search).get('topshiriq');if(!ref||!/^[0-9a-f-]{36}\.[0-9a-f-]{36}$/.test(ref))return;
 const [classId,aid]=ref.split('.');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const api=async(q,body)=>{const r=await fetch('/api/classroom'+(body?'':'?'+new URLSearchParams(q)),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});let d={};try{d=await r.json()}catch{}if(!r.ok)throw new Error(d.error||'Amal bajarilmadi.');return d;};
 fetch('/api/features',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(async flags=>{
  if(flags?.classroom!==true)return;
  const box=document.createElement('div');box.className='card';box.id='class-task';document.querySelector('.work')?.prepend(box);
  let a;try{a=await api({op:'assignment',classId,aid});}catch(e){box.innerHTML=`<p class="notice">${esc(e.message)}</p>`;return;}
  if(a.role!=='student'){box.innerHTML=`<p class="notice">Bu topshiriqni ustoz sifatida ochdingiz. Javoblar <a href="/classroom.html?class=${esc(classId)}&a=${esc(aid)}">sinf sahifasida</a>.</p>`;return;}
  const kazus=document.getElementById('kazus');if(kazus&&!kazus.value)kazus.value=a.kazus;
  const draw=mine=>{box.innerHTML=`<h2>Sinf topshirig‘i <span>${esc(a.classTitle)} · ${esc(a.title)}</span></h2>${a.dueAt?`<p class="small">Muddat: ${esc(new Date(a.dueAt).toLocaleString('uz-UZ'))}. Muddatgacha qayta topshirish mumkin.</p>`:'<p class="small">Muddat belgilanmagan; qayta topshirish mumkin.</p>'}<p class="notice">Ish varag‘idagi tekshiruv faqat tuzilishni (to‘ldirilgan maydonlarni) sanaydi. AI baho qo‘ymaydi; bahoni ustoz qo‘yadi. Topshiriladigan matn: “Mening dastlabki javobim” maydoni (8000 belgigacha).</p><div class="actions"><button class="primary" id="class-submit" type="button">Topshirish</button>${mine?'<button class="danger" id="class-delete" type="button">Javobimni o‘chirish</button>':''}</div><p id="class-status" role="status">${mine?`Topshirilgan: ${esc(new Date(mine.submittedAt).toLocaleString('uz-UZ'))}`:''}</p>${mine?.comment||mine?.grade?`<div class="notice"><b>Ustoz izohi:</b> ${esc(mine.comment)}${mine.grade?` · <b>Baho:</b> ${esc(mine.grade)}`:''}</div>`:''}`;
   box.querySelector('#class-submit').onclick=async()=>{const st=box.querySelector('#class-status');const answer=(document.getElementById('answer')?.value||'').trim();if(!answer){st.textContent='Avval “Mening dastlabki javobim” maydonini to‘ldiring.';return;}try{draw(await api(null,{op:'submit',classId,aid,answer}));box.querySelector('#class-status').textContent='Topshirildi.';}catch(e){st.textContent=e.message;}};
   box.querySelector('#class-delete')?.addEventListener('click',async()=>{if(!confirm('Topshirilgan javobingiz o‘chiriladi. Davom etasizmi?'))return;try{await api(null,{op:'delete-submission',classId,aid});draw(null);}catch(e){box.querySelector('#class-status').textContent=e.message;}});
  };
  draw(a.mine);
 });
})();

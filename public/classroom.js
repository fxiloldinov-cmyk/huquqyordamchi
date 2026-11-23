// Ustoz-talaba sahifasi. HK_CLASSROOM_ENABLED o‘chiq bo‘lsa hech narsa ko‘rsatilmaydi. AI chaqirilmaydi.
(()=>{
 const app=document.getElementById('app');
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'})[c]);
 const when=iso=>iso?new Date(iso).toLocaleString('uz-UZ',{dateStyle:'medium',timeStyle:'short'}):'';
 const api=async(q,body)=>{const r=await fetch('/api/classroom'+(body?'':'?'+new URLSearchParams(q)),body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{cache:'no-store'});let d={};try{d=await r.json()}catch{}if(!r.ok){const e=new Error(d.error||'Amal bajarilmadi.');e.status=r.status;throw e;}return d;};
 const params=()=>new URLSearchParams(location.search);
 const go=q=>{history.pushState(null,'','/classroom.html'+(q?'?'+new URLSearchParams(q):''));render();};
 const msg=t=>`<p class="notice" role="status">${esc(t)}</p>`;
 async function home(){
  const me=await api({op:'me'});let h='';
  if(me.teacher)h+=`<div class="card"><h2>Mening sinflarim (ustoz)</h2><form id="new-class" class="cls-row"><label style="flex:1">Sinf nomi<input name="title" maxlength="120" required></label><button class="primary">Sinf yaratish</button></form><ul class="cls-list">${me.teaching.map(c=>`<li><div class="cls-row"><b>${esc(c.title)}</b><span>Kirish kodi: <span class="code">${esc(c.code)}</span></span></div><p class="small">${c.students} talaba · ${c.assignments} topshiriq</p><div class="cls-row"><button data-open="${c.id}">Ochish</button><button data-rotate="${c.id}">Kodni yangilash</button><button class="danger" data-del="${c.id}">Sinfni o‘chirish</button></div></li>`).join('')||'<li>Hali sinf yo‘q.</li>'}</ul></div>`;
  h+=`<div class="card"><h2>Men qatnashayotgan sinflar</h2><form id="join" class="cls-row"><label style="flex:1">Ustoz bergan kod<input name="code" maxlength="12" autocomplete="off" required></label><button class="primary">Qo‘shilish</button></form><ul class="cls-list">${me.enrolled.map(c=>`<li><div class="cls-row"><b>${esc(c.title)}</b><span class="small">${c.assignments} topshiriq</span><button data-open="${c.id}">Ochish</button><button class="danger" data-leave="${c.id}">Sinfdan chiqish</button></div></li>`).join('')||'<li>Hali sinfga qo‘shilmagansiz.</li>'}</ul><p class="small">Sinfdan chiqsangiz, shu sinfdagi javoblaringiz ham o‘chiriladi.</p></div>`;
  app.innerHTML=h;
  app.querySelector('#new-class')?.addEventListener('submit',e=>act(e,{op:'create-class',title:e.target.title.value}));
  app.querySelector('#join').addEventListener('submit',e=>act(e,{op:'join',code:e.target.code.value}));
 }
 async function classView(classId){
  const c=await api({op:'class',classId});let h=`<p><a href="/classroom.html">← Sinflar</a></p><div class="card"><h2>${esc(c.title)}</h2>`;
  if(c.role==='teacher')h+=`<p>Kirish kodi: <span class="code">${esc(c.code)}</span> · ${c.students} talaba</p><form id="new-a"><label>Sarlavha<input name="title" maxlength="120" required></label><label>Kazus matni (4000 belgigacha, shaxsiy ma’lumotsiz)<textarea name="kazus" maxlength="4000" rows="6" required></textarea></label><label>Muddat (ixtiyoriy)<input name="due" type="datetime-local"></label><button class="primary">Topshiriq qo‘shish</button></form>`;
  h+=`</div><div class="card"><h2>Topshiriqlar</h2><ul class="cls-list">${c.assignments.map(a=>`<li><div class="cls-row"><b>${esc(a.title)}</b>${a.dueAt?`<span class="small">Muddat: ${esc(when(a.dueAt))}</span>`:''}${c.role==='teacher'?`<button data-subs="${a.id}">Javoblarni ko‘rish</button>`:`<span class="small">${a.submitted?'Topshirilgan':'Topshirilmagan'}</span><a href="/coach.html?topshiriq=${encodeURIComponent(classId+'.'+a.id)}">Ish varag‘ida ochish →</a>`}</div></li>`).join('')||'<li>Hali topshiriq yo‘q.</li>'}</ul></div>`;
  app.innerHTML=h;
  app.querySelector('#new-a')?.addEventListener('submit',e=>{const f=e.target;act(e,{op:'add-assignment',classId,title:f.title.value,kazus:f.kazus.value,dueAt:f.due.value?new Date(f.due.value).toISOString():null});});
  app.dataset.classId=classId;
 }
 async function subsView(classId,aid){
  const d=await api({op:'submissions',classId,aid});
  app.innerHTML=`<p><a href="/classroom.html?class=${esc(classId)}">← Sinf</a></p><div class="card"><h2>${esc(d.assignment.title)}</h2><pre>${esc(d.assignment.kazus)}</pre><p class="small">${d.submissions.length} / ${d.students} talaba topshirgan. AI baho qo‘ymaydi; izoh va bahoni o‘zingiz yozasiz.</p></div>`+d.submissions.map(s=>`<div class="card"><h2>${esc(s.name||s.email)}</h2><p class="small">${esc(s.email)} · ${esc(when(s.submittedAt))}</p><pre>${esc(s.answer)}</pre><form class="cls-sub" data-review="${esc(s.studentId)}"><label>Izoh<textarea name="comment" maxlength="4000" rows="3">${esc(s.comment)}</textarea></label><label>Baho (ixtiyoriy)<input name="grade" maxlength="20" value="${esc(s.grade)}"></label><button class="primary">Saqlash</button>${s.reviewedAt?`<span class="small"> Oxirgi izoh: ${esc(when(s.reviewedAt))}</span>`:''}</form></div>`).join('');
  app.querySelectorAll('[data-review]').forEach(f=>f.addEventListener('submit',e=>act(e,{op:'review',classId,aid,studentId:f.dataset.review,comment:f.comment.value,grade:f.grade.value})));
 }
 async function act(e,body){e?.preventDefault?.();const btns=app.querySelectorAll('button');btns.forEach(b=>b.disabled=true);try{const r=await api(null,body);if(body.op==='join')return go({class:r.id});if(body.op==='delete-class'||body.op==='leave')return go(null);await render();app.insertAdjacentHTML('afterbegin',msg('Saqlandi.'));}catch(err){app.insertAdjacentHTML('afterbegin',msg(err.message));btns.forEach(b=>b.disabled=false);}}
 app.addEventListener('click',e=>{const b=e.target.closest('button[data-open],button[data-rotate],button[data-del],button[data-leave],button[data-subs]');if(!b)return;const d=b.dataset;
  if(d.open)go({class:d.open});else if(d.rotate)act(null,{op:'rotate-code',classId:d.rotate});
  else if(d.del&&confirm('Sinf, topshiriqlar va barcha talaba javoblari butunlay o‘chiriladi. Davom etasizmi?'))act(null,{op:'delete-class',classId:d.del});
  else if(d.leave&&confirm('Sinfdan chiqasizmi? Shu sinfdagi javoblaringiz o‘chiriladi.'))act(null,{op:'leave',classId:d.leave});
  else if(d.subs)go({class:app.dataset.classId,a:d.subs});});
 async function render(){const p=params();try{if(p.get('class')&&p.get('a'))await subsView(p.get('class'),p.get('a'));else if(p.get('class'))await classView(p.get('class'));else await home();}catch(err){app.innerHTML=err.status===401?msg('Bu bo‘limdan foydalanish uchun hisobingizga kiring.')+'<p><a href="/#account">Hisobga kirish →</a></p>':msg(err.message);}}
 window.addEventListener('popstate',render);
 fetch('/api/features',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(flags=>{if(flags?.classroom!==true){app.innerHTML=msg('Bu bo‘lim hozir yoqilmagan.');return;}render();});
})();

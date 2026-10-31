// =====================================================================
// AQLLI QIDIRUV va KAZUS USTAXONASI
// app.js dan keyin yuklanadi ($, md, escapeHtml, norm, SITUATIONS, CODES,
// openSituation, show, lexUrl global funksiyalaridan foydalanadi).
// =====================================================================

const LAW_DOCS = HK_LEGAL.docs;
const ARTICLE_INDEX = HK_LEGAL.articles;

// Oddiy so'zlarni huquqiy atamalarga bog'lovchi sinonimlar
const SYNONYMS = {
  maosh: "ish haqi", oylik: "ish haqi", zarplata: "ish haqi",
  haydadi: "bo'shatish", haydash: "bo'shatish", ishdan: "bo'shatish",
  ajrashish: "aliment", ajrashdik: "aliment", bolam: "bola", bolalarim: "bola",
  kvartira: "ijara", ijarachi: "ijara", uy: "uy-joy",
  vafot: "meros", otam: "meros", onam: "meros",
  telefon: "tovar", "do'kon": "tovar", sotuvchi: "tovar", buzildi: "nuqsonli",
  radar: "jarima", kamera: "jarima", gai: "jarima",
  aldadi: "firibgarlik", aldab: "firibgarlik", karta: "kiber",
};

function stems(text) {
  return norm(text)
    .split(/[^a-zа-яёўқғҳ'0-9-]+/i)
    .filter((w) => w.length >= 3)
    .map((w) => (w.length > 6 ? w.slice(0, 5) : w));
}

function expandQuery(text) {
  const words = norm(text).split(/[^a-z'0-9-]+/);
  const extra = words.map((w) => SYNONYMS[w]).filter(Boolean).join(" ");
  return `${text} ${extra}`;
}

function localArticleSearch(query,limit=8){
 const q=norm(query),qs=[...new Set(stems(expandQuery(q)))];if(!qs.length)return [];
 const number=q.match(/\b(\d+(?:[-–]\d+)?)\b/)?.[1];
 const docHint=Object.keys(LAW_DOCS).find(k=>[k,...(LAW_DOCS[k].aliases||[])].some(a=>q===norm(a)||q.startsWith(norm(a)+' '))) || (q.includes('fuqarolik protsessual')?'fpk':q.includes('jinoyat protsessual')?'jpk':null);
 return ARTICLE_INDEX.map(a=>{const hay=norm(`${a.art} ${a.title} ${a.kw} ${LAW_DOCS[a.doc].name}`);const score=qs.reduce((n,t)=>n+(hay.includes(t)?1:0),0)+(number===a.art?10:0);return {...a,score};})
 .filter(a=>(!docHint||a.doc===docHint)&&(!number||a.art===number)&&(a.score>=2||(qs.length<=2&&a.score>=1)))
 .sort((a,b)=>b.score-a.score).slice(0,limit);
}

function localSituationSearch(query, limit = 3) {
  const qs = [...new Set(stems(expandQuery(query)))];
  return SITUATIONS
    .map((s) => ({ s, score: qs.reduce((n, t) => n + (norm(`${s.title} ${s.desc} ${s.tag} ${s.intro}`).includes(t) ? 1 : 0), 0) }))
    .filter((x) => x.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((x) => x.s);
}

// AI natijasi tekshirilgan indeksda bormi?
function findVerified(hujjat,modda){const key=HKCore.resolveDoc(hujjat,LAW_DOCS);return key?ARTICLE_INDEX.find(a=>a.doc===key&&a.art===HKCore.article(modda)&&a.reviewedAt):null;}

const docUrl = (docKey) => `https://lex.uz/docs/${LAW_DOCS[docKey].id}`;

// Belgilar hisoblagichi raqamsiz: faqat chegaraga yaqinlashganda ogohlantiradi.
function limitNote(len, max) {
  if (len >= max) return "Belgilar chegarasiga yetdingiz — matnni qisqartiring";
  return len >= max * 0.9 ? "Belgilar chegarasiga yaqinlashdingiz" : "";
}

// ---- Aqlli qidiruv UI -------------------------------------------------------
const smartForm = $("#smart-search");
const smartQuery = $("#smart-query");
const smartResults = $("#smart-results");
const smartBtn = $("#smart-btn");
let smartBusy = false;
let smartController=null;

smartQuery?.addEventListener("input", () => {
  $("#smart-count").textContent = limitNote(smartQuery.value.length, 2000);
});

$("#smart-examples")?.addEventListener("click", (e) => {
  if (e.target.tagName !== "BUTTON") return;
  smartQuery.value = e.target.textContent;
  smartQuery.dispatchEvent(new Event("input"));
  smartForm.requestSubmit();
});

function renderLocalBlock(query, exclude = new Set()) {
  const arts = localArticleSearch(query).filter((a) => !exclude.has(`${a.doc}:${a.art}`));
  const sits = localSituationSearch(query);
  let html = "";
  if (arts.length) {
    html += `<div class="smart-block">
      <h4>${exclude.size ? "Bog'liq boshqa moddalar (sayt bazasidan)" : "Katalogdagi tegishli moddalar"}</h4>
      <ul class="article-list">${arts.map((a) => `
        <li class="article-item">
          <div class="article-top">
            <span class="article-badge">${escapeHtml(a.art)}-modda</span>
            <span class="article-doc">${escapeHtml(LAW_DOCS[a.doc].name)}</span>
            <span class="chip ${a.reviewedAt ? "ok" : "mid"}">${a.reviewedAt ? "Raqam va nom tekshirildi: "+a.reviewedAt : "Katalog yozuvi — manbani tekshiring"}</span>
          </div>
          <div class="article-title">${escapeHtml(a.title)}</div>
          <a class="article-link" href="${docUrl(a.doc)}" target="_blank" rel="noopener">Hujjatni lex.uz da ochish ↗</a>
        </li>`).join("")}</ul>
    </div>`;
  }
  if (sits.length) {
    html += `<div class="smart-block">
      <h4>Saytdagi qo'llanmalar</h4>
      <div class="smart-sits">${sits.map((s) => `<button type="button" class="smart-sit" data-open-sit="${escapeHtml(s.id)}">${escapeHtml(s.title)} →</button>`).join("")}</div>
    </div>`;
  }
  return html;
}

function confidenceChip(level) {
  if (level === "yuqori") return `<span class="chip ok">Ishonch: yuqori</span>`;
  if (level === "o'rta") return `<span class="chip mid">Ishonch: o'rta</span>`;
  return `<span class="chip low">Ishonch: past — tekshiring</span>`;
}

function renderAiBlock(data) {
  const items = data.natijalar.map((r) => {
    const verified = findVerified(r.hujjat, r.modda);
    return `<li class="article-item">
      <div class="article-top">
        ${r.modda ? `<span class="article-badge">${escapeHtml(r.modda)}-modda</span>` : ""}
        <span class="article-doc">${escapeHtml(r.hujjat)}</span>
        ${r.rasmiyMatn === 'berilgan' ? `<span class="chip ok">Rasmiy matn bilan tekshirildi (MK)</span>` : r.rasmiyMatn === 'kodeksda' ? `<span class="chip mid">MKda bor — matnini tekshiring</span>` : r.rasmiyMatn === 'yoq' ? `<span class="chip low">MKda bunday modda yo‘q</span>` : verified ? `<span class="chip ok">Hujjat va modda raqami katalogga mos</span>` : `<span class="chip mid">AI taklifi — norma tekshirilsin</span>`}
      </div>
      ${r.moddaNomi ? `<div class="article-title">${escapeHtml(r.moddaNomi)}</div>` : ""}
      ${r.nimaUchun ? `<p class="article-why">${escapeHtml(r.nimaUchun)}</p>` : ""}
      <a class="article-link" href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${r.hujjatTasdiqlangan ? "Hujjatni lex.uz da ochish ↗" : "lex.uz da qidirish ↗"}</a>
    </li>`;
  }).join("");
  const sources = data.manbalar?.length
    ? `<details class="smart-sources"><summary>AI foydalangan manbalar</summary><ul>${data.manbalar.map((s) =>
        `<li><a href="${escapeHtml(HKCore.safeUrl(s.uri)||"https://lex.uz")}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title)}</a></li>`).join("")}</ul></details>`
    : "";
  return `<div class="smart-block ai">
    <h4>AI tahlili ${data.manbalar?.length ? `<span class="chip mid">Manbalar quyida</span>` : `<span class="chip low">Manba tasdiqlanmadi</span>`}</h4>
    ${data.xulosa ? `<p class="smart-summary">${escapeHtml(data.xulosa)}</p>` : ""}
    ${items ? `<ul class="article-list">${items}</ul>` : `<p class="smart-muted">AI aniq modda topmadi. Vaziyatni batafsilroq yozib ko'ring.</p>`}
    ${data.aniqlashtirish ? `<p class="smart-clarify"><b>Aniqroq javob uchun:</b> ${escapeHtml(data.aniqlashtirish)}</p>` : ""}
    ${data.qadamlar?.length?`<h5>Amaliy qadamlar</h5><ol>${data.qadamlar.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ol>`:''}
    ${data.dalillar?.length?`<h5>Kerakli hujjat va dalillar</h5><ul>${data.dalillar.map(s=>`<li>${escapeHtml(s)}</li>`).join('')}</ul>`:''}
    ${data.cheklovlar?`<div class="verify-note">${escapeHtml(data.cheklovlar)}</div>`:''}
    ${sources}
  </div>`;
}

smartForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = smartQuery.value.trim().slice(0, 2000);
  if (smartBusy || query.length < 3) {
    if (query.length < 3) {
      smartResults.hidden = false;
      smartResults.innerHTML = `<p class="smart-muted">Savolni to‘liqroq yozing: vaziyatingiz yoki kodeks va modda.</p>`;
    }
    return;
  }
  smartBusy = true;
  smartController=new AbortController();const timer=setTimeout(()=>smartController?.abort(),60000);
  $("#smart-stop").hidden=false;
  smartBtn.disabled = true;
  smartBtn.textContent = "Qidirilmoqda...";
  const local = renderLocalBlock(query);
  smartResults.hidden = false;
  smartResults.innerHTML = local + `<div class="smart-block ai loading"><h4>AI tahlili</h4><p class="smart-muted">Qonunchilik bazasidan tegishli moddalar qidirilmoqda...</p></div>`;

  let aiHtml;
  const shown = new Set();
  try {
    const res = await fetch("/api/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, lang: globalThis.HK_I18N?.lang || "uz" }), signal:smartController.signal,
    });
    let data = null;
    try { data = await res.json(); } catch {}
    if (!res.ok || !data) throw new Error(data?.error || `Server xatosi (${res.status})`);
    aiHtml = renderAiBlock(data);
    data.natijalar.forEach((r) => { const v = findVerified(r.hujjat, r.modda); if (v) shown.add(`${v.doc}:${v.art}`); });
  } catch (err) {
    aiHtml = `<div class="smart-block ai"><h4>AI tahlili</h4><p class="smart-muted">⚠️ ${escapeHtml(err.name==='AbortError'?'Qidiruv to‘xtatildi yoki kutish vaqti tugadi.':err.message || "AI qidiruv ishlamadi.")}</p>
      ${local ? "" : `<p class="smart-muted">Sayt bazasida ham mos modda topilmadi. Vaziyatni boshqa so'zlar bilan yozib ko'ring.</p>`}</div>`;
  } finally {
    clearTimeout(timer);smartController=null;$("#smart-stop").hidden=true;
    smartBusy = false;
    smartBtn.disabled = false;
    smartBtn.textContent = "Aqlli qidirish";
  }
  smartResults.innerHTML = aiHtml + renderLocalBlock(query, shown)
    + `<p class="smart-disclaimer">Natijalar umumiy ma'lumot. Amaldagi tahrirni lex.uz da tekshiring; muhim ishda yuristga murojaat qiling.</p>`;
});

smartResults?.addEventListener("click", (e) => {
  const b = e.target.closest("[data-open-sit]");
  if (b) openSituation(b.dataset.openSit);
});

// ---- Kazus ustaxonasi --------------------------------------------------------
const kazusForm = $("#kazus-form");
const kazusText = $("#kazus-text");
const kazusOut = $("#kazus-output");
const kazusBtn = $("#kazus-btn");
const kazusCopy = $("#kazus-copy");
const namunaSelect = $("#kazus-namuna");
const formatArea = $("#kazus-format");
let kazusBusy = false;
let kazusController=null;
let kazusAnswer = "";
let namunalar = [];

kazusText?.addEventListener("input", () => {
  $("#kazus-count").textContent = limitNote(kazusText.value.length, 6000);
});

function currentMode() {
  return document.querySelector('input[name="kazus-mode"]:checked')?.value || "standart";
}

function syncModeUi() {
  const mode = currentMode();
  formatArea.hidden = mode !== "ozim";
  namunaSelect.hidden = mode !== "namuna" || !namunalar.length;
  if (mode === "namuna") filterNamunaByFan();
}

function filterNamunaByFan() {
  const fan = $("#kazus-fan").value;
  const list = namunalar.filter((n) => n.fan === fan);
  const use = list.length ? list : namunalar;
  const other = !list.length;
  namunaSelect.innerHTML = use.map((n) =>
    `<option value="${escapeHtml(n.id)}">${other ? "(" + escapeHtml(n.fanNomi) + ") " : ""}${escapeHtml(n.title)}</option>`).join("");
}

// Tanlangan fan bo'yicha taqdim etilgan namuna bo'lsa, uni avtomatik tanlaymiz.
function autoPickMode() {
  const fan = $("#kazus-fan").value;
  const has = namunalar.some((n) => n.fan === fan);
  if (!has && currentMode() === "namuna") $("#mode-standart").checked = true;
  syncModeUi();
}

document.querySelectorAll('input[name="kazus-mode"]').forEach((r) => r.addEventListener("change", syncModeUi));
$("#kazus-fan")?.addEventListener("change", autoPickMode);

async function loadNamunalar() {
  const status = $("#namuna-status");
  const radio = $("#mode-namuna");
  try {
    const res = await fetch("/api/kazus", { headers: { Accept: "application/json" } });
    if (!res.ok) throw new Error();
    const data = await res.json();
    namunalar = Array.isArray(data.namunalar) ? data.namunalar : [];
  } catch {
    namunalar = [];
  }
  if (namunalar.length) {
    const fans = [...new Set(namunalar.map((n) => n.fanNomi))].join(", ");
    status.textContent = `Arxiv namunalari topildi (${fans}); normalarni tekshiring`;
    radio.disabled = false;
  } else {
    status.textContent = "Namunalar yuklanmadi — standart shakldan foydalaning";
    radio.disabled = true;
  }
  autoPickMode();
}

// Server yuborgan yashirin boshqaruv belgilarini matndan olib tashlaydi.
function cleanKazus(text) {
  return String(text).replace(/\u2063HK:(?:CONT:[^\u2063]*|END)\u2063/g, "").replace(/\u2063HK:[^\u2063]*$/, "");
}
kazusForm?.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (kazusBusy) return;
  const kazus = kazusText.value.trim();
  const mode = currentMode();
  const format = formatArea.value.trim();
  const showError = (msg) => { kazusOut.innerHTML = `<p class="kazus-error">⚠️ ${escapeHtml(msg)}</p>`; };
  if (kazus.length < 40) return showError("Kazus shartini to‘liqroq yozing.");
  if ($('#kazus-task').value==='review' && $('#kazus-student-answer').value.trim().length<40) return showError('Javobingizni to‘liqroq kiriting.');
  if (mode === "ozim" && format.length < 20) return showError("O'zingiz xohlagan javob shaklini kiriting.");

  kazusBusy = true;
  kazusController = new AbortController();
  $("#kazus-stop").hidden = false;
  kazusBtn.disabled = true;
  kazusBtn.textContent = "Yechilmoqda...";
  kazusCopy.disabled = true;
  $("#kazus-download").disabled = true;
  kazusAnswer = "";
  kazusOut.innerHTML = `<p class="kazus-empty">Kazus tahlil qilinmoqda… Uzun tahlil bir necha daqiqa davom etishi mumkin.</p>`;

  // Server har ~50 soniyada (Netlify chegarasi) javobni xavfsiz to'xtatib, yashirin belgi yuboradi:
  // HK:CONT — davomi bor (manbalar bilan), HK:END — tugadi. Davomi avtomatik so'raladi va matn ulanadi.
  const base = {
    kazus, mode, task: $("#kazus-task").value, studentAnswer: $("#kazus-student-answer").value, eventDate: $("#kazus-date").value, fan: $("#kazus-fan").value,
    namunaId: mode === "namuna" ? namunaSelect.value : undefined,
    format: mode === "ozim" ? format : undefined,
  };
  const MAX_ROUNDS = 4;
  let sources = [];
  let timer = null;
  try {
    for (let round = 0; round < MAX_ROUNDS; round++) {
      clearTimeout(timer);
      timer = setTimeout(() => kazusController?.abort(), 75000);
      const payload = round === 0 ? base : { ...base, continuation: { round, partial: kazusAnswer, sources } };
      const res = await fetch("/api/kazus", {
        method: "POST", signal: kazusController.signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, lang: globalThis.HK_I18N?.lang || "uz" }),
      });
      if (!res.ok || !res.body) {
        let detail = "";
        try { detail = (await res.json()).error || ""; } catch {}
        throw new Error(detail || `Server xatosi (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let chunk = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        chunk += dec.decode(value, { stream: true });
        kazusOut.innerHTML = md(cleanKazus(kazusAnswer + chunk));
      }
      chunk += dec.decode();
      const cont = chunk.match(/\u2063HK:CONT:([^\u2063]*)\u2063/);
      const ended = /\u2063HK:END\u2063/.test(chunk);
      kazusAnswer += cleanKazus(chunk);
      if (ended) break;
      if (!cont && !chunk.trim()) break;
      if (cont) { try { const extra = JSON.parse(decodeURIComponent(cont[1])); if (Array.isArray(extra)) sources = [...sources, ...extra].slice(0, 20); } catch {} }
      if (round === MAX_ROUNDS - 1) { kazusAnswer += "\n\n⚠️ Tahlil juda uzun bo‘ldi va oxirigacha yetmadi. Savollarni qisqartirib qayta yuboring."; break; }
      kazusOut.innerHTML = md(kazusAnswer) + `<p class="kazus-empty">Davomi yuklanmoqda…</p>`;
    }
    if (!kazusAnswer.trim()) throw new Error("AI bo'sh javob qaytardi.");
    kazusOut.innerHTML = md(kazusAnswer);
    kazusCopy.disabled = false;
    $("#kazus-download").disabled = false;
  } catch (err) {
    kazusOut.innerHTML=(kazusAnswer?md(kazusAnswer):'')+`<p class="kazus-error">${escapeHtml(err.name==='AbortError'?'So‘rov to‘xtatildi yoki kutish vaqti tugadi.':err.message||'Yechim olinmadi.')}</p>`;
    kazusCopy.disabled=!kazusAnswer;
    $("#kazus-download").disabled=!kazusAnswer;
  } finally {
    clearTimeout(timer);kazusController=null;$("#kazus-stop").hidden=true;
    kazusBusy = false;
    kazusBtn.disabled = false;
    kazusBtn.textContent = "Tahlilni boshlash";
  }
});

kazusCopy?.addEventListener("click", () => {
  navigator.clipboard.writeText(kazusAnswer).then(() => {
    kazusCopy.textContent = "Nusxa olindi";
  }).catch(() => {
    kazusCopy.textContent = "Nusxa olinmadi";
  }).finally(() => setTimeout(() => { kazusCopy.textContent = "Nusxa olish"; }, 2000));
});

loadNamunalar();

$('#smart-stop').addEventListener('click',()=>smartController?.abort());
$('#kazus-stop').addEventListener('click',()=>kazusController?.abort());
$('#kazus-task').addEventListener('change',()=>$('#kazus-review-field').hidden=$('#kazus-task').value!=='review');
$('#kazus-examples').addEventListener('click',e=>{const b=e.target.closest('[data-kazus-example]');if(!b)return;if(b.dataset.kazusFan){$('#kazus-fan').value=b.dataset.kazusFan;autoPickMode();}kazusText.value=b.dataset.kazusExample;kazusText.dispatchEvent(new Event('input'));});
$('#kazus-download').addEventListener('click',()=>{if(!kazusAnswer)return;const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([kazusAnswer],{type:'text/plain;charset=utf-8'}));a.download='kazus-tahlili.txt';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);});

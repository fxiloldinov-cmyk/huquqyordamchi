// KAZUS USTAXONASI — talabalar uchun kazus tahlili.
// app.js dan keyin yuklanadi: show(), renderSituations(), md(), SITUATIONS va CODES dan foydalanadi.
(function () {
  "use strict";

  const $ = (s) => document.querySelector(s);
  const LIM = { kase: 2200, answer: 3000, sample: 2400 };

  const esc = (v) => String(v).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  const SAMPLE_CASES = [
    "Karimov va Yusupova xonadon oldi-sotdisi shartnomasini tuzdi. Shartnomada xaridor oldindan to‘lagan avans hech qanday holatda qaytarilmasligi va sotuvchi shartnomani istalgan vaqtda bir tomonlama bekor qilishi mumkinligi yozilgan. Keyinchalik sotuvchi uyni boshqa shaxsga yuqoriroq narxda sotdi. Xaridor avansni qaytarish va zararni undirishni talab qilmoqda. Xaridor qanday huquqiy himoya vositalaridan foydalana oladi?",
    "Xodim Rahimov korxonada uch yildan beri ishlaydi. Ish beruvchi uni oldindan ogohlantirmasdan “lavozimga mos kelmaslik” asosida bo‘shatdi va yakuniy hisob-kitobni o‘n kunga kechiktirdi. Rahimov ishga tiklanish va kompensatsiya talab qilmoqda. Ish beruvchining harakatlari qonuniymi?",
    "Ajrashgan er-xotin o‘rtasida ikki farzandning yashash joyi va aliment bo‘yicha nizo bor. Ota norasmiy daromad oladi, rasmiy maoshi deyarli yo‘q. Ona aliment miqdorini qanday belgilatishi mumkin va qaysi faktlar muhim?"
  ];
  let sampleIdx = 0;

  const STEPS = [
    ["Huquqiy masala", "Taraflar, huquqiy munosabat va nizoning predmetini ajrating. Kazusdagi asosiy savolni bitta gapda ifodalang."],
    ["Qo‘llanadigan norma", "Quyidagi katalog natijalaridan boshlang. Tegishli modda matni, istisnolari va voqea sanasidagi tahririni tekshiring. Demo aniq norma tanlamaydi."],
    ["Faktlarga qo‘llash", "Normaning har bir shartiga kazusdan dalil keltiring. Yetishmayotgan faktlar va muqobil talqinlarni belgilang."],
    ["Asoslangan xulosa", "Xulosani oldingi tahlil bilan bog‘lang. Noaniq faktlar bo‘lsa, shartli xulosalarni ajrating."]
  ];

  const CHECKS = [
    "Masala aniq va bitta gapda ifodalanganmi?",
    "Norma manbasi (hujjat, modda, tahrir) ko‘rsatilganmi?",
    "Har bir xulosa kazus faktiga bog‘langanmi?",
    "Qarshi dalillar va muqobil talqinlar muhokama qilinganmi?"
  ];

  // ---- Katalogdan mos mavzularni topish (norma tasdiqlanmaydi) ----
  const norm = (s) => String(s).toLocaleLowerCase("uz").replace(/[’‘ʻʼ`´]/g, "'");
  const words = (s) => norm(s).match(/[a-z0-9']+/g) || [];
  const STOP = new Set(["bilan", "uchun", "shuning", "keyin", "keyinchalik", "ham", "yoki", "lekin", "qanday", "qaysi", "uning", "unga", "ular", "edi", "etdi", "bo'lsa", "bo'ldi", "bor", "yo'q"]);
  const GENERIC = ["noqon", "asoss", "kirit", "bo'lg", "qilin", "tuzil", "taraf", "mazku", "kazus", "huquq", "qonun"];

  function stemsOf(text) {
    const out = new Set();
    for (const w of words(text)) {
      if (w.length < 4 || STOP.has(w)) continue;
      const stem = w.slice(0, 5);
      if (GENERIC.some((g) => stem.startsWith(g))) continue;
      out.add(stem);
    }
    return [...out];
  }

  function findSources(text) {
    const stems = stemsOf(text);
    if (!stems.length) return [];
    const score = (hay) => {
      const hw = words(hay);
      return stems.filter((st) => hw.some((w) => w.startsWith(st))).length;
    };
    const items = [];
    CODES.forEach(([n, title, desc]) => {
      const s = score(`${n} ${title} ${desc}`);
      if (s > 0) items.push({ kind: "code", title, desc, badge: "Kodeks katalogi", s });
    });
    SITUATIONS.forEach((x) => {
      const s = score(`${x.title} ${x.desc} ${x.tag}`);
      if (s > 0) items.push({ kind: "situation", id: x.id, title: x.title, desc: x.desc, badge: "Hayotiy vaziyat", s });
    });
    return items.sort((a, b) => b.s - a.s).slice(0, 3);
  }

  // ---- Maydonlar ----
  const fields = { kase: $("#kz-case"), answer: $("#kz-answer"), sample: $("#kz-sample") };
  if (!fields.kase || !fields.answer || !fields.sample) return;

  const status = $("#kz-status");
  const mapBox = $("#kz-map");
  const aiBox = $("#kz-ai");
  const mapBtn = $("#kz-map-btn");
  const aiBtn = $("#kz-ai-btn");
  let busy = false;

  function updateCount(key) {
    const el = $(`[data-kz-count="${key}"]`);
    if (el) el.textContent = `${fields[key].value.length} / ${LIM[key]}`;
  }
  Object.keys(fields).forEach((key) => {
    fields[key].maxLength = LIM[key];
    fields[key].addEventListener("input", () => updateCount(key));
    updateCount(key);
  });

  function setStatus(msg) { status.textContent = msg || ""; }

  $("#kz-sample-btn").addEventListener("click", () => {
    fields.kase.value = SAMPLE_CASES[sampleIdx % SAMPLE_CASES.length];
    sampleIdx += 1;
    updateCount("kase");
    setStatus("");
  });

  // TXT fayl faqat brauzerda o‘qiladi, serverga alohida yuklanmaydi.
  $("#kz-file").addEventListener("change", (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const note = $("#kz-file-note");
    if (file.size > 200000) { note.textContent = "Fayl juda katta (200 KB dan oshmasin)."; e.target.value = ""; return; }
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result || "");
      fields.sample.value = text.slice(0, LIM.sample);
      updateCount("sample");
      note.textContent = text.length > LIM.sample
        ? `Fayl ${LIM.sample} belgigacha qisqartirildi.`
        : `“${file.name}” ochildi.`;
    };
    reader.onerror = () => { note.textContent = "Faylni o‘qib bo‘lmadi."; };
    reader.readAsText(file, "utf-8");
    e.target.value = "";
  });

  // ---- Demo tahlil xaritasi (AI ishlatilmaydi) ----
  function renderMap() {
    const kase = fields.kase.value.trim();
    if (!kase) { setStatus("Avval kazus shartini yozing yoki namunaviy kazusni qo‘ying."); fields.kase.focus(); return; }
    setStatus("");
    const answer = fields.answer.value.trim();
    const sample = fields.sample.value.trim();
    const sources = findSources(kase);

    const stepsHtml = STEPS.map(([t, d], i) => `
      <li class="kz-step"><span class="kz-step-n">0${i + 1}</span><div><h3>${esc(t)}</h3><p>${esc(d)}</p></div></li>`).join("");

    const srcHtml = sources.length
      ? `<div class="kz-sources">${sources.map((s) => `
        <article class="kz-source">
          <div class="kz-source-kind">${esc(s.badge)}</div>
          <h3>${esc(s.title)}</h3>
          <p>${esc(s.desc)}</p>
          <p class="kz-warn">So‘rovingizdagi mavzuga katalogdagi nom va tavsif mos keldi. Norma tasdiqlangani emas.</p>
          <div class="kz-source-links">
            <a href="https://lex.uz/search/all?searchtitle=${encodeURIComponent(s.title)}" target="_blank" rel="noopener">Lex.uz’da qidirish ↗</a>
            ${s.kind === "situation" ? `<button type="button" data-kz-sit="${esc(s.id)}">Vaziyatni ochish →</button>` : ""}
          </div>
        </article>`).join("")}</div>`
      : `<p class="kz-empty">Katalogdan mos mavzu topilmadi. Bu tegishli qonun yo‘q degani emas: katalog hali kichik. Normani Lex.uz’da o‘zingiz qidiring.</p>`;

    mapBox.hidden = false;
    mapBox.innerHTML = `
      <h2>Kazus uchun tahlil xaritasi</h2>
      <p class="kz-sub">Oldindan tayyorlangan o‘quv tuzilmasi. Individual AI yechimi emas.</p>
      <div class="kz-case-echo">${esc(kase)}</div>
      <ol class="kz-steps">${stepsHtml}</ol>
      <h2>Ko‘rib chiqish uchun manbalar</h2>
      <p class="kz-sub">Natija faqat saytdagi katalogdan olinadi.</p>
      ${srcHtml}
      <div class="kz-compare">
        <div class="kz-pane"><h3>Sizning javobingiz</h3>${answer
          ? `<div class="kz-pane-text">${esc(answer)}</div>`
          : `<p class="kz-pane-empty">Javob kiritilmagan. Yuqoridagi maydonda yechimingizni yozib qayta ko‘ring.</p>`}</div>
        <div class="kz-pane"><h3>Taqqoslash uchun namuna</h3>${sample
          ? `<div class="kz-pane-text">${esc(sample)}</div>`
          : `<p class="kz-pane-empty">Namuna kiritilmagan. O‘zingizning yuqori ball olgan javobingizni joylang.</p>`}</div>
      </div>
      <div class="kz-check">
        <h3>O‘zingizni tekshiring</h3>
        ${CHECKS.map((c) => `<label><input type="checkbox" /> <span>${esc(c)}</span></label>`).join("")}
      </div>
      <p class="kz-fine">Demo matnlarni AI bilan tahlil qilmaydi va ball qo‘ymaydi. Namuna va javob taqqoslash uchun ko‘rsatiladi.</p>`;
    mapBox.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  mapBox.addEventListener("click", (e) => {
    const b = e.target.closest("[data-kz-sit]");
    if (!b) return;
    show("home");
    renderSituations();
    const card = document.querySelector(`#situations [data-sit="${CSS.escape(b.dataset.kzSit)}"]`);
    if (card) card.click();
  });

  // ---- AI bilan manbali tahlil (server orqali /api/chat, mode: "kazus") ----
  async function runAi() {
    if (busy) return;
    const kase = fields.kase.value.trim();
    if (!kase) { setStatus("Avval kazus shartini yozing yoki namunaviy kazusni qo‘ying."); fields.kase.focus(); return; }
    setStatus("");
    const answer = fields.answer.value.trim();
    const sample = fields.sample.value.trim();
    const content =
      `[KAZUS SHARTI]\n${kase}\n\n` +
      `[TALABA JAVOBI]\n${answer || "(kiritilmagan)"}\n\n` +
      `[NAMUNA JAVOB]\n${sample || "(kiritilmagan)"}`;

    busy = true;
    aiBtn.disabled = true;
    mapBtn.disabled = true;
    aiBox.hidden = false;
    aiBox.innerHTML = `<h2>AI bilan manbali tahlil</h2><div class="kz-ai-body" id="kz-ai-body">Tahlil tayyorlanmoqda…</div>`;
    const body = $("#kz-ai-body");
    aiBox.scrollIntoView({ behavior: "smooth", block: "start" });

    let text = "";
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content }], mode: "kazus" })
      });
      if (!res.ok || !res.body) {
        let detail = "";
        try { detail = (await res.json()).error || ""; } catch (_) {}
        throw new Error(detail || `AI server xatosi (${res.status})`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        text += dec.decode(value, { stream: true });
        body.innerHTML = md(text);
      }
      text += dec.decode();
      if (!text.trim()) throw new Error("AI bo‘sh javob qaytardi.");
      body.insertAdjacentHTML("beforeend", `<p class="kz-fine">Bu o‘quv tahlili, rasmiy yuridik xulosa emas. Norma va uning amaldagi tahririni <a href="https://lex.uz" target="_blank" rel="noopener" style="text-decoration: underline;">Lex.uz</a>’da tekshiring.</p>`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Noma’lum xatolik";
      body.innerHTML = `<p><b>AI tahlilini olishda xatolik yuz berdi.</b></p><p>${esc(msg)}</p>`;
    } finally {
      busy = false;
      aiBtn.disabled = false;
      mapBtn.disabled = false;
    }
  }

  mapBtn.addEventListener("click", renderMap);
  aiBtn.addEventListener("click", runAi);
})();

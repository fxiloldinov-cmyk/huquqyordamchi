// Yagona ish oynasi (#ish): chapda ishlar va saqlangan materiallar, markazda savol/kazus/hujjat, o'ngda ishlatilgan manbalar.
// Har bir ish ichida savol, sana, soha, javob, manbalar (strukturali), kitob parchalari va hujjat versiyalari bog'lanadi.
// Server javob oxirida yashirin ⁣HK:SRC:<json>⁣ belgisi bilan manbalar ro'yxatini yuboradi — u matndan olib tashlanadi.
// Maxfiylik: hisobsiz ishlaganda ma'lumot faqat shu oynada; qurilmada saqlash faqat foydalanuvchi tanlasa (va chiqishda o'chiriladi).
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const root = $("#view-ish");
  if (!root) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const render = (t) => (typeof md === "function" ? md(t) : `<p>${esc(t)}</p>`);
  const SRC_RE = /⁣HK:SRC:([^⁣]*)⁣/g;
  const LOCAL_KEY = "hk-ws-local";
  const TASKS = {
    chat: { label: "Savol (AI yordamchi)", api: "chat" },
    kazus: { label: "Kazus tahlili", api: "kazus" },
    hint: { label: "Bosqichma-bosqich maslahat", api: "kazus" },
    review: { label: "Javobimni tekshirish", api: "kazus" },
  };
  const FLOWS = {
    vaziyat: ["Sodda tushuntirish", "Kerakli savollar", "Manbalar", "Amaliy qadam", "Hujjat"],
    kazus: ["Fan", "Kazus", "Namuna", "Tahlil yoki o‘z javobini tekshirish", "Manbalar", "DOCX"],
    savol: ["Savol", "Javob", "Manbalar", "Saqlash"],
  };

  // ---------------- Holat ----------------
  let user = null, cases = [], items = [], books = [], fanlar = {};
  let current = null;          // { id|null, title, kind, soha, eventDate, entries:[], docs:[] }
  let activeSources = null, activeEntryId = null, busy = false, controller = null;
  let localOptIn = false;
  const blankCase = (kind = "savol") => ({ id: null, title: "", kind, soha: "", eventDate: null, entries: [], docs: [] });

  async function api(path, body) {
    const res = await fetch(path, { method: body ? "POST" : "GET", credentials: "same-origin", headers: body ? { "Content-Type": "application/json" } : {}, body: body ? JSON.stringify(body) : undefined });
    let data = {}; try { data = await res.json(); } catch {}
    if (!res.ok) throw Object.assign(new Error(data.error || "Xatolik yuz berdi."), { status: res.status });
    return data;
  }
  const toast = (t) => { const el = $("#ws-status"); el.textContent = t; el.hidden = !t; clearTimeout(toast.t); if (t) toast.t = setTimeout(() => (el.hidden = true), 4500); };

  // ---------------- Qurilmada saqlash (faqat aniq tanlov bilan) ----------------
  function readLocal() { try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || "null"); } catch { return null; } }
  function writeLocal() { if (!localOptIn || user) return; try { localStorage.setItem(LOCAL_KEY, JSON.stringify({ savedAt: new Date().toISOString(), current })); } catch {} }
  function clearLocal() { try { localStorage.removeItem(LOCAL_KEY); } catch {} localOptIn = false; $("#ws-local").checked = false; }

  // ---------------- Chap panel ----------------
  function renderLeft() {
    const list = $("#ws-cases");
    if (!user) list.innerHTML = `<li class="ws-muted">Ishlarni saqlash uchun <button type="button" class="link-btn" data-ws-login>hisobga kiring</button>. Hozirgi ish faqat shu oynada.</li>`;
    else list.innerHTML = cases.length ? cases.map((c) => `<li><button type="button" class="ws-case${current?.id === c.id ? " on" : ""}" data-case="${esc(c.id)}"><b>${esc(c.title)}</b><small>${esc(kindLabel(c.kind))}${c.soha ? " · " + esc(c.soha) : ""} · ${new Date(c.updatedAt).toLocaleDateString("uz-UZ")} · ${c.entries} yozuv${c.docs ? ", " + c.docs + " hujjat" : ""}</small></button></li>`).join("") : `<li class="ws-muted">Hali ish yo‘q. “Yangi ish” tugmasini bosing.</li>`;
    $("#ws-items").innerHTML = !user ? "" : items.length ? items.map((it) => `<li><span>${esc(it.title)}</span><button type="button" class="link-btn" data-import="${esc(it.id)}" title="Asl material o‘chirilmaydi">Ishga aylantirish</button></li>`).join("") : `<li class="ws-muted">Saqlangan material yo‘q.</li>`;
    $("#ws-items-box").hidden = !user;
    renderBooks();
  }
  const kindLabel = (k) => ({ vaziyat: "Huquqiy vaziyat", kazus: "Kazus", savol: "Savol" })[k] || "Savol";
  function renderBooks() {
    const box = $("#ws-books");
    if (!user) { box.innerHTML = `<p class="ws-muted">Kitob parchalari hisobga kirgandan keyin ishlaydi.</p>`; $("#ws-book-form").hidden = true; return; }
    $("#ws-book-form").hidden = false;
    box.innerHTML = books.length ? books.map((b) => `<label class="ws-book"><input type="checkbox" value="${esc(b.id)}" data-book checked> <span><b>${esc(b.title)}</b><small>${esc([b.author, b.year, b.pages ? b.pages + " sahifa" : "", "manba: " + (b.origin || "")].filter(Boolean).join(" · "))}</small><em class="ws-tag user">foydalanuvchi yuklagan · rasmiy tekshirilmagan</em></span></label>`).join("") : `<p class="ws-muted">Parcha yo‘q. Quyida qo‘shing — kazusdan chiqmasdan.</p>`;
  }

  // ---------------- Markaz ----------------
  function renderHead() {
    $("#ws-title").value = current.title;
    $("#ws-kind").value = current.kind;
    $("#ws-soha").value = current.soha || "";
    const fanKey = Object.keys(fanlar).find((k) => fanlar[k] === current.soha);
    if (fanKey) $("#ws-fan").value = fanKey;
    $("#ws-date").value = current.eventDate || "";
    const steps = FLOWS[current.kind] || FLOWS.savol;
    const reached = stepReached();
    $("#ws-steps").innerHTML = steps.map((s, i) => `<li class="${i < reached ? "done" : i === reached ? "now" : ""}"><span>${i + 1}</span>${esc(s)}</li>`).join("");
    const isKazus = current.kind === "kazus";
    $("#ws-task").innerHTML = Object.entries(TASKS).filter(([k]) => (isKazus ? k !== "chat" : k === "chat" || k === "kazus")).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join("");
    $("#ws-fan-wrap").hidden = !isKazus;
    $("#ws-books-use").hidden = !isKazus;
    syncTask();
  }
  function stepReached() {
    const e = current.entries;
    if (!e.length) return current.kind === "kazus" && current.soha ? 1 : 0;
    const hasSrc = e.some((x) => x.sources?.passages?.length);
    if (current.kind === "kazus") return current.docs.length ? 6 : hasSrc ? 5 : 4;
    if (current.kind === "vaziyat") return current.docs.length ? 5 : hasSrc ? 3 : 1;
    return hasSrc ? 3 : 2;
  }
  function syncTask() {
    const t = $("#ws-task").value;
    $("#ws-answer-wrap").hidden = t !== "review";
    $("#ws-input").placeholder = t === "chat" ? "Vaziyatingizni yoki savolingizni shaxsiy ma’lumotlarsiz yozing…" : "Kazus shartini yozing yoki .txt fayldan yuklang…";
    $("#ws-hint-note").hidden = t !== "hint";
  }
  function renderThread() {
    const th = $("#ws-thread");
    if (!current.entries.length) { th.innerHTML = `<div class="ws-empty"><h3>${current.kind === "kazus" ? "Kazus ustida ishlash" : "Huquqiy vaziyatingizni yozing"}</h3><p>${current.kind === "kazus" ? "Fanni tanlang, kazus shartini yozing. Avval “Bosqichma-bosqich maslahat” bilan o‘zingiz o‘ylab ko‘ring, keyin tahlil yoki javobingizni tekshirishni so‘rang." : "Avval sodda tushuntirish va kerakli savollar beriladi, keyin manbalar va amaliy qadamlar. Kerak bo‘lsa, hujjat tayyorlaysiz."}</p></div>`; return; }
    th.innerHTML = current.entries.map((e) => `<article class="ws-entry${e.id === activeEntryId ? " on" : ""}" data-entry="${esc(e.id)}">
      ${e.question ? `<div class="ws-q"><small>${esc(TASKS[e.task]?.label || "Savol")} · ${new Date(e.at).toLocaleString("uz-UZ")}</small><p>${esc(e.question).replace(/\n/g, "<br>")}</p></div>` : ""}
      <div class="ws-a">${render(e.answer || "")}</div>
      <div class="ws-entry-actions">${e.sources?.passages?.length ? `<button type="button" class="btn btn-ghost btn-sm" data-show-src="${esc(e.id)}">Manbalar (${e.sources.passages.length})</button>` : `<span class="ws-muted">Strukturali manba ro‘yxati yo‘q</span>`}<button type="button" class="btn btn-ghost btn-sm" data-to-doc="${esc(e.id)}">Hujjatga olish</button></div>
    </article>`).join("");
  }
  function renderDocs() {
    $("#ws-doc-versions").innerHTML = current.docs.length ? current.docs.map((d) => `<button type="button" class="link-btn" data-doc-v="${d.version}">v${d.version} · ${new Date(d.at).toLocaleString("uz-UZ")}</button>`).join(" ") : `<span class="ws-muted">Versiyalar yo‘q</span>`;
  }

  // ---------------- O'ng panel: manbalar ----------------
  const CLAIM_HELP = "🔎 iqtibos manbada so‘zma-so‘z topildi · 📄 parcha berilgan · ℹ️ parcha berilmagan · ⚠️ shubha (inkor, istisno, subyekt, muddat, tahrir) · ❌/🚫 manba yo‘q. So‘zlar mosligi va iqtibos xulosa to‘g‘riligini kafolatlamaydi; yurist tekshirmagan.";
  function renderSources(src, focusId = null) {
    const box = $("#ws-sources");
    activeSources = src;
    if (!src || (!src.passages?.length && !src.claims?.length)) {
      box.innerHTML = `<p class="ws-muted">Javob olingach, unda ishlatilgan rasmiy parchalar shu yerda chiqadi.</p>${src?.clarify?.length ? `<div class="ws-clarify"><b>Manba yetishmadi. Aniqlashtiring:</b><ul>${src.clarify.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>` : ""}`;
      $("#ws-src-count").textContent = "";
      return;
    }
    const claims = (src.claims || []).map((c) => `<li class="ws-claim lv-${esc(c.level?.replace(/\s/g, "-"))}"><button type="button" data-open-src="${esc(c.sourceId)}"><span class="ico">${esc(c.icon || "•")}</span><span><b>${esc(c.where)}</b><small>«${esc(c.snippet)}»</small><small>${esc(c.status)}</small>
      <span class="ws-tags"><em class="ws-tag">manba mavjud: ${c.exists ? "ha" : "yo‘q"}</em>${c.overlap ? `<em class="ws-tag">so‘zlar mosligi: ${esc(c.overlap.level)}</em>` : ""}${c.quote ? `<em class="ws-tag">iqtibos: ${c.quote.found ? "manbada bor" : "topilmadi"}</em>` : ""}<em class="ws-tag">yurist tekshirgan: yo‘q</em>${c.model ? `<em class="ws-tag">${esc(c.model.label)}: ${esc(c.model.verdict)}</em>` : ""}</span></span></button></li>`).join("");
    const passages = (src.passages || []).map((p) => `<details class="ws-passage kind-${esc(p.kind)}" id="src-${esc(p.sourceId).replace(/[^\w-]/g, "_")}" ${p.sourceId === focusId ? "open" : ""}>
      <summary><b>${esc(p.label || p.sourceId)}</b><small>${p.kind === "kitob" ? "Foydalanuvchi yuklagan kitob · rasmiy tekshirilmagan" : p.kind === "plenum" ? "Plenum tushuntirishi (qonun emas)" : "Qonun · rasmiy matn (lex.uz)"}${p.asOf ? " · tahrir " + esc(p.asOf) : ""}${p.origin ? " · " + esc(p.origin) : ""}</small></summary>
      <pre class="ws-excerpt">${esc(p.text)}</pre>${p.url ? `<a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Lex.uz’da ochish ↗</a>` : ""}</details>`).join("");
    box.innerHTML = `${claims ? `<h4>Javobdagi da’volar</h4><ul class="ws-claims">${claims}</ul>` : ""}${src.unsupported?.length ? `<h4>Manba ko‘rsatilmagan da’volar</h4><ul class="ws-unsup">${src.unsupported.map((u) => `<li>❔ ${esc(u)}</li>`).join("")}</ul>` : ""}${src.clarify?.length ? `<div class="ws-clarify"><b>Aniqlashtiruvchi savollar</b><ul>${src.clarify.map((q) => `<li>${esc(q)}</li>`).join("")}</ul></div>` : ""}<h4>Tahlilga berilgan parchalar</h4>${passages || '<p class="ws-muted">Parcha berilmagan.</p>'}<p class="ws-legend">${esc(CLAIM_HELP)}</p>`;
    $("#ws-src-count").textContent = src.passages?.length ? `(${src.passages.length})` : "";
    if (focusId) openSource(focusId);
  }
  function openSource(id) {
    const el = document.getElementById("src-" + String(id).replace(/[^\w-]/g, "_"));
    if (!el) return;
    el.open = true; setPane("right");
    el.scrollIntoView({ behavior: "smooth", block: "nearest" }); el.classList.add("flash"); setTimeout(() => el.classList.remove("flash"), 1400);
  }

  // ---------------- Mobil: tablar ----------------
  function setPane(p) {
    root.dataset.pane = p;
    root.querySelectorAll("[data-pane-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.paneTab === p)));
  }

  // ---------------- Ish yuklash / yaratish ----------------
  async function openCase(id) {
    if (busy) return;
    try { current = (await api("/api/account/cases?id=" + encodeURIComponent(id))).case; } catch (e) { return toast(e.message); }
    activeEntryId = current.entries.at(-1)?.id || null;
    renderAll(); renderSources(current.entries.at(-1)?.sources || null); setPane("center");
  }
  function newCase(kind = $("#ws-kind")?.value || "savol") {
    if (busy) return;
    current = blankCase(kind); activeEntryId = null;
    renderAll(); renderSources(null); setPane("center"); $("#ws-input").focus();
  }
  async function ensureSaved() {
    if (!user || current.id) return;
    const c = (await api("/api/account/cases", { op: "create", title: current.title || firstLine(), kind: current.kind, soha: current.soha, eventDate: current.eventDate })).case;
    current.id = c.id; current.createdAt = c.createdAt;
  }
  const firstLine = () => ($("#ws-input").value.trim().replace(/\s+/g, " ").slice(0, 90) || "Yangi ish");
  async function refreshLists() {
    if (!user) { cases = []; items = []; books = []; renderLeft(); return; }
    const [c, i, b] = await Promise.allSettled([api("/api/account/cases"), api("/api/account/items"), api("/api/account/books")]);
    cases = c.value?.cases || []; items = i.value?.items || []; books = b.value?.books || [];
    if (c.status === "rejected") toast(c.reason.message);
    renderLeft();
  }
  function renderAll() { renderHead(); renderThread(); renderDocs(); renderLeft(); }

  // ---------------- So'rov yuborish ----------------
  function online() {
    const off = !navigator.onLine;
    $("#ws-offline").hidden = !off;
    $("#ws-send").disabled = off || busy;
    return !off;
  }
  function splitSources(text) {
    let payload = null;
    for (const m of text.matchAll(SRC_RE)) { try { payload = JSON.parse(decodeURIComponent(m[1])); } catch {} }
    return { text: text.replace(SRC_RE, "").replace(/⁣HK:(?:CONT:[^⁣]*|END)⁣/g, "").replace(/⁣HK:[^⁣]*$/, ""), payload };
  }
  async function streamInto(res, onText) {
    const reader = res.body.getReader(), dec = new TextDecoder(); let all = "";
    for (;;) { const { done, value } = await reader.read(); if (done) break; all += dec.decode(value, { stream: true }); onText(all); }
    return all + dec.decode();
  }
  async function errorOf(res) { try { return (await res.json()).error || ""; } catch { return ""; } }

  async function send(e) {
    e?.preventDefault();
    if (busy || !online()) return;
    const task = $("#ws-task").value, question = $("#ws-input").value.trim(), studentAnswer = $("#ws-student").value.trim();
    if (question.length < (task === "chat" ? 3 : 40)) return toast(task === "chat" ? "Savolni yozing." : "Kazus shartini to‘liqroq yozing (kamida 40 belgi).");
    if (task === "review" && studentAnswer.length < 40) return toast("Tekshirish uchun javobingizni kiriting (kamida 40 belgi).");
    current.title ||= firstLine(); current.soha = $("#ws-soha").value; current.eventDate = $("#ws-date").value || null;
    busy = true; controller = new AbortController(); online();
    $("#ws-stop").hidden = false;
    const entry = { id: "tmp-" + Date.now(), at: new Date().toISOString(), task, question: task === "review" ? question + "\n\n— Mening javobim —\n" + studentAnswer : question, answer: "", sources: null };
    current.entries.push(entry); activeEntryId = entry.id; renderThread();
    const box = () => root.querySelector(`[data-entry="${entry.id}"] .ws-a`);
    box().innerHTML = `<p class="ws-muted">Javob tayyorlanmoqda… Uzun tahlil bir necha daqiqa davom etishi mumkin.</p>`;
    let timer = null;
    try {
      if (TASKS[task].api === "chat") {
        const prior = current.entries.slice(0, -1).filter((x) => x.task === "chat").slice(-3).flatMap((x) => [{ role: "user", content: x.question.slice(0, 3000) }, { role: "assistant", content: (x.answer || "").slice(0, 6000) }]).filter((m) => m.content.trim());
        timer = setTimeout(() => controller?.abort(), 70000);
        const res = await fetch("/api/chat", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: [...prior, { role: "user", content: question }], mode: current.kind === "kazus" ? "student" : "citizen", lang: globalThis.HK_I18N?.lang || "uz" }) });
        if (!res.ok || !res.body) throw new Error((await errorOf(res)) || `Server xatosi (${res.status})`);
        const raw = await streamInto(res, (t) => { box().innerHTML = render(splitSources(t).text); });
        Object.assign(entry, { answer: splitSources(raw).text, sources: splitSources(raw).payload });
      } else {
        const bookIds = [...root.querySelectorAll("[data-book]:checked")].map((x) => x.value);
        const base = { kazus: question, task: task === "kazus" ? "analyze" : task, studentAnswer: task === "review" ? studentAnswer : "", eventDate: current.eventDate || "", fan: $("#ws-fan").value, mode: "standart", useBooks: $("#ws-use-books").checked && user ? true : undefined, bookIds: $("#ws-use-books").checked ? bookIds : undefined, lang: globalThis.HK_I18N?.lang || "uz" };
        let acc = "", extra = [];
        for (let round = 0; round < 4; round++) {
          clearTimeout(timer); timer = setTimeout(() => controller?.abort(), 75000);
          const res = await fetch("/api/kazus", { method: "POST", signal: controller.signal, headers: { "Content-Type": "application/json" }, body: JSON.stringify(round ? { ...base, continuation: { round, partial: acc, sources: extra } } : base) });
          if (!res.ok || !res.body) throw new Error((await errorOf(res)) || `Server xatosi (${res.status})`);
          const raw = await streamInto(res, (t) => { box().innerHTML = render(splitSources(acc + t).text) + (round ? "" : ""); });
          const cont = raw.match(/⁣HK:CONT:([^⁣]*)⁣/), ended = /⁣HK:END⁣/.test(raw);
          const part = splitSources(raw);
          acc += part.text; if (part.payload) entry.sources = part.payload;
          if (ended || !cont) break;
          try { extra = [...extra, ...JSON.parse(decodeURIComponent(cont[1]))].slice(0, 20); } catch {}
          box().innerHTML = render(acc) + `<p class="ws-muted">Davomi yuklanmoqda…</p>`;
          if (round === 3) acc += "\n\n⚠️ Tahlil juda uzun bo‘ldi va oxirigacha yetmadi. Savolni qisqartirib qayta yuboring.";
        }
        entry.answer = acc;
      }
      if (!entry.answer.trim()) throw new Error("AI bo‘sh javob qaytardi.");
      $("#ws-input").value = ""; $("#ws-student").value = "";
      renderSources(entry.sources);
      await persist(entry);
    } catch (err) {
      const msg = err?.name === "AbortError" ? "So‘rov to‘xtatildi yoki kutish vaqti tugadi." : err.message;
      entry.answer = (entry.answer || "") + `\n\n⚠️ ${msg}\n\nMatningiz yozish maydonida saqlandi. “Qayta yuborish” uchun yana “Yuborish”ni bosing — so‘rov avtomatik qayta yuborilmaydi.`;
      entry.failed = true;
    } finally {
      // Xato bo'lgan yozuv faqat ekranda qoladi (serverga saqlanmaydi); matn yozish maydonida turadi
      clearTimeout(timer); busy = false; controller = null; $("#ws-stop").hidden = true; online();
      renderThread(); renderHead(); writeLocal();
    }
  }
  async function persist(entry) {
    if (!user) { toast(localOptIn ? "Qurilmada saqlandi (hisobsiz)." : "Natija faqat shu oynada. Saqlash uchun hisobga kiring."); return; }
    try {
      await ensureSaved();
      const r = await api("/api/account/cases", { op: "append", id: current.id, entry: { task: entry.task, question: entry.question, answer: entry.answer, sources: entry.sources } });
      entry.id = r.entry.id; activeEntryId = entry.id;
      if (current.soha !== undefined) api("/api/account/cases", { op: "update", id: current.id, soha: current.soha, eventDate: current.eventDate, title: current.title }).catch(() => {});
      await refreshLists(); toast("Ishga saqlandi.");
    } catch (err) { toast("Javob olindi, lekin saqlanmadi: " + err.message); }
  }

  // ---------------- Hujjat tahriri ----------------
  async function saveDoc() {
    const text = $("#ws-doc").value.trim();
    if (text.length < 20) return toast("Hujjat matnini yozing.");
    if (!user) return toast("Hujjat versiyalarini saqlash uchun hisobga kiring. Word faylini hozir ham yuklab olishingiz mumkin.");
    try { await ensureSaved(); const r = await api("/api/account/cases", { op: "doc", id: current.id, title: current.title, text }); current.docs.push(r.doc); renderDocs(); renderHead(); refreshLists(); toast(`Hujjat v${r.doc.version} saqlandi.`); }
    catch (err) { toast(err.message); }
  }
  async function downloadDocx() {
    const text = $("#ws-doc").value.trim() || current.entries.at(-1)?.answer || "";
    if (!text) return toast("Avval hujjat matnini tayyorlang.");
    if (!online()) return;
    try {
      const res = await fetch("/api/docx/build", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text, title: (current.title || "Hujjat").slice(0, 80) }) });
      if (!res.ok) throw new Error((await errorOf(res)) || "Word faylini yaratib bo‘lmadi.");
      const a = document.createElement("a"); a.href = URL.createObjectURL(await res.blob()); a.download = "huquqyordamchi-hujjat.docx"; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    } catch (err) { toast(err.message + " Matnni nusxa olib saqlashingiz mumkin."); }
  }

  // ---------------- Kitob parchasi qo'shish (kazusdan chiqmasdan) ----------------
  async function addBook(e) {
    e.preventDefault();
    const f = e.target, out = $(".form-msg", f);
    try {
      await api("/api/account/books", { op: "add", title: f.title.value, author: f.author.value, year: f.year.value, origin: f.origin.value, firstPage: f.firstPage.value, text: f.text.value, rightsConfirmed: f.rights.checked });
      f.reset(); out.textContent = "Parcha qo‘shildi."; await refreshLists();
    } catch (err) { out.textContent = err.message; }
  }

  // ---------------- Fayldan kazus (.txt) ----------------
  function loadFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 200000) return toast("Fayl juda katta (200 KB gacha .txt).");
    if (!/\.(txt|md)$/i.test(file.name)) return toast("Hozircha .txt yoki .md fayl. Word namunasi formatini “Kazus ustaxonasi”dagi Word namunasi orqali tanlang.");
    const r = new FileReader(); r.onload = () => { $("#ws-input").value = String(r.result).slice(0, 6000); toast("Fayl matni yuklandi — tekshirib, yuboring."); }; r.readAsText(file);
    e.target.value = "";
  }

  // ---------------- Hodisalar ----------------
  root.addEventListener("click", (e) => {
    const t = e.target.closest("button, a"); if (!t) return;
    if (t.dataset.case) openCase(t.dataset.case);
    else if (t.dataset.import) api("/api/account/cases", { op: "import-item", itemId: t.dataset.import }).then((r) => { toast("Ish yaratildi (asl material saqlanib qoldi)."); refreshLists(); openCase(r.case.id); }).catch((err) => toast(err.message));
    else if (t.dataset.showSrc) { const en = current.entries.find((x) => x.id === t.dataset.showSrc); activeEntryId = en.id; renderSources(en.sources); renderThread(); setPane("right"); }
    else if (t.dataset.openSrc) openSource(t.dataset.openSrc);
    else if (t.dataset.toDoc) { const en = current.entries.find((x) => x.id === t.dataset.toDoc); $("#ws-doc").value = (en.answer || "").split(/\n---\n\*\*Manba tekshiruvi/)[0].trim(); $("#ws-doc-box").open = true; $("#ws-doc").focus(); }
    else if (t.dataset.docV) { const d = current.docs.find((x) => String(x.version) === t.dataset.docV); $("#ws-doc").value = d.text; }
    else if (t.dataset.paneTab) setPane(t.dataset.paneTab);
    else if ("wsLogin" in t.dataset) globalThis.HK_ACCOUNT?.openAuth("login", "Ishlarni saqlash uchun hisobingizga kiring.");
    else if (t.id === "ws-new") newCase();
  });
  $("#ws-composer").addEventListener("submit", send);
  // Telefonda klaviatura ochilganda yozish maydoni va "Yuborish" tugmasi ko'rinib tursin
  $("#ws-composer").addEventListener("focusin", () => setTimeout(() => $("#ws-send").scrollIntoView({ block: "end", behavior: "smooth" }), 250));
  $("#ws-input").addEventListener("keydown", (e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); $("#ws-composer").requestSubmit(); } });
  $("#ws-stop").addEventListener("click", () => controller?.abort());
  $("#ws-task").addEventListener("change", syncTask);
  $("#ws-kind").addEventListener("change", () => { current.kind = $("#ws-kind").value; renderHead(); renderThread(); });
  $("#ws-soha").addEventListener("change", () => { current.soha = $("#ws-soha").value; renderHead(); });
  $("#ws-fan").addEventListener("change", () => { $("#ws-soha").value = fanlar[$("#ws-fan").value] || ""; current.soha = $("#ws-soha").value; renderHead(); });
  $("#ws-title").addEventListener("change", () => { current.title = $("#ws-title").value.trim(); if (user && current.id) api("/api/account/cases", { op: "update", id: current.id, title: current.title }).then(refreshLists).catch(() => {}); });
  $("#ws-file").addEventListener("change", loadFile);
  $("#ws-doc-save").addEventListener("click", saveDoc);
  $("#ws-doc-docx").addEventListener("click", downloadDocx);
  $("#ws-book-form").addEventListener("submit", addBook);
  $("#ws-local").addEventListener("change", (e) => { localOptIn = e.target.checked; if (localOptIn) { writeLocal(); toast("Hozirgi ish shu qurilmada saqlanadi. Hisobdan chiqishda yoki “O‘chirish” bilan tozalanadi."); } else clearLocal(); });
  $("#ws-local-clear").addEventListener("click", () => { clearLocal(); toast("Qurilmadagi shaxsiy ma’lumot o‘chirildi."); });
  window.addEventListener("online", online); window.addEventListener("offline", online);
  // Mobil klaviatura: yozish maydoni va yuborish tugmasi ko'rinib tursin
  if (window.visualViewport) visualViewport.addEventListener("resize", () => { const kb = Math.max(0, window.innerHeight - visualViewport.height); root.style.setProperty("--kb", kb + "px"); document.body.classList.toggle("kb-open", kb > 120); if (document.activeElement?.closest("#ws-composer")) document.activeElement.scrollIntoView({ block: "nearest" }); });

  // Bosh sahifadagi ikki boshlanish va pastki navigatsiya: data-ws-start="vaziyat|kazus"
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-ws-start]"); if (!b) return;
    e.preventDefault();
    show("ish");
    if (!current || current.entries.length || current.kind !== b.dataset.wsStart) newCase(b.dataset.wsStart);
    if (b.dataset.wsTask) { $("#ws-task").value = b.dataset.wsTask; syncTask(); }
  });
  document.addEventListener("hk:auth", (e) => {
    const was = user; user = e.detail.user;
    if (was && !user) { clearLocal(); current = blankCase(current?.kind); activeEntryId = null; renderSources(null); renderAll(); }
    if (user && !was) { clearLocal(); refreshLists(); }
    else renderLeft();
  });

  // ---------------- Boshlash ----------------
  (async () => {
    const saved = readLocal();
    current = saved?.current && !globalThis.HK_ACCOUNT?.user ? saved.current : blankCase();
    if (saved) { localOptIn = true; $("#ws-local").checked = true; }
    try { const d = await (await fetch("/api/kazus", { headers: { Accept: "application/json" } })).json(); fanlar = d.fanlar || {}; } catch { fanlar = {}; }
    $("#ws-fan").innerHTML = Object.entries(fanlar).map(([k, v]) => `<option value="${esc(k)}">${esc(v)}</option>`).join("") || `<option value="boshqa">Boshqa</option>`;
    $("#ws-soha").innerHTML = `<option value="">Soha tanlanmagan</option>` + [...new Set(Object.values(fanlar))].map((v) => `<option>${esc(v)}</option>`).join("");
    renderAll(); renderSources(null); setPane("center"); online();
  })();
  globalThis.HK_WS = { splitSources };
})();

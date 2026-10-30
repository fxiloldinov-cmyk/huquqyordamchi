// =====================================================================
// INTERFEYS: tungi rejim, mobil menyu, qidiruv tablari, imkoniyatlar tablari,
// lex.uz yangiliklari. app.js va features.js dan keyin yuklanadi.
// =====================================================================

// ---- Tungi / kunduzgi rejim ----------------------------------------------
(function themeSetup() {
  const root = document.documentElement;
  const btn = document.getElementById("theme-toggle");
  let saved = null;
  try { saved = localStorage.getItem("hk-theme"); } catch {}
  if (saved === "dark" || saved === "light") root.dataset.theme = saved;

  const isDark = () =>
    root.dataset.theme === "dark" ||
    (!root.dataset.theme && window.matchMedia("(prefers-color-scheme: dark)").matches);

  btn?.addEventListener("click", () => {
    const next = isDark() ? "light" : "dark";
    root.dataset.theme = next;
    try { localStorage.setItem("hk-theme", next); } catch {}
  });
})();

// ---- Mobil menyu -----------------------------------------------------------
(function menuSetup() {
  const btn = document.getElementById("menu-toggle");
  const nav = document.getElementById("main-nav");
  if (!btn || !nav) return;
  const close = () => { document.body.classList.remove("menu-open"); btn.setAttribute("aria-expanded", "false"); };
  btn.addEventListener("click", () => {
    const open = !document.body.classList.contains("menu-open");
    document.body.classList.toggle("menu-open", open);
    btn.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (e) => { if (e.target.closest("a")) close(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
})();

// ---- Umumiy tab yordamchisi ------------------------------------------------
function activateTab(tabs, panels, index) {
  tabs.forEach((t, i) => {
    const on = i === index;
    t.classList.toggle("active", on);
    t.setAttribute("aria-selected", String(on));
    t.tabIndex = on ? 0 : -1;
  });
  panels.forEach((p, i) => {
    p.hidden = i !== index;
    p.classList.toggle("active", i === index);
  });
}

function wireTabs(tabs, panels, onChange) {
  tabs.forEach((tab, i) => {
    tab.addEventListener("click", () => { activateTab(tabs, panels, i); onChange?.(i); });
    tab.addEventListener("keydown", (e) => {
      if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
      e.preventDefault();
      const next = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length;
      activateTab(tabs, panels, next);
      tabs[next].focus();
      onChange?.(next);
    });
  });
}

// Qidiruv konsoli: "Moddalarni topish" / "AI'dan so'rash"
(function consoleTabs() {
  const tabs = [document.getElementById("tab-modda"), document.getElementById("tab-ai")].filter(Boolean);
  const panels = [document.getElementById("pane-modda"), document.getElementById("pane-ai")].filter(Boolean);
  if (tabs.length !== 2) return;
  wireTabs(tabs, panels, (i) => {
    (i === 0 ? document.getElementById("smart-query") : document.getElementById("hero-input"))?.focus();
  });
})();

// Imkoniyatlar bo'limi
(function moduleTabs() {
  const tabs = [...document.querySelectorAll(".module-tab")];
  const panels = tabs.map((t) => document.getElementById(t.dataset.module));
  if (!tabs.length || panels.some((p) => !p)) return;
  wireTabs(tabs, panels);
})();

// ---- Qonunchilikdagi yangiliklar (lex.uz RSS) -----------------------------
(function newsSetup() {
  const list = document.getElementById("news-list");
  const more = document.getElementById("news-more");
  const filters = document.getElementById("news-filters");
  const sourceEl = document.getElementById("news-source");
  if (!list) return;

  const PAGE = 8;
  let items = [];
  let filter = "all";
  let shown = PAGE;

  const TYPE_LABEL = { qonun: "Qonun", farmon: "Farmon", qaror: "Qaror", buyruq: "Buyruq", boshqa: "Hujjat" };

  function typeOf(item) {
    const o=norm(item.organ||'');
    if (/qonun(i)?\b|o'rq|o‘rq/.test(o)) return 'qonun';
    if (/farmon|pf[-–]/.test(o)) return 'farmon';
    if (/buyru|prikaz/.test(o)) return 'buyruq';
    if (/qaror|pq[-–]|postanovlen/.test(o)) return 'qaror';
    return 'boshqa';
  }

  // "Oʻzbekiston Respublikasi ... vazirligining qarori" -> qisqaroq organ nomi
  function organName(organ) {
    return String(organ || "")
      .replace(/\s*(qarori|qarorlari|buyrugʻi|buyrug'i|farmoni|qonuni)\s*$/i, "")
      .replace(/^Oʻzbekiston Respublikasi(ning)?\s+/i, "")
      .trim();
  }

  function render() {
    const filtered = items.filter((it) => filter === "all" || it.type === filter);
    if (!filtered.length) {
      list.innerHTML = `<li class="news-empty">Bu turdagi hujjat topilmadi.</li>`;
      more.hidden = true;
      return;
    }
    list.innerHTML = filtered.slice(0, shown).map((it) => `
      <li class="news-item">
        <div class="news-date">
          <span class="news-date-label">Qabul qilingan</span>
          <time>${escapeHtml(it.adopted || "—")}</time>
        </div>
        <div class="news-body">
          <span class="news-type t-${it.type}">${TYPE_LABEL[it.type]}</span>
          <a class="news-title" href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${escapeHtml(it.title)}</a>
          <p class="news-organ">${escapeHtml(organName(it.organ))}${it.reg ? ` · ${escapeHtml(it.reg)}` : ""}</p>
        </div>
        <div class="news-eff">
          <span class="news-date-label">Kuchga kiradi</span>
          <time>${escapeHtml(it.effective || "—")}</time>${it.archive?`<small class="archive-label">Zaxira: ${escapeHtml(it.archive)}</small>`:""}
        </div>
      </li>`).join("");
    more.hidden = filtered.length <= shown;
  }

  filters?.addEventListener("click", (e) => {
    const b = e.target.closest("[data-type]");
    if (!b) return;
    filter = b.dataset.type;
    shown = PAGE;
    filters.querySelectorAll("[data-type]").forEach((x) => x.classList.toggle("active", x === b));
    render();
  });
  more?.addEventListener("click", () => { shown += PAGE; render(); });

  async function load(url) {
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal:AbortSignal.timeout(18000) });
    if (!res.ok) throw new Error(String(res.status));
    const data = await res.json();
    if (!Array.isArray(data.items) || !data.items.length) throw new Error("empty");
    return data;
  }

  (async () => {
    let data = null;
    let live = true;
    try {
      data = await load("/api/news");
    } catch {
      live = false;
      try { data = await load("data/news.json"); } catch {}
    }
    if (!data) {
      list.innerHTML = `<li class="news-empty">Yangiliklarni yuklab bo'lmadi. <a href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> da ko'ring.</li>`;
      return;
    }
    items = data.items.filter(it=>{try{return /^https:$/.test(new URL(it.url).protocol)&&['lex.uz','www.lex.uz'].includes(new URL(it.url).hostname)}catch{return false}}).map(it=>({...it,type:typeOf(it),archive:live?null:data.updated}));
    if(live){try{const backup=await load('data/news.json');const present=new Set(items.map(it=>it.type));const urls=new Set(items.map(it=>it.url));items.push(...backup.items.filter(it=>!present.has(typeOf(it))&&!urls.has(it.url)&&/^https:\/\/(www\.)?lex\.uz\//.test(it.url)).map(it=>({...it,type:typeOf(it),archive:backup.updated})));}catch{}}
    filters.querySelectorAll('[data-type]').forEach(b=>{const n=b.dataset.type==='all'?items.length:items.filter(it=>it.type===b.dataset.type).length;const label=b.dataset.type==='all'?'Barchasi':({qonun:'Qonunlar',farmon:'Farmonlar',qaror:'Qarorlar',buyruq:'Buyruqlar'})[b.dataset.type];b.textContent=`${label} (${n})`;});
    if (sourceEl) {
      const when = live ? `oxirgi yuklash: ${escapeHtml(data.updated||"")} (ayrim turlar zaxiradan)` : `${escapeHtml(data.updated || "")} holatiga`;
      sourceEl.innerHTML = `Manba: <a href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> rasmiy RSS lentasi · ${when}.`;
    }
    render();
  })();
})();

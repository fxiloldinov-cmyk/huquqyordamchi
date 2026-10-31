// Cookie va brauzer xotirasi roziligi. Sayt reklama yoki kuzatuv cookie'larini ishlatmaydi:
//  - zarur: hisobga kirish cookie'si (HttpOnly) va shu tanlovning o'zi — doim yoqilgan;
//  - sozlamalar: tanlangan til va tungi rejim — faqat rozilik bilan eslab qolinadi.
(() => {
  const KEY = "hk-consent", VERSION = 1;
  const PREF_KEYS = ["hk-lang", "hk-theme"];
  let state = null;
  try { const v = JSON.parse(localStorage.getItem(KEY) || "null"); if (v && v.v === VERSION) state = v; } catch {}

  const api = {
    get: () => state,
    allowed: (cat) => cat === "necessary" || !!(state && state[cat]),
    open: () => render(true),
  };
  globalThis.HK_CONSENT = api;

  function save(prefs) {
    state = { v: VERSION, prefs: !!prefs, at: new Date().toISOString() };
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
    if (!prefs) for (const k of PREF_KEYS) { try { localStorage.removeItem(k); } catch {} }
    else {
      // Rozilikdan oldin tanlangan til yoki mavzu bo'lsa, endi eslab qolamiz
      try { const l = globalThis.HK_I18N?.lang; if (l) localStorage.setItem("hk-lang", l); } catch {}
      try { const t = document.documentElement.dataset.theme; if (t) localStorage.setItem("hk-theme", t); } catch {}
    }
    document.getElementById("cookie-banner")?.remove();
    document.dispatchEvent(new CustomEvent("hk-consent", { detail: state }));
  }

  function render(withSettings = false) {
    document.getElementById("cookie-banner")?.remove();
    const el = document.createElement("section");
    el.id = "cookie-banner";
    el.className = "cookie-banner";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("aria-labelledby", "cookie-title");
    const prefsOn = state ? state.prefs : true;
    el.innerHTML = `
      <div class="cookie-inner">
        <div class="cookie-text">
          <h2 id="cookie-title">Cookie va brauzer xotirasi</h2>
          <p>Sayt ishlashi uchun zarur cookie (hisobga kirish) va siz tanlagan sozlamalar (til, tungi rejim) brauzeringizda saqlanadi. Reklama yoki kuzatuv cookie’lari ishlatilmaydi.</p>
          <a href="/oferta/">Batafsil: ommaviy oferta</a>
        </div>
        <div class="cookie-settings" ${withSettings ? "" : "hidden"}>
          <label class="cookie-opt"><input type="checkbox" checked disabled><span><b>Zarur</b><small>Hisobga kirish, xavfsizlik va shu tanlovni eslab qolish. O‘chirib bo‘lmaydi.</small></span></label>
          <label class="cookie-opt"><input type="checkbox" id="cookie-prefs" ${prefsOn ? "checked" : ""}><span><b>Sozlamalar</b><small>Tanlangan til va tungi rejimni keyingi safar eslab qolish.</small></span></label>
        </div>
        <div class="cookie-actions">
          <button type="button" class="btn btn-primary btn-sm" data-consent="all">Hammasini qabul qilish</button>
          <button type="button" class="btn btn-ghost btn-sm" data-consent="necessary">Faqat zarurlari</button>
          <button type="button" class="btn btn-ghost btn-sm" data-consent="${withSettings ? "save" : "settings"}">${withSettings ? "Tanlovni saqlash" : "Sozlash"}</button>
        </div>
      </div>`;
    el.addEventListener("click", (e) => {
      const b = e.target.closest("[data-consent]");
      if (!b) return;
      const a = b.dataset.consent;
      if (a === "all") save(true);
      else if (a === "necessary") save(false);
      else if (a === "save") save(el.querySelector("#cookie-prefs").checked);
      else if (a === "settings") render(true);
    });
    document.body.appendChild(el);
    if (withSettings) el.querySelector("#cookie-prefs")?.focus();
  }

  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-cookie-settings]")) { e.preventDefault(); render(true); }
  });
  if (!state) render(false);
})();

// "Baza qamrovi" (#qamrov): public/coverage.json dan — build paytida data/ fayllaridan hisoblangan haqiqiy raqamlar.
(() => {
  const box = document.getElementById("qamrov-body");
  if (!box) return;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n) => Number(n || 0).toLocaleString("uz-UZ");
  const state = {'publication-date-matches':'nashr sanasi teng','local-content-changed':'lokal nusxa tekshiruvdan keyin o‘zgargan','indexed-text-differs':'matn farqi bor — tekshiruvda','newer-publication':'yangi nashr bor','publication-unknown':'nashr sanasi noma’lum','http-error':'havola ochilmadi','fetch-error':'ulanish xatosi','identity-unverified':'bevosita manba tasdiqlanmagan','check-expired':'tekshiruv eskirgan','unverified':'tekshirilmagan','date-conflict':'sanalarda tafovut'};
  const scope = {'indexed-text':'indekslangan matn','main_rules':'asosiy qoidalar','main_text':'asosiy matn'};
  let loaded = false;
  async function load() {
    if (loaded) return; loaded = true;
    try {
      const c = await (await fetch("/coverage.json", { cache: "no-cache" })).json();
      const t = c.totals;
      box.innerHTML = `<div class="qamrov-stats">
        <div><b>${fmt(t.laws)}</b>qonun va kodeks</div><div><b>${fmt(t.articles)}</b>modda</div>
        <div><b>${fmt(t.plenums)}</b>Plenum qarori (${fmt(t.bands)} band)</div><div><b>${fmt(t.courtDecisions)}</b>individual sud qarori</div>
        <div><b>${fmt(t.situations)}</b>kundalik vaziyat yo‘riqnomasi</div></div>
        <p class="ws-muted">Hisoblangan sana: ${esc(c.generatedAt)}. Oxirgi import: ${esc(c.lastImport || "—")}. ${esc(c.note)}</p>
        <div style="overflow-x:auto"><table class="qamrov-table"><thead><tr><th>Hujjat</th><th>Turi</th><th>Birlik</th><th>Kuchini yo‘qotgan</th><th>Bazadagi tahrir</th><th>Import</th><th>Yangilik kuzatuvi / yangilash</th><th>Nashr / kuchga kirish</th><th>Yangilik tekshiruvi</th></tr></thead><tbody>
        ${c.docs.map((d) => `<tr><td><a href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">${esc(d.name)}</a></td><td>${d.kind === "plenum" ? "Plenum tushuntirishi" : d.kind === "qoida" ? "Qoida / nizom" : "Qonun"}</td><td>${fmt(d.units)} ${esc(d.unit)}</td><td>${fmt(d.repealed)}</td><td>${esc(d.asOf)}</td><td>${esc(d.importedAt || "—")}</td><td>${d.monitoring === "weekly-page-audit" ? "haftalik audit kodi mavjud" : "qo‘lda kuzatiladi"}; matn yurist ko‘rigidan keyin yangilanadi</td><td>${esc(d.publishedAt || "e’lon sanasi alohida qayd etilmagan")} / ${esc(d.effectiveFrom || "noma’lum")} (${d.effectiveDateVerified ? "sana tasdiqlangan" : "sana tasdiqlanmagan"})</td><td>${esc(d.checkedAt || "tekshirilmagan")} · ${esc(state[d.freshness] || "tekshirilmagan")} · ${esc(scope[d.scope] || "qamrov alohida tekshiriladi")}</td></tr>`).join("")}
        </tbody></table></div>
        <h3>Ulanmagan manbalar</h3><ul>${c.notConnected.map((n) => `<li><b>${esc(n.name)}</b> — ${esc(n.why)}</li>`).join("")}</ul>`;
    } catch { box.innerHTML = `<p class="ws-muted">Qamrov ma’lumotini yuklab bo‘lmadi (internetni tekshiring).</p>`; loaded = false; }
  }
  const check = () => { if (location.hash === "#qamrov") load(); };
  window.addEventListener("hashchange", check);
  document.addEventListener("click", (e) => { if (e.target.closest('[data-view="qamrov"]')) setTimeout(load, 0); });
  check();
})();

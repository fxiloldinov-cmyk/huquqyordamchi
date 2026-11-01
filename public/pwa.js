// PWA: service worker ro'yxatdan o'tkazish, yangi versiyani taklif qilish, o'rnatish tugmasi.
// Push bildirishnoma ruxsati so'ralmaydi. Yangilashda yozilayotgan matn (ish oynasi, chat, kazus) yo'qolmaydi.
(() => {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") return;
  const DRAFT_KEY = "hk-update-draft";
  const FIELDS = ["#ws-input", "#ws-student", "#ws-doc", "#chat-input", "#kazus-text", "#kazus-student-answer"];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function banner(html, actions) {
    document.querySelector(".pwa-banner")?.remove();
    const b = document.createElement("div");
    b.className = "pwa-banner"; b.setAttribute("role", "status");
    b.innerHTML = `<p>${html}</p>` + actions.map((a, i) => `<button type="button" class="btn ${i ? "btn-ghost" : "btn-primary"} btn-sm" data-i="${i}">${esc(a.label)}</button>`).join("");
    b.addEventListener("click", (e) => { const i = e.target.closest("[data-i]")?.dataset.i; if (i != null) { actions[i].run(); b.remove(); } });
    document.body.appendChild(b);
  }

  // Yangilashdan oldin qoralamani sessionStorage'ga (faqat shu tab, yopilganda o'chadi), keyin tiklash
  function saveDraft() {
    const d = {}; for (const s of FIELDS) { const el = document.querySelector(s); if (el?.value) d[s] = el.value; }
    try { if (Object.keys(d).length) sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ hash: location.hash, d })); } catch {}
  }
  function restoreDraft() {
    let x = null; try { x = JSON.parse(sessionStorage.getItem(DRAFT_KEY) || "null"); sessionStorage.removeItem(DRAFT_KEY); } catch {}
    if (!x) return;
    setTimeout(() => { for (const [s, v] of Object.entries(x.d)) { const el = document.querySelector(s); if (el && !el.value) el.value = v; } }, 300);
  }
  restoreDraft();

  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (reloading) return; reloading = true; location.reload(); });

  function offerUpdate(reg) {
    if (!reg.waiting || !navigator.serviceWorker.controller) return;
    banner("Saytning yangi versiyasi tayyor. Yozayotgan matningiz saqlanib qoladi.", [
      { label: "Yangilash", run: () => { saveDraft(); reg.waiting.postMessage("SKIP_WAITING"); } },
      { label: "Keyinroq", run: () => {} },
    ]);
  }
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
      offerUpdate(reg);
      reg.addEventListener("updatefound", () => { const w = reg.installing; w?.addEventListener("statechange", () => { if (w.state === "installed") offerUpdate(reg); }); });
      setInterval(() => reg.update().catch(() => {}), 60 * 60 * 1000);
    } catch (e) { console.warn("SW ro‘yxatdan o‘tmadi", e?.name); }
  });

  // O'rnatish: brauzer imkon bersa tugma, iOS Safari'da qisqa yo'riqnoma
  let deferred = null;
  const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
  const dismissed = () => { try { return localStorage.getItem("hk-install-dismissed") === "1"; } catch { return false; } };
  const dismiss = () => { try { localStorage.setItem("hk-install-dismissed", "1"); } catch {} };
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); deferred = e;
    if (standalone || dismissed()) return;
    banner("HuquqYordamchi’ni telefoningiz bosh ekraniga o‘rnatish mumkin.", [
      { label: "O‘rnatish", run: async () => { deferred.prompt(); await deferred.userChoice.catch(() => {}); deferred = null; } },
      { label: "Kerak emas", run: dismiss },
    ]);
  });
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && /safari/i.test(navigator.userAgent) && !/crios|fxios/i.test(navigator.userAgent);
  if (ios && !standalone && !dismissed()) setTimeout(() => banner("Bosh ekranga qo‘shish: Safari’da “Ulashish” (□↑) tugmasini bosing va “Bosh ekranga qo‘shish”ni tanlang.", [{ label: "Tushunarli", run: dismiss }]), 4000);

  // Hisobdan chiqishda SW'dagi ehtiyot keshini tozalash
  document.addEventListener("hk:auth", (e) => { if (!e.detail.user) navigator.serviceWorker.controller?.postMessage("CLEAR_PRIVATE"); });
  // Ulanish holati: qayta ulanganda faqat xabar — so'rov avtomatik qayta yuborilmaydi
  window.addEventListener("online", () => document.querySelector(".pwa-banner.offline")?.remove());
})();

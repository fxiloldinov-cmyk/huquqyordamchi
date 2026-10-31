// Hisob: kirish / ro'yxatdan o'tish oynasi, "Mening hisobim" bo'limi, kazus va suhbatni saqlash.
// Sessiya HttpOnly cookie'da — JavaScript uni o'qiy olmaydi; parol brauzerda saqlanmaydi.
(() => {
  const $ = (s, r = document) => r.querySelector(s);
  const T = (s) => (globalThis.HK_I18N ? HK_I18N.translate(s) : s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const TYPE = { kazus: "Kazus tahlili", chat: "AI suhbat", search: "Aqlli qidiruv", doc: "Hujjat" };
  let user = null;
  let pending = null; // kirishdan keyin bajariladigan amal (masalan, saqlash)

  async function api(path, opts = {}) {
    const res = await fetch(path, {
      method: opts.body ? "POST" : "GET",
      credentials: "same-origin",
      headers: opts.body ? { "Content-Type": "application/json" } : {},
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    });
    let data = {};
    try { data = await res.json(); } catch {}
    if (!res.ok) throw Object.assign(new Error(data.error || "Xatolik yuz berdi."), { status: res.status });
    return data;
  }

  // ---------------- Sarlavhadagi tugma ----------------
  const accBtn = $("#account-btn");
  function renderHeader() {
    if (!accBtn) return;
    accBtn.textContent = user ? "Hisobim" : "Kirish";
    accBtn.title = user ? user.email : "";
    accBtn.classList.toggle("signed-in", !!user);
  }
  accBtn?.addEventListener("click", () => (user ? goAccount() : openAuth("login")));

  // ---------------- Kirish oynasi ----------------
  const dlg = $("#auth-dialog"), form = $("#auth-form"), msg = $("#auth-form .form-msg");
  let mode = "login";
  function setMode(m) {
    mode = m;
    dlg.querySelectorAll("[data-auth-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.authTab === m)));
    dlg.querySelectorAll(".reg-only").forEach((el) => (el.hidden = m !== "register"));
    $("#auth-title").textContent = m === "login" ? "Hisobingizga kiring" : "Ro‘yxatdan o‘tish";
    $("#auth-submit").textContent = m === "login" ? "Kirish" : "Hisob yaratish";
    form.password.autocomplete = m === "login" ? "current-password" : "new-password";
    msg.textContent = "";
  }
  function openAuth(m = "login", reason = "") {
    setMode(m);
    const r = $("#auth-reason");
    r.hidden = !reason; r.textContent = reason;
    dlg.showModal();
    form.email.focus();
  }
  dlg?.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-auth-tab]");
    if (tab) setMode(tab.dataset.authTab);
    const pw = e.target.closest(".pw-toggle");
    if (pw) {
      const show = form.password.type === "password";
      form.password.type = show ? "text" : "password";
      pw.textContent = show ? "Yashirish" : "Ko‘rsatish";
    }
    if (e.target === dlg) dlg.close(); // fonga bosilganda yopiladi
  });
  dlg?.addEventListener("close", () => { form.password.value = ""; form.password.type = "password"; });
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = $("#auth-submit");
    const body = { email: form.email.value.trim(), password: form.password.value };
    if (mode === "register") { body.name = form.name.value.trim(); body.acceptOferta = form.acceptOferta.checked; }
    if (mode === "register" && !body.acceptOferta) { msg.textContent = "Ommaviy oferta shartlarini qabul qiling."; return; }
    btn.disabled = true; msg.textContent = "";
    try {
      const data = await api(`/api/auth/${mode}`, { body });
      user = data.user; renderHeader(); dlg.close();
      toast(mode === "login" ? "Hisobingizga kirdingiz." : "Hisob yaratildi. Xush kelibsiz!");
      if (pending) { const p = pending; pending = null; p(); }
    } catch (err) {
      msg.textContent = err.status === 503 ? "Hisob xizmati hozircha ulanmagan. Keyinroq urinib ko‘ring." : err.message;
    } finally { btn.disabled = false; }
  });

  // ---------------- Mening hisobim ----------------
  function goAccount() {
    if (typeof show === "function") show("account"); else location.hash = "#account";
    renderAccount();
  }
  async function renderAccount() {
    const box = $("#acc-items");
    if (!box) return;
    if (!user) {
      $("#acc-email").textContent = "";
      box.innerHTML = `<div class="acc-empty"><p>Saqlangan materiallarni ko‘rish uchun hisobingizga kiring.</p><button type="button" class="btn btn-primary btn-sm" data-acc-login>Kirish</button></div>`;
      return;
    }
    $("#acc-email").textContent = user.name ? `${user.name} · ${user.email}` : user.email;
    box.innerHTML = `<p class="acc-loading">Yuklanmoqda…</p>`;
    try {
      const { items } = await api("/api/account/items");
      box.innerHTML = items.length ? items.map((it) => `
        <article class="acc-item" data-id="${esc(it.id)}">
          <span class="acc-type">${esc(TYPE[it.type] || "Material")}</span>
          <h3>${esc(it.title)}</h3>
          <p>${esc(it.preview)}${it.preview.length >= 220 ? "…" : ""}</p>
          <div class="acc-actions"><time datetime="${esc(it.createdAt)}">${esc(new Date(it.createdAt).toLocaleDateString("uz-UZ"))}</time><button type="button" class="btn btn-ghost btn-sm" data-acc-open>Ochish</button><button type="button" class="btn btn-ghost btn-sm" data-acc-del>O‘chirish</button></div>
        </article>`).join("")
        : `<div class="acc-empty"><p>Hozircha saqlangan material yo‘q. Kazus ustaxonasida yoki AI suhbatda “Saqlash” tugmasini bosing.</p></div>`;
    } catch (err) {
      box.innerHTML = `<p class="acc-error">${esc(err.message)}</p>`;
      if (err.status === 401) { user = null; renderHeader(); }
    }
  }
  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-acc-login]")) { openAuth("login"); pending = renderAccount; return; }
    const item = e.target.closest(".acc-item");
    if (!item) return;
    const id = item.dataset.id;
    if (e.target.closest("[data-acc-del]")) {
      if (!confirm(T("Bu material o‘chirilsinmi?"))) return;
      try { await api("/api/account/items", { body: { op: "delete", id } }); item.remove(); toast("O‘chirildi."); }
      catch (err) { toast(err.message); }
    }
    if (e.target.closest("[data-acc-open]")) {
      try {
        const { item: full } = await api(`/api/account/items?id=${encodeURIComponent(id)}`);
        const v = $("#item-dialog");
        $("#item-title").textContent = full.title;
        $("#item-body").innerHTML = typeof md === "function" ? md(full.text) : `<pre>${esc(full.text)}</pre>`;
        v.dataset.text = full.text;
        v.showModal();
      } catch (err) { toast(err.message); }
    }
  });
  $("#item-copy")?.addEventListener("click", async () => {
    try { await navigator.clipboard.writeText($("#item-dialog").dataset.text || ""); toast("Nusxa olindi"); } catch { toast("Nusxa olinmadi"); }
  });

  $("#acc-logout")?.addEventListener("click", async () => {
    try { await api("/api/auth/logout", { body: {} }); } catch {}
    user = null; renderHeader(); renderAccount(); toast("Hisobdan chiqdingiz.");
  });
  $("#acc-password")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, out = $(".form-msg", f);
    try { await api("/api/auth/password", { body: { current: f.current.value, next: f.next.value } }); f.reset(); out.textContent = "Parol almashtirildi. Boshqa qurilmalardagi sessiyalar yopildi."; }
    catch (err) { out.textContent = err.message; }
  });
  $("#acc-delete")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, out = $(".form-msg", f);
    if (!confirm(T("Hisob va barcha saqlangan materiallar butunlay o‘chiriladi. Davom etasizmi?"))) return;
    try { await api("/api/auth/delete", { body: { password: f.password.value } }); f.reset(); user = null; renderHeader(); renderAccount(); toast("Hisob o‘chirildi."); }
    catch (err) { out.textContent = err.message; }
  });

  // ---------------- Saqlash tugmalari ----------------
  async function saveItem(get) {
    const run = async () => {
      const { type, title, text } = get();
      if (!text || text.trim().length < 20) return toast("Saqlash uchun avval natija oling.");
      try { const r = await api("/api/account/items", { body: { op: "add", type, title, text } }); toast(r.trimmed ? "Saqlandi. Eng eski material o‘chirildi." : "Hisobingizga saqlandi."); }
      catch (err) { if (err.status === 401) { user = null; renderHeader(); pending = run; openAuth("login", "Saqlash uchun hisobingizga kiring."); } else toast(err.message); }
    };
    if (!user) { pending = run; openAuth("login", "Saqlash uchun hisobingizga kiring yoki ro‘yxatdan o‘ting."); return; }
    run();
  }
  const kazusText = () => (typeof kazusAnswer === "string" && kazusAnswer) || $("#kazus-output")?.innerText || "";
  $("#kazus-save")?.addEventListener("click", () => saveItem(() => {
    const cond = ($("#kazus-text")?.value || "").trim().replace(/\s+/g, " ");
    return { type: "kazus", title: cond ? cond.slice(0, 90) + (cond.length > 90 ? "…" : "") : "Kazus tahlili", text: kazusText() };
  }));
  // Kazus natijasi tayyor bo'lganda (Nusxa olish tugmasi faollashganda) Saqlash ham faollashadi
  const kCopy = $("#kazus-copy"), kSave = $("#kazus-save");
  if (kCopy && kSave) {
    const sync = () => (kSave.disabled = kCopy.disabled);
    sync();
    new MutationObserver(sync).observe(kCopy, { attributes: true, attributeFilter: ["disabled"] });
  }
  $("#chat-save")?.addEventListener("click", () => saveItem(() => {
    const bubbles = [...document.querySelectorAll("#messages .bubble")];
    const text = bubbles.map((b) => `${b.classList.contains("user") ? "Savol" : "Javob"}:\n${b.innerText.trim()}`).join("\n\n").trim();
    const first = (bubbles.find((b) => b.classList.contains("user"))?.innerText || "").trim().replace(/\s+/g, " ");
    return { type: "chat", title: first.slice(0, 90) || "AI suhbat", text };
  }));

  // ---------------- Kichik xabar ----------------
  let toastTimer;
  function toast(text) {
    let t = $("#hk-toast");
    if (!t) { t = document.createElement("div"); t.id = "hk-toast"; t.className = "hk-toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = text; t.classList.add("on");
    clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove("on"), 3200);
  }

  // ---------------- Boshlash ----------------
  (async () => {
    try { user = (await api("/api/auth/me")).user; } catch { user = null; }
    renderHeader();
    if (location.hash === "#account") renderAccount();
  })();
  window.addEventListener("hashchange", () => { if (location.hash === "#account") renderAccount(); });
  document.addEventListener("click", (e) => { if (e.target.closest('[data-view="account"]')) setTimeout(renderAccount, 0); });
  globalThis.HK_ACCOUNT = { get user() { return user; }, openAuth };
})();

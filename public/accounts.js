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
  let mode = "login", resetToken = "";
  // Rejimlar: login, register, forgot (tiklash havolasini so'rash), reset (havoladan yangi parol)
  const TITLES = { login: "Hisobingizga kiring", register: "Ro‘yxatdan o‘tish", forgot: "Parolni tiklash", reset: "Yangi parol o‘rnating" };
  const SUBMIT = { login: "Kirish", register: "Hisob yaratish", forgot: "Tiklash havolasini yuborish", reset: "Parolni saqlash" };
  function setMode(m) {
    mode = m;
    dlg.querySelectorAll("[data-auth-tab]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.authTab === m)));
    dlg.querySelector(".auth-tabs").hidden = m === "forgot" || m === "reset";
    dlg.querySelectorAll(".reg-only").forEach((el) => (el.hidden = m !== "register"));
    dlg.querySelectorAll(".login-only").forEach((el) => (el.hidden = m !== "login"));
    dlg.querySelectorAll(".no-forgot").forEach((el) => (el.hidden = m === "forgot"));
    dlg.querySelectorAll(".no-reset").forEach((el) => (el.hidden = m === "reset"));
    $(".pw-label", dlg).textContent = m === "reset" ? "Yangi parol" : "Parol";
    $("#auth-title").textContent = TITLES[m];
    $("#auth-submit").textContent = SUBMIT[m];
    form.password.autocomplete = m === "login" ? "current-password" : "new-password";
    msg.textContent = "";
  }
  function openAuth(m = "login", reason = "") {
    setMode(m);
    const r = $("#auth-reason");
    r.hidden = !reason; r.textContent = reason;
    if (!dlg.open) dlg.showModal();
    (m === "reset" ? form.password : form.email).focus();
  }
  $("#auth-forgot")?.addEventListener("click", () => openAuth("forgot", "Hisobingiz emailini kiriting — tiklash havolasi yuboriladi."));
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
    if (mode === "forgot" || mode === "reset") {
      btn.disabled = true; msg.textContent = "";
      try {
        if (mode === "forgot") { const d = await api("/api/auth/reset-request", { body: { email: form.email.value.trim() } }); msg.textContent = d.message; }
        else {
          const d = await api("/api/auth/reset-confirm", { body: { token: resetToken, password: form.password.value } });
          resetToken = ""; user = d.user; renderHeader(); dlg.close(); toast("Parol yangilandi. Boshqa qurilmalardagi sessiyalar yopildi.");
        }
      } catch (err) { msg.textContent = err.message; } finally { btn.disabled = false; }
      return;
    }
    const body = { email: form.email.value.trim(), password: form.password.value };
    if (mode === "register") { body.name = form.name.value.trim(); body.acceptOferta = form.acceptOferta.checked; }
    if (mode === "register" && !body.acceptOferta) { msg.textContent = "Ommaviy oferta shartlarini qabul qiling."; return; }
    btn.disabled = true; msg.textContent = "";
    try {
      const data = await api(`/api/auth/${mode}`, { body });
      user = data.user; renderHeader(); dlg.close();
      toast(mode === "login" ? "Hisobingizga kirdingiz." : data.verification === "sent" ? "Hisob yaratildi. Emailingizga tasdiqlash xati yuborildi." : "Hisob yaratildi. Xush kelibsiz!");
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
      renderBooks();
      return;
    }
    $("#acc-email").textContent = user.name ? `${user.name} · ${user.email}` : user.email;
    const v = $("#acc-verify");
    if (v) {
      v.hidden = false;
      v.innerHTML = user.emailVerified ? `<span class="ok">Email tasdiqlangan</span>`
        : `<span>Email tasdiqlanmagan.</span> <button type="button" class="link-btn" data-acc-verify>Tasdiqlash xatini yuborish</button>`;
    }
    box.innerHTML = `<p class="acc-loading">Yuklanmoqda…</p>`;
    renderBooks();
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
  // ---------------- Kitob parchalari ----------------
  async function renderBooks() {
    const box = $("#acc-books"), form = $("#book-form");
    if (!box || !form) return;
    form.hidden = !user; box.innerHTML = "";
    if (!user) return;
    try {
      const { books, sources } = await api("/api/account/books");
      const tsul = sources.find((s) => s.id === "tsul");
      box.innerHTML = (books.length ? books.map((b) => `<article class="acc-item" data-book="${esc(b.id)}"><span class="acc-type">Kitob parchasi</span><h3>${esc(b.title)}</h3><p>${esc([b.author, b.year, b.edition].filter(Boolean).join(", "))}${b.pages ? ` · ${b.pages} ta sahifa belgisi` : ""} · ${esc(b.origin)}</p><div class="acc-actions"><button type="button" class="btn btn-ghost btn-sm" data-book-del>O‘chirish</button></div></article>`).join("")
        : `<div class="acc-empty"><p>Hozircha kitob parchasi yo‘q.</p></div>`)
        + (tsul ? `<p class="acc-sub">TSUL kutubxonasi: ${esc(tsul.message)}</p>` : "");
    } catch (err) { box.innerHTML = `<p class="acc-error">${esc(err.message)}</p>`; }
  }
  $("#book-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, out = $(".form-msg", f);
    if (!f.rights.checked) { out.textContent = "Foydalanishga haqli ekaningizni tasdiqlang."; return; }
    try {
      await api("/api/account/books", { body: { op: "add", title: f.title.value, author: f.author.value, year: f.year.value, edition: f.edition.value, origin: f.origin.value, firstPage: f.firstPage.value, text: f.text.value, rightsConfirmed: true } });
      f.reset(); out.textContent = "Parcha saqlandi."; renderBooks();
    } catch (err) { out.textContent = err.message; }
  });

  document.addEventListener("click", async (e) => {
    if (e.target.closest("[data-acc-login]")) { openAuth("login"); pending = renderAccount; return; }
    const bk = e.target.closest("[data-book]");
    if (bk && e.target.closest("[data-book-del]")) {
      if (!confirm(T("Bu parcha o‘chirilsinmi?"))) return;
      try { await api("/api/account/books", { body: { op: "delete", id: bk.dataset.book } }); bk.remove(); toast("O‘chirildi."); } catch (err) { toast(err.message); }
      return;
    }
    if (e.target.closest("[data-acc-verify]")) {
      try { const d = await api("/api/auth/verify-request", { body: {} }); toast(d.already ? "Email allaqachon tasdiqlangan." : d.message); }
      catch (err) { toast(err.message); }
      return;
    }
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
  // Emaildagi havolalar: #verify=TOKEN va #reset=TOKEN. Token darhol manzil satridan olib tashlanadi.
  async function handleLinkToken() {
    const m = location.hash.match(/^#(verify|reset)=([A-Za-z0-9_-]{20,100})$/);
    if (!m) return;
    history.replaceState(null, "", location.pathname + location.search);
    if (m[1] === "reset") { resetToken = m[2]; openAuth("reset", "Yangi parol kiriting. Havola bir marta ishlaydi."); return; }
    try { const d = await api("/api/auth/verify-confirm", { body: { token: m[2] } }); if (user) user = d.user; toast("Email tasdiqlandi."); }
    catch (err) { toast(err.message); }
  }
  (async () => {
    try { user = (await api("/api/auth/me")).user; } catch { user = null; }
    renderHeader();
    await handleLinkToken();
    if (location.hash === "#account") renderAccount();
  })();
  window.addEventListener("hashchange", () => { if (location.hash === "#account") renderAccount(); });
  document.addEventListener("click", (e) => { if (e.target.closest('[data-view="account"]')) setTimeout(renderAccount, 0); });
  globalThis.HK_ACCOUNT = { get user() { return user; }, openAuth };
})();

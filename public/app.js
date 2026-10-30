// O'ZBEKISTON HUQUQIY BAZASI VA HAYOTIY VAZIYATLAR
const SITUATIONS = HK_LEGAL.situations;

// SVG ICONS (CLEAN MINIMALIST OUTLINE)
function getSvgIcon(type) {
  const icons = {
    briefcase: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>`,
    cash: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>`,
    users: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
    car: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="9" rx="2"/><path d="M5 11l2-6h10l2 6"/><circle cx="7" cy="16" r="1.5"/><circle cx="17" cy="16" r="1.5"/></svg>`,
    doc: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
    cart: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>`,
    home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
    credit: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>`,
    building: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>`,
    school: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>`,
    shield: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
    lock: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`
  };
  return icons[type] || icons.doc;
}

// [qisqartma, nomi, tavsif, lex.uz hujjat ID] — ID'lar lex.uz da tekshirilgan (2026-10-29; FK 2-qism qo‘shildi).
const CODES = HK_LEGAL.codes;
const lexUrl = (id, title) => id ? `https://lex.uz/docs/${id}` : `https://lex.uz/search/all?searchtitle=${encodeURIComponent(title)}`;

const DOC_TEMPLATES = {
  ish_haqi: {
    title: "To'lanmagan ish haqini talab qilish arizasi",
    desc: "Mehnat kodeksining 253 va 333-moddalari asosida hisoblangan maosh va kompensatsiya talabi.",
    fields: [
      { id: "employer", label: "Ish beruvchi tashkilot nomi", placeholder: "«Falonchi MChJ» rahbari A.B.ga", type: "text" },
      { id: "applicant", label: "Sizning F.I.O.", placeholder: "Karimov Sherzod Aliyevich", type: "text" },
      { id: "position", label: "Lavozimingiz", placeholder: "Bosh buxgalter / Dasturchi / Haydovchi", type: "text" },
      { id: "amount", label: "Qarzdorlik summasi (so'm)", placeholder: "8 500 000", type: "text" },
      { id: "period", label: "Qaysi oylar uchun maosh", placeholder: "2026-yil avgust va sentyabr oylari uchun", type: "text" }
    ],
    generate: (data) => `
KIMGA: ${data.employer || "[Ish beruvchi korxona rahbari]"}
KIMDAN: ${data.applicant || "[Xodimning F.I.O.]"}
Lavozimi: ${data.position || "[Lavozim]"}
Aloqa telefoni: +998 (__) ___-__-__

                                ARIZA
                   (To'lanmagan ish haqini to'lash to'g'risida)

Men, ${data.applicant || "[F.I.O.]"}, ${data.employer || "[Tashkilot]"}da ${data.position || "[Lavozim]"} lavozimida mehnat faoliyatini yuritib kelmoqdaman.

O'zbekiston Respublikasi Mehnat kodeksining 253-moddasiga muvofiq, ish beruvchi xodimga belgilangan muddatlarda ish haqini to'liq to'lashi shart.
Biroq, bugungi kunga qadar menga ${data.period || "[Tegishli davr]"} uchun jami ${data.amount || "[Summa]"} so'm miqdoridagi ish haqi to'lab berilmadi.

Shuningdek, Mehnat kodeksining 333-moddasiga ko'ra, ish beruvchi ish haqini to'lashni kechiktirganlik uchun moddiy javobgar bo'ladi.

Yuqoridagilardan kelib chiqib, SIZDAN:
1. Menga tegishli bo'lgan ${data.amount || "[Summa]"} so'm miqdoridagi ish haqini to'liq to'lab berishingizni;
2. Kechiktirilgan har bir kun uchun qonunda belgilangan foiz (kompensatsiya) miqdorini hisoblab to'lashingizni so'rayman.

Talabim bajarilmagan taqdirda, vakolatli organ yoki sudga tegishli protsessual tartibda murojaat qilish huquqimdan foydalanaman.

Imzo: _______________ (${data.applicant || "Xodim"})
Sana: ${localDate()}
`
  },

  istemol_da_vo: {
    title: "Sifatsiz tovar uchun pulni qaytarish talabnomasi (Pretenziya)",
    desc: "Iste'molchilar huquqlarini himoya qilish to'g'risidagi qonunning 13–14-moddalari asosida.",
    fields: [
      { id: "store", label: "Do'kon yoki sotuvchi nomi", placeholder: "«TexnoMart» do'koni ma'muriyatiga", type: "text" },
      { id: "buyer", label: "Iste'molchi F.I.O.", placeholder: "Rustamov Jasur Anvarovich", type: "text" },
      { id: "product", label: "Tovarning nomi va modeli", placeholder: "Samsung Galaxy smartfoni", type: "text" },
      { id: "buy_date", label: "Xarid qilingan sana", placeholder: "12.10.2026", type: "text" },
      { id: "defect", label: "Tovardagi nosozlik / kamchilik", placeholder: "Ekran to'satdan o'chib qolmoqda, zaryad olmayapti", type: "text" },
      { id: "price", label: "To'langan summa (so'm)", placeholder: "3 800 000", type: "text" }
    ],
    generate: (data) => `
KIMGA: ${data.store || "[Do'kon / Sotuvchi nomi]"}
ISTE'MOLCHI: ${data.buyer || "[Xaridorning F.I.O.]"}
Telefon raqam: +998 (__) ___-__-__

                        TALABNOMA (PRETENZIYA)
             (Sifatsiz tovar uchun to'langan pulni qaytarish haqida)

Men, ${data.buyer || "[Xaridor]"}, ${data.buy_date || "[Sana]"} kuni Sizning savdo do'koningizdan ${data.price || "[Summa]"} so'm evaziga ${data.product || "[Tovar nomi]"} tovarini xarid qilgan edim.

Tovardan foydalanish jarayonida quyidagi jiddiy nuqsonlar aniqlandi:
${data.defect || "[Nosozlik tafsiloti]"}.

O'zbekiston Respublikasi «Iste'molchilarning huquqlarini himoya qilish to'g'risida»gi Qonunining 13-moddasiga binoan, nuqsonli tovar sotilgan iste'molchi shartnomani bekor qilib, to'langan pulni qaytarishni va zararni qoplashni talab qilishga haqli.
Talabimni qonunda nazarda tutilgan tartibda ko‘rib chiqib, qabul qilingan qaror va uning asoslarini menga yozma ravishda yuborishingizni so‘rayman.

Yuqoridagilardan kelib chiqib:
1. Sifat talablariga javob bermaydigan ${data.product || "[Tovar]"}ni qabul qilib olishingizni;
2. Mazkur tovar uchun to'langan ${data.price || "[Summa]"} so'm pul mablag'ini menga to'liq qaytarishingizni talab qilaman.

Imzo: _______________ (${data.buyer || "Iste'molchi"})
Sana: ${localDate()}
`
  },

  ijara_shartnoma: {
    title: "Turar joy ijara shartnomasi (Namuna)",
    desc: "Fuqarolik kodeksining 600-moddasi (uy-joyni ijaraga berish shartnomasi) asosidagi namuna. ijara.soliq.uz da ro'yxatdan o'tkazish kerak.",
    fields: [
      { id: "city", label: "Shartnoma tuzilgan joy", placeholder: "Toshkent shahri", type: "text" },
      { id: "landlord", label: "Uy egasi F.I.O. (Ijaraga beruvchi)", placeholder: "Sobirov Otabek Akramovich", type: "text" },
      { id: "tenant", label: "Ijaraga oluvchi F.I.O.", placeholder: "Nazarov Bekzod Ikromovich", type: "text" },
      { id: "address", label: "Ijara xonadonining manzili", placeholder: "Toshkent shahri, Chilonzor tumani, 9-mavze", type: "text" },
      { id: "rent", label: "Oylik ijara narxi (so'm)", placeholder: "4 000 000", type: "text" },
      { id: "deposit", label: "Garov (Depozit) summasi (so'm)", placeholder: "2 000 000", type: "text" },
      { id: "term", label: "Ijara muddati", placeholder: "2026-yil 1-dekabrdan 2027-yil 30-noyabrgacha (12 oy)", type: "text" },
      { id: "pay_day", label: "Har oy to'lov sanasi", placeholder: "har oyning 5-sanasigacha", type: "text" }
    ],
    generate: (data) => `
                 TURAR JOYNI IJARAGA BERISH SHARTNOMASI

${data.city || "[Shahar/tuman]"}                                  ${localDate()}

Bir tomondan fuqaro ${data.landlord || "[Uy egasining F.I.O.]"} (keyingi o'rinlarda «Ijaraga beruvchi»), ikkinchi tomondan fuqaro ${data.tenant || "[Ijaraga oluvchining F.I.O.]"} (keyingi o'rinlarda «Ijarachi») quyidagilar haqida mazkur shartnomani tuzdilar:

1. SHARTNOMA PREDMETI
1.1. Ijaraga beruvchi o'ziga mulk huquqi asosida tegishli bo'lgan quyidagi manzildagi turar joyni vaqtincha yashash uchun topshiradi:
Manzil: ${data.address || "[Xonadon manzili]"}.

2. TO'LOVLAR VA HISOB-KITOBLAR
2.1. Mazkur shartnoma bo'yicha oylik ijara haqi ${data.rent || "[Oylik ijara summasi]"} so'mni tashkil etadi.
2.2. Ijara haqi ${data.pay_day || "[har oyning __-sanasigacha]"} bank o'tkazmasi orqali to'lanadi; to'lov izohida qaysi oy uchun ekani ko'rsatiladi.
2.3. Ijarachi tomonidan garov (depozit) sifatida ${data.deposit || "[Depozit summasi]"} so'm to'landi. Ushbu summa shartnoma tugagach, xonadon topshirish dalolatnomasi bo'yicha qabul qilib olingandan so'ng, ziyon yetkazilmagan taqdirda to'liq qaytariladi.
2.4. Kommunal xizmatlar (elektr, gaz, suv, chiqindi) uchun to'lovni ${"[Ijarachi / Ijaraga beruvchi]"} amalga oshiradi.

3. SHARTNOMA MUDDATI
3.1. Shartnoma ${data.term || "[boshlanish va tugash sanasi]"} muddatga tuziladi.
3.2. Shartnoma ijara.soliq.uz orqali soliq organlarida hisobga qo'yiladi.

4. TOMONLARNING MAJBURIYATLARI
4.1. Ijaraga beruvchi xonadonni yashash uchun yaroqli holatda, topshirish dalolatnomasi bilan topshiradi.
4.2. Ijarachi xonadondan maqsadiga ko'ra foydalanadi, uni ehtiyot qiladi va ijara haqini o'z vaqtida to'laydi.
4.3. Ijarachi Ijaraga beruvchining yozma roziligisiz xonadonni boshqa shaxsga ijaraga bermaydi va qayta jihozlamaydi.

5. SHARTNOMANI BEKOR QILISH
5.1. Shartnoma taraflar kelishuvi bilan yoki Fuqarolik kodeksida nazarda tutilgan asoslarda bekor qilinadi.
5.2. Muddatidan oldin bekor qilmoqchi bo'lgan taraf ikkinchi tarafni kamida [__] kun oldin yozma ogohlantiradi.
5.3. Nizolar muzokara yo'li bilan, kelishilmasa sud tartibida hal qilinadi.

TOMONLARNING IMZOLARI:
IJARAGA BERUVCHI: _______________ (${data.landlord || "Uy egasi"})
IJARACHI:         _______________ (${data.tenant || "Ijarachi"})
`
  },

  mehnat_boshash: {
    title: "O'z xohishi bilan ishdan bo'shash to'g'risida ariza",
    desc: "Mehnat kodeksining 160-moddasiga muvofiq (xodimning tashabbusi bilan) mehnat shartnomasini bekor qilish.",
    fields: [
      { id: "director", label: "Tashkilot rahbari lavozimi va F.I.O.", placeholder: "«Korxona nomi» Bosh direktoriga", type: "text" },
      { id: "employee", label: "Xodimning F.I.O.", placeholder: "Sodiqov Dilshod Farxodovich", type: "text" },
      { id: "dept", label: "Bo'lim va lavozimingiz", placeholder: "Moliya bo'limi mutaxassisi", type: "text" },
      { id: "last_day", label: "Oxirgi ish kuningiz", placeholder: "2026-yil 15-noyabr", type: "text" }
    ],
    generate: (data) => `
KIMGA: ${data.director || "[Tashkilot rahbari lavozimi va F.I.O.]"}
KIMDAN: ${data.dept || "[Bo'lim va lavozim]"}
        ${data.employee || "[Xodimning F.I.O.]"}

                                ARIZA
        (Mehnat shartnomasini xodimning tashabbusiga ko'ra bekor qilish haqida)

O'zbekiston Respublikasi Mehnat kodeksining 160-moddasiga muvofiq, men bilan tuzilgan mehnat shartnomasini o'z xohishimga ko'ra ${data.last_day || "[Oxirgi ish kuni]"} kunidan boshlab bekor qilishingizni so'rayman.

Imzo: _______________ (${data.employee || "Xodim"})
Sana: ${localDate()}
`
  }
};

Object.assign(DOC_TEMPLATES, HKExtraTemplates);

function localDate() {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Tashkent', year:'numeric', month:'2-digit', day:'2-digit'}).format(new Date());
}
const $ = (s) => document.querySelector(s);
let mode = "citizen";
let history = [];
let busy = false;
let currentDoc = "nikoh_ajrashish";
const docDrafts = {};
let chatController = null;

// VIEW SWITCHER
function show(view, track=true) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const target = $("#view-" + view);
  if (target) target.classList.add("active");
  document.body.classList.toggle("chat-open", view === "chat");
  window.scrollTo(0, 0);
  if(track) window.history.replaceState(null,"", "#"+view);
}

document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-view]");
  if (!a) return;
  e.preventDefault();
  show(a.dataset.view);
  if (a.dataset.scroll) {
    const el = document.getElementById(a.dataset.scroll);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  }
});

// RENDER SITUATIONS WITH CLEAN ICONS
// O'zbek apostroflarining barcha shakllarini (' ‘ ’ ʻ ʼ `) bittaga keltiradi.
function norm(value) { return HKCore.norm(value); }

function renderSituations(filter = "") {
  const f = norm(filter);
  const list = SITUATIONS.filter(s => norm(`${s.title} ${s.desc} ${s.tag}`).includes(f));
  
  if (list.length === 0) {
    $("#situations").innerHTML = `<p class="empty-note">Bunday vaziyat topilmadi. Yuqoridagi aqlli qidiruvga vaziyatingizni yozib ko'ring.</p>`;
    return;
  }

  $("#situations").innerHTML = list.map((s) => `
    <button type="button" class="sit-card" data-sit="${s.id}">
      <span class="sit-icon-wrap" aria-hidden="true">${getSvgIcon(s.icon)}</span>
      <span class="sit-body">
        <span class="sit-tag">${escapeHtml(s.tag)}</span>
        <span class="sit-title">${escapeHtml(s.title)}</span>
        <span class="sit-desc">${escapeHtml(s.desc)}</span>
      </span>
      <span class="sit-arrow" aria-hidden="true">→</span>
    </button>
  `).join("");
}

// SEARCH FILTER EVENT
$("#sit-search").addEventListener("input", (e) => {
  renderSituations(e.target.value.trim());
});

// RENDER CODES
$("#codes").innerHTML = CODES.map(([n, t, d, id]) => `
  <article class="code-card">
    <div class="code-info">
      <h3>${escapeHtml(t)}</h3>
      <p>${escapeHtml(d)}</p>
    </div>
    <div class="code-links">
      <a href="${lexUrl(id, t)}" target="_blank" rel="noopener">Rasmiy matn <span aria-hidden="true">↗</span></a>
      <button type="button" data-explain="${id}">Sodda tilda tushuntirish</button>
    </div>
  </article>
`).join("");

// SITUATION DETAIL VIEW
function openSituation(id) {
  const s = SITUATIONS.find((x) => x.id === id);
  if (!s) return;
  $("#situation-detail").innerHTML = `
    <div class="detail-header">
      <div class="sit-icon-wrap lg">${getSvgIcon(s.icon)}</div>
      <h1>${s.title}</h1>
    </div>
    <p class="detail-intro">${s.intro}</p>
    <div class="verify-note">⚠️ Bu umumiy ma'lumot, yurist tomonidan tasdiqlanmagan. Modda raqamlari, muddatlar, summalar va telefon raqamlarini <a href="https://lex.uz" target="_blank" rel="noopener">lex.uz</a> dagi amaldagi tahrir bilan tekshiring.</div>
    <ul class="steps-list">${s.steps.map(([b, t]) => `<li><b>${b}</b><p>${t}</p></li>`).join("")}</ul>
    <p class="share-line"><a class="link-arrow" href="/vaziyat/${encodeURIComponent(s.slug||s.id)}/">Alohida sahifada ochish (ulashish uchun) ↗</a></p>
    <div class="laws-card">${(s.sourceUrls||[]).map(u=>`<a href="${u}" target="_blank" rel="noopener">Rasmiy manba ↗</a>`).join(" · ")}
      <h4>Asosiy qonunchilik hujjatlari:</h4>
      <ul>${s.laws.map((l) => `<li>${l}</li>`).join("")}</ul>
    </div>
    <div class="ask-banner">
      <h3>AI huquqshunosdan qo'shimcha so'rang</h3>
      <div class="chips left">${s.qs.map((q) => `<button type="button" data-ask="${escapeHtml(q)}">${escapeHtml(q)}</button>`).join("")}</div>
    </div>`;
  show("situation");
}

$("#situations").addEventListener("click", (e) => {
  const c = e.target.closest("[data-sit]");
  if (c) openSituation(c.dataset.sit);
});

// DOCUMENT GENERATOR
function renderDocForm(docKey) {
 if (!DOC_TEMPLATES[docKey]) return;
 if (document.querySelector('#doc-form input, #doc-form select, #doc-form textarea')) docDrafts[currentDoc] = getFormData();
 currentDoc=docKey; const doc=DOC_TEMPLATES[docKey], form=$('#doc-form');
 form.innerHTML=doc.fields.map(f=>{
 const attrs=`id="field_${f.id}" name="${f.id}"`;
 const input=f.type==='select'?`<select ${attrs}>${f.options.map(([v,t])=>`<option value="${escapeHtml(v)}">${escapeHtml(t)}</option>`).join('')}</select>`:
 f.type==='textarea'?`<textarea ${attrs} rows="3" maxlength="5000" placeholder="${escapeHtml(f.placeholder||'')}"></textarea>`:
 `<input ${attrs} type="${f.type||'text'}" maxlength="500" placeholder="${escapeHtml(f.placeholder||'')}" autocomplete="off" />`;
 return `<div class="form-group"><label for="field_${f.id}">${escapeHtml(f.label)}</label>${input}</div>`;
 }).join('');
 const saved=docDrafts[docKey]||{};
 form.querySelectorAll('input,select,textarea').forEach(el=>{if(saved[el.name]!==undefined)el.value=saved[el.name];el.addEventListener('input',updateDocPreview);el.addEventListener('change',updateDocPreview);});
 document.querySelectorAll('.doc-tab-btn').forEach(t=>t.classList.toggle('active',t.dataset.doc===docKey));
 $('#doc-title').textContent=doc.title;
 $('#doc-guidance').innerHTML=`<p>${escapeHtml(doc.note||'Bu boshlang‘ich namuna. Holat, rekvizitlar va ilovalarni to‘liq tekshiring.')}</p>${(doc.sources||[]).map((u,i)=>`<a href="${u}" target="_blank" rel="noopener">Qonuniy asos ${i+1} ↗</a>`).join(' · ')}`;
 updateDocPreview();
}

function getFormData() {
  const form = $("#doc-form");
  const data = {};
  new FormData(form).forEach((value, key) => { data[key] = value.trim(); });
  return data;
}

function updateDocPreview() {
  const doc = DOC_TEMPLATES[currentDoc];
  if (!doc) return;
  const data = getFormData();
  const blocked=doc.block?.(data);
  const text = blocked || doc.generate(data);
  ["#btn-copy-doc","#btn-download-doc","#btn-print-doc"].forEach(id=>$(id).disabled=!!blocked);
  $("#doc-paper").classList.toggle('blocked',!!blocked);
  $("#doc-paper").textContent = text;
  const note = $("#doc-desc");
  if (note) note.textContent = doc.desc;
}

$("#doc-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".doc-tab-btn");
  if (tab) renderDocForm(tab.dataset.doc);
});

$("#btn-copy-doc").addEventListener("click", () => {
  const text = $("#doc-paper").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $("#btn-copy-doc");
    btn.textContent = "Nusxa olindi";
    setTimeout(() => { btn.textContent = "Nusxa olish"; }, 2000);
  }).catch(() => alertCopyFail());
});

function alertCopyFail() {
  const btn = $("#btn-copy-doc");
  btn.textContent = "Nusxa olinmadi";
  setTimeout(() => { btn.textContent = "Nusxa olish"; }, 2000);
}

$("#btn-download-doc").addEventListener("click", () => {
  const text = $("#doc-paper").textContent;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentDoc}_ariza.txt`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
});

// Faqat hujjat matnini chop etish (butun sahifani emas)
$("#btn-print-doc").addEventListener("click", () => {
  const text = $("#doc-paper").textContent;
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
  document.body.append(frame);
  const d = frame.contentDocument;
  d.open();
  d.write(`<!doctype html><html lang="uz"><head><meta charset="utf-8"><title>${escapeHtml(DOC_TEMPLATES[currentDoc]?.title || "Hujjat")}</title>
<style>@page{margin:18mm}body{margin:0;font:12pt/1.5 "Times New Roman",serif;color:#000}pre{white-space:pre-wrap;font:inherit;margin:0}</style>
</head><body><pre>${escapeHtml(text)}</pre></body></html>`);
  d.close();
  frame.contentWindow.focus();
  frame.contentWindow.print();
  setTimeout(() => frame.remove(), 1000);
});

// CLICKS & CHIPS
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ask]");
  if (b) ask(b.dataset.ask);
  const m = e.target.closest("[data-mode-start]");
  if (m) { setMode(m.dataset.modeStart); show("chat"); }
});

$("#hero-chips").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
$("#hero-ask").addEventListener("submit", (e) => { e.preventDefault(); if(busy) return; const v = $("#hero-input").value.trim(); if (v) { $("#hero-input").value = ""; ask(v); } });

function setMode(m) {
  mode = m;
  document.querySelectorAll("#mode-toggle button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  $("#mode-note").textContent = m === "student" ? "Chuqur huquqiy tahlil: normaning tuzilishi, dispozitsiya va sud amaliyoti." : "Sodda tilda, amaliy qadamlar bilan javob.";
}
$("#mode-toggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setMode(b.dataset.mode); });

// SETTINGS MODAL
// API kaliti brauzerda saqlanmaydi. U faqat serverdagi GEMINI_API_KEY muhit o'zgaruvchisida bo'lishi kerak.
const modalSettings = $("#modal-settings");

function refreshApiStatus() {
  $("#api-model-name").textContent = "Server orqali";
}

$("#btn-config-api").addEventListener("click", () => { modalSettings.classList.remove("hidden"); $('#btn-close-settings').focus(); });
function closeSettings(){modalSettings.classList.add('hidden');$('#btn-config-api').focus();}
document.addEventListener('keydown', e=>{if(modalSettings.classList.contains('hidden'))return;if(e.key==='Escape')closeSettings();if(e.key==='Tab'){const controls=[...modalSettings.querySelectorAll('button,a[href],input,select,textarea,[tabindex="0"]')];const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
modalSettings.addEventListener("click", (e) => {
  if (e.target === modalSettings) closeSettings();
});
$("#btn-close-settings")?.addEventListener("click", closeSettings);

// NEW CHAT
$("#new-chat").addEventListener("click", () => {
  if (busy) return;
  history = [];
  $("#messages").innerHTML = "";
  $("#messages").append(emptyEl);
});
const emptyEl = $("#chat-empty");

// MARKDOWN PARSER
function esc(s) { return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])); }
function md(src) {
  const lines = esc(src).split("\n");
  let out = "", list = null;
  const inline = (t) => t
    // [matn](https://...) — faqat http/https havolalar (matn allaqachon ekranlangan)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    .replace(/\*\*(.+?)\*\*/g, "<b>$1</b>")
    .replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, "$1<i>$2</i>");
  const close = () => { if (list) { out += `</${list}>`; list = null; } };
  for (const l of lines) {
    let m;
    if ((m = l.match(/^#{1,6}\s+(.*)/))) { close(); out += `<h3>${inline(m[1])}</h3>`; }
    else if ((m = l.match(/^\s*[-*]\s+(.*)/))) { if (list !== "ul") { close(); out += "<ul>"; list = "ul"; } out += `<li>${inline(m[1])}</li>`; }
    else if ((m = l.match(/^\s*\d+[.)]\s+(.*)/))) { if (list !== "ol") { close(); out += "<ol>"; list = "ol"; } out += `<li>${inline(m[1])}</li>`; }
    else if (l.trim() === "") close();
    else { close(); out += `<p>${inline(l)}</p>`; }
  }
  close();
  return out;
}

function addMsg(role, text) {
  emptyEl.remove();
  const d = document.createElement("div");
  d.className = "bubble " + role;
  if (role === "user") d.textContent = text; else d.innerHTML = md(text);
  $("#messages").append(d);
  $("#messages").scrollTop = $("#messages").scrollHeight;
  return d;
}

// Backend 20 tadan ko'p xabar qabul qilmaydi: oxirgi xabarlarni yuboramiz (birinchisi user bo'lishi shart).
const MAX_HISTORY = 20;
const MAX_INPUT_CHARS = 4000;
const MAX_TOTAL_CHARS = 28000;
function historyForRequest() {
  let list = history.slice(-MAX_HISTORY).map(m=>({...m,content:m.content.length>7500?m.content.slice(0,7400)+'\n[Oldingi javob konteksti qisqartirildi]':m.content}));
  while (list.length && (list[0].role !== "user" ||
         list.reduce((n, m) => n + m.content.length, 0) > MAX_TOTAL_CHARS)) {
    list = list.slice(1);
  }
  return list;
}

// ASK FUNCTION — barcha AI so'rovlari server backend orqali yuboriladi.
async function ask(text) {
  if (busy) return;
  show("chat");
  text = String(text || "").trim().slice(0, MAX_INPUT_CHARS);
  if (busy || !text) return;
  busy = true;
  chatController=new AbortController();
  const timer=setTimeout(()=>chatController?.abort(),65000);
  $('#chat-stop').hidden=false;
  $("#send-btn").disabled = true;
  history.push({ role: "user", content: text });
  addMsg("user", text);
  const bubble = addMsg("assistant", "");
  bubble.textContent = "Javob tayyorlanmoqda...";
  let answer = "";

  try {
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: historyForRequest(), mode }), signal: chatController.signal
    });

    if (!res.ok || !res.body) {
      let detail = "";
      try {
        const data = await res.json();
        detail = data.error || "";
      } catch {}
      throw new Error(detail || `AI server xatosi (${res.status})`);
    }

    const reader = res.body.getReader();
    const dec = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      answer += dec.decode(value, { stream: true });
      bubble.innerHTML = md(answer);
      $("#messages").scrollTop = $("#messages").scrollHeight;
    }
    answer += dec.decode();
    if (!answer.trim()) throw new Error("AI bo'sh javob qaytardi.");
    bubble.innerHTML = md(answer);
    history.push({ role: "assistant", content: answer });
  } catch (err) {
    const safeMessage = err?.name==='AbortError'?'So‘rov to‘xtatildi yoki kutish vaqti tugadi.':(err instanceof Error ? err.message : "Noma'lum xatolik");
    bubble.innerHTML = md(
      (answer?answer+"\n\n":"")+"⚠️ **AI javobini olishda xatolik yuz berdi.**\n\n" +
      safeMessage +
      "\n\nBirozdan keyin qayta urinib ko'ring. " +
      "Huquqiy normaning amaldagi tahririni [Lex.uz](https://lex.uz) orqali tekshiring."
    );
    history.pop();
  } finally {
    clearTimeout(timer);chatController=null;$('#chat-stop').hidden=true;
    busy = false;
    $("#send-btn").disabled = false;
  }
}

$("#composer").addEventListener("submit", (e) => {
  e.preventDefault();
  if(busy) return;
  const v = $("#chat-input").value.trim();
  $("#chat-input").value = "";
  ask(v);
});
$("#chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit(); }
});

$('#doc-form').addEventListener('submit', e=>e.preventDefault());
// INITIALIZE
renderSituations();
const preferred=['nikoh_ajrashish','aliment_sud','jarima_shikoyat','firibgarlik','ish_haqi','istemol_da_vo','ijara_shartnoma','mehnat_boshash'];
$('#doc-tabs').innerHTML=preferred.map((key,i)=>`<button type="button" class="doc-tab-btn" data-doc="${key}"><span class="tab-num">${String(i+1).padStart(2,'0')}</span>${escapeHtml(DOC_TEMPLATES[key].short||DOC_TEMPLATES[key].title)}</button>`).join('');
renderDocForm('nikoh_ajrashish');
refreshApiStatus();


function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]);
}

$('#chat-stop').addEventListener('click',()=>chatController?.abort());
function routeHash(){const key=location.hash.slice(1);if(['chat','kazus','explain'].includes(key))show(key,false);else {show('home',false);if(key)document.getElementById(key)?.scrollIntoView();}}
window.addEventListener('hashchange',routeHash);routeHash();

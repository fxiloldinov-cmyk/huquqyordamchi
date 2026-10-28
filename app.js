// O'ZBEKISTON HUQUQIY BAZASI VA HAYOTIY VAZIYATLAR
const SITUATIONS = [
  { 
    id: "ish", icon: "briefcase", title: "Ishdan noqonuniy bo'shatish", desc: "Asossiz bo'shatish, hisob-kitob va kompensatsiya olish", tag: "Mehnat kodeksi",
    intro: "Ish beruvchi xodimni faqat Mehnat kodeksida aniq belgilangan asoslar bo'yicha va qat'iy tartibda ishdan bo'shatishga haqli. Noqonuniy bo'shatilgan taqdirda ishga tiklanish va majburiy bekor yurilgan vaqt uchun ish haqi undirish mumkin.",
    steps: [
      ["Buyruq nusxasini oling", "Ishdan bo'shatish haqidagi buyruq va uning asosini yozma ravishda talab qilib oling."],
      ["Yakuniy hisob-kitobni tekshiring", "Oxirgi ish kuni barcha ish haqi, foydalanilmagan mehnat ta'tillari uchun kompensatsiya to'liq berilishi shart."],
      ["Davlat mehnat inspeksiyasiga yozing", "Yashash yoki ish joyingizdagi Kambag'allikni qisqartirish va bandlik vazirligi huzuridagi Mehnat inspeksiyasiga shikoyat qiling."],
      ["Sudga da'vo bilan chiqing", "Ishga tiklash to'g'risidagi da'volar bo'yicha fuqarolik sudiga buyruq chiqqan kundan boshlab 1 oy ichida murojaat qilinadi. Sudda xodim davlat bojidan ozod qilingan."]
    ],
    laws: ["O'zbekiston Respublikasining yangi Mehnat kodeksi (161, 171, 172, 400-moddalar)", "O'zbekiston Respublikasi Fuqarolik protsessual kodeksi"],
    qs: ["Meni ogohlantirishsiz ishdan bo'shatishdi, bu qonuniymi?", "Bo'shatilganda ish beruvchi qanday to'lovlarni to'lashi shart?", "Ishga tiklash uchun sudga qanday ariza yoziladi?"]
  },
  { 
    id: "ish_haqi", icon: "cash", title: "Maosh va ta'til puli kechikishi", desc: "Kechiktirilgan ish haqi, jarimalar va foizli kompensatsiya", tag: "Mehnat kodeksi",
    intro: "Mehnat kodeksining 253 va 333-moddalariga ko'ra, ish haqi har yarim oyda kamida bir marta to'lanishi lozim. Har bir kechiktirilgan kun uchun ish beruvchi Markaziy bank qayta moliyalash stavkasi miqdorida foiz (kompensatsiya) to'lashga majbur.",
    steps: [
      ["Ish beruvchiga yozma ariza bering", "Maosh kechikkani haqida yozma ariza yozing va nusxasini o'zingizda muhr bilan saqlang."],
      ["Mehnat inspeksiyasi va prokuraturaga murojaat", "Darmon topilmasa, Mehnat inspeksiyasi yoki '1142' ishonch telefoniga xabar bering."],
      ["Sud buyrug'i oling", "Hisoblangan, ammo to'lanmagan ish haqi bo'yicha fuqarolik sudiga 'sud buyrug'i' chiqarish uchun ariza bering (oddiy da'vodan ancha tez hal bo'ladi)."]
    ],
    laws: ["Mehnat kodeksi 253, 333-moddalar", "Fuqarolik protsessual kodeksi 238-2-modda"],
    qs: ["Maosh 2 oy kechiksa qayerga shikoyat qilaman?", "Ish beruvchidan kechiktirilgan foizni qanday talab qilsa bo'ladi?"]
  },
  { 
    id: "oila", icon: "users", title: "Ajrashish va aliment", desc: "Nikohdan ajralish tartibi, bolalar taqdiri va aliment miqdori", tag: "Oila kodeksi",
    intro: "Oila kodeksiga asosan aliment miqdori: 1 bola uchun daromadning 1/4 qismi, 2 bola uchun 1/3 qismi, 3 va undan ko'p bola uchun 1/2 qismini tashkil qiladi. Har bir bola uchun eng kam miqdor mehnatga haq to'lash eng kam miqdorining 26.5% idan kam bo'lmasligi shart.",
    steps: [
      ["FHDYo yoki sudga ariza", "Voyaga yetmagan bolalar yoki mulkiy nizo bo'lsa — Fuqarolik ishlari bo'yicha sud orqali, o'zaro rozilik bo'lsa — FHDYo orqali ajralinadi."],
      ["Aliment undirish arizasi", "Alimentni ajrashish jarayonida yoki undan mustaqil ravishda darhol sud buyrug'i tartibida undirish mumkin."],
      ["MIB orqali ijro", "Sud qarori chiqqach, ijro varaqasi Majburiy ijro byurosiga (MIB) topshiriladi va to'lov nazoratga olinadi."]
    ],
    laws: ["O'zbekiston Respublikasi Oila kodeksi (96, 99, 105-moddalar)", "Sud hujjatlari va boshqa organlar hujjatlarini ijro etish to'g'risida Qonun"],
    qs: ["Aliment qanday hisoblanadi va eng kam miqdori qancha?", "Turmush o'rtog'im aliment to'lamasa qanday jazo bor?", "Ajrashganda uy va mol-mulk qanday bo'linadi?"]
  },
  { 
    id: "jarima", icon: "car", title: "YHXBB ma'muriy jarimalari", desc: "Radar, kamera va nohaq jarimaga shikoyat qilish", tag: "Ma'muriy javobgarlik",
    intro: "Ma'muriy javobgarlik to'g'risidagi kodeksning 17-1-moddasiga binoan, foto va video qayd etish vositalari orqali qayd etilgan qoidabuzarliklar bo'yicha qaror ustidan 10 kun ichida yuqori turuvchi organga yoki sudga shikoyat qilish mumkin.",
    steps: [
      ["Qaror va fotosuratni tekshiring", "My.gov.uz yoki YHXBB ilovasi orqali fotosurat va vaqtni aniq tekshirib oling."],
      ["10 kunlik muddatni o'tkazmang", "Qaror nusxasi olingan kundan boshlab 10 kun ichida shikoyat berish muddati bor."],
      ["Shikoyatni elektron yoki yozma yuboring", "YHXBBga yoki ma'muriy sudga shikoyat bering. 50% lik chegirma muddatini ham inobatga oling (agar haqiqatda qoidabuzarlik bo'lsa, 15 kun ichida to'lasangiz 50% chegirma beriladi)."]
    ],
    laws: ["Ma'muriy javobgarlik to'g'risidagi kodeks (17-1, 314, 315, 332-moddalar)"],
    qs: ["Radar jarimasiga qanday e'tiroz bildirsa bo'ladi?", "Jarimalarni 50 foiz chegirma bilan to'lash tartibi qanday?", "Mening mashinam emas, boshqa odam haydagan bo'lsa nima qilaman?"]
  },
  { 
    id: "meros", icon: "doc", title: "Meros va vasiyatnoma", desc: "Meros qabul qilish, 6 oylik muddat va qonuniy navbat", tag: "Fuqarolik kodeksi",
    intro: "Meros fuqaro vafot etgan kundan ochiladi. Merosni qabul qilish muddati — meros ochilgan kundan e'tiboran 6 oy. Agar ushbu muddat o'tkazib yuborilsa, uni faqat sud orqali tiklashga to'g'ri keladi.",
    steps: [
      ["Notariusga ariza bering", "Meros qoldiruvchi oxirgi yashagan joydagi notarial idoraga murojaat qiling."],
      ["6 oylik muddatga qat'iy e'tibor bering", "Aynan 6 oy ichida merosni qabul qilish haqida ariza berish shart."],
      ["Qarindoshlik va mulk hujjatlarini taqdim eting", "FHDYo guvohnomalari va marhumning mulkiga tegishli kadastr, texpasport kabilar yig'iladi."],
      ["Meros guvohnomasini oling", "6 oy o'tgach, notarius rasmiy 'Merosga bo'lgan huquq to'g'risida guvohnoma' beradi."]
    ],
    laws: ["O'zbekiston Respublikasi Fuqarolik kodeksi (Meros huquqi, 1112-1157-moddalar)", "Notariat to'g'risida Qonun"],
    qs: ["Meros olish uchun 6 oylik muddat o'tib ketsa nima bo'ladi?", "Vasiyatnoma bo'lmasa qonun bo'yicha kimlar birinchi navbatda merosxo'r hisoblanadi?", "Merosdan voz kechish mumkinmi?"]
  },
  { 
    id: "istemol", icon: "cart", title: "Sifatsiz tovar va xizmat", desc: "Tovarni qaytarish, almashtirish va pulni qaytarib olish", tag: "Iste'molchilar huquqlari",
    intro: "Iste'molchi maqbul sifatdagi nooziq-ovqat tovarini sotib olgan kundan boshlab 10 kun ichida qaytarishga yoki almashtirishga haqli. Sifatsiz (brak) tovar aniqlansa, kafolat muddati ichida pulni to'liq qaytarish yoki bepul ta'mirlab berish talab qilinishi mumkin.",
    steps: [
      ["Chek yoki to'lov tasdig'ini oling", "Kvitansiya, bank ilovasi kvitansiyasi yoki guvohlar dalil bo'ladi."],
      ["Sotuvchiga yozma da'vo (pretenziya) bering", "Talabingizni 2 nusxada yozing, bitta nusxasiga qabul qilib olganlik haqida imzo qo'ydiring."],
      ["Raqobat qo'mitasiga murojaat qiling", "Sotuvchi rad etsa, Raqobatni rivojlantirish va iste'molchilar huquqlarini himoya qilish qo'mitasiga (Call-markaz: 1159) yozing."],
      ["Sudga ariza bering", "Iste'molchilar sudga murojaat qilganda davlat boji to'lamaydilar va ma'naviy zarar ham undirishlari mumkin."]
    ],
    laws: ["\"Iste'molchilarning huquqlarini himoya qilish to'g'risida\"gi Qonun (13, 14, 18-moddalar)"],
    qs: ["Kiyinish yoki telefonni 10 kun ichida qaytarib berish mumkinmi?", "Cheki yo'q tovarni qaytarsa bo'ladimi?", "Kafolat muddati davomida ta'mirlanmasa nima qilish kerak?"]
  },
  { 
    id: "uy", icon: "home", title: "Turar joy ijarasi va mulk", desc: "Ijara shartnomasi, depozitni qaytarish va ijarachi huquqlari", tag: "Fuqarolik kodeksi",
    intro: "Ijara shartnomasi soliq organlarida (ijara.soliq.uz) hisobga qo'yilishi shart. Yozma shartnoma bo'lganda, uy egasi ijarachini ogohlantirishsiz yoki sababsiz ko'chira olmaydi, shuningdek depozit asossiz ushlab qolinishidan himoyalanadi.",
    steps: [
      ["Rasmiy shartnoma tuzing", "ijara.soliq.uz portali orqali shartnomani ro'yxatdan o'tkazing."],
      ["Dalolatnoma (Akt) imzolang", "Uyga kirishda mavjud jihozlar va kamchiliklarni akt orqali rasmiylashtiring va rasmga oling."],
      ["To'lovlarni bank orqali qiling", "Naqd bermasdan, kartadan kartaga o'tkazib, izohida 'falon oy ijarasi' deb yozib boring."]
    ],
    laws: ["Fuqarolik kodeksi (600-614-moddalar)", "Uy-joy kodeksi"],
    qs: ["Uy egasi depozitni qaytarmayapti, nima qilsam bo'ladi?", "Shartnomasiz yashaganda qanday xavf bor?", "Ijarachini to'satdan chiqarib yuborish mumkinmi?"]
  },
  { 
    id: "kredit", icon: "credit", title: "Bank kreditlari va foizlar", desc: "Muddati o'tgan qarz, garov mulki va bank nizolari", tag: "Bank qonunchiligi",
    intro: "Bank qarzdorlikni undirishda qonun doirasidan chiqa olmaydi. Qarzdor og'ir moliyaviy vaziyatga tushib qolganda kredit ta'tili (restrukturizatsiya) so'rash huquqiga ega. Garovdagi mulk faqat sud orqali yoki notarial ijro xati bilan undiriladi.",
    steps: [
      ["Shartnoma shartlarini o'rganing", "Foiz, penya va jarima miqdorlarini diqqat bilan o'qing (penya miqdori asosiy qarzdan oshib ketishi taqiqlangan)."],
      ["Bankka yozma ariza bering", "Muammoli holat haqida ma'lum qilib, kredit to'lov grafigini uzaytirishni (kredit ta'tili) so'rang."],
      ["Markaziy bankka murojaat qiling", "Bank huquqlaringizni buzsa, Markaziy bankning iste'molchilar huquqlarini himoya qilish xizmatiga shikoyat bering."]
    ],
    laws: ["\"Banklar va bank faoliyati to'g'risida\"gi Qonun", "Fuqarolik kodeksi (Garov va kredit shartnomalari)"],
    qs: ["Kreditni to'lay olmasam garovdagi uyimni tortib olishadimi?", "Kredit bo'yicha penya qancha bo'lishi mumkin?", "Kafillikdan voz kechish mumkinmi?"]
  },
  { 
    id: "biznes", icon: "building", title: "Biznes ochish: YaTT yoki MChJ", desc: "Ro'yxatdan o'tish, soliq rejimini tanlash va qonuniy faoliyat", tag: "Tadbirkorlik",
    intro: "Yakka tartibdagi tadbirkor (YaTT) sifatida ro'yxatdan o'tish yoki MChJ ta'sis etish fo.birdarcha.uz portali orqali 15 daqiqada amalga oshiriladi. Faoliyat turiga qarab to'g'ri soliq rejimini tanlash biznes xavfsizligining garovidir.",
    steps: [
      ["Tashkiliy-huquqiy shaklni tanlang", "Bitta o'zingiz xizmat ko'rsatsangiz — YaTT, sheriklar bilan katta loyiha qilsangiz — MChJ."],
      ["Onlayn ro'yxatdan o'ting", "Birdarcha (my.gov.uz) orqali ariza topshiring va davlat ro'yxatidan o'tganlik guvohnomasini oling."],
      ["Soliq rejimini belgilang", "Aylanmadan olinadigan soliq (4%) yoki umumiy soliq tizimini 10 kun ichida tanlang."]
    ],
    laws: ["O'zbekiston Respublikasi Soliq kodeksi", "\"Tadbirkorlik faoliyati erkinligining kafolatlari to'g'risida\"gi Qonun"],
    qs: ["YaTT va MChJ ning farqi nima?", "O'zini o'zi band qilgan shaxslar qanday soliq to'laydi?", "Biznes hisob raqamini qanday ochiladi?"]
  },
  { 
    id: "talim", icon: "school", title: "Ta'lim krediti va kontrakt", desc: "Talabalar uchun imtiyozli ta'lim krediti va talabalik huquqlari", tag: "Ta'lim huquqi",
    intro: "O'zbekistonda xotin-qizlar uchun 14% stavkadagi ta'lim krediti foizlari to'liq davlat tomonidan qoplab beriladi (0% stavkada). Kontrakt to'lovi kechikkan taqdirda talabani darslardan asossiz chetlatish taqiqlanadi.",
    steps: [
      ["OTM bilan shartnoma oling", "To'lov-kontrakt shartnomasini ta'lim muassasasidan oling."],
      ["Onlayn ariza yuboring", "talim-krediti.mf.uz portali orqali bankka imtiyozli kredit uchun ariza bering."],
      ["Kafillik va hujjatlar", "Pasport, kontrakt va oila daromadi to'g'risidagi ma'lumotlarni ilova qiling."]
    ],
    laws: ["Vazirlar Mahkamasining ta'lim kreditlarini ajratish tartibi to'g'risidagi Qarorlari"],
    qs: ["Qizlar uchun foizsiz ta'lim krediti qanday olinadi?", "Kontrakt to'lovini bo'lib to'lash mumkinmi?", "Akademik ta'tildan qaytish qoidalari qanday?"]
  },
  { 
    id: "pasport", icon: "shield", title: "Pasport, propiska va xorij", desc: "ID-karta olish, erkin propiska va xorijga chiqish pasporti", tag: "Davlat xizmatlari",
    intro: "O'zbekistonda har qanday hududda erkin ko'chmas mulk sotib olish va doimiy ro'yxatga (propiska) turish cheklovlari bekor qilingan. Xorijga chiqish (qizil) pasporti 10 yil muddatga beriladi.",
    steps: [
      ["Davlat xizmatlari markaziga boring", "Yoki my.gov.uz orqali navbatga yoziling."],
      ["Davlat bojini to'lang", "BHM koeffitsiyenti asosida davlat bojini to'lang."],
      ["Pasportni qabul qilib oling", "Tayyor pasport 10 ish kuni ichida beriladi."]
    ],
    laws: ["\"O'zbekiston Respublikasida fuqarolarni ro'yxatga olish tartibi to'g'risida\"gi Qonun"],
    qs: ["Toshkentdan uy olmasdan ham doimiy propiskaga o'tsa bo'ladimi?", "Qizil pasport yo'qolsa nima qilish kerak?"]
  },
  { 
    id: "kiber", icon: "lock", title: "Kiberfiribgarlik va karta o'g'irligi", desc: "Bank kartasidan noqonuniy pul yechilganda nima qilish kerak?", tag: "Jinoyat qonunchiligi",
    intro: "Bank kartasidan ruxsatsiz pul yechib olinganda, zudlik bilan kartani bloklash va IIB Kiberxavfsizlik markaziga (102 yoki 1102) xabar berish shart. Shubhali havolalarga (fishing) kirmaslik eng asosiy xavfsizlik chorasidir.",
    steps: [
      ["Kartani darhol bloklang", "Bank mobil ilovasi orqali yoki bank call-markaziga qo'ng'iroq qilib bloklang."],
      ["Pul o'tkazmasi chekini saqlang", "Qaysi hisobga yoki kartaga pul o'tganini aniqlab, PDF chekini yuklab oling."],
      ["Kiberxavfsizlik bo'limiga ariza bering", "Yashash joyingizdagi IIBga yoki elektron shaklda ariza yuboring."]
    ],
    laws: ["O'zbekiston Respublikasi Jinoyat kodeksi (168-modda Firibgarlik, 169-modda O'g'rilik)"],
    qs: ["Karta raqamimni aytib pulimni oldirib qo'ydim, qaytarsa bo'ladimi?", "Bank kiberhujum vaqtida pulni qaytarishga majburmi?"]
  }
];

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

const CODES = [
  ["K", "Konstitutsiya", "Davlatning bosh qonuni: inson qadri, huquq va erkinliklar."],
  ["MK", "Mehnat kodeksi", "Ishga qabul, maosh, mehnat ta'tili, bo'shatish va xodim kafolatlari."],
  ["OK", "Oila kodeksi", "Nikoh, ajrashish, aliment, bolalar tarbiyasi va ota-onalik huquqi."],
  ["FK", "Fuqarolik kodeksi", "Mulk huquqi, oldi-sotdi, ijara, shartnomalar va meros."],
  ["MJ", "Ma'muriy javobgarlik kodeksi", "Yo'l harakati, jarimalar va ma'muriy huquqbuzarliklar."],
  ["JK", "Jinoyat kodeksi", "Jinoiy javobgarlik, jazolar va jinoyat turlari."],
  ["SK", "Soliq kodeksi", "Jismoniy va yuridik shaxslar soliqlari, imtiyozlar va hisobotlar."],
  ["UK", "Uy-joy kodeksi", "Ko'chmas mulk, xonadondan foydalanish va kommunal munosabatlar."],
  ["FPK", "Fuqarolik protsessual kodeksi", "Sudga da'vo berish, dalillar, sud majlislari va qarorlar."],
  ["IPK", "Iqtisodiy protsessual kodeksi", "Tadbirkorlar va korxonalar o'rtasidagi iqtisodiy nizolar."]
];

// TAYYOR HUJJAT SHABLONLARI (DOC BUILDER)
const DOC_TEMPLATES = {
  ish_haqi: {
    title: "To'lanmagan ish haqini talab qilish arizasi",
    desc: "Mehnat kodeksining 253 va 333-moddalari asosida hisoblangan maosh va kompensatsiya talabi.",
    fields: [
      { id: "employer", label: "Ish beruvchi tashkilot nomi", placeholder: "«Falonchi MChJ» rahbari A.B.ga", type: "text" },
      { id: "applicant", label: "Sizning F.I.O.", placeholder: "Karimov Sherzod Aliyevich", type: "text" },
      { id: "position", label: "Lavozimingiz", placeholder: "Bosh buxgalter / Dasturchi / Haydovchi", type: "text" },
      { id: "amount", label: "Qarzdorlik summasi (so'm)", placeholder: "8 500 000 so'm", type: "text" },
      { id: "period", label: "Qaysi oylar uchun maosh", placeholder: "2026-yil avgust va sentyabr oylari uchun", type: "text" }
    ],
    generate: (data) => `
KIMGA: ${data.employer || "[Ish beruvchi korxona rahbari]"}
KIMDAN: ${data.applicant || "[Xodimning F.I.O.]"}
Lavozimi: ${data.position || "[Lavozim]"}
Aloqa telefoni: +998 (__) ___-__-__

                                ARIZA
                   (To'lanmagan ish haqini to'lash to'g'risida)

Men, ${data.applicant || "[F.I.O.]"}, ${data.employer || "[Tashkilot]"} da ${data.position || "[Lavozim]"} lavozimida mehnat faoliyatini yuritib kelmoqdaman.

O'zbekiston Respublikasi Mehnat kodeksining 253-moddasiga muvofiq, ish beruvchi xodimga belgilangan muddatlarda ish haqini to'liq to'lashi shart.
Biroq, bugungi kunga qadar menga ${data.period || "[Tegishli davr]"} uchun jami ${data.amount || "[Summa]"} miqdoridagi ish haqi to'lab berilmadi.

Shuningdek, Mehnat kodeksining 333-moddasiga ko'ra, ish beruvchi ish haqini to'lash muddatini kechiktirganlik uchun har bir kun hisobiga Markaziy bank qayta moliyalash stavkasi miqdorida pullik kompensatsiya to'lash majburiyatiga ega.

Yuqoridagilardan kelib chiqib, SIZDAN:
1. Menga tegishli bo'lgan ${data.amount || "[Summa]"} so'm miqdoridagi ish haqini to'liq to'lab berishingizni;
2. Kechiktirilgan har bir kun uchun qonunda belgilangan foiz (kompensatsiya) miqdorini hisoblab to'lashingizni so'rayman.

Ushbu talab 3 (uch) ish kuni ichida ixtiyoriy ravishda bajarilmagan taqdirda, Davlat mehnat inspeksiyasi, Prokuratura organlariga hamda Fuqarolik ishlari bo'yicha sudga sud buyrug'i chiqarish to'g'risida ariza bilan murojaat qilishimni ma'lum qilaman.

Imzo: _______________ (${data.applicant || "Xodim"})
Sana: ${new Date().toISOString().slice(0, 10)}
`
  },

  istemol_da_vo: {
    title: "Sifatsiz tovar uchun pulni qaytarish talabnomasi (Pretenziya)",
    desc: "Iste'molchilar huquqlarini himoya qilish to'g'risidagi qonunning 13-14 moddalari asosida.",
    fields: [
      { id: "store", label: "Do'kon yoki sotuvchi nomi", placeholder: "«TexnoMart» do'koni ma'muriyatiga", type: "text" },
      { id: "buyer", label: "Iste'molchi F.I.O.", placeholder: "Rustamov Jasur Anvarovich", type: "text" },
      { id: "product", label: "Tovarning nomi va modeli", placeholder: "Samsung Galaxy smartfoni", type: "text" },
      { id: "buy_date", label: "Xarid qilingan sana", placeholder: "12.10.2026", type: "text" },
      { id: "defect", label: "Tovardagi nosozlik / kamchilik", placeholder: "Ekran to'satdan o'chib qolmoqda, zaryad olmayapti", type: "text" },
      { id: "price", label: "To'langan summa (so'm)", placeholder: "3 800 000 so'm", type: "text" }
    ],
    generate: (data) => `
KIMGA: ${data.store || "[Do'kon / Sotuvchi nomi]"}
ISTE'MOLCHI: ${data.buyer || "[Xaridorning F.I.O.]"}
Telefon raqam: +998 (__) ___-__-__

                        TALABNOMA (PRETENZIYA)
             (Sifatsiz tovar uchun to'langan pulni qaytarish haqida)

Men, ${data.buyer || "[Xaridor]"}, ${data.buy_date || "[Sana]"} kuni Sizning savdo do'koningizdan ${data.price || "[Summa]"} so'm evaziga ${data.product || "[Tovar nomi]"} tovarini xarid qilgan edim.

Tovar foydalanish jarayonida quyidagi jiddiy nuqsonlar aniqlandi:
${data.defect || "[Nosozlik tafsiloti]"}.

O'zbekiston Respublikasi «Iste'molchilarning huquqlarini himoya qilish to'g'risida»gi Qonunining 13-moddasiga binoan, nuqsonli tovar sotilgan iste'molchi tovar uchun to'langan pul summasini qaytarishni va zararni to'liq qoplashni talab qilishga haqli.
Ushbu qonunning 14-moddasiga ko'ra, iste'molchining pulni qaytarish to'g'risidagi talabi tovar topshirilgan kundan e'tiboran 7 kun ichida qanoatlantirilishi lozim.

Yuqoridagilardan kelib chiqib:
1. Sifat talablariga javob bermaydigan ${data.product || "[Tovar]"} ni qabul qilib olishingizni;
2. Mazkur tovar uchun to'langan ${data.price || "[Summa]"} so'm pul mablag'ini menga to'liq qaytarishingizni talab qilaman.

Imzo: _______________ (${data.buyer || "Iste'molchi"})
Sana: ${new Date().toISOString().slice(0, 10)}
`
  },

  ijara_shartnoma: {
    title: "Turar joy ijara shartnomasi (Namuna)",
    desc: "Fuqarolik kodeksining 600-moddasiga binoan uy egasi va ijarachi o'rtasidagi kelishuv.",
    fields: [
      { id: "landlord", label: "Uy egasi F.I.O. (Ijaraga beruvchi)", placeholder: "Sobirov Otabek Akramovich", type: "text" },
      { id: "tenant", label: "Ijaraga oluvchi F.I.O.", placeholder: "Nazarov Bekzod Ikromovich", type: "text" },
      { id: "address", label: "Ijara xonadonining manzili", placeholder: "Toshkent shahri, Chilonzor tumani, 9-mavze", type: "text" },
      { id: "rent", label: "Oylik ijara narxi (so'm)", placeholder: "4 000 000 so'm", type: "text" },
      { id: "deposit", label: "Garov (Depozit) summasi", placeholder: "2 000 000 so'm", type: "text" }
    ],
    generate: (data) => `
                 TURAR JOYNI IJARAGA BERISH SHARTNOMASI

Toshkent shahri                                  «____» __________ 2026-yil

Bir tomondan fuqaro ${data.landlord || "[Uy egasining F.I.O.]"} (keyingi o'rinlarda «Ijaraga beruvchi»), ikkinchi tomondan fuqaro ${data.tenant || "[Ijaraga oluvchining F.I.O.]"} (keyingi o'rinlarda «Ijarachi») quyidagilar haqida mazkur shartnomani tuzdilar:

1. SHARTNOMA PREDMETI
1.1. Ijaraga beruvchi o'ziga mulk huquqi asosida tegishli bo'lgan quyidagi manzildagi turar joyni vaqtincha yashash uchun topshiradi:
Manzil: ${data.address || "[Xonadon manzili]"}.

2. TO'LOVLAR VA HISOB-KITOBLAR
2.1. Mazkur shartnoma bo'yicha oylik ijara haqi ${data.rent || "[Oylik ijara summasi]"} so'mni tashkil etadi.
2.2. Ijarachi tomonidan garov (depozit) sifatida ${data.deposit || "[Depozit summasi]"} so'm to'landi. Ushbu summa shartnoma tugagach xonadonga ziyon yetkazilmagan taqdirda to'liq qaytariladi.

TOMONLARNING IMZOLARI:
IJARAGA BERUVCHI: _______________ (${data.landlord || "Uy egasi"})
IJARACHI:         _______________ (${data.tenant || "Ijarachi"})
`
  },

  aliment_sud: {
    title: "Aliment undirish to'g'risida sudga ariza (Sud buyrug'i)",
    desc: "Oila kodeksining 96-moddasi bo'yicha sud majlisisiz tezkor sud buyrug'i chiqarish tartibi.",
    fields: [
      { id: "court", label: "Fuqarolik sudi nomi", placeholder: "Fuqarolik ishlari bo'yicha tumanlararo sudiga", type: "text" },
      { id: "claimant", label: "Da'vogar (Ona/Ota) F.I.O.", placeholder: "Aliyeva Nargiza Valijonovna", type: "text" },
      { id: "debtor", label: "Javobgar (Qarzdor) F.I.O.", placeholder: "Aliyev Rustam Qosimovich", type: "text" },
      { id: "child_name", label: "Farzand(lar) ismi va tug'ilgan yili", placeholder: "Aliyev Temur Rustam o'g'li, 2020-yil 15-may", type: "text" }
    ],
    generate: (data) => `
KIMGA: ${data.court || "[Fuqarolik ishlari bo'yicha sudga]"}
UNDIRUVCHI: ${data.claimant || "[Undiruvchining F.I.O.]"}
QARZDOR: ${data.debtor || "[Qarzdor ota/onaning F.I.O.]"}

                               ARIZA
       (Voyaga yetmagan bola ta'minoti uchun aliment undirish 
                to'g'risida sud buyrug'i berish haqida)

Men va qarzdor ${data.debtor || "[Qarzdor]"} o'rtamizda tuzilgan nikohdan birgalikdagi farzandimiz ${data.child_name || "[Farzandning F.I.O.]"} tug'ilgan.
Bola to'liq mening qaramog'imda. Qarzdor bola ta'minoti uchun moddiy yordam ko'rsatishdan bosh tortib kelmoqda.

O'zbekiston Respublikasi Oila kodeksining 96 va 99-moddalariga muvofiq, Sudingizdan:
Qarzdor ${data.debtor || "[Qarzdor]"} dan voyaga yetmagan farzandimiz ta'minoti uchun har oyda uning barcha turdagi daromadlarining 1/4 qismi miqdorida aliment undirish to'g'risida SUD BUYRUG'I chiqarishingizni so'rayman.

Imzo: _______________ (${data.claimant || "Ariza beruvchi"})
Sana: ${new Date().toISOString().slice(0, 10)}
`
  },

  mehnat_boshash: {
    title: "O'z xohishi bilan ishdan bo'shash to'g'risida ariza",
    desc: "Yangi Mehnat kodeksining 160-moddasiga muvofiq mehnat shartnomasini bekor qilish.",
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
Sana: ${new Date().toISOString().slice(0, 10)}
`
  }
};

const $ = (s) => document.querySelector(s);
let mode = "citizen";
let history = [];
let busy = false;
let currentDoc = "ish_haqi";

// VIEW SWITCHER
function show(view) {
  document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
  const target = $("#view-" + view);
  if (target) target.classList.add("active");
  document.body.classList.toggle("chat-open", view === "chat");
  window.scrollTo(0, 0);
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
function renderSituations(filter = "") {
  const list = SITUATIONS.filter(s => 
    s.title.toLowerCase().includes(filter.toLowerCase()) || 
    s.desc.toLowerCase().includes(filter.toLowerCase()) ||
    s.tag.toLowerCase().includes(filter.toLowerCase())
  );
  
  if (list.length === 0) {
    $("#situations").innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted); padding: 40px;">Bunday vaziyat topilmadi. AI yordamchidan bevosita so'rab ko'rishingiz mumkin.</p>`;
    return;
  }

  $("#situations").innerHTML = list.map((s) => `
    <button class="sit-card" data-sit="${s.id}">
      <div>
        <div class="sit-card-top">
          <div class="sit-icon-wrap">${getSvgIcon(s.icon)}</div>
          <span class="sit-tag">${s.tag}</span>
        </div>
        <h3>${s.title}</h3>
        <p>${s.desc}</p>
      </div>
      <div class="sit-card-footer">
        <span style="font-size: 0.82rem; font-weight: 600; color: var(--text-muted);">Qadamlar va moddalar</span>
        <span class="sit-arrow">→</span>
      </div>
    </button>
  `).join("");
}

// SEARCH FILTER EVENT
$("#sit-search").addEventListener("input", (e) => {
  renderSituations(e.target.value.trim());
});

// RENDER CODES
$("#codes").innerHTML = CODES.map(([n, t, d]) => `
  <div class="code-card">
    <div class="code-badge">${n}</div>
    <div class="code-info">
      <h3>${t}</h3>
      <p>${d}</p>
      <div class="code-links">
        <a href="https://lex.uz/search/all?searchtitle=${encodeURIComponent(t)}" target="_blank" rel="noopener">Rasmiy matn ↗</a>
        <button data-ask="${t} haqida oddiy tilda tushuntirib bering: u nimalarni tartibga soladi va oddiy fuqaro uchun eng muhim 3 ta qoidasi qaysi?">AI tahlili</button>
      </div>
    </div>
  </div>
`).join("");

// SITUATION DETAIL VIEW
$("#situations").addEventListener("click", (e) => {
  const c = e.target.closest("[data-sit]");
  if (!c) return;
  const s = SITUATIONS.find((x) => x.id === c.dataset.sit);
  if (!s) return;
  $("#situation-detail").innerHTML = `
    <div class="detail-header">
      <div class="sit-icon-wrap" style="width: 52px; height: 52px;">${getSvgIcon(s.icon)}</div>
      <h1>${s.title}</h1>
    </div>
    <p style="font-size: 1.1rem; color: var(--text-muted); margin-bottom: 24px;">${s.intro}</p>
    <ul class="steps-list">${s.steps.map(([b, t]) => `<li><b>${b}</b><p>${t}</p></li>`).join("")}</ul>
    <div class="laws-card">
      <h4>Asosiy qonunchilik hujjatlari:</h4>
      <ul>${s.laws.map((l) => `<li>${l}</li>`).join("")}</ul>
    </div>
    <div class="ask-banner">
      <h3>AI huquqshunosdan qo'shimcha so'rang</h3>
      <div class="chips" style="justify-content: flex-start;">${s.qs.map((q) => `<button data-ask="${q}">${q}</button>`).join("")}</div>
    </div>`;
  show("situation");
});

// DOCUMENT GENERATOR
function renderDocForm(docKey) {
  currentDoc = docKey;
  const doc = DOC_TEMPLATES[docKey];
  if (!doc) return;

  const form = $("#doc-form");
  form.innerHTML = doc.fields.map(f => `
    <div class="form-group">
      <label for="field_${f.id}">${f.label}</label>
      <input type="${f.type}" id="field_${f.id}" name="${f.id}" placeholder="${f.placeholder}" autocomplete="off" />
    </div>
  `).join("");

  document.querySelectorAll(".doc-tab-btn").forEach(tab => {
    tab.classList.toggle("active", tab.dataset.doc === docKey);
  });

  updateDocPreview();

  form.querySelectorAll("input").forEach(input => {
    input.addEventListener("input", updateDocPreview);
  });
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
  const text = doc.generate(data);
  $("#doc-paper").textContent = text;
}

$("#doc-tabs").addEventListener("click", (e) => {
  const tab = e.target.closest(".doc-tab-btn");
  if (tab) renderDocForm(tab.dataset.doc);
});

$("#btn-copy-doc").addEventListener("click", () => {
  const text = $("#doc-paper").textContent;
  navigator.clipboard.writeText(text).then(() => {
    const btn = $("#btn-copy-doc");
    btn.textContent = "✅ Nusxa olindi";
    setTimeout(() => { btn.textContent = "📋 Nusxa olish"; }, 2000);
  });
});

$("#btn-download-doc").addEventListener("click", () => {
  const text = $("#doc-paper").textContent;
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `${currentDoc}_ariza.txt`;
  a.click();
});

$("#btn-print-doc").addEventListener("click", () => {
  window.print();
});

// CLICKS & CHIPS
document.addEventListener("click", (e) => {
  const b = e.target.closest("[data-ask]");
  if (b) ask(b.dataset.ask);
  const m = e.target.closest("[data-mode-start]");
  if (m) { setMode(m.dataset.modeStart); show("chat"); }
});

$("#hero-chips").addEventListener("click", (e) => { if (e.target.tagName === "BUTTON") ask(e.target.textContent); });
$("#hero-ask").addEventListener("submit", (e) => { e.preventDefault(); const v = $("#hero-input").value.trim(); if (v) ask(v); });

function setMode(m) {
  mode = m;
  document.querySelectorAll("#mode-toggle button").forEach((b) => b.classList.toggle("on", b.dataset.mode === m));
  $("#mode-note").textContent = m === "student" ? "Chuqur huquqiy tahlil: normaning tuzilishi, dispozitsiya va sud amaliyoti." : "Sodda tilda, amaliy qadamlar bilan javob.";
}
$("#mode-toggle").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setMode(b.dataset.mode); });

// SETTINGS MODAL
const modalSettings = $("#modal-settings");
const inputApiKey = $("#input-api-key");

function refreshApiStatus() {
  const key = localStorage.getItem("gemini_api_key");
  if (key) {
    $("#api-model-name").textContent = "Gemini Flash";
    inputApiKey.value = key;
  } else {
    $("#api-model-name").textContent = "Standart";
    inputApiKey.value = "";
  }
}

$("#btn-open-settings").addEventListener("click", () => modalSettings.classList.remove("hidden"));
$("#btn-config-api").addEventListener("click", () => modalSettings.classList.remove("hidden"));
modalSettings.addEventListener("click", (e) => { if (e.target === modalSettings) modalSettings.classList.add("hidden"); });

$("#btn-save-key").addEventListener("click", () => {
  const val = inputApiKey.value.trim();
  if (val) localStorage.setItem("gemini_api_key", val);
  else localStorage.removeItem("gemini_api_key");
  refreshApiStatus();
  modalSettings.classList.add("hidden");
});

$("#btn-clear-key").addEventListener("click", () => {
  localStorage.removeItem("gemini_api_key");
  refreshApiStatus();
  modalSettings.classList.add("hidden");
});

// NEW CHAT
$("#new-chat").addEventListener("click", () => {
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
  const inline = (t) => t.replace(/\*\*(.+?)\*\*/g, "<b>$1</b>").replace(/\*(.+?)\*/g, "<i>$1</i>");
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

// ASK FUNCTION (DUAL ENGINE: DIRECT GEMINI OR BACKEND)
async function ask(text) {
  show("chat");
  if (busy || !text.trim()) return;
  busy = true;
  $("#send-btn").disabled = true;
  history.push({ role: "user", content: text });
  addMsg("user", text);
  const bubble = addMsg("assistant", "");
  bubble.textContent = "Javob tayyorlanmoqda...";
  let answer = "";

  const localKey = localStorage.getItem("gemini_api_key");

  try {
    if (localKey) {
      const systemPrompt = mode === "student"
        ? "Siz O'zbekiston Respublikasi qonunchiligi bo'yicha chuqur huquqiy tahlilchi va yuridik fakultet domlasisiz. Huquqshunos talabalarga javob berasiz: normaning tuzilishi (gipoteza, dispozitsiya, sanksiya), moddalar tahlili, kazuslar va sud amaliyoti bilan ilmiy tilda tushuntiring. Rasmiy manba sifatida lex.uz ga tayaning."
        : "Siz O'zbekiston Respublikasi qonunchiligi bo'yicha yordamchi AI konsultantsiz. Fuqarolarga oddiy, tushunarli, amaliy tilda javob bering. Qadam-baqadam yo'l-yo'riq, qayerga murojaat qilish kerakligi va qonun nomlarini oddiy qilib tushuntiring. Zarur bo'lsa advokatga murojaat qilishni va lex.uz orqali tekshirishni eslatib o'ting.";

      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?alt=sse&key=${localKey}`;
      const contents = history.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }]
      }));

      const res = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: contents
        })
      });

      if (!res.ok) throw new Error("Gemini API xatosi");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";

      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.replace("data: ", "").trim();
            if (dataStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(dataStr);
              const chunk = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
              if (chunk) {
                answer += chunk;
                bubble.innerHTML = md(answer);
                $("#messages").scrollTop = $("#messages").scrollHeight;
              }
            } catch (e) {}
          }
        }
      }

    } else {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, mode })
      });

      if (!res.ok || !res.body) throw new Error();
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += dec.decode(value, { stream: true });
        bubble.innerHTML = md(answer);
        $("#messages").scrollTop = $("#messages").scrollHeight;
      }
    }

    history.push({ role: "assistant", content: answer });
  } catch (err) {
    bubble.innerHTML = md(`
⚠️ **Javob olishda xatolik yuz berdi.**

Agar saytni serverisiz (lokal) ishlatayotgan bo'lsangiz:
1. Yuqoridagi **«⚙️ API»** tugmasini bosing.
2. Bepul [Google AI Studio (Gemini API)](https://aistudio.google.com/app/apikey) kalitingizni kiriting va saqlang. Shunda sayt to'g'ridan-to'g'ri hech qanday serversiz mustaqil ishlaydi!
    `);
    history.pop();
  }

  busy = false;
  $("#send-btn").disabled = false;
}

$("#composer").addEventListener("submit", (e) => {
  e.preventDefault();
  const v = $("#chat-input").value.trim();
  $("#chat-input").value = "";
  ask(v);
});
$("#chat-input").addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); $("#composer").requestSubmit(); }
});

// INITIALIZE
renderSituations();
renderDocForm("ish_haqi");
refreshApiStatus();

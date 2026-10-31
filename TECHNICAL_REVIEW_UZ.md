# HuquqYordamchi v10 — o‘zgarishlar va tekshiruv

Sana: 2026-10-29. Bu fayl v9 dagi eski texnik ko‘rik o‘rniga joriy holatni qayd etadi.

## Tuzatilgan kamchiliklar

1. Mehnat kodeksi havolalaridagi aralashishlar: xodim tashabbusi — 160, ish beruvchi tashabbusi — 161, kechikkan to‘lov bo‘yicha javobgarlik — 333. Sudga murojaat muddatlari 560-modda doirasida qayta yozildi.
2. Birinchi navbatdagi vorislar uchun FK 1135 ko‘rsatildi; FK 1146 dagi olti oy merosni qabul qilishning mutlaq oxirgi muddati sifatida berilishi olib tashlandi.
3. Iste’molchi huquqlarini sudda himoya qilish havolasi 29-moddaga tuzatildi. Tekshirilmagan qat’iy to‘lov va ayrim tez o‘zgaradigan ma’lumotlar umumiy yo‘riq bilan almashtirildi.
4. Bir xil so‘zdan boshlanadigan kodekslar “tasdiqlangan” belgisi uchun adashib moslashtirilmaydi: hujjatning aniq nomi/aliasi va modda raqami solishtiriladi.
5. Kirillcha va modda raqami bilan lokal qidiruv ishlaydi. Tekshirilmagan katalog yozuvlari tekshirilgan deb belgilanmaydi.
6. Oldingi katta AI javobi keyingi savolni backend limitiga urmaydi; so‘rov tarixi chegaralanadi. Band holatda ikkinchi yozilayotgan savol o‘chirib yuborilmaydi.
7. AI oqimining oxirgi, yangi qatordan oldin tugamagan paketi ham o‘qiladi. Bo‘sh, bloklangan, tugallanmagan yoki uzilgan javob holatlari ko‘rsatiladi. Foydalanuvchi so‘rovni to‘xtata oladi.
8. Google qidiruvi xatosida manbasiz generatsiyaga yashirin qaytish olib tashlandi. Manba havolalari filtrlanadi va takrorlari olinadi.
9. JSONning haqiqiy bayt hajmi, rollar, xabar va suhbat chegaralari tekshiriladi. Origin protokol va port bilan to‘liq tekshiriladi; mijoz kiritgan forwarding sarlavhasi avtorizatsiya asosi emas.
10. Telegram bot yagona katalogdan foydalanadi; parallel yangilanishlar, AI uchun bir vaqtda 4 so‘rov chegarasi, foydalanuvchiga 5/minut va 30/soat cheklovi, API kutish chegarasi qo‘shildi.
11. To‘rtta yangi/qayta ishlangan ariza, professional kazus va kodeksni sodda tushuntirish interfeysi qo‘shildi.
12. Yangilik turini sarlavhadagi tasodifiy “qonun” so‘zi orqali aniqlash olib tashlandi; hujjatning organ/turi metama’lumoti ishlatiladi. To‘rtta turga ma’lumot mavjud.

## Bajarilgan tekshiruv

- `npm run build` — muvaffaqiyatli.
- `npm test` — 35/35 test. Qidiruv, kodekslar chalkashishi, aliment ulushi, andoza cheklovlari, uzun suhbat, JSON/Origin, SSE, RSS va AI so‘rov shakli tekshirildi. AI integratsiyasi tashqi haqiqiy xizmat o‘rniga nazorat qilinadigan javoblar bilan sinaldi.
- JavaScript/ESM sintaksisi va Python kompilyatsiyasi tekshirildi.
- Brauzerda bosh sahifa, `JK 168` qidiruvi, AI kaliti yo‘q holati, aliment generatori, kodeks tushuntirish oynasi va kazus rejimlari ko‘rildi. Desktop ko‘rinishi vizual tekshirildi; mobil ekran uchun CSS qo‘shilgan, alohida haqiqiy telefon sinovi bajarilmadi.

## Qolgan cheklovlar

- Jonli Netlify deploy, haqiqiy Gemini/Telegram kalitlari va provayder hisobi bilan sinov ushbu muhitda bajarilmadi. Amaldagi domen nomi/DNS o‘zgartirilmadi.
- RSS tashqi tarmoqqa bog‘liq. Zaxira sanasi ochiq ko‘rsatiladi; zaxira jonli yangilik sifatida taqdim etilmaydi.
- Serverning soatlik in-memory limiti bitta faol instance doirasida. Ko‘p instance va restartlar uchun umumiy saqlagichli limit/budget alohida kerak; Origin tekshiruvi autentifikatsiya o‘rnini bosmaydi. Netlify konfiguratsiyasida minutlik platforma limiti ham bor.
- Katalogdagi barcha 46 modda va barcha umumiy qo‘llanmalar to‘liq yuridik ekspertizadan o‘tmagan. `reviewedAt` yo‘q yozuvlar alohida belgilangan. To‘rtta yangi arizaga tegishli rasmiy manbalar berilgan, lekin individual sud ishiga moslik avtomatik kafolatlanmaydi.
- Kazusning avvaldan berilgan arxiv namunasi saqlangan. Unda tarixiy normalar uchrashi mumkin; endi u avtomatik tanlanmaydi va “tekshirilgan amaldagi yechim” deb taqdim etilmaydi.
- AI xulosasi qonuniy kuchga ega hujjat emas. Havolalar dalilni tekshirishga yordam beradi, lekin avtomatik to‘liq iqtibos-verifikatsiya tizimi yo‘q.
- Hujjat eksporti: TXT va brauzer orqali chop etish/PDF. DOCX, administrator paneli, login va foydalanuvchi hujjatlarini serverda saqlash bu versiyada yo‘q.

Asosiy qayta tekshirish navbati: hostingda AI/RSS sinovi, qolgan katalogning huquqiy auditi, haqiqiy telefon sinovi, tarqatilgan API xarajat nazorati.

## v10.4 — shaxsiy ma’lumot filtri tuzatildi

- Formatlanmagan 9 xonali son (masalan, `901234567 so‘m`) endi telefon deb yashirilmaydi. Telefon faqat +998 prefiksi, `90 123 45 67` / `(90) 123-45-67` shakli yoki yonida "tel/telefon/aloqa" so‘zi bo‘lsa yashiriladi.
- Orqasidan so‘m, sum, mln, ming, $ kabi so‘z kelgan sonlar (karta va JSHSHIRga o‘xshasa ham) yashirilmaydi.
- Kichik harfli pasport (`aa1234567`) va email manzillari yashiriladi.
- Telegram bot ham Gemini'ga yuborishdan oldin xuddi shu qoidalarni qo‘llaydi.
- Cheklov: ism, familiya va manzil ataylab yashirilmaydi (kazus tahlili uchun kerak). Bu to‘liq anonimlashtirish emas; interfeysdagi ogohlantirish shuni aytadi.
- Tekshiruv: `npm test` — 23/23; filtr katalog, shablonlar, kazus namunasi va yangiliklar matnidagi birorta raqamni o‘zgartirmaydi.

## v10.5 — AI ishga tushirish

- Sabab: standart `gemini-2.5-flash` yangi API kalitlar uchun yopilgan (Google, 2025-09-18). Yangi standart — `gemini-3.8-flash`, zaxira zanjiri bilan.
- Sabab: kazus tahlili Netlify’ning 60 soniyalik chegarasidan uzun bo‘lishi mumkin edi. Endi 48 soniyada xavfsiz to‘xtab, brauzer davomini so‘raydi; matn uzilishsiz ulanadi.
- "thinking" sozlamasi qabul qilinmasa, usiz qayta yuboriladi. Sababi noma’lum xatoda qayta urinish yo‘q.
- Tekshiruv: 27/27 test; brauzerda soxta (sekin) Gemini bilan 3 qismli kazus javobi to‘liq ulanib, manba va TSUL qatori bilan tugashi tekshirildi. Haqiqiy Gemini kaliti bilan sinov hosting muhitida qilinishi kerak.

## v10.6 — RAG: Mehnat kodeksi va Plenum 26-son

- Mehnat kodeksining lex.uz rasmiy matni (593 modda, 2026-10-15 tahriri) va Oliy sud Plenumining 26-son qarori (74 band) bazaga kiritildi.
- Rasmiy matn bilan tasdiqlandi: 161 — ish beruvchi tashabbusi, 163 — taqiqlar (kasallik davri 1-qism 3-band), 165 — ogohlantirish (qisqarishda kamida 2 oy), 173 — ishdan bo‘shatish nafaqasi, 560 — sudga murojaat muddatlari (ishga tiklash — 3 oy), 562 — sud xarajatlaridan ozod qilish. Katalogdagi MK raqamlari to‘g‘ri edi; 333, 560 va 163 sarlavhalari rasmiy shaklga keltirildi, barcha MK yozuvlari `reviewedAt: 2026-10-30`.
- Kazus, chat, qidiruv va tushuntirishga parchalar beriladi; javobdagi MK modda va Plenum band raqamlari avtomatik tekshiriladi (kazusda — barcha qismlar bo‘yicha).
- Tekshiruv: 32/32 test; brauzerda soxta Gemini bilan 3 qismli kazus — har qismda parchalar berildi, 163 ✅, uydirma 999 ❌ deb belgilandi.

## v10.7 — kalit diagnostikasi

- `/api/status`: kalit borligi va formati, modellar bo‘yicha sinov, Google xatosining sababi (ErrorInfo reason + xabar) o‘zbekcha izoh bilan. Kalit javobda yashiriladi.
- Foydalanuvchiga umumiy "ulanishda xatolik" o‘rniga aniq sabab ko‘rsatiladi; kalit/kvota xatolarida keraksiz model almashtirish qilinmaydi.
- Kalit avtomatik tozalanadi (bo‘sh joy, qo‘shtirnoq, `GEMINI_API_KEY=` prefiksi).

## v10.8 — kundalik vaziyatlar 12 → 32

- `data/legal.json`: 20 ta yangi vaziyat, barcha 32 tasiga `group`; yangi yozuvlarda `reviewedAt: 2026-10-31`; `sourceLabels` (lex.uz ID → hujjat nomi).
- Manbalar: Mehnat — `data/laws/mk.json` (rasmiy matn); Oila kodeksi 13, 15–17, 20, 23 — lex.uz matni (12.09.2026 tahriri); 25–28, 60–63, 65–66, 76–77, 88, 208 — lex.uz mundarijasi; FK 468–477, 479–481, 488, 732–737 — lex.uz mundarijasi; Ijro qonuni (258-II) moddalari — lex.uz mundarijasi; O‘RQ-1134 (20.04.2026) — lex.uz; pensiya — gov.uz (19.10.2026); Ijtimoiy reyestr — VMQ 35-son (29.01.2026); onlayn xarid — kun.uz (26.10.2026) va 2026-yil sentabrdagi e-tijorat qonuni.
- Ataylab yozilmaganlar: tasdiqlanmagan summalar, telefon raqamlari (Pensiya jamg‘armasi 1140 dan tashqari), OSAGO mol-mulk limiti taqsimoti, FK 571 (u transport ijarasiga oid — umumiy YTH javobgarligiga emas).
- UI: guruh filtri, 12 ta kartochka + "hammasini ko‘rsatish", mobil'da gorizontal chiplar; 5 ta yangi ikonka (clock, calendar, heart, scale, bolt).
- Testlar: 37/37 — yangi test har bir vaziyatdagi MK havolasini rasmiy matn bilan, ikonka va guruhni tekshiradi.

## v10.9 — dizaynda raqamlar yo‘q

- Bosh sahifa: hero faktlari raqam o‘rniga so‘z bilan (Kodekslar / Namunalar / Qidiruv); "8 TA NAMUNA" → "TAYYOR NAMUNALAR"; "01 → 05" → "FAKT → XULOSA"; tahlil bosqichlari va forma bo‘limlaridan raqamlar olib tashlandi.
- Vaziyat guruhlari va "Barcha vaziyatlarni ko‘rsatish" tugmasida son yo‘q; kartochka tavsiflarida raqam yo‘q (raqamlar yo‘riqnoma ichida qoladi).
- Hujjat namunalari tablaridagi 01–08 olib tashlandi; "Qonuniy asos 1/2" → hujjat nomi.
- Yangiliklar filtrida son yo‘q, har bir yangilikdagi "Zaxira: sana" belgisi olib tashlandi (manba qatorida qoladi).
- Belgilar hisoblagichi ("0 / 2000") o‘rniga faqat chegaraga yaqinlashganda matnli ogohlantirish.
- Qoldirilgan raqamlar — bu ma’lumot, bezak emas: modda havolalari, hujjat sanalari va ro‘yxat raqamlari, "JK 168" qidiruv misoli, footer’dagi yil.

## v11.0 — animatsiya, logotip, til, oferta

- `public/motion.js` (yangi): header soyasi, rasm parallaksi (`--py`), IntersectionObserver bilan `[data-reveal]`; dinamik kodeks kartochkalari va bo‘lim almashinuvi kuzatiladi. CSS: `hk-rise/hk-up/hk-kenburns/hk-drift/hk-twinkle`; `prefers-reduced-motion` da o‘chadi. Vaziyat kartochkalari `--i` bilan navbatma-navbat chiqadi.
- `public/i18n.js` (yangi): lotin→kirill transliteratsiyasi (o‘/g‘, sh/ch, yo/ya/yu/ye, so‘z boshida e→э, tutuq→ъ, o‘zlashma ts→ц: -tsiya/-tsess/-tsent; URL, email, AI/PDF kabi tokenlar o‘zgarmaydi); ru/en lug‘ati (~300 satr, normallashtirilgan kalit). MutationObserver dinamik matnni ham o‘giradi; asl matn WeakMap’da saqlanadi, til qaytarilganda tiklanadi. `HK_I18N.lang` → `/api/chat`, `/api/search`, `/api/kazus` so‘rovlariga `lang`; serverda `langNote()` system prompt’ga qo‘shiladi.
- Oferta: FK 360, 367, 369, 370 (lex.uz mundarijasi), “Shaxsga doir ma’lumotlar to‘g‘risida”gi Qonun (O‘RQ-547), “Mualliflik huquqi…” Qonuni 8-modda (lex.uz matni). Rekvizitlar bo‘sh — to‘ldirilishi kerak.
- Testlar: 40/40 (logotip, menyu, til tugmalari, oferta va sitemap, transliteratsiya, lug‘at to‘liqligi, AI tiliga ko‘rsatma).

## v11.1 — hisoblar va cookie roziligi

- Yangi fayllar: `netlify/shared/store.mjs` (Blobs / xotira), `netlify/shared/auth.mjs`, `netlify/functions/auth.mjs`, `netlify/functions/account.mjs`, `public/consent.js`, `public/accounts.js`; `package.json` → `dependencies: @netlify/blobs`.
- Production'da `HK_DEV_MEMORY_STORE` o'rnatilmaydi; Blobs import bo'lmasa 503 ("Hisob xizmati hozircha ulanmagan"), xotiraga hech qachon tushmaydi.
- `i18n.js` va `ui.js` til/mavzuni faqat `HK_CONSENT.allowed("prefs")` bo'lsa saqlaydi.
- FAQ va oferta maxfiylik bo'limi hisoblarga moslandi; ru/en lug'atiga ~70 satr qo'shildi.
- Testlar: 42/42 (ro'yxat, cookie atributlari, scrypt xesh, saqlash, chiqish, bloklash, begona origin, rozilik).

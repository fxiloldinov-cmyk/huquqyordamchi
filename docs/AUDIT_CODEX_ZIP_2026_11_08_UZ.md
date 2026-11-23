# Codex qayta auditi (ZIP) bo‘yicha mustaqil audit — 2026-11-08

**Tekshirilgan arxiv:** `HuquqYordamchi_v11_13_qayta_audit_2026_11_08.zip`. U v11.13 ustiga Codex o‘zgarishlari qo‘shilgan nusxa: 32 fayl o‘zgargan, 128 fayl qo‘shilgan.

**Usul — statik tekshiruv:**
- ish nusxasi bilan fayl va modda darajasida solishtirildi;
- kod o‘qib chiqildi;
- lex.uz bilan qo‘lda tekshirildi.

ZIP ichidagi kodni ishga tushirishga xavfsizlik qoidasi ruxsat bermadi (tashqi arxiv). Shuning uchun "207 test o‘tdi" da’vosi qayta ishga tushirib tasdiqlanmadi. Test e’lonlari soni (207) da’voga mos keladi.

## Codex to‘g‘ri qilgan ishlar (tasdiqlandi)

- **Uy-joy kodeksi havolasi.** Eski `lex.uz/docs/-106134` 404 qaytaradi, yangi `-106136` esa Uy-joy kodeksini ochadi. Bu bizda haqiqiy xato edi.
- **JK 244¹, 244², 246-moddalar.** Ular O‘RQ-1185 (02.11.2026) bo‘yicha yangilangan. Qonun lex.uz’da "rasmiy e’lon qilingan kundan e’tiboran kuchga kiradi" deydi (e’lon 03.11.2026), demak matn amalda. Masalan, 244²-modda 1-qismida jazo "5–15 yil" o‘rniga "5–10 yil" bo‘lgan.
- **FK 1-qism 288, 360, 382-moddalar.** Faqat imlo tuzatilgan: "boshqa shaxslapga bepilgan" → "boshqa shaxslarga berilgan", "yohud" → "yoxud".
- **Plenum 26-son qarori.** Qidiruv havolasi o‘rniga bevosita hujjat havolasi qo‘yilgan.
- **Importer.** Lex.uz sahifasidagi tugma matnlari (`.lx_elem2`) qonun matniga aralashmaydi.
- **Voqea sanasi.** U taqvim bo‘yicha tekshiriladi (`2026-02-30` rad etiladi), "bugun" Toshkent vaqtida hisoblanadi.
- **Tashqi havolalar.** Faqat `https` havolalar o‘tadi va ular "tashqi, tasdiqlanmagan" deb belgilanadi.
- **IIV 502 sanasi.** Taxminiy kuchga kirish sanasi `proposedEffectiveFrom` ga ko‘chirilgan. Hujjatni yoqish uchun yurist ko‘rigi va tasdiqlangan sana talab qilinadi.

## Topilgan muammolar (muhimligi bo‘yicha)

### 1. YUQORI — voqea sanasi ko‘rsatilsa, butun kodeks javobdan chiqarib tashlanadi

**Qayerda:** `netlify/shared/source-integrity.mjs` → `applicability()`. Agar `eventDate < law.asOf` bo‘lsa, `historical-text-unavailable` qaytadi. `passageRestriction` bu holatda **hujjatning barcha moddalarini** yashiradi.

**Bazadagi oxirgi tahrir sanalari:** MK 2026-10-15, FK1 2026-09-12, JK 2026-11-04, YHQ 2026-10-30. Demak, voqea sanasi shu kunlardan oldin bo‘lsa, kodeks javobga umuman berilmaydi.

**Misollar:**
- 2026-yil avgustda ishdan bo‘shatilgan foydalanuvchi Mehnat kodeksidan birorta modda olmaydi;
- oktabrdagi yo‘l jarimasi bo‘yicha savolga YHQ moddalari berilmaydi.

**Codex testlari buni o‘zi ko‘rsatadi:**
- `tests/v115.test.mjs` endi "2024-01-01 voqeasida MK’dan 0 parcha" kutadi;
- `tests/regression.test.mjs` da kazus sanasi `2026-10-12` dan `2026-10-16` ga surilgan, chunki MK tahriri 2026-10-15 da va eski sana bilan test yiqilardi.

**Ta’siri.** Codex ish oynasi (`workspace.js`) va kazusdan sanani chat serveriga ham yuboradigan qildi. Natijada sanali savollarning katta qismiga "Manba yetishmadi" chiqadi.

**Tavsiya.** Cheklovni modda darajasida qo‘llash kerak: faqat o‘zgartish izohida voqea sanasidan keyingi sana bor moddani yashirish yoki ogohlantirish bilan berish (v11.5 dagi kabi). Butun kodeksni yashirish ortiqcha.

### 2. YUQORI (halollik) — bitta umumiy gap asosida 20 hujjatga "yurist ko‘rigidan o‘tgan" belgisi qo‘yilgan

**Qayerda:** `data/review/approvals/user-text-attestation.json`. Asos sifatida "hamma matnlarni yurist tekshirdi bos" degan bitta gap yozilgan; yurist ismi yo‘q, ko‘rik sanasi yo‘q.

**Natija:**
- `data/source-status.json` da 20 hujjatning hammasiga `textReview: approved` qo‘yilgan;
- bu ro‘yxatga lex.uz’da hali yo‘q IIV 502 va nashr sanasi noma’lum Plenumlar ham kiradi;
- foydalanuvchiga har bir parcha yonida "manba matni yurist ko‘rigidan o‘tgan (foydalanuvchi tasdig‘i)" degan yozuv chiqadi (`integrityLabel`).

**Nega muammo.** CLAUDE.md va v11.13 qoidalariga ko‘ra "yurist tasdiqlagan" degan da’vo faqat haqiqiy ko‘rik bo‘lsa yoziladi. Agar 20 hujjatni yurist haqiqatan ko‘rmagan bo‘lsa, bu yozuv sayt foydalanuvchisini adashtiradi.

**Tavsiya.** Tasdiqni faqat haqiqatan ko‘rilgan hujjatlarga, yurist ismi va sanasi bilan qoldirish. Qolganlaridan bu yozuvni olib tashlash.

### 3. O‘RTA — qonun matni har qanday yangilansa, hujjat jim yashirinadi

`sourceMetadata()` har so‘rovda hujjatning to‘liq xeshini hisoblaydi va uni `data/source-status.json` dagi xesh bilan solishtiradi. Bitta belgi farq qilsa ham `local-content-changed` bo‘ladi va **butun hujjat** javobdan chiqariladi.

**Qachon yuz beradi:**
- `npm run law:update` orqali rasmiy import qilinganda;
- qo‘lda imlo tuzatilganda;
- `audit:sources` qayta ishga tushirilib, natija commit qilinmaganda.

`tests/traffic-v119.test.mjs` aynan shuni tasdiqlaydi: yangi import qilingan YHQ endi `found:false`.

Build yoki test bunday holatda to‘xtamaydi, xato faqat production’da "manba cheklovi" bo‘lib chiqadi.

**Haftalik workflow bilan birga.** Lex.uz’da yangi nashr chiqsa (`newer-publication`), PR qo‘shilgach yana butun kodeks yashiriladi. Kodekslar deyarli har oy o‘zgaradi.

**Tavsiya.**
- Xesh mos kelmasa, `npm run build` xato bilan to‘xtasin. Shunda muammo deploy’dan oldin ko‘rinadi.
- `newer-publication` holatida faqat o‘zgargan moddalarni cheklash kerak.

### 4. O‘RTA — unumdorlik: har so‘rovda o‘nlab marta to‘liq kodeks xeshlanadi

`lawContentHash()` butun hujjatni `JSON.stringify` qiladi va SHA-256 hisoblaydi. Lokal o‘lchov:

| Kodeks | Bitta xesh |
|---|---|
| MK | ~9 ms |
| JPK | ~10 ms |
| SK | ~15 ms |

Bu `retrieve` ichida har bir nomzod moddada, `sourcesPayload` da har parchada ikki marta va `claimChecks` da har da’voda chaqiriladi. Natijada bitta chat so‘roviga 0,3–0,6 soniya ortiqcha CPU sarflanadi.

**Tavsiya.** Xeshni hujjat obyekti bo‘yicha bir marta hisoblab, keshlab qo‘yish (WeakMap).

### 5. PAST — kazusda "Voqea sanasi: null"

`kazus.mjs`: avval sana yo‘q bo‘lsa "ko‘rsatilmagan" yozilardi. Endi `eventDate = body?.eventDate || null` va prompt `Voqea sanasi: ${eventDate}` ko‘rinishida, shuning uchun AI’ga "null" boradi.

### 6. PAST — saqlangan ishlarda yangi manba ma’lumotlari yo‘qoladi

`cases.mjs` → `cleanSources()` faqat `v:1` maydonlarini saqlaydi. `integrityNote`, `withheld` va `externalSources` "Ishlarim"ga saqlanmaydi, keyin ochilganda cheklov izohlari ko‘rinmaydi.

## Xulosa

Codex manbalar haqidagi ma’lumotni to‘g‘ri yangilagan: havolalar, JK va FK matnlari, importer. Lekin "ishonchsiz bo‘lsa berma" yondashuvini butun hujjat darajasida qo‘llagan. Natijada sayt sanali savollarning ko‘piga javob bera olmaydi (1-band). Bundan tashqari, bitta umumiy gap asosida hammaga "yurist ko‘rigidan o‘tgan" belgisi qo‘yilgan (2-band).

**Tavsiya etilgan reja:** Codex’ning tasdiqlangan foydali qismlarini olish, 1–6-bandlarni tuzatish, keyin to‘liq build va test.

## Birlashtirish natijasi (egasi roziligi bilan, 2026-11-08)

Codex’ning barcha o‘zgarishlari loyihaga ko‘chirildi (128 yangi, 32 o‘zgargan fayl). Ustidan quyidagilar tuzatildi:

1. **Sana cheklovi modda darajasida.** `applicability()` endi butun hujjatni yopmaydi. `retrieve()` faqat tahrir izohida voqea sanasidan keyingi sana bor moddani `historical-text-unavailable` sababi va modda raqami bilan chiqaradi. Ogohlantirishda modda raqamlari ko‘rsatiladi.
2. **Umumiy tasdiq yozuvi.** "Manba matni yurist ko‘rigidan o‘tgan" yozuvi foydalanuvchiga ko‘rsatilmaydi. `publicSourceMetadata()` `textReview` maydonini javoblardan va `coverage.json` dan olib tashlaydi. Ichki yozuv `data/review/approvals/` va `data/source-status.json` da tarix sifatida qoldi.
3. **Yangi nashr va build tekshiruvi:**
   - `newer-publication` endi butun kodeksni yashirmaydi: parcha beriladi va javob boshida "Lex.uz’da yangiroq tahrir chiqqan" ogohlantirishi chiqadi (`rag.stale`);
   - farqli moddalar avvalgidek `indexed-text-differs` bilan yopiladi;
   - `npm run build` qonun matni `data/source-status.json` dagi xeshga mos kelmasa, xato bilan to‘xtaydi.
4. **Unumdorlik.** `lawContentHash()` hujjat obyekti bo‘yicha keshlanadi.
5. **Kazus sanasi.** Sana bo‘lmasa, AI’ga "ko‘rsatilmagan" boradi.
6. **Saqlangan ishlar.** "Ishlarim" `withheld`, `externalSources`, `eventDate` va `integrityNote` ni ham saqlaydi.
7. **Qo‘shimcha topilma.** `approve-law-review.mjs` va `check-law-updates.mjs` Windows’da `C:\C:\...` yo‘l xatosi berardi (`URL.pathname`). `fileURLToPath` ga almashtirildi. Codex’ning tasdiqlash testi shu kompyuterda aynan shu sababli yiqilgan edi.

**Tekshiruv natijalari:**
- `npm run build` ishladi.
- `npm test`: 213 test, 211 o‘tdi, 0 yiqildi, 2 tasi o‘tkazib yuborildi (python3 yo‘q).
- Codex’ning 3 testi yangi qoidaga moslashtirildi; `tests/audit-merge-v1113.test.mjs` qo‘shildi.
- `npm run eval`: 46/46 nomzod topildi.

| Ko‘rsatkich | Codex nusxasida | Tuzatishdan keyin |
|---|---|---|
| `eligibleRecall` | 0,935 | 0,973 |
| `withheldCases` | 3 | 2 |
| `avgRetrievalMs` | 88 | 65 |

**Qolgan cheklov.** Tahrir izohi bo‘lmagan modda voqea sanasida umuman amalda bo‘lganmi — buni bilish uchun hujjatning kuchga kirish sanasi (`effectiveFrom`) kerak. Masalan, yangi Mehnat kodeksi 2023-04-30 dan amalda. Bu sanalar hali kiritilmagan. Blokda AI’ga voqea sanasi va nusxa sanasi beriladi va hozirgi matnni avtomatik qo‘llamaslik buyuriladi.

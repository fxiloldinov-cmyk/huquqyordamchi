# HuquqYordamchi v11.7 — hisobot

Sana: 2026-11-01. Deploy qilinmagan: natija tekshirish uchun ZIP sifatida topshirildi.

## 1. Boshlang‘ich holatni qayta tekshirish

| Ko‘rsatkich | Oldingi hisobot | Qayta tekshiruv (v11.6) |
|---|---|---|
| Testlar | 72 | 72/72 o‘tdi |
| Build | ishlagan | ishladi |
| Oflayn baholash (33 kazus) | recall 0.985, 32 to‘liq | recall 0.985, 32 to‘liq — E29 da FK 1135 topilmadi |

Topilgan qo‘shimcha nosozliklar (v11.6 da bor edi):
- `npm run eval` Windows’da umuman ishga tushmasdi (`main()` sharti `/` bilan yo‘l bo‘lardi).
- Mavzu regex’lari global (`/g`): `isLaborQuery()` va har qanday `.test()` `lastIndex`ni qoldirib, keyingi so‘rovda sohalar sanog‘ini buzishi mumkin edi.
- `accounts.js` dagi `history.replaceState` `app.js`dagi global `history` massiviga tushardi — email tasdiqlash va parol tiklash havolalari xato berardi.
- Bosh sahifa `canonical`, `og:url` va JSON-LD eski `huquqyordamchi.netlify.app` manziliga ishora qilardi (Google indekslamasligining asosiy sababi).

## 2. O‘zgarishlar

### 2.1 Manba ishonchliligi (`netlify/shared/rag.mjs`)
- `claimChecks()` qayta qurildi. So‘zlar mosligi endi **hech qachon** yashil tasdiq (✅) bermaydi.
- Har bir da’vo strukturali yozuv: `claimId, sourceId, doc, code, art, qism, band, excerpt (iqtibos parchasi), edition, url, method`, alohida maydonlar:
  `exists` (manba mavjud), `given` (parcha berilgan), `overlap` (so‘zlar mosligi, leksik), `quote` (iqtibos), `risks`, `reviewed: false` (yurist tekshirmagan), `model` (ikkinchi model — “avtomatik baho”).
- Javobdagi «iqtibos» rasmiy matnda so‘zma-so‘z borligi kod orqali tekshiriladi (`quoteFound`, “…” bilan qisqartirilgan iqtibos ham). Topilgan iqtibos ham “xulosa to‘g‘riligini kafolatlamaydi” deb belgilanadi.
- Xavf belgilari (`claimRisks`): inkor, istisno (“bundan mustasno”, “boshqacha nazarda tutilgan”), boshqa subyekt, muddat/miqdor (so‘z bilan yozilgan sonlar ham: “o‘ttiz kun” = “30 kun”), voqeadan keyingi tahrir.
- Manba yetishmaganda — “Manba yetishmadi” cheklovi va aniqlashtiruvchi savollar.
- Tarixiy tahrir bazada yo‘q bo‘lsa, hozirgi matn eski voqeaga avtomatik qo‘llanmaydi (prompt va da’vo darajasida).
- Javob oxiriga yashirin `⁣HK:SRC:<json>⁣` belgisi qo‘shiladi — o‘ng paneldagi manbalar ro‘yxati; matndan olib tashlanadi.
- Qarama-qarshi misollar bilan testlar: `tests/v117.test.mjs`.

### 2.2 Ombor atomarligi (`netlify/shared/store.mjs`, `limits.mjs`)
- `getWithMetadata` mavjudligi atomarlik dalili hisoblanmaydi. `setJSON` natijasida `modified: boolean` bo‘lmasa — `StoreNotAtomic` (avval ogohlantirib `true` qaytarardi).
- AI limitlari ombor ishlamasa yoki atomarlik tasdiqlanmasa **xavfsiz rad etadi** (503, foydalanuvchiga sodda xabar, administratorga logda sabab). Avval limitsiz o‘tkazib yuborardi.
- Hisob API’lari xuddi shunday 503 qaytaradi (yozildi deb aytilmaydi).
- Haqiqiy SDK shaklidagi adapter bilan konflikt testlari; `@netlify/blobs` `11.1.7` ga `package-lock.json` bilan mahkamlandi.

### 2.3 Sayt manzili
- `canonical`, `og:*`, JSON-LD, sitemap, robots — bitta `SITE_URL` (Netlify’da `URL`) dan. Build bosh sahifa manzillarini ham shu domenga moslaydi; test eski manzil qaytmasligini tekshiradi.

### 2.4 Yagona ish oynasi (`#ish`, `public/workspace.js`, `/api/account/cases`)
- Chapda: yangi ish, oxirgi ishlar, saqlangan materiallar (eski “Mening hisobim” materiallari — yo‘qolmaydi, “Ishga aylantirish” bilan nusxa ishga o‘tadi), kitob parchalari.
- Markazda: savol / kazus tahlili / bosqichma-bosqich maslahat / javobimni tekshirish, hujjat tahriri va versiyalari, DOCX.
- O‘ngda: javobdagi da’volar va tahlilga berilgan aniq parchalar; da’voga bosilganda parcha ochiladi.
- Mobil: “Ishlar | Ish | Manbalar” tablari.
- Har bir ish: savol, sana, soha, javob, strukturali manbalar, kitob parchalari, hujjat versiyalari.
- Ajratish: kalit sessiyadagi foydalanuvchi ID’sidan (`c_<uid>_<id>`); boshqa hisob ID orqali o‘qiy/o‘zgartira/o‘chira olmaydi (test bilan). Hisob o‘chirilsa, ishlar ham o‘chadi.

### 2.5 Ikki auditoriya va talaba rejimi
- Bosh sahifada “Huquqiy vaziyatim bor” va “Kazus ustida ishlayapman”; har biriga bosqichlar zanjiri.
- Talaba uchun `task: "hint"` — tayyor yechim emas: masala → norma → dalillar → o‘zini tekshirish savollari; “AI bahosi o‘qituvchi yoki universitet bahosi emas”.

### 2.6 DOCX va kitoblar
- Yangi testlar: uslub orqali berilgan shrift/o‘lcham/interval, sarlavha, raqamlash; jadval, kolontitul, footnote, bir nechta bo‘lim, rasm — ogohlantirish bilan.
- **Topilgan va tuzatilgan sizib chiqish:** namunadagi kolontitul matni, footnote matni, izoh mualliflari (`people.xml`), `customXml`, birinchi sahifa eskizi, shablon fayl yo‘li (`C:/Users/<ism>/…`), rsid izlari va rasmlar yangi eksportda qolardi — endi tozalanadi (`scrubPackage`).
- Namunada `numbering.xml` hujjatga ulanmagan bo‘lsa, ulanadi (aks holda Word raqamlarni ko‘rsatmaydi).
- Vizual tekshiruv: `docs/screens/06-…`, `07-…` (docx-preview renderi).
- Kitob parchalari kazusdan chiqmasdan qo‘shiladi va belgilanadi; manbalar panelida “foydalanuvchi yuklagan · rasmiy tekshirilmagan”. TSUL — ulanmagan (yashirin ulanish yo‘q).

### 2.7 Sud amaliyoti va baza qamrovi
- `data/court/decisions.json` (bo‘sh), `data/court/sources.json` (manba ruxsati), `netlify/shared/court.mjs` (hujjat turlari: qonun / Plenum / individual qaror), `scripts/import-court.mjs` (ruxsatsiz manba, demo yozuv, noto‘g‘ri domen — rad).
- “Baza qamrovi” (`#qamrov`, `public/coverage.json`): hujjatlar, moddalar, tahrir va import sanalari, ulanmagan manbalar — build paytida haqiqiy fayllardan.

### 2.8 Baholash
- E29: umumiy sabab — ko‘p sohali savolda ikkinchi darajali soha butun savol bo‘yicha qidirilardi va so‘zlashuvdagi “merosxo‘r” rasmiy “voris” bilan mos kelmasdi. Tuzatish: ikkinchi darajali soha o‘z gaplari bo‘yicha qidiriladi + so‘roq qismiga vazn + “merosxo‘r → voris”. Boshqa so‘z bilan ham tekshirildi.
- Yangi holatlar: so‘zlashuv (4), kirill (3), ruscha (3), fanlararo (+3). Ruscha savollar uchun huquqiy atamalar lug‘ati (to‘liq tarjima emas).
- Metrikalar alohida: retrieval recall; citation accuracy (faqat jonli); huquqiy xulosa — “baholanmagan, yurist kutilmoqda”. Jonli rejim kalitsiz ishga tushmaydi.

### 2.9 Mobil va PWA
- Pastki navigatsiya (Bosh sahifa, Qidiruv, Kazus, Ishlarim), 360–430 px’da gorizontal siljish yo‘q, 44 px+ tugmalar, iOS’da kattalashtirmaydigan 16 px maydonlar.
- `manifest.webmanifest`, ikonalar (192, 512, maskable), `sw.js` (versiyalangan kesh, faqat statik), `pwa.js` (yangilash taklifi — qoralama saqlanadi; o‘rnatish tugmasi faqat brauzer imkon bersa; iOS yo‘riqnomasi; push so‘ralmaydi), `offline.html` (keshlangan sana; “amaldagi” deb belgilanmaydi).
- `/api/*`, auth, sessiya, ishlar va AI javoblari keshlanmaydi. Hisobsiz ishni qurilmada saqlash — faqat belgilansa; chiqishda o‘chadi. Oflayn holatda so‘rov yashirincha qayta yuborilmaydi.

## 3. Natijalar

| Tekshiruv | Natija |
|---|---|
| `npm run build` | ✅ 32 vaziyat sahifasi, sitemap 35 URL, qamrov: 17 hujjat, 6 103 modda, 100 band, 0 sud qarori |
| `npm test` | ✅ **104/104** (72 eski + 32 yangi) — tashqi xizmatlar MOCK |
| `npm run eval` (oflayn, AI chaqirilmagan) | retrievalRecall **0.978**, 44/46; asl 33 holat — **33/33** (E29 tuzatildi); ruscha 3/3, kirill 3/3, so‘zlashuv 4/4, fanlararo 4/5 |
| Ochiq qolgan | E44 (OK 99), E45 (FPK 188) — uch sohali savollarda ikkinchi darajali modda chiqmayapti |
| `npm run eval:live` | ❌ ishga tushirilmadi — haqiqiy `GEMINI_API_KEY` yo‘q. Jonli AI sifati **o‘lchanmagan** |
| Citation accuracy | o‘lchanmagan (jonli rejim kerak) |
| Huquqiy xulosa bahosi | baholanmagan — 46 holatning birortasi yurist tomonidan tasdiqlanmagan |

## 4. Funksiyalar holati

| Holat | Funksiyalar |
|---|---|
| **Ishlaydi (kod + avtomatik test, tashqi xizmatsiz)** | RAG qidiruv, da’vo ↔ manba tekshiruvi, iqtibos tekshiruvi, ish oynasi API va ajratish, eski materiallarni ko‘chirish, kitob parchalari, DOCX yaratish va tozalash, sud moduli (bo‘sh baza), baza qamrovi, SITE_URL, PWA fayllari, oflayn baholash |
| **Mock bilan tekshirilgan** | Chat/kazus/maslahat oqimlari va manbalar paneli (Gemini o‘rniga `scripts/dev-mock.mjs`), Netlify Blobs atomarligi (SDK shaklidagi soxta adapter), ish oynasi brauzerda (lokal server, xotiradagi ombor) |
| **Tashqi xizmat sozlamasini kutmoqda** | Haqiqiy AI javoblari va jonli baholash (`GEMINI_API_KEY`), email tasdiqlash/parol tiklash (`RESEND_API_KEY`, `HK_MAIL_FROM`), sud qarorlari (ruxsatli manba), TSUL (rasmiy API), ikkinchi model tekshiruvi (ulanmagan), Netlify Blobs’ning haqiqiy muhitda shartli yozishi (deploydan keyin `/api/status` va ro‘yxatdan o‘tish bilan tekshirilsin) |

## 5. Ekranlar (`docs/screens/`)

1. `01-desktop-bosh-sahifa.jpg` — ikki boshlanish kartasi
2. `02-desktop-ish-oynasi.jpg` — uch ustunli ish oynasi, manbalar paneli (mock AI)
3. `03-mobil-360-bosh-sahifa.jpg` — pastki navigatsiya
4. `04-mobil-360-ish.jpg` — mobil tablar, ish
5. `05-mobil-360-manbalar.jpg` — mobil manbalar tabi
6. `06-docx-namuna-formatida.jpg`, `07-docx-standart-format.jpg` — eksport renderi

## 6. Qurilmada sinov

**Real Android Chrome va iPhone Safari’da sinalmagan.** Tekshiruv Chromium asosidagi ilova brauzerida 1366 px va 360 px emulyatsiyasida:
- ✅ gorizontal siljish yo‘q (360 px), pastki navigatsiya, mobil tablar, manbaga bosilganda parcha ochilishi;
- ✅ yangi versiya taklifi va yangilash (qoralama saqlandi), eski kesh o‘chirildi;
- ✅ oflayn holat emulyatsiyasi: ogohlantirish, “Yuborish” o‘chadi, 0 ta so‘rov; qayta ulanganda avtomatik yuborilmaydi;
- ✅ hisobdan chiqish: ekrandagi ish va qurilmadagi lokal nusxa o‘chdi, `/api/account/cases` → 401;
- ⏳ sinalmagan: haqiqiy o‘rnatish oynasi (beforeinstallprompt), iOS “Bosh ekranga qo‘shish”, real klaviatura xatti-harakati, fayl tanlash oynasi, DOCX’ni telefonda ochish.

## 7. Qolgan cheklovlar

- Jonli AI va citation accuracy o‘lchanmagan; kutilgan natijalar yurist tasdig‘ini kutmoqda.
- Uch sohali savollarda (E44, E45) ikkinchi darajali modda tushib qolishi mumkin.
- Ruscha savollar uchun faqat lug‘at bo‘yicha kengaytirish; javob rus tilida bo‘lsa ham manbalar o‘zbekcha.
- Leksik va qoidaga asoslangan xavf belgilari (inkor, istisno, subyekt, muddat) huquqiy tahlil emas: ular shubhani ko‘rsatadi, tasdiqlamaydi.
- Fayldan kazus yuklash — hozircha `.txt/.md`; `.docx` matnini ajratish yo‘q.
- Standart DOCX shablonidagi xatboshi chekinishi `Normal` uslubida; docx-preview uni ko‘rsatmadi (Word qo‘llaydi) — Word’da ko‘rib chiqish tavsiya etiladi.
- Ish oynasi va eski “Kazus ustaxonasi”/“AI yordamchi” oynalari yonma-yon ishlaydi; eski oynalarda manbalar paneli yo‘q (matnli hisobot bor).
- Sud qarorlari bazasi bo‘sh; manba ruxsati tekshirilmagan.

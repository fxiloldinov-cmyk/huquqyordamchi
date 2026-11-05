# HuquqYordamchi v11.11 — ko‘rib chiqish tuzatishlari

Sana: 2026-11-06. Asos: `HuquqYordamchi_v11_10.zip`. v11.10 loyiha papkasiga ko‘chirildi va quyidagi kamchiliklar tuzatildi. GitHub’ga push va Netlify deploy bajarilmadi.

## Tuzatilgan kamchiliklar

| # | Kamchilik | Nima qilindi |
|---|---|---|
| 1 | Bosh sahifadagi "Kazus pilot tariflari" havolasi hammaga ko‘rinardi va 19 000 / 39 000 so‘mlik narxlarni ko‘rsatardi. Ommaviy oferta esa xizmatni bepul deydi. | Havola `data-plans hidden` bilan yashirildi; `/api/features` endi `plans` flagini qaytaradi va havola faqat `HK_KAZUS_PLANS_ENABLED=1` bo‘lsa ochiladi. `/plans.html` flag o‘chiq bo‘lsa narx kartalarini ko‘rsatmaydi, "bepul ishlaydi" deb yozadi va `noindex` bilan qidiruv tizimlaridan yashirildi. `coach.html` menyusidagi tariflar havolasi olib tashlandi. |
| 2 | YHQning yo‘l belgilari va chiziqlar ilovalari (rasmlar, jadvallar) indekslanmagan, lekin bu haqda foydalanuvchiga aytilmasdi. | `trafficAnnexNotice()` qo‘shildi. Belgi yoki chiziq haqidagi savolda (lotin, kirill, rus tilida) cheklov AI manba blokiga yoziladi va AI uni javobda aytishi shart. Aqlli qidiruvda esa "Cheklovlar" maydoniga lex.uz havolasi bilan qo‘shiladi. |
| 3 | Kazus Coach’dagi 30 ta o‘quv vaziyati yurist tekshiruvidan o‘tmagan, lekin bosh sahifada oddiy bo‘lim sifatida ko‘rinardi. | Bosh sahifadagi kartaga "· sinov" belgisi qo‘shildi. `coach.html` boshida "Sinov rejimi" ogohlantirishi bor: natija baho yoki huquqiy xulosa emas. |
| 4 | Ovozli kiritishda telefon, pasport va karta raqamlarini yashirish audioga ishlamaydi, audio chet eldagi serverga ketadi. Ogohlantirishda buni aniq aytilmagan edi. | Rozilik matni besh tilda (uz/en/ru/de/fr) aniqlashtirildi: audio chet eldagi Google Gemini serveriga yuboriladi, raqamlar ovozda yashirilmaydi. `HK_VOICE_ENABLED=0` standartligicha qoldi. |
| 5 | Bosh sahifadagi yangi blok va tezkor savol maydoni rus va ingliz tillarida o‘zbekcha qolardi. | `i18n.js` ga 17 ta yangi ru/en tarjima qo‘shildi. Kirill avtomatik ishlaydi. |
| 6 | Python o‘rnatilmagan kompyuterda (Windows) `npm test` 2 ta testda yiqilardi. | Bu ikki test python3 topilmasa o‘tkazib yuboriladi (skip). GitHub CI’da Python o‘rnatiladi, u yerda ular ishlaydi. |
| 7 | v11.10 dagi `.gitignore` dan `.claude/` va `*.zip` qatorlari tushib qolgan edi, ZIP va lokal sozlamalar git’ga tushishi mumkin edi. | Qatorlar qaytarildi. |
| 8 | `CLAUDE.md` dan Netlify kreditlari haqidagi muhim yozuv tushib qolgan edi. | Qaytarildi va joriy holat (v11.11, push qilinmagan) yozildi. |

Versiya: `11.11.0` (`package.json`, `package-lock.json`, service worker).

## Tekshirilgan ishlar

- `npm run build` — o‘tdi. Domen to‘g‘ri: `https://huquqyordamchiuz.netlify.app`.
- `npm test` — 154 ta test: 152 tasi o‘tdi, 0 tasi yiqildi. Python’ga bog‘liq 2 tasi bu kompyuterda o‘tkazib yuborildi.
- Yangi `tests/v1111.test.mjs` (4 ta test): tariflar flagi, YHQ ilovalari cheklovi, Coach belgisi, ovoz ogohlantirishi, yangi tarjimalar.
- `npm run eval` — 46/46 kutilgan manba topildi. Bu AI javobining huquqiy aniqligi bahosi emas.
- Lokal brauzerda (`npm run dev`) quyidagilar tekshirildi:
  - bosh sahifada tariflar havolasi yashirin;
  - Travel/Business kartalari yashirin;
  - Coach kartasida "sinov" belgisi bor;
  - `?til=ru` da yangi blok ruscha;
  - `/plans.html` narx ko‘rsatmaydi;
  - `coach.html` da ogohlantirish bor va tariflar havolasi yo‘q;
  - konsolda xato yo‘q.

## Bajarilmagan yoki hal qilinmagan

- **Kod formati.** Yangi fayllar (`international.js`, `voice.js`, `coach.js` va boshqalar) siqilgan holda qoldi. Avtomatik formatlash sinab ko‘rildi, lekin 6 ta test yiqildi, chunki testlar bu fayllarning manba matnini to‘g‘ridan-to‘g‘ri tekshiradi. O‘zgarishlar bekor qilindi. Formatlash uchun avval testlarni xulq-atvorni tekshiradigan qilib qayta yozish kerak.
- **`coach.html`, `plans.html`, `international.html` to‘liq tarjimasi.** Bu sahifalar `i18n.js` ni yuklamaydi. `international.html` o‘zining besh tilli interfeysiga ega. Coach va tariflar sahifalari faqat o‘zbekcha.
- **Pilot tariflarni yoqish** quyidagilarni talab qiladi:
  1. Resend’ni sozlash, chunki email tasdig‘isiz grant ochilmaydi.
  2. `data/oferta.json` ga haqiqiy rekvizitlarni kiritish.
  3. Pullik xizmat uchun ofertani yangilash va yurist tekshiruvi.
- **Ovozli kiritishni yoqish:** shaxsga doir ma’lumotlarni chet elda qayta ishlash bo‘yicha yurist xulosasi kerak.
- **Yurist tekshiruvi:** 30 ta Coach vaziyati va `eval/cases.json`.
- **YHQ ilovalari** (belgilar rasmlari) hali indekslanmagan; endi faqat bu haqda ogohlantiriladi.
- **Jonli sinovlar bajarilmadi:** jonli Gemini, haqiqiy mikrofon, telefon va PWA.
- **Deploy:** Netlify kreditlari 2026-11-28 da yangilanadi. Barcha o‘zgarishlarni bitta deploy bilan chiqarish kerak.

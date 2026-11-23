# v11.13 hisoboti: baho, ustoz-talaba rejimi, kalkulyator skeleti

Sana: 2026-11-08. Deploy qilinmagan, chunki Netlify kreditlari 2026-11-28 gacha to‘xtatilgan. Uchala funksiya standart holatda o‘chiq. Batafsil: `docs/RETENTION_UZ.md`.

## Boshlang‘ich holat

- `npm run build` ishladi.
- `npm test` natijasi: 166 test, 164 o‘tdi, 0 yiqildi, 2 o‘tkazib yuborildi (python3 yo‘q).
- Topshiriqda aytilgan 2 ta ma’lum yiqilish (i18n CRLF va YHQ manba hashi) bu kompyuterda **takrorlanmadi**. Shuning uchun ularni yangi koddan ajratib ko‘rsatishga hojat bo‘lmadi.
- Ish daraxtida v11.13 dan oldingi, hali commit qilinmagan o‘zgarish bor: IIV 502-son yo‘riqnomasi (`data/pending/iiv502.json`, `docs/IIV502_IMPORT_UZ.md`). U shu seriya bilan birga turibdi.

## Nima o‘zgardi

| Soha | Fayllar |
|---|---|
| Flaglar | `netlify/shared/features.mjs`, `/api/features` (`feedback`, `classroom`, `calc`), `public/suite.js`, `.env.example` |
| Baho | `netlify/shared/feedback.mjs`, `netlify/functions/feedback.mjs`, `/api/chat` (`X-HK-Response-Id`), `public/feedback.js`, `public/app.js`, `public/index.html`, `public/premium.css`, `public/i18n.js` (ru/en), `scripts/export-feedback.mjs`, `scripts/stats.mjs` |
| Sinf | `netlify/shared/classroom.mjs`, `netlify/functions/classroom.mjs`, `public/classroom.html`, `public/classroom.js`, `public/classroom-coach.js` (`coach.html` ga ulandi), `scripts/grant-teacher.mjs` |
| Kalkulyator | `netlify/shared/calc.mjs` (parser, aniq kasr, validatsiya), `netlify/functions/calc.mjs`, `data/calc/calculators.json` (`[]`), `data/calc/holidays.json` (shablon), `scripts/build-data.mjs` (validatsiya → `netlify/shared/calc-approved.json`), `public/calc.html`, `public/calc.js` |
| Umumiy | `netlify/shared/store.mjs` (`list(prefix)`: administrator skriptlari uchun) |
| Hujjat va versiya | `package.json` 11.13.0, `CLAUDE.md`, `docs/RETENTION_UZ.md`, ushbu hisobot |
| Boshqa | `netlify.toml` `included_files` ga `data/laws/iiv502.json` qo‘shildi. Busiz yo‘riqnoma lex.uz havolasi bilan yoqilganda production funksiyasida topilmasdi. |

## Nima tekshirildi

- `npm run build` ishladi. Kalkulyatorlar: 0 ta yozuv, 0 ta tasdiqlangan.
- `npm test`: 186 test, 184 o‘tdi, 0 yiqildi, 2 o‘tkazib yuborildi (python3). Yangi 20 ta test:
  - `tests/feedback-v1113.test.mjs` (6 ta):
    - o‘chiq holat va 503;
    - chat javob ID’si tasodifiy, omborda savol matni yo‘q;
    - bitta javobga bitta baho (409);
    - izohdagi telefon va email yashirinadi;
    - yaroqsiz kirishlar;
    - tezlik chegarasi (7-baho 429);
    - kunlik statistika va CSV (formula in’ektsiyasi zararsizlanadi);
    - interfeys sharti.
  - `tests/classroom-v1113.test.mjs` (7 ta):
    - o‘chiq holat;
    - ustoz roli faqat grant va tasdiqlangan email bilan;
    - kod tasodifiy, 8 belgi, qayta yaratilganda eski kod ishlamaydi;
    - **kirish nazorati:** tizimga kirmagan foydalanuvchi 401; boshqa sinf ustozi, boshqa talaba va sinfdosh 404; `__proto__`/`constructor` amallari rad etiladi;
    - cheklovlar: 60 talaba, 10 sinf, 4000 va 8000 belgi, muddat;
    - o‘chirish oqimlari: talaba javobi, sinfdan chiqish, sinfni o‘chirish.
  - `tests/calc-v1113.test.mjs` (7 ta):
    - parser xavfsizligi: 28 ta xavfli yoki noto‘g‘ri ifoda rad etiladi; manbada `eval` yoki `new Function` yo‘q;
    - aniq arifmetika: 0.1+0.2, yaxlitlash rejimlari, nolga bo‘lish;
    - kirish turlari va oraliqlar;
    - validatsiya (noma’lum maydon, formula, modda, takroriy id);
    - tasdiqlanmagan yozuv ko‘rinmaydi;
    - `addWorkdays` faqat tasdiqlangan jadval bilan ishlaydi;
    - o‘chiq holat (503).
- Testdagi barcha soxta ma’lumot faqat `tests/` ichida va "TEST ONLY" belgisi bilan. `data/calc/` bo‘sh.
- `tests/release-v119.test.mjs` dagi versiya tekshiruvi 11.13.0 ga yangilandi.
- Brauzerda (lokal mock server, uchala flag yoqilgan):
  - mock AI javobi ostida "Foydali / Xato bor" chiqdi; "Xato bor" → sabab → yuborish → "Rahmat, bahoingiz saqlandi.";
  - sinf sahifasi tizimga kirmagan foydalanuvchiga "hisobingizga kiring" dedi;
  - tasdiqlangan kalkulyator yo‘q bo‘lgani uchun kalkulyator bo‘limi va bosh sahifadagi havola yashirin qoldi.

  Sinf oqimi brauzerda ustoz sifatida sinab ko‘rilmadi, chunki tasdiqlangan email kerak.

## Nima tekshirilmadi

- Jonli Netlify Blobs (`list`, `onlyIfNew`) — faqat xotiradagi ombor bilan sinaldi.
- Ko‘p foydalanuvchili haqiqiy sinf (bir vaqtda 60 talaba), haqiqiy telefon va brauzerlar.
- Brauzerda qo‘lda bosib ko‘rish:
  - baho tugmalari: jonli AI javobi kerak;
  - sinf sahifasi: tasdiqlangan email kerak, Resend sozlanmagan.

  Interfeys faqat manba matni bo‘yicha testlangan.
- Haqiqiy Gemini, to‘lov va email chaqiruvlari bajarilmadi.
- Administrator skriptlari (`export-feedback`, `stats`, `grant-teacher`) haqiqiy Netlify tokeni bilan ishga tushirilmadi, faqat xotiradagi ombor bilan.

## Bajarilmagan yoki cheklangan joylar

- **Tillar.** Topshiriqda 5 til so‘ralgan (uz, ru, en, de, fr). Sayt faqat uz, kirill, ru va en tillarini qo‘llab-quvvatlaydi. Baho tugmalari shu tillarda. Sinf va kalkulyator sahifalarida "faqat o‘zbekcha" deb aniq yozilgan. Nemis va fransuz tillari qo‘shilmadi.
- **"Bilmayman" ulushi.** U "RAG manba bermagan javoblar ulushi" orqali taxminiy hisoblanadi, AI matni tahlil qilinmaydi.
- **Saqlash muddati.** Baho yozuvlari uchun avtomatik tozalash yo‘q.
- **Ustoz roli.** Email tasdig‘i talab qilinadi, Resend esa sozlanmagan. Shuning uchun Resend ulanmaguncha ustoz roli amalda ishlamaydi.
- **Oferta.** Baho va sinf yoqilsa, "nima saqlanadi" matni o‘zgaradi. Ofertani yangilash egasining ishi, kodda o‘zgartirilmadi.

## Keyingi qo‘shimcha (2026-11-08)

- Yuqori menyuga "Travel", "Business" va "Kalkulyator" havolalari qo‘shildi. Ular faqat tegishli flag yoqilganda ko‘rinadi.
- `data/calc/calculators.json` ga 5 ta kalkulyator yozildi. Formulalar qonun matnidan olingan:
  - aliment: bir, ikki, uch va undan ortiq bola — OK 99-modda (daromadning 1/4, 1/3 yoki 1/2 qismi; har bir bola uchun eng kam ish haqining kamida 26,5 foizi);
  - jarimani 15 kun ichida 50 foiz va 30 kun ichida 70 foiz miqdorida to‘lash — MJtK 332¹-modda.
- Eng kam ish haqi miqdorini foydalanuvchi o‘zi kiritadi, chunki u qonun matnida emas, alohida farmonda belgilanadi.
- `lawyerReview: "tasdiqlangan"` holatini sayt egasi chatda tasdiqladi.
- Cheklovlar:
  - sud aliment miqdorini kamaytirishi yoki ko‘paytirishi mumkin;
  - MJtK 332¹-moddaning 2-qismidagi istisnolar (131, 132, 136, 140-moddalar, shikoyat qilinganda, takroran sodir etilganda) kalkulyatorda hisoblanmaydi va faqat sarlavhada eslatiladi.

## Siz to‘ldirishingiz kerak bo‘lgan fayllar

- `data/calc/calculators.json`: kalkulyatorlar, `lawyerReview: "tasdiqlangan"` faqat yurist ko‘rigidan keyin.
- `data/calc/holidays.json`: dam olish kunlari (`weekend`), bayramlar va ularning manbasi.
- `data/oferta.json`: flaglarni yoqishdan oldin baho va sinf ma’lumotlari bo‘yicha band.
- Netlify env: `HK_FEEDBACK_ENABLED`, `HK_CLASSROOM_ENABLED`, `HK_CALC_ENABLED` (hammasi hozir 0).

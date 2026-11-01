# v11.7 — sozlash va ma’lumotlarni ko‘chirish

## 1. O‘rnatish (lokal)

Node.js 22+ kerak.

```bash
npm ci
npm run build
npm test
npm run dev
```

`npm ci` — `package-lock.json` dagi aniq versiyalar (`@netlify/blobs` 11.1.7). Lokal server: `http://localhost:3000`.

AI kalitisiz interfeysni ko‘rish uchun (Gemini o‘rniga soxta javob, faqat lokal):

```bash
node scripts/dev-mock.mjs --port 4174
```

## 2. Netlify

Avvalgidek (`SOZLASH_UZ.md`): `GEMINI_API_KEY` majburiy; `RESEND_API_KEY` va `HK_MAIL_FROM` — email uchun; limitlar ixtiyoriy.

Yangi xulq:
- Netlify Blobs ishlamasa yoki shartli yozishni tasdiqlamasa, **AI so‘rovlari 503** bilan rad etiladi (“so‘rovlar hisoblagichi ulanmagan”). Bu nazoratsiz xarajatdan himoya. Deploydan keyin bitta AI so‘rovi va ro‘yxatdan o‘tishni sinab ko‘ring; logda `store: shartli yozish tasdiqlanmadi` bo‘lsa — `npm ci` bilan qayta deploy qiling.
- Sayt manzili: Netlify `URL` o‘zgaruvchisidan (yoki `SITE_URL`). O‘z domeningizni ulaganda `SITE_URL=https://domeningiz.uz` qo‘ying — canonical, og, sitemap, robots avtomatik yangilanadi.

## 3. Mavjud ma’lumotlarni ko‘chirish

Avtomatik ko‘chirish **shart emas** — eski ma’lumot o‘chirilmaydi:

| Ma’lumot | Ombor kaliti | v11.7 da |
|---|---|---|
| Saqlangan materiallar (kazus, suhbat) | `items` / `i_<uid>` | O‘zgarmaydi. “Ishlarim” chap panelida ko‘rinadi; “Ishga aylantirish” nusxadan yangi ish yaratadi, asl material qoladi |
| Kitob parchalari | `books` / `b_<uid>` | O‘zgarmaydi; kazusda tanlab ishlatiladi |
| Hisoblar, sessiyalar, limitlar | `users`, `sessions`, `ratelimit` | O‘zgarmaydi |
| **Ishlar (yangi)** | `cases` / `ci_<uid>` (ro‘yxat), `c_<uid>_<id>` (ish) | Yangi ombor |

Hisob o‘chirilganda `items`, `books` va barcha `cases` yozuvlari o‘chiriladi.

## 4. Sud qarorlarini qo‘shish (kelajak)

1. `data/court/sources.json` da manbani tekshiring: rasmiy ochiq manba, foydalanish/qayta tarqatish ruxsati. So‘ng `status: "ruxsat-berilgan"`, `permission` (ruxsat qanday olingani), `hosts` (domenlar), `checkedAt`.
2. Qarorlarni JSON massiv sifatida tayyorlang: `court, caseNumber, date (YYYY-MM-DD), instance, docType, sourceId, sourceUrl, text`.
3. `node scripts/import-court.mjs qarorlar.json --dry-run`, keyin `--dry-run`siz.
4. `npm run build && npm test`. “Baza qamrovi”da son ko‘rinadi.

Demo yoki test yozuvlar, ruxsatsiz manba va boshqa domen rad etiladi.

## 5. PWA

- Fayllar: `public/manifest.webmanifest`, `public/sw.js`, `public/pwa.js`, `public/offline.html`, `public/assets/icon-*.png`.
- Ikonalarni qayta yaratish (Windows): `powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1`.
- Service worker versiyasi `npm run build` paytida statik fayllar mazmunidan hosil bo‘ladi. Har deploydan oldin `npm run build` (Netlify buni o‘zi qiladi).
- Yangi versiya o‘zi faollashmaydi: sahifa “Yangilash” taklif qiladi; yozilayotgan matn `sessionStorage` orqali saqlanadi.
- HTTPS shart (Netlify’da bor). `localhost` dan boshqa HTTP manzilda SW ishlamaydi.
- Keshlanmaydi: `/api/*` (AI, hisob, sessiya, ishlar, kitoblar), POST so‘rovlar, boshqa domenlar.
- Telefonda tekshirish ro‘yxati (real qurilmada hali bajarilmagan):
  1. Android Chrome: sayt → “O‘rnatish” taklifi → bosh ekrandan ochish (standalone).
  2. iPhone Safari: Ulashish → “Bosh ekranga qo‘shish”.
  3. Samolyot rejimi → sahifa ochiladi, “Internet yo‘q” va keshlangan sana ko‘rinadi; AI tugmasi o‘chiq.
  4. Kirish/chiqish; chiqishdan keyin “Ishlarim” bo‘sh.
  5. Kazus → tahlil → Manbalar tabi → parcha ochiladi → Saqlash → Word (.docx) yuklab ochish.
  6. Yangi deploydan keyin “Yangi versiya” taklifi, yozilgan matn saqlanishi.

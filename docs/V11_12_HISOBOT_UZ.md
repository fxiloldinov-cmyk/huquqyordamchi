# HuquqYordamchi v11.12 — alifbo paneli birlashtirildi

Sana: 2026-11-06. Asoslar:
- loyihadagi v11.11 (commit 0ad2057, ko‘rib chiqish tuzatishlari);
- `HuquqYordamchi_v11_11 (1).zip` — v11.10 asosida alohida tayyorlangan "Yangi alifboga o‘tkazish" paneli. Bu zip ham o‘zini "v11.11" deb ataydi, lekin unda v11.11 tuzatishlari yo‘q.

Ikkala versiya v11.10 ni umumiy asos qilib uch tomonlama birlashtirildi va natija v11.12 deb belgilandi. v11.11 tuzatishlari saqlandi: tariflar havolasi yashirin, YHQ ilovalari ogohlantirishi, Coach sinov belgisi, ovoz ogohlantirishi, tarjimalar.

## Qo‘shilgan: Yangi alifboga o‘tkazish paneli

- `/alphabet.html` sahifasi bilan bog‘liq fayllar: `alphabet.js`, `alphabet-core.js`, `alphabet.css`.
- `/api/alphabet-import` (DOCX import) va `/api/alphabet-translate` (ruscha matnni tarjima qilish) endpointlari.
- Bosh sahifaga uchta havola qo‘shildi: menyudagi "Alifbo", hero blokda va kazus bo‘limida.
- O‘zbek lotin va kirill matni O‘RQ–1184 jadvali bo‘yicha (Ö, Ğ, Ş, Ç) brauzerning o‘zida o‘giriladi. Bu hech qayerga yuborilmaydi.
- Ruscha tarjima `HK_TRANSLATION_ENABLED=0` bilan standart holatda o‘chiq. `/api/features` endi `translation` flagini ham qaytaradi.
- Panel PWA keshiga (`sw.js`) va `sitemap.xml` ga qo‘shildi.
- Batafsil: `docs/ALIFBO_UZ.md`.

Alifbo panelining asl hisoboti (alohida zipdan) qisqacha:
- 8 ta yangi test qo‘shilgan.
- Jonli Gemini, ruscha tarjima sifati va haqiqiy Word fayllari sinab ko‘rilmagan.
- Transliterator to‘liq imlo tekshirgich emas.
- Qonun 2027-04-22 da kuchga kiradi, shuning uchun panel ixtiyoriy vosita.

## Birlashtirishda hal qilingan ziddiyatlar

| Fayl | Nima qilindi |
|---|---|
| `netlify/functions/features.mjs` | Ikkala flag birga qoldirildi: `plans` (v11.11) va `translation` (alifbo). |
| `public/index.html` | v11.11 dagi bosh sahifa (yashirin tariflar havolasi, "sinov" belgisi) saqlandi, alifbo havolalari ustiga qo‘shildi. |
| `public/sw.js` | Alifbo fayllari kesh ro‘yxatiga qo‘shildi, versiya build orqali yangilandi. |
| `.env.example`, `scripts/build-data.mjs`, `scripts/dev.mjs` | Avtomatik, ziddiyatsiz birlashdi. |

Versiya: `11.12.0`.

## Tekshirildi

- `npm run build` — o‘tdi. Sitemap 36 URL, domen `huquqyordamchiuz.netlify.app`.
- `npm test` — 162 ta test: 160 tasi o‘tdi, 0 tasi yiqildi. Python’ga bog‘liq 2 tasi bu kompyuterda o‘tkazib yuborildi.
- `npm run eval` — 46/46.
- Lokal brauzerda tekshirildi:
  - bosh sahifada 3 ta alifbo havolasi bor;
  - tariflar havolasi va Travel/Business kartalari yashirin;
  - `/alphabet.html` da "Oʻzbekiston, choʻl, gʻisht, shahar" → "Özbekiston, çöl, ğişt, şahar" deb o‘girildi;
  - konsolda xato yo‘q.

## Nega xalqaro bo‘limlar (Travel / Business Legal) ko‘rinmaydi

1. **Jonli sayt eski versiyada.** Netlify kreditlari tugagani uchun jonli sayt hali v11.7 (1e8f5b6) da ishlayapti. Unda xalqaro bo‘lim umuman yo‘q.
2. **Bo‘lim ataylab o‘chirilgan.** Yangi deploy qilingandan keyin ham kartalar `HK_INTERNATIONAL_ENABLED=1` bo‘lmaguncha yashirin turadi. Bu v11.9 da shunday qilingan, chunki bazada viza, ro‘yxatdan o‘tish, konsullik va investitsiya bo‘yicha maxsus qonun matnlari yo‘q. Bunday savollarga bo‘lim "bazada ma’lumot yo‘q" deb javob beradi.
3. **Yoqish usuli.** Netlify → Site configuration → Environment variables bo‘limida `HK_INTERNATIONAL_ENABLED=1` qilib, keyin deploy qilinadi. Tavsiya: avval Viza tartibi, Chet el fuqarolarining huquqiy holati, Investitsiya qonuni kabi tegishli matnlarni lex.uz’dan bazaga qo‘shish. Aks holda bo‘lim ko‘p savolga javob bera olmaydi.

## Bajarilmagan

- **Deploy:** Netlify kreditlari 2026-11-28 da yangilanadi.
- **Pullik tariflar, ovoz, ruscha tarjima va xalqaro bo‘limni yoqish:** har biri o‘z shartlariga bog‘liq (oferta, Resend, yurist xulosasi, qonun matnlari).

# HuquqYordamchi v11.5 — sozlash yo‘riqnomasi

Maxfiy qiymatlar (kalitlar) faqat Netlify’ga kiritiladi: **Site configuration → Environment variables**, Scopes: **Functions**. Kalitni GitHub’ga, ZIP’ga yoki chatga yozmang. O‘zgaruvchini qo‘shgandan yoki o‘zgartirgandan keyin saytni qayta deploy qiling.

## 1. Majburiy

| O‘zgaruvchi | Vazifasi |
|---|---|
| `GEMINI_API_KEY` | AI suhbat, aqlli qidiruv va kazus ustaxonasi. Bo‘lmasa, AI funksiyalari "ulanmagan" deydi; katalog va yo‘riqnomalar ishlayveradi. |

Tekshirish: `https://<sayt>/api/status`. U kalit borligini, ishlagan modelni va sozlamalar holatini ko‘rsatadi. Kalitning o‘zi hech qachon ko‘rsatilmaydi.

## 2. AI sarfi va limitlar (ixtiyoriy)

| O‘zgaruvchi | Standart | Izoh |
|---|---|---|
| `HK_AI_DISABLED` | — | `1` — barcha AI so‘rovlarini darhol o‘chiradi (favqulodda). |
| `HK_AI_DAILY_LIMIT` | 600 | Butun sayt bo‘yicha kunlik AI so‘rovlari. Kazus davomi ham hisoblanadi. |
| `HK_AI_IP_HOURLY` | 40 | Bitta IP uchun soatlik so‘rovlar. |
| `HK_AI_USER_DAILY` | 150 | Bitta hisob uchun kunlik so‘rovlar. |

- Hisoblagichlar Netlify Blobs’da atomar oshiriladi, shuning uchun funksiyaning bir nechta nusxasida ham umumiy ishlaydi.
- IP ochiq holda saqlanmaydi, faqat xeshi saqlanadi.
- Kunlik chegara faqat so‘rovlar sonini cheklaydi. Pul miqdoridagi aniq chegarani Google AI Studio / Cloud Billing’da **budget alert** va **kvota** orqali ham qo‘ying: bu sayt kodi to‘lovni ko‘ra olmaydi.

## 3. Email: tasdiqlash va parolni tiklash (ixtiyoriy)

| O‘zgaruvchi | Izoh |
|---|---|
| `RESEND_API_KEY` | resend.com kaliti. |
| `HK_MAIL_FROM` | Tasdiqlangan domendagi jo‘natuvchi, masalan: `HuquqYordamchi <noreply@sizning-domen.uz>`. |

- **Sozlanmagan bo‘lsa:** ro‘yxatdan o‘tish ishlaydi. "Parolni unutdim" va "Tasdiqlash xati" esa "xat yuborish xizmati sozlanmagan" deb ochiq javob beradi — "xat yuborildi" deyilmaydi.
- **Narx:** Resend’ning bepul tarifi bor, lekin limit va narxni o‘zingiz tekshiring. Bu xizmatni men yoqmadim.
- **Domen:** `netlify.app` subdomenidan xat yuborish uchun o‘z domeningiz va DNS (SPF/DKIM) sozlamasi kerak bo‘ladi.

## 4. Netlify Blobs

- Hisoblar, sessiyalar, saqlangan materiallar, kitob parchalari va limit hisoblagichlari Netlify Blobs’da saqlanadi.
- `@netlify/blobs` (>= 8.2) build vaqtida `package.json` orqali o‘rnatiladi; alohida sozlash kerak emas.
- 8.2 dan eski versiyada shartli yozish (parallel yozuvlardan himoya) ishlamaydi va logda ogohlantirish chiqadi.

## 5. Qonunlar bazasini yangilash (GitHub Actions)

1. Repo → Settings → Actions → General:
   - **Read and write permissions**;
   - **Allow GitHub Actions to create and approve pull requests**.
2. Ixtiyoriy: Variables → `LEX_WORD_URL_TEMPLATE` — lex.uz Word yuklash havolasi (`{id}` yoki `{num}` bilan). Bo‘lmasa, workflow yangi tahrirni topganda faqat issue ochadi.
3. Ixtiyoriy: Secrets → `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

**Qo‘lda yangilash:**

```
pip install beautifulsoup4
node scripts/check-law-updates.mjs --file ok=<lex.uz’dan yuklangan.doc>
npm run build && npm test
```

**Orqaga qaytarish:** `node scripts/check-law-updates.mjs --rollback ok`. Arxivda har bir hujjatning oxirgi 3 ta tahriri saqlanadi.

## 6. TSUL kutubxonasi

Hozir **ulanmagan**. Batafsil: `TSUL_INTEGRATION_UZ.md`. Foydalanuvchilar o‘zlari foydalanishga haqli bo‘lgan kitob parchalarini "Mening hisobim → Kitob parchalarim" bo‘limiga yuklab, kazusda ishlatishlari mumkin.

## 7. Huquqiy sifatni o‘lchash

| Buyruq | Nima qiladi | Narx |
|---|---|---|
| `npm run eval` | 30 ta kazus bo‘yicha faqat manba topish (RAG) | Bepul, oflayn |
| `HK_EVAL_LIMIT=5 npm run eval:live` | Haqiqiy Gemini API bilan javob sifatini o‘lchaydi | **Pullik bo‘lishi mumkin** |

- `eval:live` uchun `GEMINI_API_KEY` kerak. Taxminiy xarajatni hisoblash uchun `HK_PRICE_IN_PER_M` va `HK_PRICE_OUT_PER_M` qiymatlarini kiriting.
- `eval/cases.json` dagi kutilgan natijalar yurist tasdig‘ini kutmoqda (`lawyerReview: "kutilmoqda"`).

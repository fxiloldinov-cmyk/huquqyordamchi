# Qaytish uchun sabab: baho, sinf, kalkulyator (v11.13)

Maqsad: foydalanuvchini saytda majburan ushlab turish emas, unga qaytishga haqiqiy sabab berish. Shuning uchun quyidagilar yo‘q: sun’iy tanqislik, jazolovchi seriyalar, bezovta qiluvchi xabarlar, push-bildirishnomalar, reyting va "do‘stni chaqir" bonuslari, hisob ochishga majburlash. Savolga manbali javob olish uchun ro‘yxatdan o‘tish shart emas. Uchinchi tomon trekerlari yo‘q.

Uchala funksiya standart holatda o‘chiq. Har birini Netlify → Environment variables orqali `=1` qilib yoqasiz. O‘chiq bo‘lsa:
- API 503 qaytaradi;
- interfeysda karta yoki havola ko‘rinmaydi (`/api/features` → `false`);
- sahifa sitemap va service worker keshiga kirmaydi.

**Yoqishdan oldin** ofertadagi "nima saqlanadi" bo‘limini yangilang. Baho va sinf ma’lumotlari Netlify Blobs’da saqlanadi.

## 1. Javobga baho — `HK_FEEDBACK_ENABLED`

- `/api/chat` har bir javobga tasodifiy `X-HK-Response-Id` beradi. U savol matnidan hosil qilinmaydi.
- Javob ostida "Foydali" va "Xato bor" tugmalari chiqadi. "Xato bor" tanlansa, sabab so‘raladi: noto‘g‘ri modda, eskirgan ma’lumot, tushunarsiz yoki boshqa. Ixtiyoriy izoh 500 belgigacha yoziladi.
- `POST /api/feedback {responseId, rating, reason, comment}`.
- Saqlanadi (`feedback` ombori):
  - `r_<id>`: vaqt, RAG bergan manba id'lari (masalan `mk:131`), manbasiz javob belgisi;
  - `f_<id>`: baho, sabab, izoh (`redactPII` dan o‘tgan), manba id'lari, vaqt.
- **Saqlanmaydi:** savol matni, javob matni, IP (limit uchun faqat qisqartirilgan xesh, oyna tugagach eskiradi), foydalanuvchi ID.
- Har bir javobga faqat bitta baho beriladi; takroriy urinish 409 qaytaradi. Javob 30 kundan keyin baholanmaydi. IP bo‘yicha daqiqasiga 6 ta.
- Administrator skriptlari (`NETLIFY_SITE_ID` va `NETLIFY_AUTH_TOKEN` muhitdan olinadi):
  - `node scripts/export-feedback.mjs feedback.csv` — CSV eksport. `=`, `+`, `-`, `@` bilan boshlanuvchi kataklar Excel formulasi sifatida ishlamasligi uchun zararsizlantiriladi.
  - `node scripts/stats.mjs [--json]` — kunlik jamlama: javoblar, manbasiz javoblar ulushi, baholar, "foydali" ulushi, sabablar.
- **Cheklov:** "bilmayman" javoblar ulushi AI matnini tahlil qilmasdan hisoblanadi. U "RAG manba bermagan javoblar ulushi" sifatidagi taxminiy ko‘rsatkich.
- **Saqlash muddati:** avtomatik o‘chirish hali yo‘q. Muddatni belgilang (masalan, 12 oy) va yozuvlarni qo‘lda tozalang. Avtomatik tozalash keyingi ish.
- **Tillar:** tugmalar o‘zbek (lotin va kirill), rus va ingliz tillarida. Sayt nemis va fransuz tillarini qo‘llab-quvvatlamaydi.

## 2. Ustoz va talaba — `HK_CLASSROOM_ENABLED`

- **Rollar.** Ustoz roli faqat qo‘lda beriladi: `node scripts/grant-teacher.mjs --email ustoz@... [--revoke]`. Email tasdiqlanmagan bo‘lsa (`emailVerified !== true`), rol ishlamaydi. Resend hali sozlanmagan, shuning uchun hozir hech kim email tasdiqlay olmaydi va ustoz roli amalda ishlamaydi.
- **Ustoz:**
  - sinf yaratadi (10 tagacha);
  - 8 belgili tasodifiy kod oladi va uni qayta yaratishi mumkin, eski kod shu zahoti ishlamay qoladi;
  - topshiriq qo‘shadi: sarlavha, kazus (4000 belgigacha), ixtiyoriy muddat;
  - javoblarni bir joyda ko‘radi va izoh hamda ixtiyoriy baho yozadi.
- **Talaba:**
  - kod bilan qo‘shiladi (sinfda 60 tagacha talaba);
  - `/coach.html?topshiriq=…` sahifasida IRAC ish varag‘ini to‘ldiradi;
  - "Mening dastlabki javobim" maydonini topshiradi (8000 belgigacha) va muddatgacha qayta topshirishi mumkin;
  - o‘z javobini o‘chirishi va sinfdan chiqishi mumkin. Chiqqanda shu sinfdagi javoblari ham o‘chadi.
- **AI va baholash.** AI baho qo‘ymaydi va bu oqimda AI chaqirilmaydi. Ish varag‘idagi tekshiruv faqat tuzilishni (to‘ldirilgan maydonlarni) sanaydi.
- **Maxfiylik:**
  - talaba ishini faqat o‘zi va o‘z sinfining ustozi ko‘radi;
  - boshqa sinf ustozi, boshqa talaba va sinfdosh 404 oladi, shuning uchun sinf mavjudligi ham oshkor bo‘lmaydi;
  - ustoz talabaning ismi va emailini ko‘radi;
  - matnlar `redactPII` dan o‘tadi.
- **O‘chirish.** Ustoz sinfni o‘chirsa, topshiriqlar, javoblar va kod ham o‘chadi.
- **Xabarnomalar.** Email yuborilmaydi, hammasi sayt ichida.
- **Til.** Sahifa faqat o‘zbekcha va bu sahifada aniq yozilgan.

## 3. Kalkulyatorlar — `HK_CALC_ENABLED`

Huquqiy mazmunni (stavka, muddat, formula, modda) **faqat yurist** kiritadi. Kod faqat sxema va tekshiruvni beradi.

### `data/calc/calculators.json`: kalkulyatorlar massivi (hozir `[]`)

```json
{
  "id": "kichik-lotin-va-chiziqcha",
  "title": "Foydalanuvchiga ko‘rinadigan nom",
  "inputs": [
    {"key": "summa", "label": "Summa (so‘m)", "type": "money", "min": 0, "max": 1000000000}
  ],
  "formula": "summa * ... / 100",
  "rounding": {"decimals": 2, "mode": "half_up"},
  "unit": "so‘m",
  "sourceRef": "mk:131",
  "lawyerReview": "kutilmoqda"
}
```

- `type`: `number`, `integer`, `money` (2 xonagacha) yoki `date` (YYYY-MM-DD). `min` va `max` ixtiyoriy. Sana uchun ular ham sana bo‘ladi.
- **Formula tili:** sonlar, kirish o‘zgaruvchilari, `+ - * /`, qavslar, `min(...)`, `max(...)`, `round(x, xonalar)`, `addWorkdays(sana, n)`. Boshqa hech narsa qabul qilinmaydi. `eval` yoki `new Function` ishlatilmaydi. Hisob aniq kasrlarda bajariladi, suzuvchi nuqta xatosi chiqmaydi.
- `rounding.mode`: `half_up`, `floor` yoki `ceil`. `decimals` 0–4 oralig‘ida. `unit: "date"` bo‘lsa, natija sana bo‘ladi.
- `sourceRef`: `hujjat:modda` ko‘rinishida, `data/laws/<hujjat>.json` dagi mavjud modda bo‘lishi shart (masalan `mk:131`, `fk1:333`).
- **Rad etiladi:**
  - noma’lum maydon;
  - noto‘g‘ri formula;
  - formulada kirishlar orasida yo‘q o‘zgaruvchi;
  - takroriy `id`.

  Bunday xato bo‘lsa `npm run build` to‘xtaydi.
- `lawyerReview`: `"kutilmoqda"` bo‘lgan yozuv foydalanuvchiga, API’ga va keshga tushmaydi. Faqat `"tasdiqlangan"` yozuvlar `netlify/shared/calc-approved.json` (build natijasi, qo‘lda tahrirlanmaydi) orqali ko‘rinadi.

### `data/calc/holidays.json`: ish kunlari jadvali (`addWorkdays` uchun)

```json
{"schema": 1, "lawyerReview": "kutilmoqda", "sourceRef": "", "weekend": [], "days": []}
```

- `weekend`: dam olish kunlari raqamlari (0 — yakshanba, 6 — shanba). Bu huquqiy mazmun, shuning uchun bo‘sh qoldirilgan; uni siz to‘ldirasiz.
- `days`: `[{"date": "YYYY-MM-DD", "note": "..."}]` ko‘rinishidagi bayram va dam olish kunlari.
- Jadval tasdiqlanmaguncha `addWorkdays` ishlatgan kalkulyator build’dan o‘tmaydi.

### Sahifa

`/calc.html` tasdiqlangan kalkulyatorlarni ko‘rsatadi. Har bir natija yonida formula va modda havolasi chiqadi, ostida "Hisob-kitob yo‘naltiruvchi, rasmiy xulosa emas." yozuvi turadi. Tasdiqlangan yozuv bo‘lmasa, bo‘lim va bosh sahifadagi havola ko‘rinmaydi. Sahifa faqat o‘zbekcha.

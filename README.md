# HuquqYordamchi v10

O‘zbekiston qonunchiligi bo‘yicha mustaqil axborot loyihasi. Ko‘k-oq portal dizayni, huquqiy mavzudagi rasm, aqlli qidiruv, ariza generatori, kodekslarning sodda izohi va kazus ustaxonasi.

## Tez ishga tushirish

Node.js 22 yoki yangiroq versiya kerak. Loyiha ildizida:

```bash
npm run build
npm test
npm run dev
```

Brauzerda `http://localhost:3000` ni oching. Lokal server uchun qo‘shimcha npm paketlari talab qilinmaydi. Portni `npm run dev -- --port 4173` orqali o‘zgartirish mumkin. `index.html` ni file:// orqali ochish o‘rniga serverdan foydalaning.

AI uchun `.env.example` dan `.env` nusxasini yarating va `GEMINI_API_KEY` ni kiriting. `GEMINI_MODEL` provayder hisobingizdagi Google Search vositasini qo‘llaydigan model bo‘lishi kerak. Kalitsiz ariza generatori, katalog va sodda umumiy izohlar ishlaydi; AI oynasi ulanish yo‘qligini aniq bildiradi.

## Netlify’ga yangilash

Loyihaning **butun papkasini** repozitoriyga joylang va Netlify orqali build qiling. Faqat `public/` papkasini qo‘lda statik yuklash AI funksiyalarini o‘rnatmaydi.

- Build: `npm run build`
- Publish directory: `public`
- Functions directory: `netlify/functions`
- Node.js: 22 yoki yangiroq
- Server muhiti: `GEMINI_API_KEY`; ixtiyoriy `GEMINI_MODEL`
- `ALLOWED_ORIGINS`: bo‘sh bo‘lsa saytning o‘z origin’i; aks holda vergul bilan ajratilgan to‘liq origin’lar, masalan `https://your-site.netlify.app`. Protokol va port ham hisobga olinadi.

Kalitni frontendga, ZIPga yoki ochiq repozitoriyga qo‘ymang. AI so‘rovlari tashqi provayderga ketadi; kvota va billing sozlamalarini hisobingizda tekshiring. Mahalliy dev server internetga chiqarish uchun mo‘ljallanmagan.

Ushbu arxiv tayyorlash paytida jonli saytga deploy qilinmadi va haqiqiy Gemini kaliti ishlatilmadi. Yangilashdan keyin `/api/chat`, `/api/search`, `/api/kazus`, `/api/news` ni hosting muhitida sinang.

## v10 dagi o‘zgarishlar

- Sayt nomi HuquqYordamchi; Lex.uz portalidan ilhomlangan ko‘k-oq ko‘rinish, mobil CSS va tungi rejim.
- Namunalar: nikohdan ajratish, aliment, YHXX jarimasiga shikoyat va firibgarlik alomatlari yuzasidan ariza. Avvalgi to‘rtta boshqa namuna bilan jami 8 ta.
- Aliment ulushi bolalar soniga mos. Nizoli holatda sud buyrug‘i andozasi bloklanadi. Sud chiqargan jarima qarori uchun organ qarori andozasi qo‘llanmaydi.
- Rekvizitlar shu brauzer oynasi xotirasida qoladi; sahifani yangilash tozalaydi. Nusxa olish, TXT va brauzer orqali chop etish/PDF mavjud.
- Aqlli qidiruv lotin, kirill va `JK 168` kabi raqamli so‘rovlarni qabul qiladi. AI javobi xulosa, normalar, amaliy qadamlar, dalillar, cheklovlar va manbalar tuzilmasida so‘raladi.
- Kodekslarda “Sodda tilda tushuntirish”: umumiy izoh, savol/modda matni, oddiy misol, istisno va amaliy qadamlar. Batafsil individual tushuntirish AI ulanishini talab qiladi.
- Kazusda soha, voqea sanasi, tuzilma va ikki vazifa: tahlil qilish yoki talaba javobini tekshirish. Nusxa olish va TXT yuklash bor.
- Yangiliklarning to‘rtta turi alohida filtrlanadi. RSS ishlamasa, 2026-10-28 sanali mavjud zaxira ko‘rsatiladi. Jonli lentada ayrim tur bo‘lmasa, shu tur zaxiradan to‘ldiriladi va belgilanadi.
- Uzun AI javobidan keyingi suhbat, kutish vaqti, to‘xtatish, uzilgan/bo‘sh oqim va xatolik holatlari yaxshilandi.

## Ma’lumot va manbalarni yangilash

`data/legal.json` — sayt va Telegram bot uchun yagona vaziyat/kodeks/modda katalogi. Uni o‘zgartirgach `npm run build` ni bajaring. Natija `public/legal-data.js` ga yoziladi.

`reviewedAt` faqat aynan ko‘rsatilgan modda raqami va nomi tekshirilgan yozuvlarda berilgan. Bu butun huquqiy xulosa yoki barcha katalog yozuvlari tasdiqlanganini anglatmaydi. AI manbalari mavjudligi ham xulosaning to‘g‘riligini kafolatlamaydi.

Asosiy foydalanilgan rasmiy hujjatlar:

- Mehnat kodeksi: https://lex.uz/uz/docs/-6257288
- Oila kodeksi: https://lex.uz/uz/docs/-104720
- Fuqarolik kodeksi, 2-qism: https://lex.uz/docs/180552
- Fuqarolik protsessual kodeksi: https://lex.uz/uz/docs/-3517337
- Ma’muriy javobgarlik to‘g‘risidagi kodeks: https://lex.uz/docs/97664
- Jinoyat kodeksi: https://lex.uz/uz/docs/-111453
- Jinoyat-protsessual kodeksi: https://lex.uz/uz/docs/-111460
- Iste’molchi huquqlari to‘g‘risidagi qonun: https://lex.uz/acts/-4704

Vaziyat sanasiga mos kuchga kirgan tahrirni tanlang. Katalog to‘liq normativ baza emas; arizalar boshlang‘ich namuna. Muhim ish bo‘yicha hujjatni topshirishdan oldin tegishli talab, organ, muddat va dalillarni tekshiring.

## Tuzilma va tekshiruv

`public/` — brauzer interfeysi; `netlify/functions/` — API; `netlify/shared/` — umumiy himoya va AI oqimi; `data/` — yagona katalog; `scripts/` — build va lokal server; `tests/` — 23 ta regressiya testi; `telegram_bot/` — alohida bot.

## TSUL kitoblari

TSUL Digital orqali brauzerda kirish va kitob matnini o'qish tekshirildi. Serverdan avtomatik olish hali ulanmagan; `/api/kazus` bu holatni ochiq qaytaradi va tahlil oxirida ko'rsatadi. Kitob iqtibosi va sahifalarini uydirmaslik qoidalari qo'shildi. Maxfiy kirish ma'lumotlari loyihaga kiritilmagan. Tekshiruv dalillari va doimiy ulanish shartlari [TSUL_INTEGRATION_UZ.md](TSUL_INTEGRATION_UZ.md) da.

`TECHNICAL_REVIEW_UZ.md` da tuzatilgan muammolar va qolgan cheklovlar yozilgan. Botning sozlash yo‘riqnomasi `telegram_bot/README_BOT.md` da. Hero rasmi ushbu loyiha uchun AI yordamida yaratilgan.

## SEO va Google'da ko‘rinish

`npm run build` har bir vaziyat uchun `public/vaziyat/<slug>/index.html` statik sahifasini, `public/vaziyat/index.html` ro‘yxatini, `public/sitemap.xml` va `public/robots.txt` ni yaratadi. Sayt manzili Netlify'dagi `URL` o‘zgaruvchisidan olinadi (yoki `SITE_URL`). Yangi vaziyat qo‘shganda `legal.json` da unga lotincha `slug` bering.

Google Search Console: saytni "URL prefix" sifatida qo‘shing, tasdiqlash faylini `public/` ga joylang, so‘ng `sitemap.xml` ni yuboring. Yandex Webmaster uchun ham xuddi shunday qiling. Shaxsiy domen ulansa, `public/index.html` dagi canonical va og:url manzillarini yangilang.

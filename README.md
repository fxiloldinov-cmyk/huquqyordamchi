# v11.12 yangi alifbo paneli

`/alphabet.html`: o‘zbek lotin/kirill matnini O‘RQ–1184 bo‘yicha yangi alifboga o‘tkazish, DOCX import/eksport, ixtiyoriy ruscha tarjima (`HK_TRANSLATION_ENABLED=0`). v11.11 tuzatishlari saqlangan. [Hisobot](docs/V11_12_HISOBOT_UZ.md), [panel](docs/ALIFBO_UZ.md). Deploy bajarilmadi.

# v11.11 ko‘rib chiqish tuzatishlari

Tariflar havolasi `HK_KAZUS_PLANS_ENABLED=1` bo‘lmaguncha yashirin; YHQ belgilar ilovasi cheklovi javobda aytiladi; Coach "sinov" deb belgilandi; ovoz ogohlantirishi aniqlashtirildi; bosh sahifa yangi bloki ru/en tarjima qilindi. [Hisobot](docs/V11_11_HISOBOT_UZ.md). Deploy bajarilmadi.

# v11.10 manbalar va diktovka

172-son YHQning asosiy bandlari va 975-son nizom foydalanuvchi yuklagan eksportlardan bazaga qo‘shildi. Ixtiyoriy diktovka standartda o‘chiq (`HK_VOICE_ENABLED=0`). [Hisobot](docs/V11_10_HISOBOT_UZ.md), [ovozli kiritish](docs/VOICE_UZ.md), [import chegaralari](docs/YHQ_IMPORT_UZ.md). Deploy bajarilmadi.

# v11.9 tuzatishlari

Amaldagi xatti-harakat va cheklovlar: [hisobot](docs/V11_9_HISOBOT_UZ.md). Xalqaro modul standartda o‘chiq. Grantlar Blobs’da; email tasdig‘i majburiy. Quyidagi v11.8 yozuvlari oldingi relizga tegishli.

# v11.8 funksional kengaytma

Yangi Travel Legal, Business Legal, Kazus Learning Coach va ixtiyoriy pilot tariflari: [V11_8_HISOBOT_UZ.md](docs/V11_8_HISOBOT_UZ.md). Haqiqiy to‘lov va ommaviy deploy yoqilmagan. Quyidagi eski hisobotlar v11.7 asosiga tegishli.

# HuquqYordamchi v11.7

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
- Server muhiti: `GEMINI_API_KEY`; ixtiyoriy `GEMINI_MODEL` (standart `gemini-3.8-flash`, vergul bilan zaxira modellar) va `GEMINI_THINKING_LEVEL` (`low` standart)
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

`public/` — brauzer interfeysi; `netlify/functions/` — API; `netlify/shared/` — umumiy himoya va AI oqimi; `data/` — yagona katalog; `scripts/` — build va lokal server; `tests/` — 35 ta regressiya testi; `telegram_bot/` — alohida bot.

## TSUL kitoblari

TSUL Digital orqali brauzerda kirish va kitob matnini o'qish tekshirildi. Serverdan avtomatik olish hali ulanmagan; `/api/kazus` bu holatni ochiq qaytaradi va tahlil oxirida ko'rsatadi. Kitob iqtibosi va sahifalarini uydirmaslik qoidalari qo'shildi. Maxfiy kirish ma'lumotlari loyihaga kiritilmagan. Tekshiruv dalillari va doimiy ulanish shartlari [TSUL_INTEGRATION_UZ.md](TSUL_INTEGRATION_UZ.md) da.

`TECHNICAL_REVIEW_UZ.md` da tuzatilgan muammolar va qolgan cheklovlar yozilgan. Botning sozlash yo‘riqnomasi `telegram_bot/README_BOT.md` da. Hero rasmi ushbu loyiha uchun AI yordamida yaratilgan.

## SEO va Google'da ko‘rinish

`npm run build` har bir vaziyat uchun `public/vaziyat/<slug>/index.html` statik sahifasini, `public/vaziyat/index.html` ro‘yxatini, `public/sitemap.xml` va `public/robots.txt` ni yaratadi. Sayt manzili Netlify'dagi `URL` o‘zgaruvchisidan olinadi (yoki `SITE_URL`). Yangi vaziyat qo‘shganda `legal.json` da unga lotincha `slug` bering.

Google Search Console: saytni "URL prefix" sifatida qo‘shing, tasdiqlash faylini `public/` ga joylang, so‘ng `sitemap.xml` ni yuboring. Yandex Webmaster uchun ham xuddi shunday qiling. Shaxsiy domen ulansa, `public/index.html` dagi canonical va og:url manzillarini yangilang.

## AI ishlashi (v10.5)

- Standart model `gemini-3.8-flash`. Google 2.5 modellarini faqat ularni avval ishlatgan hisoblarga qoldirgan, shuning uchun yangi kalit bilan `gemini-2.5-flash` rad etilardi. Model topilmasa yoki ruxsat bo‘lmasa, keyingi modelga avtomatik o‘tiladi.
- Noto‘g‘ri kalitda foydalanuvchiga "GEMINI_API_KEY ni tekshiring" degan aniq xabar chiqadi; batafsil sabab Netlify → Functions loglarida (`AI provider ...`).
- Netlify sinxron funksiyasi 60 soniyada to‘xtatiladi. Kazus javobi 48 soniyada xavfsiz to‘xtatiladi va brauzer davomini avtomatik so‘raydi (ko‘pi bilan 4 qism). Manbalar birinchi qismdan oxirigacha saqlanadi.
- Chat va kazusda Google qidiruvi aynan qidiruv sababli rad etilsa, javob qidiruvsiz beriladi va boshida ochiq ogohlantirish turadi. Aqlli qidiruvda bunday almashtirish yo‘q.

## RAG: rasmiy matnga tayangan javoblar (v10.6)

Chat, aqlli qidiruv, "Sodda tilda tushuntirish" va kazus AI'ga so‘rov yuborishdan oldin `netlify/shared/rag.mjs` orqali mos parchalarni topadi va ularni "TASDIQLANGAN MANBA PARCHALARI" sifatida beradi.

- **Baza:** `data/laws/mk.json` — Mehnat kodeksi, 593 modda, lex.uz eksporti, 2026-10-15 holatidagi tahrir (o‘zgartish izohlari bilan). `data/laws/plenum-26-2023.json` — Oliy sud Plenumining 2023-yil 20-noyabrdagi 26-son qarori, 74 band; bandlar ular tilga olgan MK moddalariga bog‘langan.
- **Qidiruv:** "MK 163" kabi aniq havola; BM25 (o‘zbekcha qo‘shimchalar olib tashlanadi, kirill→lotin); uzun kazusda har bir gap alohida izlanadi; kundalik so‘zlar mavzu jadvali orqali kerakli moddalarga yo‘naltiriladi ("kasal" → MK 163, 165).
- **Faqat mehnatga oid** savollarda yoki kazusda soha "Mehnat huquqi" bo‘lsa ishlaydi; boshqa mavzularga parcha qo‘shilmaydi.
- **Tekshiruv:** javob oxirida "Manba tekshiruvi" chiqadi: ✅ berilgan rasmiy matndagi modda/band, ⚠️ kodeksda bor lekin berilmagan, ❌ mavjud emas. Aqlli qidiruvda MK natijalari rasmiy sarlavha bilan almashtiriladi va belgilanadi.
- **Yangilash:** lex.uz’dan hujjatni Word shaklida yuklab, `npm run import:law -- <fayl.doc> data/laws/mk.json --doc mk --lex-id -6257288` (bandli hujjat uchun `--lex-id` ixtiyoriy). `pip install beautifulsoup4` kerak. So‘ng `npm test`.
- **Cheklov:** baza amaldagi tahrirni saqlaydi; voqea sanasidagi eski tahrir alohida saqlanmaydi — buning o‘rniga tahrir izohlari beriladi va tekshiruvda ogohlantiriladi. Telegram botga RAG hali ulanmagan.

## AI ishlamasa: /api/status (v10.7)

Brauzerda `https://<sayt>/api/status` ni oching. Sahifa Google'ga kichik sinov so‘rovi yuboradi va sababni o‘zbekcha yozadi: kalit yo‘q / noto‘g‘ri / oshkor bo‘lgani uchun o‘chirilgan / referer cheklovi / API yoqilmagan / kvota / model. Kalit hech qachon ko‘rsatilmaydi. `?search=1` Google qidiruvini ham sinaydi (bepul limitdan 1 so‘rov). Kalitdagi bo‘sh joy, qo‘shtirnoq yoki `GEMINI_API_KEY=` prefiksi avtomatik tozalanadi.

## Kundalik vaziyatlar: 32 ta yo‘riqnoma (v10.8)

20 ta yangi yo‘riqnoma qo‘shildi; jami 32 ta, 5 guruhda (`group` maydoni):

- **Mehnat (9):** sinov muddati, yillik ta’til, homiladorlik va bola parvarishi ta’tili, ish vaqti va ortiqcha ish, o‘z xohishi bilan ketish, xodimning moddiy javobgarligi, shartnomasiz ishlash (+ eski 2 ta). Har bir MK moddasi `data/laws/mk.json` rasmiy matni bilan solishtirilgan; test buni avtomatik tekshiradi.
- **Oila (6):** nikohdan o‘tish, otalikni belgilash, bola kim bilan qoladi, er-xotin mulkini bo‘lish (+ ajrashish/aliment, meros).
- **Uy va pul (6):** qarz qaytarilmasa, elektr/gaz hisobi nizosi, uy oldi-sotdisi, MIB qarzdorligi va karta bloki (+ ijara, kredit).
- **Xarid va internet (3):** onlayn xarid va qaytarish (+ sifatsiz tovar, kiberfiribgarlik).
- **Davlat va ijtimoiy (8):** YTH va OSAGO, yoshga doir pensiya, nogironlik, Ijtimoiy reyestr va bolalar nafaqasi (+ jarima, pasport, ta’lim krediti, biznes).

Bosh sahifada guruh filtri va dastlab 12 ta kartochka ("Barcha 32 ta vaziyatni ko‘rsatish" tugmasi) bor; `/vaziyat/` sahifasi guruhlarga bo‘lingan, har bir sahifadagi "Boshqa vaziyatlar" avval shu guruhdan olinadi. Yangi yozuvlarda `reviewedAt` (manbalar bilan solishtirilgan sana) saqlanadi va sahifada ko‘rsatiladi.

**Eslatma:** Oila kodeksi, Fuqarolik kodeksi va boshqa qonunlarning to‘liq matni hali bazada yo‘q — ulardagi modda raqamlari lex.uz mundarijasi va gov.uz/advice.uz rasmiy tushuntirishlari bo‘yicha tekshirildi. Bu kodekslarni lex.uz’dan Word shaklida yuborsangiz, ular ham MK kabi RAG bazasiga qo‘shiladi va avtomatik tekshiriladi.

## v11: animatsiyalar, Hidoya logotipi, 4 til, ommaviy oferta

- **Animatsiyalar** (`public/motion.js` + `styles.css` oxiri): bosh sarlavha satrma-satr chiqadi, rasm sekin yaqinlashadi va parallaks, bo‘limlar aylantirganda paydo bo‘ladi, kartochkalar ko‘tariladi, talabalar blokida suzuvchi yorug‘lik. "Harakatni kamaytirish" yoqilgan qurilmada hammasi o‘chadi.
- **Logotip:** Hidoya belgisi (peshtoq + yulduz) — sarlavha, footer, rasm ostidagi yozuv, favicon va barcha statik sahifalar.
- **Tillar** (`public/i18n.js`): O‘zbekcha (lotin) · Ўзбекча (kirill) · Русский · English. Kirill — butun sahifa avtomatik o‘giriladi. Rus/ingliz — interfeys, vaziyat sarlavhalari va kodekslar lug‘at bo‘yicha; yo‘riqnoma matnlari va hujjat namunalari hozircha o‘zbekcha (sahifada ogohlantirish chiqadi). Tanlov brauzerda saqlanadi, `?til=ru` bilan ham ochiladi. AI so‘rovlariga `lang` yuboriladi — rus/ingliz tanlansa javob shu tilda yoziladi.
- **Kazus ustaxonasi:** menyu va bo‘lim nomi.
- **Ommaviy oferta:** `/oferta/` (`data/oferta.json` dan yaratiladi). ⚠️ E’lon qilishdan oldin `data/oferta.json` → `requisites` dagi ijrochi nomi, STIR, manzil, email va telefonni to‘ldiring va `npm run build` qiling. Yurist ko‘rib chiqishi tavsiya etiladi.
- **Raqamlar:** interfeysdagi bezak raqamlar olib tashlandi (namuna misollari, hisoblagichlar, xabarlar).

## v11.1: hisoblar va cookie roziligi

- **Cookie banneri** (`public/consent.js`): "Hammasini qabul qilish" / "Faqat zarurlari" / "Sozlash". Zarur — hisobga kirish cookie'si; Sozlamalar — til va tungi rejimni eslab qolish (rozilik bo'lmasa saqlanmaydi). Reklama/kuzatuv cookie'lari yo'q. Footer'da "Cookie sozlamalari" — tanlovni qayta ochadi.
- **Hisoblar** (`netlify/functions/auth.mjs`, `account.mjs`, `netlify/shared/auth.mjs`, `store.mjs`):
  - `POST /api/auth/register|login|logout|password|delete`, `GET /api/auth/me`, `GET/POST /api/account/items`.
  - Parol — scrypt xeshi (ochiq parol saqlanmaydi); sessiya — tasodifiy token, `HttpOnly; Secure; SameSite=Lax` cookie, omborda faqat token xeshi; 8 ta xato urinishdan keyin 15 daqiqa bloklash; IP bo'yicha limitlar; begona origin rad etiladi.
  - Ro'yxatdan o'tishda ommaviy oferta qabul qilinadi (tahrir sanasi hisobda saqlanadi).
  - Saqlash: kazus tahlili va AI suhbat — foydalanuvchi "Saqlash"ni bosganda (eng ko'pi 50 ta). "Mening hisobim" (`#account`): ro'yxat, ochish, o'chirish, parolni almashtirish, hisobni o'chirish.
  - Ombor: **Netlify Blobs** (`@netlify/blobs` — build paytida o'rnatiladi; qo'shimcha sozlash kerak emas). Lokal `npm run dev` va testlarda xotiradagi ombor.
- **Qilinmagan:** parolni email orqali tiklash (email yuborish xizmati kerak).
- **Huquqiy eslatma:** hisob ma'lumotlari Netlify serverlarida (xorijda). 2026-yilgi o'zgarishlardan keyin oddiy shaxsga doir ma'lumotlarni xorijda saqlash shartlar bilan ruxsat etilgan; shartlar va shaxsga doir ma'lumotlar bazasini ro'yxatdan o'tkazish talabini yurist bilan tekshiring.

## v11.2: Oila va Fuqarolik kodekslari bazada, haftalik yangilash

- **Yangi rasmiy matnlar** (`data/laws/`): `ok.json` (Oila kodeksi, 12.09.2026 tahriri), `fk1.json` (FK 1-qism, 12.09.2026), `fk2.json` (FK 2-qism, 23.06.2026). Har birida kuchini yo‘qotgan moddalar ro‘yxati (`repealed`) bor.
- **RAG endi uch kodeks bo‘yicha** (`netlify/shared/rag.mjs`):
  - Savol mavzusi bo‘yicha MK, OK yoki FK tanlanadi; ko‘p sohali kazusda har bir soha kamida 2 ta modda oladi.
  - Kazusda tanlangan fan (mehnat/oila/fuqarolik) va chatda tanlangan kodeks har doim qidiriladi.
  - Havolalar: `MK 163`, `OK 27-moddaning 9-qismi`, `Fuqarolik kodeksining 1135-moddasi`, `FK 26¹`.
  - Manba tekshiruvi: ✅ berilgan, ⚠️ kodeksda bor, 🚫 kuchini yo‘qotgan, ❌ bunday modda yo‘q.
  - Aqlli qidiruvda FK qismi adashsa, havola to‘g‘ri qismga to‘g‘rilanadi.
- **Kodekslar bo‘limida** bazadagi rasmiy matn holati (tahrir sanasi) ko‘rsatiladi.
- **Yo‘riqnomalar rasmiy matn bilan qayta tekshirildi**: uy sotish (FK 480, 481, 488), mulk bo‘lish (OK 12, 26, 27), otalik (OK 61, 62), bola kim bilan qoladi (OK 68, 75, 76), qarz (FK 109, 150, 735). Testlar har bir yo‘riqnomadagi OK/FK havolasini bazadan tekshiradi.

### Qonunlarni yangilash

- **Avtomatik tekshiruv** — `.github/workflows/law-update.yml`, har dushanba 08:37 (Toshkent):
  1. lex.uz sahifasidagi eng so‘nggi tahrir sanasini bazadagi bilan solishtiradi.
  2. Yangi tahrir bo‘lsa: Word faylni yuklaydi, import qiladi, `npm run build` va testlarni ishga tushiradi, **PR ochadi**.
  3. O‘zgargan moddalar ro‘yxati PR tavsifida bo‘ladi.
- **Yoqish uchun (bir marta):**
  - GitHub → Settings → Actions → General → *Workflow permissions*: **Read and write permissions** va **Allow GitHub Actions to create and approve pull requests**.
  - Settings → Secrets and variables → Actions → *Variables*: `LEX_WORD_URL_TEMPLATE` — lex.uz’dagi Word yuklash havolasi, hujjat ID o‘rniga `{id}` (masalan, `-104720`) yoki `{num}` (`104720`). Bu o‘zgaruvchi bo‘lmasa, workflow yangi tahrirni topganda faqat **issue ochadi** — Word faylni qo‘lda yuklab, quyidagi buyruq bilan import qilasiz.
  - Ixtiyoriy: Secrets’ga `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHAT_ID` — natija Telegram’ga keladi.
- **Qo‘lda yangilash:** lex.uz’dan Word faylni yuklab oling va:
  ```
  pip install beautifulsoup4
  npm run law:update -- --file ok=~/Downloads/30.04.1998.doc --file fk2=~/Downloads/29.08.1996.doc
  npm run build && npm test
  ```
  Kalitlar: `kon`, `mk`, `ok`, `fk1`, `fk2`, `fpk`, `jk`, `jpk`, `mjtk`, `sk`, `ujk`, `ipk`, `ist`. Skript moddalar soni keskin kamaysa yoki fayl eski tahrir bo‘lsa, bazani o‘zgartirmaydi.
- Yangi kodeks qo‘shish: Word faylni yuboring — import, RAG yo‘naltirish va testlar shu tartibda qo‘shiladi.

## v11.3: Jinoyat, protsessual va ma’muriy kodekslar

- **Bazaga qo‘shildi** (`data/laws/`):

  | Fayl | Kodeks | Tahrir |
  |---|---|---|
  | `jk.json` | Jinoyat kodeksi | 15.10.2026 |
  | `jpk.json` | Jinoyat-protsessual kodeksi | 15.10.2026 |
  | `mjtk.json` | Ma’muriy javobgarlik to‘g‘risidagi kodeks | 15.10.2026 |
  | `fpk.json` | Fuqarolik protsessual kodeksi | 12.09.2026 |

  Endi 7 ta kodeks bazada — taxminan 4 400 modda.
- **JPK kirill yozuvida** (lex.uz eksporti shunday). Rasmiy matn o‘zgartirilmagan. Sarlavhaning lotincha nusxasi (`titleLatn`) qidiruv natijasida ko‘rsatiladi; qidiruv lotin so‘rov bilan ham ishlaydi.
- **RAG yo‘naltirish:**
  - o‘g‘irlik, firibgarlik, tan jarohati, haqorat → JK (va kerak bo‘lsa MJtK);
  - ushlab turish, advokat, ariza berish → JPK;
  - svetofor, kamera, mastlik, jarima va unga shikoyat → MJtK;
  - da’vo arizasi, davlat boji, sudlov, apellyatsiya → FPK.
  - Kazusda "Jinoyat huquqi", "Ma’muriy huquq", "Jinoyat-protsessual", "Fuqarolik protsessual" tanlansa, tegishli kodeks majburiy qidiriladi.
- **Havolalar:** `JK 169`, `JPK 221`, `MJtK 128³` / `MJtK 128-3`, `FPK 188`, to‘liq nomlari bilan ham.
- **Yo‘riqnomalar:**
  - "YHXX jarimalari": kamera qayd etganda mulkdorning javobgarlikdan ozod bo‘lishi (MJtK 17-1(5)), shikoyatda davlat bojidan ozodlik (315), imtiyozli to‘lov va uning istisnolari (332-1).
  - "Kiberfiribgarlik": ariza ko‘rib chiqish muddati (JPK 322, 329, 330).
- **Importer:**
  - kirill eksportini o‘qiydi;
  - "BIRINCHI BOʻLIM", "I bob", "12 1 -bob" sarlavhalarini taniydi;
  - butun bob kuchini yo‘qotganini va yuqori indeksli chiqarilgan moddalarni aniqlaydi.
- **Haftalik yangilash** endi 8 ta hujjatni tekshiradi (kirill sahifadagi "15.10.2026 й." sanasi ham o‘qiladi).

## v11.4: Konstitutsiya, Soliq, Uy-joy, IPK va Iste’molchilar qonuni

- **Bazaga qo‘shildi:**

  | Fayl | Hujjat | Tahrir |
  |---|---|---|
  | `kon.json` | Konstitutsiya (2023-yil 30-apreldagi) | 14.07.2026 |
  | `sk.json` | Soliq kodeksi | 21.10.2026 |
  | `ujk.json` | Uy-joy kodeksi | 12.09.2026 |
  | `ipk.json` | Iqtisodiy protsessual kodeksi | 21.10.2026 |
  | `ist.json` | Iste’molchilarning huquqlarini himoya qilish to‘g‘risidagi qonun | 18.10.2025 |

  Endi saytdagi 12 ta kodeks kartochkasining hammasi rasmiy matn bilan ishlaydi; jami 13 ta hujjat, 6 000 ga yaqin modda.
- **Yo‘naltirish:**
  - sifatsiz tovar, onlayn xarid, pulni qaytarish → Iste’molchilar qonuni (va FK);
  - mol-mulk, yer, daromad solig‘i, QQS, soliq tekshiruvi, jarima va shikoyat → SK;
  - kommunal to‘lov, ko‘chirish, ro‘yxatdan chiqarish, ko‘p kvartirali uy → UJK;
  - korxonalar o‘rtasidagi nizo, iqtisodiy sud → IPK (bunday holatda FPK qo‘shilmaydi);
  - ushlab turish, so‘z erkinligi, shaxsiy hayot kabi asosiy huquqlar → Konstitutsiya.
- **Konstitutsiya moddalari sarlavhasiz:**
  - natijada birinchi gapning boshi ko‘rsatiladi;
  - tekshiruv hisobotida raqamlar 2023-yilgi tahrir bo‘yicha ekani eslatiladi.
- **Kazus:** "Konstitutsiyaviy huquq" tanlansa, Konstitutsiya majburiy qidiriladi.
- **"Onlayn xarid" yo‘riqnomasi** (Iste’molchilar qonuni 18 va 28¹-moddalar) quyidagilar bilan to‘ldirildi:
  - qaytarish xarajatlari sotuvchi zimmasida;
  - pul kechiktirilsa, har kun uchun 1 % penya;
  - sifatli tovarni 10 kunda almashtirish shartlari.

## v11.7: manba ishonchliligi, yagona ish oynasi, PWA

Batafsil: [docs/V11_7_HISOBOT_UZ.md](docs/V11_7_HISOBOT_UZ.md). Sozlash va ko‘chirish: [docs/SOZLASH_VA_KOCHIRISH_UZ.md](docs/SOZLASH_VA_KOCHIRISH_UZ.md).

- **Da’vo ↔ manba:** so‘zlar mosligi tasdiq emas; “manba mavjud”, “so‘zlar mosligi”, “iqtibos manbada”, “yurist tekshirgan” alohida. Iqtibos rasmiy matnda kod orqali tekshiriladi; inkor, istisno, subyekt, muddat va tahrir xavflari belgilanadi.
- **Ombor:** shartli yozish tasdiqlanmasa — xavfsiz 503 (AI limitlari va hisoblar). `@netlify/blobs` lockfile bilan mahkamlangan.
- **Ishlarim (`#ish`):** chapda ishlar va materiallar, markazda savol/kazus/hujjat, o‘ngda manbalar; mobil’da tablar. `/api/account/cases`, hisoblar qat’iy ajratilgan.
- **Ikki boshlanish:** “Huquqiy vaziyatim bor” / “Kazus ustida ishlayapman”; talaba uchun bosqichma-bosqich maslahat.
- **DOCX:** namunadagi yashirin ma’lumot (kolontitul, footnote, mualliflar, customXml, eskiz, shablon yo‘li) eksportga o‘tmaydi.
- **Sud amaliyoti moduli** (bo‘sh, ruxsatli import), **Baza qamrovi** (`#qamrov`).
- **Baholash:** 46 holat (so‘zlashuv, kirill, ruscha, fanlararo); E29 tuzatildi; metrikalar alohida.
- **PWA:** manifest, ikonalar, service worker (faqat statik kesh), yangilash taklifi, pastki navigatsiya.

## v11.6: yangi manbalar

- **Jinoyat-ijroiya kodeksi** (`data/laws/jik.json`, lex.uz -163629, 2026-10-15 tahriri, 1–197-moddalar, 19 ta kuchini yo‘qotgan modda belgilangan) — RAG kodi `JIK`: muddatidan oldin shartli ozod qilish, uchrashuvlar, posilkalar, mahkumlarning huquqlari, intizomiy jazo va h.k.
- **Ma’muriy sud ishlarini yuritish to‘g‘risidagi kodeks** (`msk.json`, -3527353, 2026-08-14 tahriri, 1–288) — RAG kodi `MSK`: davlat organi qarori/harakati ustidan shikoyat, muddatlar, sudlovlilik, dalillar, apellyatsiya. Ma’muriy sud so‘ralganda FPK aralashmaydi.
- **Oliy sud Plenumining 2011-yil 20-iyuldagi 5-son qarori** (meros ishlari, `plenum05.json`, -2414320) — faqat meros/vasiyat mavzusida yoki "5-son qarori N-bandi" aniq so‘ralganda FK moddalari bilan birga beriladi. Avtomatik yangilanmaydi (qo‘lda).
- **JPK** endi lotin yozuvidagi rasmiy matndan (moddalar va kuchini yo‘qotganlar ro‘yxati kirill nusxa bilan bir xil).
- Plenumlar umumiy mexanizmga o‘tkazildi (`PLENUMS`, `bandRefsAll`, `retrieve().bandsBy`); manba tekshiruvi har bir Plenum bo‘yicha alohida: mavjud bo‘lmagan band ❌.
- Katalogda JIK va MSK kartalari, kazus ustaxonasida 2 ta yangi soha; `manifest.json` va haftalik yangilash ro‘yxati yangilandi.
- Testlar 72/72; oflayn baholash 33 ta holat, manba topish 0.985 (E29 da FK 1135 hali topilmaydi).

## v11.5: manba ishonchliligi, Word namunasi, hisobni tiklash, limitlar

Sozlash: `SOZLASH_UZ.md`. TSUL: `TSUL_INTEGRATION_UZ.md`.

- **Manba tekshiruvi endi da’vo darajasida** (`rag.mjs` → `claimChecks`).
  - Javobdagi har bir moddali gap uchun modda, qism va band mavjudligi, lex.uz havolasi va tahrir sanasi ko‘rsatiladi.
  - Gap AI’ga berilgan parcha bilan so‘z bo‘yicha qanchalik mosligi tekshiriladi. Holatlar:
    - ✅ parcha bilan asoslangan;
    - ⚠️ parcha berilgan, lekin mosligi past;
    - ℹ️ modda bor, parcha berilmagan;
    - ❌ qism yoki modda yo‘q;
    - 🚫 modda kuchini yo‘qotgan;
    - ❔ manba ko‘rsatilmagan huquqiy da’vo.
  - "Parcha berilgan" endi ✅ emas, 📄 bilan belgilanadi.
  - Hisobotda "huquqiy kafolat emas" deb yoziladi.
- **Voqea sanasi** bazadagi tahrirdan oldin bo‘lsa:
  - AI’ga hozirgi matnni avtomatik qo‘llamaslik buyuriladi;
  - voqeadan keyin o‘zgargan moddalar ⚠️ bilan belgilanadi;
  - hisobotda ⏳ ko‘rsatiladi.
- **Aqlli qidiruv** natijasida izohning modda matni bilan mosligi va tahrir sanasi chiqadi.
- **Word (.docx):**
  - Kazus ustaxonasida "Word namunasi" tanlanadi. Shrift, o‘lcham, interval, tekislash, xatboshi, sahifa chegaralari, sarlavha uslublari va raqamlash namunadan **kod orqali** olinadi.
  - AI’ga faqat bo‘limlar tartibi beriladi.
  - "Word (.docx)" tugmasi haqiqiy OOXML fayl yaratadi; namuna tanlanmasa — standart format (TNR 14, 1,5 interval, 30/15/20/20 mm).
  - Namuna matni, muallifi va matnli kolontituli ko‘chirilmaydi. Jadval, rasm, footnote va bir nechta bo‘lim haqida ogohlantiriladi.
  - Cheklovlar: 2 MB; .doc va .docm rad etiladi; zip-bomba va xavfli nomlardan himoya bor; fayl xotirada ishlanadi, saqlanmaydi.
- **Hisob:**
  - emailni tasdiqlash va "Parolni unutdim";
  - tokenlar bir martalik, muddatli (1 soat / 24 soat), serverda xeshlangan;
  - parol tiklanganda barcha sessiyalar bekor qilinadi;
  - javob email bor-yo‘qligini oshkor qilmaydi;
  - email xizmati sozlanmagan bo‘lsa, ochiq aytiladi.
  - Ro‘yxatdan o‘tish va saqlash atomar (parallel so‘rovlarda ustiga yozilmaydi).
- **Limit va AI sarfi:**
  - umumiy atomar limit: IP — soatlik, hisob — kunlik, sayt — kunlik;
  - `HK_AI_DISABLED=1` bilan favqulodda o‘chirish;
  - kazus davomi ham hisoblanadi;
  - logdagi kalitga o‘xshash qatorlar `[maxfiy]` bilan almashtiriladi.
- **Kitob parchalari:**
  - retriever interfeysi (`books.mjs`);
  - foydalanuvchi o‘zi yuklagan parchalar (sahifa, muallif, yil, kelib chiqishi bilan) faqat yetarli mos kelganda ishlatiladi;
  - TSUL adapteri — "ulanmagan".
- **Baza yangilash:**
  - import vaqtinchalik papkada tekshiriladi: bo‘sh matn, takroriy va yo‘qolgan modda, keskin kamayish;
  - oldingi tahrir `data/laws/archive/` ga saqlanadi, `--rollback` bilan qaytariladi;
  - `data/laws/manifest.json` da e’lon sanasi, import sanasi va sha256;
  - hali kuchga kirmagan o‘zgartishlar hisobotda ko‘rsatiladi;
  - Plenum avtomatik kuzatilmasligi ochiq aytiladi.
- **Baholash:**
  - `eval/cases.json` — 12 sohadan 30 ta kazus (oddiy, murakkab, fanlararo, eski sana, ma’lumot yetishmaydigan). Kutilgan manbalar, zarur savollar va taqiqlangan xulosalar yurist tasdig‘ini kutmoqda;
  - `npm run eval` — oflayn, `npm run eval:live` — jonli API.

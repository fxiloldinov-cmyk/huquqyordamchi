# HuquqYordamchi v11.9 — tuzatishlar hisoboti

Sana: 2026-11-05. Asos: v11.8 source paketi. O‘zgarishlar shu loyiha papkasida bajarildi. GitHub yoki Netlify ishlab chiqarish muhitiga yuborilmadi. Haqiqiy Gemini va to‘lov chaqiruvi bajarilmadi.

## 1. Email tasdig‘i va tarif

`entitlement()` faqat `emailVerified === true` hisobga grant beradi. False, yo‘q qiymat, satr yoki raqam bepul tarifga tushadi. Tasdiqlangan hisob, tasdiqlanmagan hisob va grantning aniq tugash chegarasi test qilindi. Email yuborish xizmati sozlanmaguncha tasdiqlanmagan hisobning grant huquqi ochilmaydi.

## 2. Grantlar ombori

Grantlar Netlify Blobs’dagi `entitlements` do‘konida saqlanadi. Kalit emailning normallashtirilgan SHA-256 xeshidir. `scripts/grant-entitlement.mjs` email, plan va expiresAt ni qabul qiladi. Faqat server muhitidagi NETLIFY_SITE_ID va NETLIFY_AUTH_TOKEN bilan yozadi. Kalit qiymatini chiqarmaydi.

Blobs yozuvi eski muhit sozlamasidan ustun. Muddati o‘tgan yoki free yozuv eski Pro grantini qayta yoqmaydi. `HK_PILOT_ENTITLEMENTS` eskirgan fallback bo‘lib, faqat yozuv mavjud bo‘lmaganda ishlaydi. Ombor xatosi fallback grantini ochmaydi. Yo‘riqnoma: `docs/ENTITLEMENTS_UZ.md`.

4 KB haqidagi aniqlashtirish: Netlify’ning hozirgi Functions runtime’ida jami muhit hajmi limiti 2026-06-12 da olib tashlangan. Lambda compatibility rejimida 4 KB qolgan. Muhit qiymatini yangilash deploy talab qiladi. Ushbu saytning jonli runtime rejimi tekshirilmadi.

Manbalar:
- https://docs.netlify.com/build/functions/environment-variables/
- https://www.netlify.com/changelog/2026-06-12-serverless-functions-env-var-size-limit-removed/

## 3. Xalqaro modulning manba chegarasi

`/api/international` Google Search vositasini yubormaydi. Javob faqat lokal parchalar bilan ishlaydi. Qamrovi limited mavzular uchun maxsus manba IDlari alohida ro‘yxat bilan chegaralangan. Hozir viza, ro‘yxatdan o‘tish, konsullik va investitsiya bo‘yicha maxsus matnlar yo‘q. Umumiy kodeksdagi tasodifiy moslik ularning o‘rnini bosmaydi.

Manba bo‘lmasa AI va kvota hisoblagichi chaqirilishidan oldin “Bu mavzu bo‘yicha ma’lumot bazada yo‘q” xabari qaytadi. Shartnoma maydonida maxfiy hujjat, haqiqiy ism va rekvizitlarni kiritmaslik haqida besh tilda ko‘rinadigan ogohlantirish bor.

## 4. Xalqaro modul flagi

`HK_INTERNATIONAL_ENABLED` standartda 0. Faqat aniq 1 yoqadi. O‘chiq holatda API GET va POST uchun 404 qaytaradi. Bosh sahifadagi Travel/Business kartalari dastlab yashirin turadi, `/api/features` flagni tasdiqlamaguncha ochilmaydi. Xato javobda ham yashirin qoladi.

Sitemap modulni faqat flag 1 bo‘lganda kiritadi. Service worker xalqaro sahifani shell keshiga kiritmaydi. 0/1/0 build almashish testi bor. Flag uchun Build va Functions scopelarida bir xil qiymat ishlatish kerak.

Statik `international.html` fayli paketda qoladi. Uning aniq manzilini ochish mumkin, ammo flag 0 bo‘lsa API orqali tahlil bajarilmaydi. Bu flag statik faylga kirish avtorizatsiyasi emas.

## 5. IRAC sahifasi nomi

Sahifa “IRAC ish varag‘i (tuzilish tekshiruvi)” deb nomlandi. Oddiy tekshiruv faqat to‘ldirilgan maydonlarni sanashini yozadi. Gemini orqali fikr olish alohida AI tugmalarida qolgan. Yangi AI funksiya yozilmadi. Eski `/coach.html` manzili va saqlangan qurilma nusxalari kaliti saqlandi.

## 6. Bepul so‘rovlar soni

`HK_FREE_REQUESTS` musbat butun sonni qabul qiladi. Standart 2. Noto‘g‘ri, nol yoki manfiy qiymat standartga qaytadi. Tarif katalogi va atomar oylik hisoblagich bir xil qiymatdan foydalanadi. 5 so‘rov konfiguratsiyasida parallel 7 urinishdan faqat 5 tasi o‘tishi tekshirildi.

## 7. Ko‘p sohali qidiruv

E44 sabablaridan biri umumiy “bo‘lishi” so‘zining mulkni bo‘lish yo‘nalishini yoqishi bo‘lgan. Keng moslik olib tashlandi. E45 da so‘roq gapining oxirgi bo‘lagi sudga da’vo niyatidan ajralib qolgan va ikkinchi sohaga faqat bitta o‘rin ajratilgan. “Buzildi” so‘zi ham nuqsonli tovar yo‘nalishida yetishmagan.

Endi ko‘p sohali savolda butun so‘roq gapi ham qidiriladi. Aniq yo‘nalish boshidagi manbaga o‘rin ajratiladi va ikkinchi sohadagi savol niyati hisobga olinadi. Bitta soha savollariga bu qo‘shimcha niyat og‘irligi qo‘llanmaydi.

Oflayn solishtirish: avval 46 holatdan 44 tasida barcha kutilgan manba topilgan, keyin 46 tasida ham topildi. E44 va E45 bo‘shliqlari qolmadi. Har bir holat bo‘yicha oldingi natijadan pasayish aniqlanmadi. Bu manba topish testi. AI huquqiy xulosasi yoki yuridik ekspertiza natijasi emas. Kutilgan manbalar to‘plami inson ekspertizasidan o‘tmagan.

## 8. YHQ import joyi

Manifestga `yhq`, `status: not_imported`, `articles: 0` yozuvi qo‘shildi. `yhq.json` yaratilmagan va hech qanday YHQ bandi kiritilmagan. Import `scripts/import_lexuz.py --doc yhq` orqali alohida standart kutubxonali `import_yhq.py` adapteriga yo‘naltiriladi.

Egasi Word/HTML faylini, haqiqiy Lex.uz ID sini va ilovaning aniq boshlang‘ich sarlavhasini beradi. Keyingi ilova bo‘lsa `--end-before` bilan chegaralanadi. Takroriy band, noma’lum sana yoki noaniq chegara importni to‘xtatadi. Importdan keyingi band qidiruvi va manba yorlig‘i huquqiy mazmuni yo‘q IMPORT_TEST markerlari bilan tekshirildi. Yo‘riqnoma: `docs/YHQ_IMPORT_UZ.md`.

YHQ bo‘lmasa YPX, YHQ va yo‘l belgisi mavzulari search/chat/kazus/international APIlarda AI chaqiruvisiz qamrov xabarini qaytaradi. RAG MJtK sanksiyasi borligini YHQ matni borligiga tenglashtirmaydi. Oldingi kitob mosligi testi endi transportga aloqasiz vaziyatdan foydalanadi, chunki trafik savoli yangi qamrov to‘sig‘ida to‘xtaydi.

Qonun matnlari hash orqali solishtirildi. `data/laws` ichida faqat manifest metama’lumoti o‘zgargan.

## 9. CI

`.github/workflows/ci.yml` faqat pull_request uchun qo‘shildi. Node 22 va Python 3.12, `npm ci`, `npm run build`, `npm test`, `npm run eval`. Contents ruxsati read. Gemini kalit qiymatlari bo‘sh. Deploy, merge, jonli eval yoki secret ulanishi yo‘q. Mavjud qonun yangilash workflowi ishga tushirilmadi va o‘zgartirilmadi.

## 10. Tekshiruvlar va cheklovlar

Har bir vazifa ketidan build va test bajarildi. Yakuniy buyruqlar:

```sh
npm run build
npm test
npm run eval
```

Yangi testlar: email tasdig‘i, Blobs ustuvorligi, ombor xatosida yopilish va grant validatsiyasi, Google vositasisiz so‘rov, limited mavzuda AI chaqirilmasligi, flag va sitemap almashishi, IRAC matnlari, sozlanadigan bepul kvota, ikki sohali manba qidiruvi, YHQ qamrov to‘sig‘i, suhbatdagi qisqa davom savoli va import markerlari, CI cheklovlari, versiya va hujjat kontrakti.

Haqiqiy Blobs omboriga yozish, email yetkazilishi, ishlab chiqarish autentifikatsiyasi, Netlify bundle ichidagi YHQ fayl joylashuvi va GitHub Actions’da workflow bajarilishi sinovdan o‘tkazilmadi. Testlar lokal xotira va soxta provider javoblaridan foydalandi. Brauzerda v11.9 ko‘rinishi alohida tekshirilmadi. Haqiqiy YHQ Word eksporti, yo‘l belgisi tasvirlari va jadvallar berilmagan. Umumiy kodekslarning BeautifulSoup talab qiladigan import yo‘li ushbu ishda qayta bajarilmadi. Hech qanday mustaqil yuridik ekspertiza o‘tkazilmadi.

Yakuniy natija: 138 test, 138 muvaffaqiyatli, 0 xato. v11.8 ga nisbatan 18 ta yangi test bor. Build o‘tdi. Oflayn evalda 46/46 holatning kutilgan manbalari topildi.

Yakuniy sonlar va qonun matnlari hash nazorati `docs/V11_9_TEKSHIRUV.json` faylida.

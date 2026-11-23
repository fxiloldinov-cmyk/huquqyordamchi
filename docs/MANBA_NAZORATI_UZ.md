# Manba, sana va xulosa nazorati

2026-11-08. Bu texnik o‘zgarishlar huquqiy ekspertiza o‘rnini bosmaydi.

> **Keyingi tuzatish (2026-11-08, mustaqil audit).** Quyidagi ikki joy o‘zgartirildi:
> - voqea sanasi cheklovi butun hujjat emas, modda darajasida ishlaydi;
> - umumiy foydalanuvchi tasdig‘i saytda "yurist ko‘rigidan o‘tgan" deb ko‘rsatilmaydi.
>
> `newer-publication` endi ogohlantirish bilan beriladi. Matn xeshi mos kelmasa, build to‘xtaydi. Batafsil: `docs/AUDIT_CODEX_ZIP_2026_11_08_UZ.md`. Quyidagi matnning shu ikki band bilan zid kelgan joylari eskirgan.

## Kiritilgan o‘zgarishlar

- Har bir hujjat uchun manba, import, nashr sanasi, kuchga kirish sanasi, tekshiruv va matn solishtirish holatlari ajratildi. Noma’lum qiymatlar `null`; `asOf` kuchga kirish sanasi emas.
- Rasmiy sahifadagi `PUBLICATION_ORIGIN` nashr yozuvlari olinadi. Boshqa matnlardagi sanalar hujjat tahriri sanasi deb olinmaydi. HTTP 200 javobning o‘zi hujjat ekanini tasdiqlamaydi.
- Uy-joy kodeksining o‘zbekcha havolasi `https://lex.uz/docs/-106136`, Plenum 26-son qarorining bevosita havolasi `https://lex.uz/docs/-6684613` qilib tuzatildi. Ularning huquqiy matni o‘zgartirilmadi.
- Jonli sahifalardagi izoh yuborish, audio va havola olish tugmalari matni importerda normativ matndan ajratildi.
- Hujjatning indekslangan sarlavha, xatboshi va tahrir izohlari alohida solishtirildi. Bu butun hujjat, barcha ilova, kuchga kirish yoki huquqiy xulosa tasdig‘i emas.
- Farq topilgan matnlar `data/review/candidates/`ga saqlandi. Asosiy huquqiy matnlar avtomatik almashtirilmaydi. FK 1-qismda 288, 360, 382-moddalar; JKda 244-1, 244-2, 246-moddalar farqi bor.
- JK uchun yangi nashr aniqlangani sababli uning mahalliy nusxasi javobga asos sifatida berilmaydi. FK 1-qismda farqli moddalar berilmaydi. Yangilik tekshiruvi muddati o‘tishi bu cheklovlarni olib tashlamaydi.
- Eski voqea sanasi uchun tarixiy matn bo‘lmasa, keyingi nusxa AI kontekstidan chiqariladi. Hali kuchga kirmagan, amal qilish oralig‘idan chiqqan va kelajakdagi o‘zgartirish sanasi mavjud matnlar ham cheklanadi.
- Chat, qidiruv va kazusda sana tekshiriladi; ish oynasidagi sana chat serveriga ham yuboriladi. Taqvimda mavjud bo‘lmagan sanalar rad etiladi. Huquqiy “bugun” Toshkent vaqtida hisoblanadi.
- Manba mavjudligi, parcha AI’ga berilgani, ko‘rsatilgan qismdagi iqtibos mosligi, leksik moslik va yurist tasdig‘i alohida holatlar. Leksik tekshiruv huquqiy xulosani tasdiqlamaydi.
- Tashqi qidiruv mahalliy bazadan ajratildi. Domen yoki havola mavjudligi manba mazmuni tasdig‘i sifatida ko‘rsatilmaydi.
- Qamrov oynasi tekshiruv holatlari, cheklovlar, noma’lum sanalar va qo‘lda tekshiriladigan materiallarni ko‘rsatadi. Jadval kodi mavjudligi real GitHub ishga tushishini isbotlamaydi.
- IIV 502 dagi `2027-01-07` hisoblangan sana `proposedEffectiveFrom`ga ko‘chirildi; tasdiqlangan kuchga kirish sanasi emas. Havola qo‘shishning o‘zi hujjatni faollashtirmaydi.
- Oldingi nusxalar tasdiqlangan yangilanishdan oldin xeshli nom bilan arxivlanadi; avtomatik uch nusxagacha qisqartirish olib tashlandi. Arxiv nusxasi o‘z-o‘zidan voqea paytidagi tasdiqlangan matn bo‘lmaydi.

## Tekshiruvni takrorlash

Node 22+ va Python 3, matn solishtirish uchun `beautifulsoup4==4.14.3` kerak.

```sh
npm ci
npm run audit:sources
npm run audit:compare
npm run review:export
npm run build
npm test
npm run eval
```

Proksi orqali ishlaydigan Node 24 muhitida `NODE_USE_ENV_PROXY=1 NODE_USE_SYSTEM_CA=1` kerak bo‘lishi mumkin. TLS tekshiruvi o‘chirilmaydi.

`npm run law:update -- --file jk=rasmiy-eksport.doc` yangi matnni faqat tekshiruv navbatiga import qiladi. `LEX_WORD_URL_TEMPLATE` orqali asosiy bazaga nazoratsiz avtomatik import olib tashlandi. Haftalik workflow audit, texnik solishtirish, build va testlarni bajaradi; dalillar artifactga saqlanadi, audit metama’lumotlari uchun PR tayyorlanadi. Hozirgi ish davomida workflow yoki deploy tashqi servisda ishga tushirilmadi.

## Yurist uchun materiallar

- `data/review/legal-cases.csv` va `legal-cases.json`: 46 savol, tavsiya qilingan manbalar, sana, istisno, aniqlashtiruvchi savol, tekshiruvchi, tasdiqlangan manbalar va izoh kataklari. Kutilgan manbalar hali tasdiqlanmagan.
- `data/review/inventory.json`: 20 hujjat inventari; 19 tasi indekslangan, IIV 502 kutilmoqda.
- `data/review/source-queue.json`: yangi nashr, matn farqi, noma’lum nashr sanalari va manbasi aniqlanmagan hujjatlar.
- `data/review/text-comparison.json` va `*.comparison.json`: texnik solishtirish va alohida o‘zgartirish izohlari. Sana kataklari taxmin bilan to‘ldirilmagan.
- `data/review/fk1.approval-template.json`, `jk.approval-template.json`: tasdiqlash shakllari. Har bir o‘zgargan modda uchun nashr va kuchga kirish sanalarini tekshirish kerak.
- `data/review/yhq-annex-elements.json`: foydalanuvchi bergan HTMLdagi 18 rasm va 3 jadval. Rasmlar `yhq-assets/`ga rasmiy havolalardan yuklandi, xeshlari qayd etildi. Bu barcha YHQ ilovalari qamrab olingani degani emas. Ma’nolar tasdiqlanmaguncha javob indeksiga kiritilmaydi.
- `data/review/snapshots/`: ushbu auditda olingan rasmiy sahifalar; huquqiy ma’lumotning sanali nusxasi, buyruq emas.

Yurist ko‘rigi tugagach, shaklda `status: approved`, tekshiruvchi, sana, kuchga kirish va o‘zgargan moddalarning sanalari to‘ldiriladi. Nomzod va manba xeshlari o‘zgarmasligi kerak.

```sh
npm run review:approve -- --review data/review/jk.approval-template.json
npm run build
npm test
```

Bu buyruq tasdiqlanmagan shakl, mos kelmagan xesh, noto‘g‘ri sana, tekshirilmagan o‘zgartirish yoki nomzodning texnik muammosida to‘xtaydi. Bajarilgan tasdiq `data/review/approvals/`da saqlanadi. Oddiy hujjat yangilanishi undan foydalangan har bir AI xulosasi tasdiqlanganini anglatmaydi.

## Ochiq qolgan bosqichlar

Yurist ko‘rigi, tarixiy tahrirlarning rasmiy sanalar bilan kiritilishi, Plenum qarorlarining nashr/kuchga kirish sanalari, IIV 502 rasmiy manbasi va sanalari, barcha YHQ ilovalarining to‘liqligi hamda jonli AI va haqiqiy qurilma tekshiruvi. Ular bajarildi deb belgilanmagan.

Oflayn qidiruv ko‘rsatkichi nomzod topishni o‘lchaydi. `eligibleRecall` javobga berishga yaroqli parchalar ulushini, `withheldCases` esa cheklovli holatlarni alohida qayd etadi. 46/46 nomzod topilishi huquqiy sifat 100% degani emas.

## Foydalanuvchi tasdig‘idan keyingi holat

Foydalanuvchi “hamma matnlarni yurist tekshirdi bos” deb davom etishni tasdiqladi. Xabar `data/review/approvals/user-text-attestation.json`da aynan qayd etildi. FK 1-qism va JK nomzodlari ularning texnik solishtirish hisoboti hamda xeshlari tekshirilib bazaga o‘tkazildi; avvalgi nusxalar arxivlandi. JK nusxasidagi nashr sanasi endi 2026-11-04.

Bu manba matni ko‘rigi haqidagi foydalanuvchi tasdig‘i. Yurist shaxsi, ko‘rikning haqiqiy sanasi va noma’lum kuchga kirish sanalari o‘ylab topilmadi. Alohida AI javoblari yoki testning kutilgan huquqiy xulosalari bu yozuv orqali avtomatik tasdiqlanmaydi. IIV 502 uchun rasmiy havola va sana, tarixiy nusxalar va rasmlar ma’nosi yetishmagan joylardagi cheklovlar saqlanadi.

`review:approve-text -- --attestation <fayl.json>` faqat aniq hujjat va xeshlarga bog‘langan matn tasdig‘ini qo‘llaydi; sanalarni ham tasdiqlash uchun `review:approve`ning avvalgi qat’iy tekshiruvi saqlangan.

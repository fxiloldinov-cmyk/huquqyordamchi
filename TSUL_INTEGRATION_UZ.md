# TSUL integratsiyasi: tekshiruv va joriy holat

Tekshiruv sanasi: 2026-10-29.

**Holat: brauzer orqali kirish va kitob matnini o'qish tekshirildi. Sayt backendidan avtomatik olish hali ulanmagan.** Ushbu hujjat yoki API holati doimiy ulanish o'rnatilganini bildirmaydi.

## Tekshirilgan imkoniyatlar

- `https://elib.tsul.uz/login` sahifasida TSUL Digital orqali himoyalangan kirish muvaffaqiyatli bajarildi. Login va parol qiymatlari modelga berilmadi, kodga yoki arxivga yozilmadi.
- Kitob kartasidan “Onlayn o'qish” oynasi ochildi. Faqat katalog havolasi emas, kitobning matn qatlami ham o'qildi.
- Sinov manbasi: X.R. Ochilov, **Jinoyat huquqi (Umumiy qism)**, o'quv qo'llanma, Toshkent: Yuridik adabiyotlar Publish, 2022. Bibliografik ma'lumotlar PDFning 2–3-tartib sahifalarida tekshirildi.
- Katalogda 176 bet, o'quvchida 177 PDF sahifasi ko'rsatilgan. PDFning 4-tartib sahifasida bosma raqam 3. Bu farqni barcha kitoblarga avtomatik tatbiq etish mumkin emas.
- Kitobning kirish ma'lumotida Jinoyat kodeksining 2022-yil maygacha bo'lgan holati asos qilib olingani aytilgan. Bu 2026-yil yoki boshqa voqea sanasidagi amaldagi tahrir tekshiruvi o'rnini bosmaydi.
- Butun kitob yoki kutubxona ko'chirilmadi. Kitob matni, shaxsiy sessiya va vaqtinchalik kirish havolalari ushbu loyihada saqlanmadi.

Doimiy katalog havolasi: https://elib.tsul.uz/books/jinoyat-huquqi-umumiy-qism-ochilov-x-2022

## Koddagi joriy xatti-harakat

`GET /api/kazus` javobidagi `sources.tsul` holati `connected: false`, `status: "not_connected"` qaytaradi. Kazus tahlilining yakuniga TSUL kitob matni avtomatik olinmagani haqida server yaratadigan izoh qo'shiladi. Modelga katalogni o'qilgan kitob deb ko'rsatmaslik, iqtibos va sahifalarni uydirmaslik, PDF va bosma sahifani farqlash, darslikni voqea sanasidagi qonun tahriri bilan solishtirish qoidalari berilgan. Bu qoidalar modelning barcha xatolarini bartaraf etish kafolati emas.

## Doimiy ulanish uchun qolgan shartlar

1. TSULning uchinchi tomon ilovasiga avtomatik matn olish, AI provayderiga zarur parcha uzatish va keshdan foydalanish shartlari tasdiqlanishi kerak. Ochiq qidiruvda hujjatlashtirilgan rasmiy API yoki qayta foydalanish ruxsati topilmadi; bu bunday imkoniyat yo'q degani emas.
2. Ruxsatli server autentifikatsiyasi aniqlanishi kerak. Ushbu ChatGPT brauzeri sessiyasi Netlify funksiyalariga ko'chirilmagan. Shaxsiy hisob umumiy sayt foydalanuvchilari nomidan ishlatilmasligi uchun kirish va vakolat tekshiruvi zarur. Hamma foydalanuvchilar uchun xizmat ko'rsatilsa, TSUL bilan kelishilgan xizmat hisobi yoki litsenziya kerak bo'lishi mumkin.
3. Token yoki zarur maxfiy ma'lumot faqat hostingning server secret sozlamasida saqlanadi. Parol frontend JavaScript, Git, ZIP, log, URL, AI prompt yoki javobga qo'shilmaydi. Sessiya yangilanishi faqat provayder ruxsat bergan usulda bajariladi; sessiya tugashi, CAPTCHA yoki qayta tasdiqlashda cheklov ochiq ko'rsatiladi.
4. Mavjud Netlify sayti tekshiruvda foydalanish limiti sabab to'xtatilgan edi. Ushbu o'zgarishlar jonli saytga joylanmagan. Server konfiguratsiyasi va AI kaliti alohida sozlanishi kerak.

## Ruxsatli transport mavjud bo'lgach bajariladigan oqim

Kazus fani va masalalarini aniqlash → zarur minimal qidiruv so'rovi bilan katalogdan tanlash → faqat ruxsat etilgan kerakli parchalarni olish → muallif, yil, kitob nomi, bosma sahifa/PDF sahifasi va parchaning kelib chiqishini tekshirish → voqea sanasidagi qonunchilik bilan solishtirish → dalilli tahlil va manba ro'yxatini berish.

Yetarli va mos parchalar mavjud bo'lsa, tahlilda ulardan foydalaniladi. Faqat havola yoki yetarli bo'lmagan matn topilsa, manba cheklovi aytiladi. To'liq kutubxona ko'chirilmaydi; ruxsat muddati va foydalanuvchi vakolatiga mos keshdan foydalaniladi. Tasdiqlanmagan endpoint yoki parolga asoslangan taxminiy avtomatik kirish ushbu versiyaga qo'shilmagan.

# TSUL elektron kutubxonasi — integratsiya holati

**Holat:** ulanmagan (`netlify/shared/books.mjs` → `tsul.status()` = `not_connected`). Tizim TSUL’ga hech qanday so‘rov yubormaydi va TSUL kitobidan iqtibos keltirgandek ko‘rsatmaydi.

## Nega ulanmagan
- Rasmiy API va undan foydalanishga ruxsat yo‘q.
- Shaxsiy talaba hisobi (login/parol, sessiya cookie’si) ommaviy saytga ulanmaydi. Bu kirish shartlarini chetlab o‘tish bo‘lardi va hisob egasining ma’lumotlarini xavf ostiga qo‘yardi.
- Katalogdagi kitob nomi va annotatsiyasi kitobning to‘liq matni emas. Ular asosida iqtibos va sahifa ko‘rsatilmaydi.

## Hozir ishlaydigan yo‘l: foydalanuvchi yuklagan parchalar
- "Mening hisobim → Kitob parchalarim":
  - kitob nomi, muallif, nashr yili, nashr/tahrir, parcha qayerdan olingani va sahifa belgilari (`[45]`) bilan parcha saqlanadi;
  - foydalanuvchi parchadan foydalanishga haqli ekanini tasdiqlaydi.
- Kazus ustaxonasida "Kitob parchalarimdan foydalanish" belgilanganda:
  - parchalar kazus matni bilan solishtiriladi;
  - kamida 3 ta noyob so‘z va so‘rov so‘zlarining 20 % i mos kelsa, parcha AI’ga beriladi;
  - AI kitobga faqat shu parchadagi fikr uchun "(Muallif. Nomi, yil, N-bet)" shaklida havola qilishi shart;
  - mos parcha topilmasa, javob ostida "javob kitobga asoslanmagan" deb yoziladi.

## TSUL rasmiy ulanishi uchun nima kerak
1. TSUL Axborot-resurs markazidan yozma ruxsat va API hujjati: qidiruv endpoint, autentifikatsiya turi (servis kaliti yoki OAuth), sahifa/parcha formati, foydalanish limitlari, litsenziya shartlari.
2. Servis kaliti faqat Netlify environment variable’da saqlanadi (masalan, `TSUL_API_URL`, `TSUL_API_KEY` — nomlari API hujjatiga qarab aniqlanadi). Kodga, logga va brauzerga chiqarilmaydi.
3. `books.mjs` dagi `tsul.search()` API javobini `Passage` shakliga o‘giradi (`title`, `author`, `year`, `page`, `text`, `origin: "TSUL"`) va `status()` `connected: true` qaytaradi.
4. Test: TSUL javobi mock bilan, sahifa va muallif to‘g‘ri uzatilishi, mos bo‘lmagan parcha ishlatilmasligi.

Ruxsat olinmaguncha holat "ulanmagan" bo‘lib qoladi.

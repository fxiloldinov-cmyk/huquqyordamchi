# Yangi alifboga o‘tkazish paneli

Manzil: `/alphabet.html`. Bosh sahifadagi Alifbo menyusi yoki Yangi alifboga o‘tkazish havolasidan ochiladi.

## Ishlatish

1. Manba yozuvini tanlang: o‘zbek lotin, o‘zbek kirill yoki ruscha.
2. Matn kiriting yoki `.docx`/UTF-8 `.txt` faylini tanlang. DOCX uchun serverga yuborish roziligini avval belgilang.
3. O‘girish tugmasini bosing. Natijani tekshirib tahrirlang.
4. Nusxalash, TXT yoki Word (.docx) yuklashni tanlang.

O‘RQ–1184 (2026-10-21) jadvalidagi Ö, Ğ, Ş, Ç ishlatiladi. Qonunning kuchga kirish sanasi 2027-04-22: https://lex.uz/uz/docs/8548754. Panel ixtiyoriy. Sayt interfeysining qolgan qismi va data/laws asl matnlari o‘zgartirilmaydi.

## O‘girish va tarjima

O‘zbek lotin/kirill o‘girish brauzerda bajariladi; oddiy matn yuborilmaydi va saqlanmaydi. To‘rt yangi harf, registr, apostrof variantlari, o‘zbek kirill harflari va ayrim kontekstli е holatlari qo‘llanadi. Ng birikmasi saqlanadi. Bu to‘liq morfologik/imlo tekshirgich emas: chet tili so‘zlari, qisqartmalar, ismlar, URL, kirilldagi ц/ъ/ь va o‘zlashma so‘zlar natijasini tekshiring. Ruscha matnni o‘zbek kirill rejimida o‘girish tarjima qilmaydi.

Ruscha rejim — o‘zbekchaga mashina tarjimasi, keyin yangi alifboga o‘girish. `HK_TRANSLATION_ENABLED=0` standart; uni `1` qilish va mavjud server Gemini sozlamalari kerak. Roziliksiz yuborilmaydi. Kirish 6000 belgigacha; 4/min, 20/soat va guardAi umumiy limitlari; 20 soniyalik vaqt chegarasi. Google qidiruvi ishlatilmaydi. PII yashirish qo‘llanadi, lekin to‘liq maxfiylashtirish kafolati emas. Google Gemini matn bilan ishlaydi; uning saqlash siyosati ilova nazoratida emas. Tarjima mazmuni, raqamlar va atamalar inson tomonidan tekshirilishi kerak. Jonli provider sinalmagan.

## Word cheklovlari

Fayl 1,5 MB, ochilgan asosiy XML 2 MB, chiqarilgan matn 50000 belgigacha. Faqat OOXML `.docx`; eski ikkilik `.doc`, makrosli DOCM, skaner/PDF qo‘llanmaydi. Eski Word faylini Word/LibreOffice orqali `.docx` sifatida saqlash yoki matnni nusxalash kerak. Asosiy matn/paragraflar/tablar olinadi; shrift, jadval tuzilishi, rasm, izohlar va kolontitullar saqlanmaydi. Natija yangi, oddiy matnli DOCXga yoziladi. Faylni import qilish serverda xotirada bajariladi; disk/ombor/keshga yozilmaydi.

Statik sahifa va modullar PWA keshiga kiradi. Avval keshlangan sahifada lotin/kirill va TXT oflayn ishlaydi; DOCX import va ruscha tarjima internet talab qiladi. Real telefon/oflayn sinovi bajarilmagan.

# Ovozli kiritish (v11.10)

Bu diktovka: ovozdan olingan matnni foydalanuvchi tekshiradi va odatdagi savol maydoniga qo‘shadi. Huquqiy javob keyingi, alohida yuborilgan so‘rovda mavjud chat/RAG orqali olinadi. Javobni ovozda o‘qish (TTS) qo‘shilmadi.

## Yoqish

1. Server muhitida mavjud Gemini kaliti sozlanganini tekshiring; kalitni frontendga yozmang.
2. `HK_VOICE_ENABLED=1` qo‘ying. Standart qiymat `0`; o‘chiq endpoint 503 qaytaradi va tugmalar ko‘rinmaydi.
3. HTTPS yoki localhost va MediaRecorder qo‘llaydigan brauzer kerak. WebM, Ogg yoki WAV qo‘llanadi; faqat MP4 yozadigan brauzerda matnni qo‘lda kiriting. Haqiqiy qurilmada moslik sinovi zarur.

## Foydalanuvchi oqimi

Mikrofon tugmasi → audio Gemini’ga yuborilishiga rozilik → yozishni boshlash → to‘xtatish → matnga aylantirish → tahrirlash → savol maydoniga qo‘shish → odatdagi yuborish tugmasi. Yozish tugashi audio yuborilishini boshlamaydi. Oyna yopilganda mikrofon to‘xtaydi va audio tashlanadi. Internetsiz diktovka ishlamaydi. Besh tildagi interfeys bor (uz, ru, en, de, fr); tarjima va tanish sifati baholanmagan.

## Chegaralar va maxfiylik

Brauzer 30 soniyada yozishni to‘xtatadi; server 750000 baytgacha qabul qiladi. Server haqiqiy audio davomiyligini o‘lchamaydi. MIME va fayl boshi tekshiruvi to‘liq dekoder tekshiruvi emas. So‘rov uchun 20 soniyalik chegara, daqiqasiga 4 va soatiga 20 ta so‘rov bor. `guardAi` umumiy limitlari va o‘chirgich ham qo‘llanadi. Diktovka va keyingi huquqiy savol ikkita alohida AI so‘rovi sifatida hisoblanadi.

Ilova audio faylni disk, ma’lumot ombori, service worker keshi yoki jurnalga yozmaydi. Audio brauzer/server xotirasida qayta ishlanadi va inline shaklda Google Gemini’ga uzatiladi. Providerning saqlash siyosati ilova nazoratida emas; xotirani tozalash xavfsiz o‘chirish kafolati emas. Maxfiy ma’lumotni aytmang. Transkript `redactPII()`dan o‘tadi, lekin bu barcha shaxsiy ma’lumotni aniqlash kafolati emas.

Rozilik, noto‘g‘ri audio, limitlar, bekor qilish, mikrofon resurslarini bo‘shatish, provider xatolari va matnni avtomatik yubormaslik soxta javoblar bilan sinaldi. Jonli Gemini, haqiqiy audio, mobil brauzer va mikrofon ruxsati sinovdan o‘tkazilmadi.

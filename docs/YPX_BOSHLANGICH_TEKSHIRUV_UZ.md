# YPX rejimi: boshlang‘ich tekshiruv

Sana: 2026-11-05. Tekshirilgan source paket: HuquqYordamchi 11.9.0.

## Natija: 0-band bo‘yicha ish to‘xtatildi

| Shart | Kuzatilgan holat |
| --- | --- |
| npm run build | O‘tdi |
| npm test | 138 test, 138 o‘tdi, 0 xato, 0 tashlab ketilgan |
| /api/voice | Mavjud emas |
| Diktovka frontendi | public va netlify ichida topilmadi |
| HK_VOICE_ENABLED | Source va .env.example ichida topilmadi |
| data/laws/yhq.json | Mavjud emas |
| Manifestdagi yhq | not_imported, 0 band |
| data/ypx/ | Mavjud emas |

Tekshiruvda fayl nomlari, API route matnlari, HK_VOICE_ENABLED, MediaRecorder, SpeechRecognition va diktovka havolalari qidirildi. Mavjud paketda diktovka sharti bajarilmadi. Boshqa, yuborilmagan versiyada uning mavjudligi haqida xulosa qilinmadi.

## Biriktirilgan fayl

`975 01.12.2018 (1).doc` HTML shaklidagi Word eksportidir. Undagi ACT_TITLE:

“Yoʻl-patrul xizmati xodimlarining yoʻl harakati qatnashchilari bilan oʻzaro munosabatlari hamda maxsus moslamalardan foydalanishi tartibi toʻgʻrisidagi nizomni tasdiqlash haqida”.

Fayl rekvizitlari: 2018-yil 1-dekabr, 975-son. Bu sarlavha YHQ matnining bazaga kiritilganini ko‘rsatmaydi. Fayl YHQ nomi bilan import qilinmadi. Hujjatning amaldagi tahriri yoki normativ mazmuni ushbu tekshiruvda baholanmadi.

## Nima bajarildi

- Build va testlar lokal bajarildi.
- Diktovka, YHQ va YPX ma’lumotlari mavjudligi tekshirildi.
- Biriktirilgan faylning formati va sarlavhasi o‘qildi.
- Ushbu hisobot yozildi.

## Nima bajarilmadi va sabab

Foydalanuvchining “boshlashdan oldingi shart bajarilmasa to‘xta” talabiga binoan yangi API, sahifa, ma’lumot massivlari yoki PWA keshi yozilmadi. YHQ yo‘qligi odatda 1, 2 va 5-vazifalarning skeletiga ruxsat bergan bo‘lardi, ammo bundan oldingi diktovka sharti ham bajarilmagan.

/api/ypx AI endpointi yaratilmagan. YPX rejimi yoqilmagan. Qonun matni, belgi, istisno, jarima, modda raqami yoki inspektor vakolati haqidagi mazmun kiritilmagan. Mavjud chat, RAG va funksiyalar kodi tahrirlanmagan. Versiya o‘zgartirilmagan.

## Davom etish uchun yetishmayotgan qismlar

1. /api/voice, diktovka interfeysi va HK_VOICE_ENABLED mavjud bo‘lgan source versiya yoki avval diktovkani alohida yozish topshirig‘i.
2. YHQning alohida Word/HTML eksporti va import uchun manba rekvizitlari.
3. Keyingi bosqichda egasi to‘ldiradigan signs, documents va checklist yozuvlari. Ular bo‘sh yoki ko‘rib chiqish holati kutilmoqda bo‘lsa, YPX foydalanuvchiga ko‘rsatilmaydi.

## Sinalmagan narsalar

Jonli Gemini, mikrofon ruxsatlari va audio oqimi, real telefondagi oflayn ish, PWA keshi, manba bo‘yicha YPX javobi va ishlab chiqarish deployi sinalmadi. Ushbu ishda haqiqiy AI yoki to‘lov chaqiruvi, deploy va audio qabul qilish yoki saqlash bajarilmadi.

# HuquqYordamchi v11.10 — o‘zgarishlar hisoboti

## Bajarilgan ishlar

- Egasi yuborgan 172-son YHQning 191 asosiy bandi va 975-son nizomning 62 bandi bazaga qo‘shildi. Asl eksportlar va SHA-256 izlari saqlandi. RAG, manba yorliqlari, qidiruv, build va Netlify paketiga yangi manbalar ulandi.
- Parser yuqori indeksli raqamlar va nuqtadan keyin bo‘shliqsiz bandlarni o‘qiydi. Asosiy bo‘limlar boshqa ilovalardan ajratildi. Huquqiy mazmun yaratilmagan.
- `/api/voice` va chat/qidiruv/kazus/IRAC maydonlari uchun diktovka qo‘shildi. Rozilik, alohida audio yuborish, tahrir va matnni qo‘shish amallari bor; savol avtomatik yuborilmaydi. `HK_VOICE_ENABLED=0` standart, kalit frontendga chiqmaydi.
- Audio ilovada disk/ombor/kesh/jurnalga yozilmaydi; Gemini’ga inline yuboriladi. Provider saqlash siyosati ilova nazoratida emas. PII ni yashirish, hajm, tezlik, umumiy AI o‘chirgichi va vaqt chegarasi qo‘llanadi.

## Tekshirilgan ishlar

`npm run build`, `npm test` va `npm run eval` o‘tdi: 150 test, oflayn qidiruvda 46/46 kutilgan manba topildi. Bu AI javobining huquqiy aniqlik bahosi emas.

12 yangi test: import hajmi, IDlar va asl eksport bilan matn mosligi (2); mikrofon hayot sikli, bekor qilish, hajm va vaqt chegarasi (4); o‘chirgich, rozilik/audio tekshiruvi, soxta provider, xatolar, tezlik/global limit va frontend oqimi (6). Mavjud YHQ yo‘q holati testlari alohida nusxada saqlandi. Gemini javoblari soxta; haqiqiy chaqiruv bajarilmadi.

## Bajarilmagan yoki sinovdan o‘tkazilmagan

- Deploy, jonli Gemini, haqiqiy audio/mikrofon va real telefonda oflayn/PWA sinovi bajarilmadi.
- Belgilar rasmlari, jadvallar va YHQ keyingi ilovalari indekslanmadi. Ular asl eksportda saqlanadi.
- Eksport sanalaridan keyingi qonunchilik o‘zgarishlari, huquqiy xulosa va ovoz tanish sifati tekshirilmadi.
- Maxsus YPX tezkor rejimi, yurist to‘ldiradigan ro‘yxatlar va TTS qo‘shilmadi.
- Brauzerda 30 soniya, serverda 750000 bayt chegarasi bor; server audio davomiyligini dekodlab o‘lchamaydi. MP4-only brauzer uchun moslik qo‘shilmagan.

Yoqish va maxfiylik chegaralari: `docs/VOICE_UZ.md`. Manba qamrovi: `docs/YHQ_IMPORT_UZ.md`. Oldingi v11.9 hisoboti tarixiy holatni ifodalaydi.

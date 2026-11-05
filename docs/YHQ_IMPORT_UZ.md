# YHQ va YPX manbalarini import qilish

Foydalanuvchi bergan ikki Word/HTML eksporti import qilindi. Huquqiy matn yaratilmagan.

| Manba | Indeksdagi hajm | Eksportdagi so‘nggi sana | Qamrov |
|---|---:|---|---|
| 172-son qaror, Lex.uz -5953883 | 191 band | 2026-10-30 | YHQ asosiy qoidalari |
| 975-son qaror, Lex.uz -4089917 | 62 band | 2024-07-17 | O‘zaro munosabatlar nizomi |

Sanalar yuklangan fayllardan olingan; eng so‘nggi qonunchilikka muvofiqligi internet orqali tekshirilmagan. Asl baytlar `data/sources/yhq-172-owner.html` va `data/sources/ypx-975-owner.html`da, SHA-256 qiymatlari tegishli JSONdagi `provenance`da saqlangan. Asl fayllar ommaviy public papkaga chiqarilmaydi.

```sh
python3 scripts/import_lexuz.py data/sources/yhq-172-owner.html data/laws/yhq.json --doc yhq --lex-id -5953883 --start-at 'Yoʻl harakati qoidalari' --end-before 'Yoʻl belgilari' --manifest data/laws/manifest.json
python3 scripts/import_lexuz.py data/sources/ypx-975-owner.html data/laws/ypx975.json --doc ypx975 --lex-id -4089917 --start-at 'Yoʻl-patrul xizmati xodimlarining yoʻl harakati qatnashchilari bilan oʻzaro munosabatlari hamda maxsus moslamalardan foydalanishi tartibi toʻgʻrisida' --manifest data/laws/manifest.json
npm run build
npm test
npm run eval
```

Importer `.doc` nomidagi HTML eksportini o‘qiydi; ikkilik DOC/DOCX qo‘llanmaydi. Kirish qaror bandlari va keyingi YHQ ilovalari asosiy bandlarga aralashtirilmaydi. Yuqori indeksdagi qo‘shimcha raqamlar alohida ID oladi, nuqtadan keyin bo‘shliq bo‘lmagan bandlar ham olinadi. Takroriy ID yoki sana yo‘qligida import to‘xtaydi. Importni qayta bajargach, provenance ma’lumotlarini ham qayta tekshirish lozim.

Asosiy bandlar matni eksportning tegishli bo‘limlaridagi matn bloklari bilan avtomatik solishtirildi. Bu huquqiy ekspertiza emas. Belgilar rasmlari, jadvallar va keyingi ilovalar mazmuni indekslanmagan, AI orqali talqin qilinmagan. Ular uchun alohida, egasi tekshiradigan import kerak. Maxsus YPX tezkor rejimi va yurist to‘ldiradigan data/ypx ro‘yxatlari qo‘shilmadi.

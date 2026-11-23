# IIV 502-son yo‘riqnoma: import holati

**Hujjat:** Ichki ishlar vazirining 2026-yil 4-sentabrdagi 502-son buyrug‘i bilan tasdiqlangan "Yo‘l harakati qoidalarining buzilishiga doir ma’muriy ishlarni rasmiylashtirish va ko‘rib chiqish tartibi to‘g‘risidagi yo‘riqnoma". Adliya vazirligida 2026-yil 5-noyabrda 3969-raqam bilan ro‘yxatdan o‘tgan, QMMB 06.11.2026-y., 10/26/3969/1107-son.

## Hozirgi holat: `pending-lex`

- Egasi PDF nusxasini berdi: `data/sources/iiv-502-owner.pdf`. Matn eksporti `data/sources/iiv-502-owner.txt` faylida. Eksport pdfjs-dist 4.10.38 bilan olingan, sahifalar `===== PAGE n =====` bilan ajratilgan.
- 2026-11-07 holatiga hujjat lex.uz qidiruvida topilmadi. U yerda eng oxirgi hujjat amaldagi 2011-yilgi yo‘riqnomaga (ro‘yxat raqami 2240) kiritilgan 2240-8 o‘zgartirish.
- PDF metama’lumoti: PDF2Go; yaratilgan sana 2024-11-20, o‘zgartirilgan sana 2026-11-07. Bu fayl rasmiy nashr emas, konvertatsiya qilingan nusxa.
- Shu sababli bazadagi nusxa `data/pending/iiv502.json` faylida turadi va javoblarda **ishlatilmaydi**. `loadBandLaw` lex.uz havolasisiz hujjatni qabul qilmaydi. Qamrov sahifasi hujjatni "ulanmagan" ro‘yxatida ko‘rsatadi.
- Kuchga kirishi: rasmiy e’londan 2 oy o‘tgach. `effectiveFrom: 2027-01-07` sanasi 06.11.2026 + 2 oy deb hisoblangan; uni lex.uz bilan tasdiqlash kerak. Ulangandan keyin har bir bandda shu sanagacha "HALI KUCHGA KIRMAGAN" ogohlantirishi chiqadi.
- 118 band, 7 bob, 3-bobda 3 ta paragraf (§). 1–10 va 12-ilovalar blanka rasmlari: ular indekslanmagan va taxminan talqin qilinmaydi. 2-ilova (o‘z kuchini yo‘qotgan hujjatlar) va 11-ilova (shakl) ham kiritilmagan.

## Faollashtirish (lex.uz’da chiqqanda)

1. lex.uz’dagi matnni PDF nusxa bilan solishtiring. Farq bo‘lsa, lex.uz matnini asos qilib oling.
2. Qayta import qiling (`--lex-id` bilan) va natijani `data/laws/` ga yozing:

```bash
node scripts/import-band-text.mjs data/sources/iiv-502-owner.txt data/laws/iiv502.json --doc iiv502 --name "…" --from "1-bob" --to "1-ILOVA" --lex-id -<ID> --as-of 2026-11-06 --effective <lex.uz sanasi> --pdf data/sources/iiv-502-owner.pdf
```

3. `data/pending/iiv502.json` faylini o‘chiring. `manifest.json` da `file: "iiv502.json"`, `status: "imported"` va `lexId` ni yangilang.
4. `tests/iiv502-v1113.test.mjs` dagi "javoblarda ishlatilmaydi" tekshiruvini "ulangan" tekshiruviga almashtiring. `eval/cases.json` ga bayonnoma, shikoyat muddati va jarima chegirmasi bo‘yicha holatlar qo‘shing.
5. `npm run build`, `npm test`, `npm run eval` ni ishga tushiring.

RAG ulanishi tayyor: `traffic.mjs` (`adminProcLaw`, `notInForce`), `rag.mjs` (`CODES.iiv502`: bayonnoma, jarima maydonchasi, jarima ballari, jarimaga shikoyat), `chat.mjs` va `search.mjs`. Bu ulanish hujjat `data/laws/` ga ko‘chganda o‘zi yoqiladi.

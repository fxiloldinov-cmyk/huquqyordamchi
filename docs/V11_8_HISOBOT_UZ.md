# HuquqYordamchi v11.8 — funksiyalarni kengaytirish

Sana: 2026-11-05. Asos: foydalanuvchi yuborgan v11.7 ZIP. Bu v12.0 yakuniy relizi emas; yuborilgan to‘rtta prompt bo‘yicha birinchi funksional kengaytma.

## Qo‘shilgan imkoniyatlar

- Bosh sahifada tezkor savol maydoni va Travel / Business / Kazus Coach yo‘nalishlariga kirish kartalari. Navy / teal / mist / gold ranglari bilan mavjud dizaynni yangilovchi qatlam. Avvalgi sahifalar va ish oynasi saqlanadi.
- `/international.html`: Travel Legal va Business Legal uchun alohida ma’lumot yig‘ish oqimlari, besh tilda interfeys, AI roziligi, manbalar paneli, tahrirlanadigan javob, TXT va brauzer orqali chop etish/PDF.
- `/api/international`: mavjud RAG, manba tekshiruvi, Gemini oqimi, shaxsiy identifikatorlarni yashirish va global xarajat limitlarini qayta ishlatadi. Viza/ro‘yxatdan o‘tish/investitsiya maxsus qonunlari qamrovi to‘liq deb ko‘rsatilmaydi. Xorijiy huquq xulosasi kafolatlanmaydi.
- `/coach.html`: Kazus Learning Coach. IRAC ish varag‘i, o‘z javobi, maslahat/AI tekshiruvi, qayta ishlash va solishtirish oqimi. Tuzilish bo‘yicha avtomatik ro‘yxat — huquqiy mazmun bahosi emas. Yurist tekshiruvi kutilayotgan 30 o‘quv vaziyat.
- `/plans.html` va `/api/plans`: 0 / 19 000 / 39 000 so‘mlik gipoteza tariflar, mos ravishda 2 / 10 / 30 oylik AI murojaati. Bu tayyor sotuv yoki real obuna emas.
- Ixtiyoriy server pilot limitlari: foydalanuvchi, kalendar oy, matn hajmi va javob token chegarasi; atomar hisoblagich. To‘lov yoki tarifni mijoz tomondan faollashtirish yo‘q.

## Tariflarni sozlash

`HK_KAZUS_PLANS_ENABLED=0` — standart. Eski hisobsiz Kazus ishlashi davom etadi; global IP/kunlik limitlar saqlanadi.

`HK_KAZUS_PLANS_ENABLED=1` — Kazus AI uchun hisob talab etiladi, server oylik pilot kvotasini tekshiradi. Bepul hisob: oyiga 2 murojaat, 3000 belgigacha kazus, 4000 javob tokenigacha. Davom so‘rovi va qayta urinish ham murojaat hisoblanadi. Provayder xatosi boshlangan urinishni qaytarmaydi; bu mahsulot sahifasida yozilgan.

`HK_PILOT_ENTITLEMENTS` — faqat serverdagi JSON sozlama, masalan:

```json
{"student@example.com":{"plan":"student","expiresAt":"2026-12-01T00:00:00Z"}}
```

`student`: 10 murojaat, 6000 belgi, 8000 javob tokeni. `pro`: 30 murojaat, 6000 belgi, 12000 javob tokeni. Muddati tugagan yoki noma’lum tarif bepul tarifga qaytadi. Noto‘g‘ri konfiguratsiyada AI o‘tkazilmaydi. Hisob o‘chirilganda uning Kazus kvota yozuvi ham o‘chiriladi.

Bu sozlama pul to‘langanini bildirmaydi. To‘lov provayderi, chek, tranzaksiya webhooki, qaytarish va obuna yangilash hali yozilmagan.

## Ishga tushirish

Node.js 22+. ZIPni oching, butun loyiha papkasida `npm ci`, `npm run build`, `npm test`, so‘ng `npm run dev`. `http://localhost:3000` da bosh sahifa; yangi bo‘limlar yuqoridagi manzillarda. Lokal hisoblar xotirada; server qayta ishga tushsa yo‘qoladi. Haqiqiy muhitda Netlify Blobs kerak. Gemini kaliti faqat server muhitida. Faqat `public`ni yuklash APIlarni ishga tushirmaydi.

Mavjud sozlash hujjatlari v11.7 asosini ham tasvirlaydi; ushbu hisobot yangi funksiyalar uchun ustuvor.

## Promptlar bo‘yicha hali yakunlanmagan ishlar

- To‘liq xalqaro huquqiy qamrov, barcha maxsus manbalar va inson tekshirgan amaldagi tahrirlar.
- Embedding/semantic retrieval va alohida reranker; hozir mavjud BM25/kalit-so‘z qidiruvi va soha bo‘yicha yo‘naltirish ishlatiladi.
- To‘liq PDF/DOCX yuklash va serverdagi maxfiy hujjat ombori; xalqaro modulda faqat matn/TXT bilan ishlanadi.
- Admin paneli, ekspert navbati, audit jurnali va haqiqiy biznes analitikasi.
- Haqiqiy to‘lov integratsiyasi, cheklar, tranzaksiya holatlari va qaytarish oqimi.
- Haqiqiy API sarfi/token tannarxi, MRR, retention va foydalanuvchi konversiyasi — o‘lchanmagan. Mijozlar yoki investor borligi da’vo qilinmaydi.
- 20–30 talaba beta va 10–20 pullik foydalanuvchi piloti o‘tkazilmagan.
- Huquqiy ekspertiza va huquqiy xulosa aniqligi baholanmagan. Oflayn texnik testlar buni almashtirmaydi.
- Sayt ommaga joylanmadi, GitHub/Netlify o‘zgartirilmadi, pullik AI chaqiruvlari bajarilmadi.

## Operatsiya va zaxira

Source ZIPni reliz nusxasi sifatida saqlang. Netlify ishlab chiqarishdagi foydalanuvchilar, sessiyalar, ishlar, kitob parchalari va kvota ma’lumotlari ZIPda bo‘lmaydi. Ishlab chiqarish omborini alohida ruxsatli eksport qilish va tiklash sinovini administrator tashkil qilishi kerak; bu versiyada avtomatik backup/restore yo‘q. Rollback: avvalgi v11.7 source paketidan qayta build/deploy qilish; avval yangi ombor yozuvlarini zaxiralash.

Keyingi funksional reliz uchun ustuvorlik: admin feedback/ekspert navbati → to‘liq hujjat importi → to‘lov provayderi adapteri → xalqaro maxsus manbalar → real foydalanish analitikasi.

## Yakuniy texnik tekshiruv dalillari

- `npm run build`: muvaffaqiyatli.
- `npm test`: 120 test, 120 muvaffaqiyatli, 0 xato, 0 o‘tkazib yuborilgan. Asosiy v11.7 testlari ham shu to‘plamda. Testlardagi provayder 400/404/403 xabarlari soxta javoblarning tekshiruvi; haqiqiy kalit ishlatilmagan.
- Qo‘shimcha 100 ta xalqaro vaziyat savoli: `eval/international-scenarios.json`. Identifikatorlar noyob; javoblar belgilanmagan; huquqiy baholash foiziga kiritilmaydi. Kazus Coachdagi 30 ta mashq alohida.
- Brauzerda bosh sahifa va tariflar ochildi; Kazusda “Sud topshirig‘i” mashqi olindi, fan to‘g‘ri tanlandi va 1/7 to‘ldirilgan maydon tekshiruvi ko‘rindi.
- Business query-parametri va nemis tili, Travelga almashish va fransuz tili brauzerda tekshirildi. Mobil/tablet CSS breakpointlari yozilgan, ammo alohida real qurilma sinovi o‘tkazilmadi.
- Jonli Gemini javobi, haqiqiy billing, deploy, ishlab chiqarish ombori va huquqiy xulosa aniqligi ushbu tekshiruvda sinovdan o‘tkazilmadi.

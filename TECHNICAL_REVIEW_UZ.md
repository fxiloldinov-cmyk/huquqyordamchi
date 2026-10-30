# HuquqYordamchi v10 — o‘zgarishlar va tekshiruv

Sana: 2026-10-29. Bu fayl v9 dagi eski texnik ko‘rik o‘rniga joriy holatni qayd etadi.

## Tuzatilgan kamchiliklar

1. Mehnat kodeksi havolalaridagi aralashishlar: xodim tashabbusi — 160, ish beruvchi tashabbusi — 161, kechikkan to‘lov bo‘yicha javobgarlik — 333. Sudga murojaat muddatlari 560-modda doirasida qayta yozildi.
2. Birinchi navbatdagi vorislar uchun FK 1135 ko‘rsatildi; FK 1146 dagi olti oy merosni qabul qilishning mutlaq oxirgi muddati sifatida berilishi olib tashlandi.
3. Iste’molchi huquqlarini sudda himoya qilish havolasi 29-moddaga tuzatildi. Tekshirilmagan qat’iy to‘lov va ayrim tez o‘zgaradigan ma’lumotlar umumiy yo‘riq bilan almashtirildi.
4. Bir xil so‘zdan boshlanadigan kodekslar “tasdiqlangan” belgisi uchun adashib moslashtirilmaydi: hujjatning aniq nomi/aliasi va modda raqami solishtiriladi.
5. Kirillcha va modda raqami bilan lokal qidiruv ishlaydi. Tekshirilmagan katalog yozuvlari tekshirilgan deb belgilanmaydi.
6. Oldingi katta AI javobi keyingi savolni backend limitiga urmaydi; so‘rov tarixi chegaralanadi. Band holatda ikkinchi yozilayotgan savol o‘chirib yuborilmaydi.
7. AI oqimining oxirgi, yangi qatordan oldin tugamagan paketi ham o‘qiladi. Bo‘sh, bloklangan, tugallanmagan yoki uzilgan javob holatlari ko‘rsatiladi. Foydalanuvchi so‘rovni to‘xtata oladi.
8. Google qidiruvi xatosida manbasiz generatsiyaga yashirin qaytish olib tashlandi. Manba havolalari filtrlanadi va takrorlari olinadi.
9. JSONning haqiqiy bayt hajmi, rollar, xabar va suhbat chegaralari tekshiriladi. Origin protokol va port bilan to‘liq tekshiriladi; mijoz kiritgan forwarding sarlavhasi avtorizatsiya asosi emas.
10. Telegram bot yagona katalogdan foydalanadi; parallel yangilanishlar, AI uchun bir vaqtda 4 so‘rov chegarasi, foydalanuvchiga 5/minut va 30/soat cheklovi, API kutish chegarasi qo‘shildi.
11. To‘rtta yangi/qayta ishlangan ariza, professional kazus va kodeksni sodda tushuntirish interfeysi qo‘shildi.
12. Yangilik turini sarlavhadagi tasodifiy “qonun” so‘zi orqali aniqlash olib tashlandi; hujjatning organ/turi metama’lumoti ishlatiladi. To‘rtta turga ma’lumot mavjud.

## Bajarilgan tekshiruv

- `npm run build` — muvaffaqiyatli.
- `npm test` — 23/23 test. Qidiruv, kodekslar chalkashishi, aliment ulushi, andoza cheklovlari, uzun suhbat, JSON/Origin, SSE, RSS va AI so‘rov shakli tekshirildi. AI integratsiyasi tashqi haqiqiy xizmat o‘rniga nazorat qilinadigan javoblar bilan sinaldi.
- JavaScript/ESM sintaksisi va Python kompilyatsiyasi tekshirildi.
- Brauzerda bosh sahifa, `JK 168` qidiruvi, AI kaliti yo‘q holati, aliment generatori, kodeks tushuntirish oynasi va kazus rejimlari ko‘rildi. Desktop ko‘rinishi vizual tekshirildi; mobil ekran uchun CSS qo‘shilgan, alohida haqiqiy telefon sinovi bajarilmadi.

## Qolgan cheklovlar

- Jonli Netlify deploy, haqiqiy Gemini/Telegram kalitlari va provayder hisobi bilan sinov ushbu muhitda bajarilmadi. Amaldagi domen nomi/DNS o‘zgartirilmadi.
- RSS tashqi tarmoqqa bog‘liq. Zaxira sanasi ochiq ko‘rsatiladi; zaxira jonli yangilik sifatida taqdim etilmaydi.
- Serverning soatlik in-memory limiti bitta faol instance doirasida. Ko‘p instance va restartlar uchun umumiy saqlagichli limit/budget alohida kerak; Origin tekshiruvi autentifikatsiya o‘rnini bosmaydi. Netlify konfiguratsiyasida minutlik platforma limiti ham bor.
- Katalogdagi barcha 46 modda va barcha umumiy qo‘llanmalar to‘liq yuridik ekspertizadan o‘tmagan. `reviewedAt` yo‘q yozuvlar alohida belgilangan. To‘rtta yangi arizaga tegishli rasmiy manbalar berilgan, lekin individual sud ishiga moslik avtomatik kafolatlanmaydi.
- Kazusning avvaldan berilgan arxiv namunasi saqlangan. Unda tarixiy normalar uchrashi mumkin; endi u avtomatik tanlanmaydi va “tekshirilgan amaldagi yechim” deb taqdim etilmaydi.
- AI xulosasi qonuniy kuchga ega hujjat emas. Havolalar dalilni tekshirishga yordam beradi, lekin avtomatik to‘liq iqtibos-verifikatsiya tizimi yo‘q.
- Hujjat eksporti: TXT va brauzer orqali chop etish/PDF. DOCX, administrator paneli, login va foydalanuvchi hujjatlarini serverda saqlash bu versiyada yo‘q.

Asosiy qayta tekshirish navbati: hostingda AI/RSS sinovi, qolgan katalogning huquqiy auditi, haqiqiy telefon sinovi, tarqatilgan API xarajat nazorati.

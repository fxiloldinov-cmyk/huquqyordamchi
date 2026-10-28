# Huquq Kutubxonasi — Telegram Botini Ishga Tushirish Qo'llanmasi

Ushbu bot O'zbekiston qonunlari bo'yicha fuqarolarga va talabalarga maslahat beruvchi, hayotiy vaziyatlar bo'yicha qadam-baqadam yo'l-yo'riq ko'rsatuvchi va AI yordamida savollarga javob beruvchi rasmiy botdir.

---

## 🚀 3 daqiqada ishga tushirish:

### 1-qadam: Bot Token olish
1. Telegram'da **@BotFather** botini qidiring va kiring.
2. `/newbot` buyrug'ini yuboring.
3. Botingizga nom (masalan: `Mening Huquq Boti`) va username (masalan: `huquq_yordamchi_bot`) bering.
4. BotFather sizga uzun token beradi (masalan: `7123456789:AAH...`).

### 2-qadam: Tokenni kiritish
1. Ushbu papkadagi `.env` faylini Bloknot (Notepad) orqali oching.
2. Tokenni quyidagicha yozib saqlang:
   ```env
   TELEGRAM_BOT_TOKEN=7123456789:AAHxxxxxxxxxxxxxxxxxxxx
   GEMINI_API_KEY=AIzaxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```
   *(Gemini API kalitini [aistudio.google.com](https://aistudio.google.com/app/apikey) saytidan bepul olishingiz mumkin).*

### 3-qadam: Ishga tushirish
* Shunchaki **`run_bot.bat`** faylini sichqoncha bilan 2 marta bosing!
* Kutubxonalar avtomatik o'rnatiladi va botingiz Telegram'da ishga tushadi.

---

## 📱 Bot imkoniyatlari:
- 💼 **Hayotiy vaziyatlar:** Mehnat, jarima, aliment, meros, kredit, ijara, tovar qaytarish bo'yicha tayyor tugmalar.
- 📜 **Kodekslar:** Barcha asosiy O'zbekiston kodekslari va ularning lex.uz rasmiy havolalari.
- 🤖 **AI Yurist:** Foydalanuvchi yozgan har qanday matnli savolga o'zbek tilida qonun moddalari bilan javob berish.

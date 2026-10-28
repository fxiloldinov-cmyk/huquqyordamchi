# Huquq Kutubxonasi — O'zbekiston qonunlari va AI yordamchi

Ushbu loyiha [uzbekistan-law-library.netlify.app](https://uzbekistan-law-library.netlify.app) saytining to'liq manba kodlari (Frontend & Backend arxitekturasi) hisoblanadi.

> **Eslatma:** Ushbu sayt dastlab Netlify AI orqali to'g'ridan-to'g'ri deploy qilingan bo'lib, ochiq GitHub repozitoriysi mavjud emas edi. Quyida saytning barcha tozalangan HTML, CSS, JS fayllari hamda AI backend funksiyasi to'liq taqdim etilgan.

---

## 📁 Loyiha tarkibi

- **`index.html`** — Saytning asosiy strukturasi: Bosh sahifa (Hero), Hayotiy vaziyatlar bo'limi, Kodekslar ro'yxati, Vaziyat tafsilotlari va AI chat interfeysi.
- **`styles.css`** — Moslashuvchan (responsive), toza va chiroyli dizayn (Fraunces serif va Manrope shriftlari, oltin va to'q ko'k ranglar palitrasi).
- **`app.js`** — Barcha hayotiy vaziyatlar (`SITUATIONS`) va kodekslar (`CODES`) bazasi, Markdown rendering, sahifalararo navigatsiya va AI chat mantiqi.
- **`netlify/functions/chat.js`** — `/api/chat` serverless funksiyasi (Gemini yoki OpenAI modeli bilan O'zbekiston qonunchiligi bo'yicha javob beruvchi backend).

---

## 🚀 Qanday ishga tushirish mumkin?

### 1. Faqat frontendni ko'rish (statik ko'rinish)
`index.html` faylini istalgan brauzerda oching. Hayotiy vaziyatlar, qonunlar va qadam-baqadam qo'llanmalar to'liq ishlaydi.

### 2. AI chat bilan to'liq ishga tushirish (Netlify orqali)
1. Ushbu papkani GitHub-ga yangi repozitoriy qilib yuklang (`git push`).
2. Netlify-ga ulab, deploy qiling.
3. Netlify Environment Variables bo'limiga API kalitingizni (`GEMINI_API_KEY` yoki `OPENAI_API_KEY`) kiriting.

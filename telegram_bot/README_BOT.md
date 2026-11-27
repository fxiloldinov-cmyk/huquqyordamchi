# HuquqYordamchi Telegram boti

Bot sayt bilan bir xil `../data/legal.json` katalogidan foydalanadi. `telegram_bot` papkasini alohida ajratib ko‘chirmang; loyiha tuzilmasini saqlang.

Python 3.11 yoki yangiroq muhitda:

```bash
cd telegram_bot
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
python bot.py
```

Ishga tushirishdan oldin shu papkada `.env` yarating:

```env
TELEGRAM_BOT_TOKEN=
# ixtiyoriy, standart: https://huquqyordamchiuz.netlify.app
HK_SITE_URL=
```

Telegram tokenini @BotFather orqali oling. Haqiqiy tokenni ommaviy repozitoriyga yoki arxivga qo‘shmang. Windows uchun `run_bot.bat` ham saqlangan.

**AI javobi saytdan olinadi (2026-11-27 dan).** Bot savolni saytning `/api/chat` funksiyasiga yuboradi, shuning uchun javob saytdagi bilan bir xil: lex.uz rasmiy matnidan olingan parchalar, modda raqamlarini tekshirish (🔎 📄 ⚠️ ❌), shaxsiy ma’lumot filtri. Gemini kaliti botda kerak emas va saqlanmaydi — faqat Netlify muhitida. Eski `GEMINI_API_KEY`/`GEMINI_MODEL` qatorlarini `.env` dan o‘chirib tashlang.

Bot mustaqil jarayon sifatida ishlaydi; Netlify sayt deploy’i uni ishga tushirmaydi. Bir vaqtda ko‘pi bilan 4 chaqiruv, har bir foydalanuvchi uchun 5/minut va 30/soat in-memory chegara. Cheklov: sayt limitlari IP bo‘yicha hisoblanadi, bot esa bitta IP’dan so‘raydi — ko‘p foydalanuvchi bo‘lsa, umumiy limit tez tugaydi (bot "limit tugadi" deydi). Kerak bo‘lsa, bot uchun alohida kvota keyin qo‘shiladi.

Savollar sayt orqali Gemini xizmatiga yuboriladi. Huquqiy javob va manbalarni mustaqil tekshiring. Haqiqiy Telegram tokeni bilan jonli sinov bajarilmadi.

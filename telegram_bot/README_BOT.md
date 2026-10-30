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
GEMINI_API_KEY=
GEMINI_MODEL=gemini-2.5-flash
```

Telegram tokenini @BotFather orqali, Gemini kalitini o‘zingizning provayder hisobingizdan oling. Haqiqiy kalitlarni ommaviy repozitoriyga yoki arxivga qo‘shmang. Windows uchun `run_bot.bat` ham saqlangan.

Bot mustaqil jarayon sifatida ishlaydi; Netlify sayt deploy’i uni ishga tushirmaydi. AI uchun Google qidiruvi, 50 soniyalik kutish chegarasi va bir vaqtda ko‘pi bilan 4 chaqiruv bor. Har bir foydalanuvchi uchun 5/minut va 30/soat in-memory chegara qo‘llanadi; restart yoki bir nechta bot instance’i uchun bu umumiy kvota emas.

Savollar Gemini xizmatiga yuboriladi. Huquqiy javob va manbalarni mustaqil tekshiring. Ushbu paket tayyorlanayotganda haqiqiy Telegram/Gemini kalitlari bilan jonli sinov bajarilmadi.

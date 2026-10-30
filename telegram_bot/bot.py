"""
HuquqYordamchi — O'zbekiston Qonunchiligi va AI Yurist Telegram Boti
Muallif: Sizning loyihangiz
"""

import os
import re
import html
import logging
import asyncio
import time
import json
from pathlib import Path
from collections import defaultdict, deque
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup
from telegram.constants import ChatAction, ParseMode
from telegram.error import BadRequest
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

# Muhit o'zgaruvchilarini yuklash (.env fayldan)
load_dotenv(Path(__file__).with_name(".env"))

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)
# httpx so'rov loglarida bot tokeni URL ichida chiqmasligi uchun
logging.getLogger("httpx").setLevel(logging.WARNING)

TELEGRAM_LIMIT = 4000  # Telegram limiti 4096 belgi; zaxira bilan
MAX_QUESTION_CHARS = 4000

SYSTEM_INSTRUCTION = (
    "Siz O'zbekiston Respublikasi qonunchiligi bo'yicha ehtiyotkor AI axborot yordamchisiz. "
    "O'zbek tilida sodda va amaliy javob bering. Tekshirilmagan modda raqami, muddat, jarima "
    "yoki URLni o'ylab topmang. Rasmiy qonun matni bilan https://lex.uz orqali tekshirishni "
    "eslating. Yetarli ma'lumot bo'lmasa, aniqlashtiruvchi savol bering. "
    "Murakkab yoki yuqori xavfli holatda malakali yuristga murojaat qilishni tavsiya qiling. "
    "Javob 3000 belgidan oshmasin."
)

VERIFY_NOTE = "\n\n_⚠️ Umumiy ma'lumot. Modda, muddat va raqamlarni lex.uz da tekshiring._"

_gemini_client = None


def get_gemini_client():
    """Gemini klientini bir marta yaratib, qayta ishlatadi."""
    global _gemini_client
    if _gemini_client is None:
        from google import genai
        _gemini_client = genai.Client(api_key=GEMINI_KEY)
    return _gemini_client


def markdown_to_telegram_html(text: str) -> str:
    """AI javobidagi oddiy Markdownni Telegram HTML formatiga xavfsiz o'giradi."""
    text = html.escape(text, quote=False)
    # [matn](https://...) havolalar
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^\s)]+)\)",
        lambda m: f'<a href="{m.group(2).replace(chr(34), "%22")}">{m.group(1)}</a>',
        text,
    )
    # Sarlavhalar -> qalin qator
    text = re.sub(r"^#{1,6}\s+(.+)$", r"<b>\1</b>", text, flags=re.M)
    # **qalin** va __qalin__
    text = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", text, flags=re.S)
    text = re.sub(r"__(.+?)__", r"<b>\1</b>", text, flags=re.S)
    # Ro'yxat belgilari: "* " yoki "- " -> "• "
    text = re.sub(r"^(\s*)[*-]\s+", r"\1• ", text, flags=re.M)
    # *kursiv*
    text = re.sub(r"(?<![*\w])\*(?!\s)([^*\n]+?)\*(?!\w)", r"<i>\1</i>", text)
    # `kod`
    text = re.sub(r"`([^`\n]+)`", r"<code>\1</code>", text)
    return text


def split_message(text: str, limit: int = TELEGRAM_LIMIT) -> list[str]:
    """Uzun matnni paragraf/qator chegarasida Telegram limitiga mos bo'laklarga ajratadi."""
    parts = []
    while len(text) > limit:
        cut = text.rfind("\n\n", 0, limit)
        if cut < limit // 2:
            cut = text.rfind("\n", 0, limit)
        if cut < limit // 2:
            cut = text.rfind(" ", 0, limit)
        if cut <= 0:
            cut = limit
        parts.append(text[:cut].rstrip())
        text = text[cut:].lstrip()
    if text:
        parts.append(text)
    return parts


async def send_ai_answer(update: Update, answer: str):
    """Javobni HTML bilan yuboradi; formatlash xatosi bo'lsa oddiy matn bilan qayta yuboradi."""
    for chunk in split_message(answer):
        try:
            await update.effective_message.reply_text(
                markdown_to_telegram_html(chunk),
                parse_mode=ParseMode.HTML,
                disable_web_page_preview=True,
            )
        except BadRequest as e:
            logger.warning("HTML formatlash xatosi, oddiy matnda yuborilmoqda: %s", e)
            await update.effective_message.reply_text(chunk, disable_web_page_preview=True)

# Shared catalogue with the website: edit data/legal.json and run npm run build.
LEGAL = json.loads((Path(__file__).resolve().parents[1] / 'data' / 'legal.json').read_text(encoding='utf-8'))
SITUATIONS = {item['id']: {'title': item['title'], 'text': item['title'] + '\n\n' + item['intro'] + '\n\n' + '\n\n'.join(str(i+1)+'. '+a+'\n'+b for i,(a,b) in enumerate(item['steps'])) + '\n\nAsos: ' + '; '.join(item['laws'])} for item in LEGAL['situations']}
CODES = [(c[1],c[2],c[3]) for c in LEGAL['codes']]
_user_hits = defaultdict(deque)
_ai_slots = asyncio.Semaphore(4)
def allow_question(user_id):
    now=time.monotonic()
    if len(_user_hits)>5000:
        for key in list(_user_hits):
            if not _user_hits[key] or now-_user_hits[key][-1]>3600: del _user_hits[key]
    hits=_user_hits[user_id]
    while hits and now-hits[0]>=3600: hits.popleft()
    if len(hits)>=30 or sum(now-t<60 for t in hits)>=5: return False
    hits.append(now)
    return True

# ASOSIY MENYU TUGMALARI
def main_menu_keyboard():
    return ReplyKeyboardMarkup(
        [
            ["💼 Hayotiy vaziyatlar", "📜 Kodekslar"],
            ["📝 Hujjat shablonlari", "🤖 AI Yuristga savol berish"],
            ["ℹ️ Bot haqida va yordam"]
        ],
        resize_keyboard=True
    )

async def start_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    user_name = update.effective_user.first_name or "Foydalanuvchi"
    text = (
        f"Assalomu alaykum, {user_name}! 👋\n\n"
        "Men — *«HuquqYordamchi»* AI huquqiy axborot yordamchisiman.\n\n"
        "🏛 *Sizga qanday yordam bera olaman?*\n"
        "• Hayotiy muammolar (ish, jarima, aliment, meros) bo'yicha qadam-baqadam qo'llanma beraman.\n"
        "• O'zbekiston qonunlari va kodekslarini sodda tushuntiraman.\n"
        "• Ariza va shartnoma namunalari haqida ma'lumot beraman.\n"
        "• Savollaringizga AI (sun'iy intellekt) orqali umumiy ma'lumot beraman.\n\n"
        "Quyidagi bo'limlardan birini tanlang:"
    )
    await update.message.reply_text(markdown_to_telegram_html(text), parse_mode=ParseMode.HTML, reply_markup=main_menu_keyboard())

async def help_command(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "ℹ️ *BOTDAN FOYDALANISH:* \n\n"
        "1. Tugmalar orqali eng ko'p uchraydigan hayotiy vaziyatlar bo'yicha tayyor javoblarni oling.\n"
        "2. Istalgan huquqiy savolingizni to'g'ridan-to'g'ri xabar sifatida yozing — AI yordamchi sizga javob qaytaradi!\n\n"
        "⚠️ *Muhim eslatma:* AI javoblari ma'lumot xarakteriga ega va rasmiy advokatlik maslahati o'rnini bosmaydi. Qonunlarning so'nggi tahriri bilan [lex.uz](https://lex.uz) saytida tanishishingiz mumkin."
    )
    await update.message.reply_text(text, parse_mode="Markdown", disable_web_page_preview=True)

# VAZIYATLARNI CHIQARISH
async def show_situations(update: Update, context: ContextTypes.DEFAULT_TYPE):
    keyboard = []
    keys = list(SITUATIONS.keys())
    for i in range(0, len(keys), 2):
        row = [InlineKeyboardButton(SITUATIONS[keys[i]]["title"], callback_data=f"sit_{keys[i]}")]
        if i + 1 < len(keys):
            row.append(InlineKeyboardButton(SITUATIONS[keys[i+1]]["title"], callback_data=f"sit_{keys[i+1]}"))
        keyboard.append(row)

    reply_markup = InlineKeyboardMarkup(keyboard)
    await update.message.reply_text(
        "📌 *Quyidagi hayotiy vaziyatlardan birini tanlang:*",
        parse_mode="Markdown",
        reply_markup=reply_markup
    )

# KODEKSLARNI CHIQARISH
async def show_codes(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = "📜 *O'ZBEKISTON RESPUBLIKASI ASOSIY KODEKSLARI:*\n\n"
    for title, desc, doc_id in CODES:
        link = f"https://lex.uz/docs/{doc_id}"
        text += f"🔹 *{title}* — {desc}\n[Rasmiy matnini o'qish (lex.uz)]({link})\n\n"
    
    await update.message.reply_text(text, parse_mode="Markdown", disable_web_page_preview=True)

# HUJJATLAR SHABLONLARI
async def show_docs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "📝 *TAYYOR HUQUQIY HUJJATLAR VA ARIZALAR:*\n\n"
        "Saytimizda quyidagi namunalarni onlayn to'ldirib, chop etish yoki yuklab olish mumkin (rasmiy andoza emas):\n"
        "1. Ish haqini undirish to'g'risida ariza\n"
        "2. Sifatsiz tovar uchun da'vo xati (pretenziya)\n"
        "3. Turar joy ijara shartnomasi\n"
        "4. Aliment undirish to'g'risida sud buyrug'i arizasi\n"
        "5. O'z xohishi bilan bo'shash arizasi\n"
        "6. Nikohdan ajratish da’vo arizasi\n"
        "7. YHXX jarimasiga shikoyat\n"
        "8. Firibgarlik alomatlari yuzasidan ariza\n\n"
        "🌐 To'liq generator veb-saytda mavjud!"
    )
    await update.message.reply_text(text, parse_mode="Markdown")

# CALLBACK HANDLER (Tugmalar bosilganda)
async def callback_handler(update: Update, context: ContextTypes.DEFAULT_TYPE):
    query = update.callback_query
    await query.answer()

    if query.data.startswith("sit_"):
        key = query.data.replace("sit_", "")
        data = SITUATIONS.get(key)
        if data:
            await send_ai_answer(update, data["text"] + VERIFY_NOTE)

# AI BILAN SAVOL-JAVOB (GEMINI INTEGRATSIYASI)
async def handle_user_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
    if not update.message or not update.message.text:
        return
    user_text = update.message.text.strip()

    if user_text == "💼 Hayotiy vaziyatlar":
        await show_situations(update, context)
        return
    elif user_text == "📜 Kodekslar":
        await show_codes(update, context)
        return
    elif user_text == "📝 Hujjat shablonlari":
        await show_docs(update, context)
        return
    elif user_text == "🤖 AI Yuristga savol berish":
        await update.message.reply_text("Savolingizni yozing, masalan: *«Meni dam olish kuni ishlatishdi, qo'shimcha haq to'lanadimi?»*", parse_mode="Markdown")
        return
    elif user_text == "ℹ️ Bot haqida va yordam":
        await help_command(update, context)
        return

    # Foydalanuvchi huquqiy savol yozsa:
    if len(user_text) > MAX_QUESTION_CHARS:
        await update.message.reply_text(
            f"Savol juda uzun. Iltimos, {MAX_QUESTION_CHARS} belgidan qisqaroq yozing."
        )
        return

    if not GEMINI_KEY:
        await update.message.reply_text(
            "⚠️ AI xizmati hozir sozlanmagan. Bu savolga umumiy yoki taxminiy huquqiy javob bermayman.\n\n"
            "Qonunlarning amaldagi tahririni https://lex.uz orqali tekshiring.",
            disable_web_page_preview=True,
        )
        return

    if not allow_question(update.effective_user.id):
        await update.message.reply_text('So‘rovlar limiti tugadi. Keyinroq qayta urinib ko‘ring.')
        return
    wait_msg = await update.message.reply_text("🔍 Savolingiz tahlil qilinmoqda, iltimos kuting...")
    await update.message.chat.send_action(ChatAction.TYPING)

    try:
        from google.genai import types
        client = get_gemini_client()
        # Asinxron chaqiruv: bitta javob kutilayotganda bot boshqa foydalanuvchilarga ham javob beradi.
        async with _ai_slots:
            response = await asyncio.wait_for(client.aio.models.generate_content(
                model=GEMINI_MODEL, contents=user_text,
                config=types.GenerateContentConfig(system_instruction=SYSTEM_INSTRUCTION,
                    temperature=0.1, max_output_tokens=3000,
                    tools=[types.Tool(google_search=types.GoogleSearch())]),
            ), timeout=50)
        answer = (response.text or "").strip() or "AI javobi bo'sh qaytdi. Iltimos, savolni boshqacha yozib ko'ring."
    except Exception as e:
        logger.error("Gemini API xatosi: %s", type(e).__name__)
        answer = (
            "⚠️ Sun'iy intellekt javob berishda texnik xatolik yuz berdi. Birozdan keyin qayta urinib ko'ring.\n\n"
            "Qonunlarning rasmiy matni: https://lex.uz"
        )

    answer += "\n\n⚠️ Umumiy AI ma’lumoti. Modda va xulosalarni Lex.uz’dagi tegishli tahrirda tekshiring."
    try:
        await wait_msg.delete()
    except Exception:
        pass
    await send_ai_answer(update, answer)


async def error_handler(update: object, context: ContextTypes.DEFAULT_TYPE):
    """Kutilmagan xatolarni loglaydi va foydalanuvchiga xabar beradi."""
    logger.error("Kutilmagan xatolik turi: %s", type(context.error).__name__)
    if isinstance(update, Update) and update.effective_message:
        try:
            await update.effective_message.reply_text("⚠️ Texnik xatolik yuz berdi. Iltimos, qayta urinib ko'ring.")
        except Exception:
            pass


def main():
    if not BOT_TOKEN:
        print("\n❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!")
        print("Iltimos, .env faylini oching va @BotFather dan olingan tokenni kiriting.\n")
        return

    print("🚀 «HuquqYordamchi» Telegram boti ishga tushmoqda...")
    app = ApplicationBuilder().token(BOT_TOKEN).concurrent_updates(8).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_user_message))
    app.add_error_handler(error_handler)

    app.run_polling()

if __name__ == "__main__":
    main()

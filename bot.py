"""
Huquq Kutubxonasi — O'zbekiston Qonunchiligi va AI Yurist Telegram Boti
Muallif: Sizning loyihangiz
"""

import os
import logging
from dotenv import load_dotenv
from telegram import Update, InlineKeyboardButton, InlineKeyboardMarkup, ReplyKeyboardMarkup
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    MessageHandler,
    CallbackQueryHandler,
    ContextTypes,
    filters,
)

# Muhit o'zgaruvchilarini yuklash (.env fayldan)
load_dotenv()

BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "")
GEMINI_KEY = os.getenv("GEMINI_API_KEY", "")

logging.basicConfig(
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s", level=logging.INFO
)
logger = logging.getLogger(__name__)

# HAYOTIY VAZIYATLAR BAZASI
SITUATIONS = {
  "ish": {
    "title": "💼 Ishdan noqonuniy bo'shatish",
    "text": (
      "💼 *ISHDAN NOQONUNIY BO'SHATISH*\n\n"
      "Ish beruvchi xodimni faqat Mehnat kodeksida ko'rsatilgan asoslar bo'yicha bo'shata oladi.\n\n"
      "📌 *Qadam-baqadam yo'l-yo'riq:*\n"
      "1️⃣ *Buyruq nusxasini oling:* Ishdan bo'shatish buyrug'i va moddasini yozma talab qiling.\n"
      "2️⃣ *Hisob-kitobni tekshiring:* Oxirgi ish kuni maosh va foydalanilmagan ta'til uchun kompensatsiya to'liq berilishi shart.\n"
      "3️⃣ *Mehnat inspeksiyasiga murojaat:* Yashash joyingizdagi Mehnat inspeksiyasiga shikoyat qiling (Tel: 1142).\n"
      "4️⃣ *Sudga da'vo bering:* Ishga tiklash bo'yicha fuqarolik sudiga 1 oy ichida ariza topshiring. Davlat boji to'lanmaydi!\n\n"
      "📖 *Asos:* Yangi Mehnat kodeksi 161, 171, 400-moddalar."
    )
  },
  "ish_haqi": {
    "title": "💵 Ish haqi berilmayapti",
    "text": (
      "💵 *ISH HAQI VA TA'TIL PULI KECHIKKANDA*\n\n"
      "Mehnat kodeksining 253-moddasiga binoan, ish haqi har yarim oyda kamida bir marta to'lanishi shart.\n\n"
      "📌 *Sizning huquqlaringiz:*\n"
      "• Ish beruvchi har bir kechiktirilgan kun uchun MB qayta moliyalash stavkasida kompensatsiya (foiz) to'lashi shart (MK 333-modda).\n"
      "• Fuqarolik sudiga da'vo emas, 'Sud buyrug'i' berish haqida ariza berilsa, sud majlisisiz tezda pul undirib beriladi."
    )
  },
  "oila": {
    "title": "👨‍👩‍👧 Ajrashish va aliment",
    "text": (
      "👨‍👩‍👧 *AJRASHISH VA ALIMENT MIQDORI*\n\n"
      "📌 *Aliment miqdori (Oila kodeksi 99-modda):*\n"
      "• 1 nafar bola uchun — daromadning 1/4 qismi;\n"
      "• 2 nafar bola uchun — 1/3 qismi;\n"
      "• 3 va undan ortiq bola uchun — 1/2 qismi.\n\n"
      "📌 *Qayerga boriladi?*\n"
      "Bolalar bor bo'lsa yoki mulkiy nizo bo'lsa — Fuqarolik ishlari bo'yicha sudga ariza beriladi. Aliment ajrashishdan oldin ham darhol undirilishi mumkin."
    )
  },
  "jarima": {
    "title": "🚔 Radar va YHXBB jarimalari",
    "text": (
      "🚔 *YHXBB JARIMALARIGA SHIKOYAT*\n\n"
      "📌 *Muhim qoidalar:*\n"
      "• Radar yoki kamera qarori chiqqan kundan boshlab 10 kun ichida shikoyat berish muddati bor (MJtK 17-1-modda).\n"
      "• Agar qoidabuzarlik haqiqatda bo'lgan bo'lsa, 15 kun ichida jarimaning 50% miqdorini to'lash imtiyozi mavjud.\n"
      "• Avtomobilni ishonchnoma (doverennost) bilan boshqa shaxs boshqargan bo'lsa, 10 kun ichida dalillarni taqdim etib jarimani o'zgartirish mumkin."
    )
  },
  "meros": {
    "title": "📜 Meros va vasiyat",
    "text": (
      "📜 *MEROSNI QABUL QILISH TARTIBI*\n\n"
      "📌 *Qat'iy muddat:* Meros ochilgan (vafot etgan) kundan e'tiboran 6 oy ichida notariusga ariza berish shart!\n"
      "Agar 6 oy o'tib ketsa, notarius rad etadi va muddatni faqat sud orqali tiklashga to'g'ri keladi.\n\n"
      "📌 *Navbat:* 1-navbatda — farzandlar, turmush o'rtoq va ota-ona teng ulushda meros oladilar."
    )
  },
  "istemol": {
    "title": "🛒 Sifatsiz tovar va qaytarish",
    "text": (
      "🛒 *ISTE'MOLCHILAR HUQUQLARI*\n\n"
      "📌 *Asosiy huquqlar:*\n"
      "• Sifatli nooziq-ovqat tovarini 10 kun ichida qaytarish yoki almashtirish mumkin.\n"
      "• Sifatsiz (brak) tovar uchun kafolat muddati ichida pulni 100% qaytarib olishga haqlisiz.\n"
      "• Chek yo'qolgan bo'lsa ham, guvohlar yoki bank kvitansiyasi orqali isbotlash mumkin.\n"
      "📞 Raqobat qo'mitasi ishonch telefoni: 1159."
    )
  },
  "uy": {
    "title": "🏠 Uy ijarasi va shartnoma",
    "text": (
      "🏠 *TURAR JOY IJARASI*\n\n"
      "• Ijara shartnomasi ijara.soliq.uz orqali ro'yxatga olinishi shart.\n"
      "• Yozma shartnoma bo'lsa, uy egasi ijarachini muddatidan oldin asossiz chiqarib yubora olmaydi.\n"
      "• Uyga kirishda jihozlar va kamchiliklar dalolatnoma (akt) qilinishi depozitni to'liq qaytarib olishga yordam beradi."
    )
  },
  "kredit": {
    "title": "💳 Bank kreditlari va garov",
    "text": (
      "💳 *BANK KREDITLARI VA QARZDORLIK*\n\n"
      "• Moliyaviy qiyinchilik bo'lganda, bankka rasmiy ariza berib grafikni uzaytirishni (kredit ta'tili) so'rang.\n"
      "• Qonun bo'yicha penya va jarimalar miqdori asosiy qarz summasidan oshib ketishi mumkin emas.\n"
      "• Garovdagi yagona uy-joy faqat sudning qonuniy qarori asosida undirilishi mumkin."
    )
  }
}

# KODEKSLAR BAZASI
CODES = [
  ("Konstitutsiya", "Davlatning bosh qonuni"),
  ("Mehnat kodeksi", "Ishga qabul, maosh, bo'shatish"),
  ("Oila kodeksi", "Nikoh, ajrashish, aliment"),
  ("Fuqarolik kodeksi", "Mulk, shartnomalar, meros"),
  ("Ma'muriy javobgarlik kodeksi", "Jarimalar va qoidabuzarliklar"),
  ("Jinoyat kodeksi", "Jinoiy javobgarlik va jazolar"),
  ("Soliq kodeksi", "Soliqlar va imtiyozlar"),
  ("Uy-joy kodeksi", "Ko'chmas mulk va uy-joy huquqi")
]

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
        "Men — **«Huquq Kutubxonasi»** rasmiy AI huquqiy yordamchi botiman.\n\n"
        "🏛 *Sizga qanday yordam bera olaman?*\n"
        "• Hayotiy muammolar (ish, jarima, aliment, meros) bo'yicha qadam-baqadam qo'llanma beraman.\n"
        "• O'zbekiston qonunlari va kodekslarini sodda tushuntiraman.\n"
        "• Sudga ariza va shartnomalar shablonlarini taqdim etaman.\n"
        "• Savollaringizga AI (sun'iy intellekt) orqali darhol javob beraman!\n\n"
        "Quyidagi bo'limlardan birini tanlang:"
    )
    await update.message.reply_text(text, parse_mode="Markdown", reply_markup=main_menu_keyboard())

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
    for title, desc in CODES:
        search_link = f"https://lex.uz/search/all?searchtitle={title.replace(' ', '+')}"
        text += f"🔹 *{title}* — {desc}\n[Rasmiy matnini o'qish (lex.uz)]({search_link})\n\n"
    
    await update.message.reply_text(text, parse_mode="Markdown", disable_web_page_preview=True)

# HUJJATLAR SHABLONLARI
async def show_docs(update: Update, context: ContextTypes.DEFAULT_TYPE):
    text = (
        "📝 *TAYYOR HUQUQIY HUJJATLAR VA ARIZALAR:*\n\n"
        "Saytimizda barcha arizalarni onlayn to'ldirib, PDF qilib yuklab olishingiz mumkin:\n"
        "1. Ish haqini undirish to'g'risida ariza\n"
        "2. Sifatsiz tovar uchun da'vo xati (pretenziya)\n"
        "3. Turar joy ijara shartnomasi\n"
        "4. Aliment undirish to'g'risida sud buyrug'i arizasi\n"
        "5. O'z xohishi bilan bo'shash arizasi\n\n"
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
            await query.message.reply_text(data["text"], parse_mode="Markdown")

# AI BILAN SAVOL-JAVOB (GEMINI INTEGRATSIYASI)
async def handle_user_message(update: Update, context: ContextTypes.DEFAULT_TYPE):
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
    wait_msg = await update.message.reply_text("🔍 Savolingiz O'zbekiston qonunlari bo'yicha tahlil qilinmoqda, iltimos kuting...")

    answer = ""
    if GEMINI_KEY:
        try:
            import google.generativeai as genai
            genai.configure(api_key=GEMINI_KEY)
            model = genai.GenerativeModel(
                model_name="gemini-1.5-flash",
                system_instruction=(
                    "Siz O'zbekiston Respublikasi qonunchiligi bo'yicha AI yordamchisiz. "
                    "Fuqarolarga o'zbek tilida, tushunarli, amaliy va qadam-baqadam javob bering. "
                    "Tegishli qonun moddalarini (Mehnat kodeksi, Oila kodeksi, FK, MJtK va b.) "
                    "keltiring va lex.uz ga havola qiling. Zarur bo'lsa advokatga borishni eslating."
                )
            )
            response = model.generate_content(user_text)
            answer = response.text
        except Exception as e:
            logger.error(f"Gemini API xatosi: {e}")
            answer = (
                "⚠️ Sun'iy intellekt javob berishda texnik xatolik yuz berdi.\n\n"
                "Iltimos, [lex.uz](https://lex.uz) milliy qonunchilik bazasidan yoki Adliya vazirligining «1008» ishonch telefonidan foydalaning."
            )
    else:
        answer = (
            f"Hurmatli fuqaro! Sizning so'rovingiz: *«{user_text}»*.\n\n"
            "📌 *Umumiy qonuniy tavsiya:*\n"
            "O'zbekiston Respublikasi qonunchiligiga ko'ra, har qanday huquqiy nizoni hal qilishda dastlab yozma ariza yoki da'vo xati berish lozim.\n\n"
            "To'liq avtonom AI javoblarini yoqish uchun bot egasi `.env` faylida `GEMINI_API_KEY` ni sozlashishi kerak.\n"
            "Qonun matnlari bilan [lex.uz](https://lex.uz) saytida tanishishingiz mumkin."
        )

    await wait_msg.delete()
    await update.message.reply_text(answer, parse_mode="Markdown", disable_web_page_preview=True)

def main():
    if not BOT_TOKEN:
        print("\n❌ XATOLIK: TELEGRAM_BOT_TOKEN topilmadi!")
        print("Iltimos, .env faylini oching va @BotFather dan olingan tokenni kiriting.\n")
        return

    print("🚀 «Huquq Kutubxonasi» Telegram boti ishga tushmoqda...")
    app = ApplicationBuilder().token(BOT_TOKEN).build()

    app.add_handler(CommandHandler("start", start_command))
    app.add_handler(CommandHandler("help", help_command))
    app.add_handler(CallbackQueryHandler(callback_handler))
    app.add_handler(MessageHandler(filters.TEXT & ~filters.COMMAND, handle_user_message))

    app.run_polling()

if __name__ == "__main__":
    main()

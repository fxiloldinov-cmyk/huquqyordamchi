// Til almashtirgich: o'zbekcha (lotin), o'zbekcha (kirill), ruscha, inglizcha.
// Kirill — butun sahifa avtomatik transliteratsiya qilinadi. Rus va ingliz — interfeys lug'at bo'yicha
// tarjima qilinadi; lug'atda yo'q matn (yo'riqnomalar, hujjat namunalari) o'zbekcha qoladi.
(() => {
  const LANGS = {
    uz: { label: "O‘zbekcha", short: "UZ", html: "uz" },
    cy: { label: "Ўзбекча", short: "ЎЗ", html: "uz-Cyrl" },
    ru: { label: "Русский", short: "RU", html: "ru" },
    en: { label: "English", short: "EN", html: "en" },
  };

  // ---------------- Lotin → kirill ----------------
  const APOS = /[‘’ʻʼ'`]/;
  const LETTER = /[A-Za-z]/;
  const ONE = { a: "а", b: "б", d: "д", f: "ф", g: "г", h: "ҳ", i: "и", j: "ж", k: "к", l: "л", m: "м", n: "н", o: "о", p: "п", q: "қ", r: "р", s: "с", t: "т", u: "у", v: "в", x: "х", y: "й", z: "з", c: "ц", w: "в" };
  const KEEP = /(https?:\/\/\S+|[\w.+-]+@[\w-]+\.[\w.]+|\b[\w-]+(?:\.[\w-]+)*\.(?:uz|com|org|net|ru|app|io)\b(?:\/\S*)?|\b(?:AI|API|PDF|RSS|TXT|URL|SMS|Google|Gemini|Netlify|Telegram|Shift|Enter|Ctrl)\b|\bID\b)/g;
  function cyrWord(s) {
    let out = "";
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], lo = ch.toLowerCase(), up = ch !== lo;
      const nx = s[i + 1] || "", nxl = nx.toLowerCase(), prev = s[i - 1] || "";
      const cap = (c) => (up ? c.toUpperCase() : c);
      if ((lo === "o" || lo === "g") && APOS.test(nx) && LETTER.test(prev + (s[i + 2] || "")) ) { out += cap(lo === "o" ? "ў" : "ғ"); i++; continue; }
      // o'zlashma so'zlar: Konstitutsiya → Конституция, protsessual → процессуал ("ketsa", "ketsin" o'zgarmaydi)
      if (lo === "t" && nxl === "s" && /^(iya|iy|io|ess|ent|ep)/i.test(s.slice(i + 2))) { out += cap("ц"); i++; continue; }
      if (lo === "s" && nxl === "h") { out += cap("ш"); i++; continue; }
      if (lo === "c" && nxl === "h") { out += cap("ч"); i++; continue; }
      if (lo === "y" && "oaue".includes(nxl) && nxl) {
        if (nxl === "o" && APOS.test(s[i + 2] || "")) { out += cap("й"); continue; }
        out += cap({ o: "ё", a: "я", u: "ю", e: "е" }[nxl]); i++; continue;
      }
      if (lo === "e") { out += cap(LETTER.test(prev) ? "е" : "э"); continue; }
      if (APOS.test(ch)) { out += LETTER.test(prev) && LETTER.test(nx) ? "ъ" : ch; continue; }
      out += ONE[lo] ? cap(ONE[lo]) : ch;
    }
    return out;
  }
  function toCyr(text) {
    let res = "", last = 0;
    text.replace(KEEP, (m, _g, off) => { res += cyrWord(text.slice(last, off)) + m; last = off + m.length; return m; });
    return res + cyrWord(text.slice(last));
  }

  // ---------------- Rus / ingliz lug'ati: o'zbekcha matn → [ru, en] ----------------
  const D = {
    "Asosiy qismga o‘tish": ["Перейти к основному содержанию", "Skip to main content"],
    "O‘zbekiston qonunchiligi bo‘yicha mustaqil axborot loyihasi": ["Независимый информационный проект о законодательстве Узбекистана", "Independent information project on the legislation of Uzbekistan"],
    "Rasmiy manba: Lex.uz ↗": ["Официальный источник: Lex.uz ↗", "Official source: Lex.uz ↗"],
    "QONUNNI TUSHUNISH OSONROQ": ["ПОНЯТЬ ЗАКОН ПРОЩЕ", "LAW MADE EASIER"],
    "Aqlli qidiruv": ["Умный поиск", "Smart search"],
    "Namunalar": ["Образцы", "Templates"],
    "Yangiliklar": ["Новости", "News"],
    "Kodekslar": ["Кодексы", "Codes"],
    "Vaziyatlar": ["Ситуации", "Situations"],
    "Kazus ustaxonasi": ["Мастерская казусов", "Case workshop"],
    "AI yordamchi": ["AI-помощник", "AI assistant"],
    "HUQUQIY MA’LUMOT. AMALIY YECHIM.": ["ПРАВОВАЯ ИНФОРМАЦИЯ. ПРАКТИЧЕСКОЕ РЕШЕНИЕ.", "LEGAL INFORMATION. PRACTICAL SOLUTIONS."],
    "Huquqingizni biling.": ["Знайте свои права.", "Know your rights."],
    "Yechimni toping.": ["Найдите решение.", "Find the solution."],
    "Vaziyatingizni yozing. Qonuniy asoslarni o‘rganing, kerakli arizani tayyorlang va keyingi qadamingizni aniqlang.": ["Опишите свою ситуацию. Изучите правовые основания, подготовьте нужное заявление и определите следующий шаг.", "Describe your situation. Learn the legal grounds, prepare the right application and decide your next step."],
    "Aqlli qidiruv →": ["Умный поиск →", "Smart search →"],
    "Ariza tayyorlash": ["Подготовить заявление", "Prepare an application"],
    "Konstitutsiya va asosiy kodekslarning rasmiy matni": ["Официальные тексты Конституции и основных кодексов", "Official texts of the Constitution and main codes"],
    "Ariza va hujjatlarni tez tayyorlash": ["Быстрая подготовка заявлений и документов", "Prepare applications and documents quickly"],
    "Qidiruv": ["Поиск", "Search"],
    "Lotin, kirill yoki modda bo‘yicha": ["Латиница, кириллица или номер статьи", "Latin, Cyrillic or article number"],
    "Har bir qaror — asos bilan": ["Каждое решение — с правовым основанием", "Every decision backed by law"],
    "Qonun • Tushuntirish • Amaliy qadam": ["Закон • Разъяснение • Практический шаг", "Law • Explanation • Practical step"],
    "SIZNING SAVOLINGIZDAN BOSHLAYMIZ": ["НАЧНЁМ С ВАШЕГО ВОПРОСА", "WE START WITH YOUR QUESTION"],
    "Qanday huquqiy yordam kerak?": ["Какая правовая помощь нужна?", "What legal help do you need?"],
    "AI bilan suhbat": ["Чат с AI", "Chat with AI"],
    "Vaziyat yoki modda": ["Ситуация или статья", "Situation or article"],
    "Lotin va kirill yozuvida qidiring": ["Ищите латиницей или кириллицей", "Search in Latin or Cyrillic script"],
    "To‘xtatish": ["Остановить", "Stop"],
    "Aqlli qidirish →": ["Искать →", "Search →"],
    "Aqlli qidirish": ["Искать", "Search"],
    "Misollar:": ["Примеры:", "Examples:"],
    "Ish haqim to‘lanmayapti": ["Мне не платят зарплату", "My salary is not being paid"],
    "Aliment miqdori": ["Размер алиментов", "Amount of alimony"],
    "Firibgarlik uchun javobgarlik": ["Ответственность за мошенничество", "Liability for fraud"],
    "Meros guvohnomasi": ["Свидетельство о наследстве", "Certificate of inheritance"],
    "AI uchun savol": ["Вопрос для AI", "Question for AI"],
    "Suhbatni boshlash": ["Начать чат", "Start chat"],
    "Ishdan noqonuniy bo‘shatishsa nima qilaman?": ["Что делать при незаконном увольнении?", "What should I do if I am unlawfully dismissed?"],
    "Aliment qanday undiriladi?": ["Как взыскать алименты?", "How is alimony collected?"],
    "Shaxsiy ma’lumotlarni kiritmang. Telefon, email, pasport, karta va JSHSHIR raqamlari imkon qadar avtomatik yashiriladi, lekin ism va manzil yashirilmaydi — ularni o‘zingiz almashtiring. AI uchun savol Google Gemini xizmatiga yuboriladi. Natijadagi normani rasmiy manbada tekshiring.": ["Не вводите личные данные. Телефон, email, номера паспорта, карты и ПИНФЛ по возможности скрываются автоматически, но имена и адреса — нет: замените их сами. Вопрос для AI отправляется в сервис Google Gemini. Проверяйте норму в официальном источнике.", "Do not enter personal data. Phone numbers, emails, passport, card and PINFL numbers are masked automatically where possible, but names and addresses are not — replace them yourself. AI questions are sent to the Google Gemini service. Check the cited rule in the official source."],
    "Masalan: Ish haqim ikki oydan beri berilmayapti. Qanday talab qo‘ysam bo‘ladi? Yoki kodeks va modda raqamini yozing.": ["Например: мне два месяца не платят зарплату. Что я могу потребовать? Или укажите кодекс и номер статьи.", "For example: my salary hasn't been paid for two months. What can I demand? Or enter a code and article number."],
    "Savolingizni oddiy tilda yozing…": ["Напишите вопрос простыми словами…", "Write your question in plain words…"],
    "KUNDALIK HAYOT UCHUN": ["ДЛЯ ПОВСЕДНЕВНОЙ ЖИЗНИ", "FOR EVERYDAY LIFE"],
    "Vaziyatingizga mos yo‘l-yo‘riq": ["Инструкции для вашей ситуации", "Guidance for your situation"],
    "Vaziyatlarni filtrlash": ["Фильтр ситуаций", "Filter situations"],
    "Vaziyatni qidirish…": ["Поиск ситуации…", "Search situations…"],
    "Vaziyat guruhlari": ["Группы ситуаций", "Situation groups"],
    "Barcha vaziyatlarni ko‘rsatish": ["Показать все ситуации", "Show all situations"],
    "Barcha vaziyatlar alohida sahifalarda →": ["Все ситуации на отдельных страницах →", "All situations on separate pages →"],
    "Bunday vaziyat topilmadi. Yuqoridagi aqlli qidiruvga vaziyatingizni yozib ko'ring.": ["Такая ситуация не найдена. Попробуйте описать её в умном поиске выше.", "No such situation found. Try describing it in the smart search above."],
    "Hammasi": ["Все", "All"],
    "Mehnat": ["Труд", "Employment"],
    "Oila": ["Семья", "Family"],
    "Uy va pul": ["Жильё и деньги", "Housing and money"],
    "Xarid va internet": ["Покупки и интернет", "Shopping and online"],
    "Davlat va ijtimoiy": ["Госуслуги и соцзащита", "Public services and welfare"],
    "QONUNCHILIKDAGI O‘ZGARISHLAR": ["ИЗМЕНЕНИЯ В ЗАКОНОДАТЕЛЬСТВЕ", "CHANGES IN LEGISLATION"],
    "Yangiliklar va yangi hujjatlar": ["Новости и новые документы", "News and new documents"],
    "Lex.uz’da ochish ↗": ["Открыть на Lex.uz ↗", "Open on Lex.uz ↗"],
    "Barchasi": ["Все", "All"],
    "Qonunlar": ["Законы", "Laws"],
    "Farmonlar": ["Указы", "Decrees"],
    "Qarorlar": ["Постановления", "Resolutions"],
    "Buyruqlar": ["Приказы", "Orders"],
    "Qonun": ["Закон", "Law"],
    "Farmon": ["Указ", "Decree"],
    "Qaror": ["Постановление", "Resolution"],
    "Buyruq": ["Приказ", "Order"],
    "Hujjat": ["Документ", "Document"],
    "Kuchga kiradi": ["Вступает в силу", "Takes effect"],
    "Qabul qilingan": ["Принят", "Adopted"],
    "Hujjatlar yuklanmoqda…": ["Загрузка документов…", "Loading documents…"],
    "Manba: Lex.uz RSS": ["Источник: Lex.uz RSS", "Source: Lex.uz RSS"],
    "Yana ko‘rsatish": ["Показать ещё", "Show more"],
    "Bu turdagi hujjat topilmadi.": ["Документы этого типа не найдены.", "No documents of this type found."],
    "MA’LUMOTNI AMALIYOTGA O‘TKAZING": ["ПРИМЕНИТЕ ЗНАНИЯ НА ПРАКТИКЕ", "PUT KNOWLEDGE INTO PRACTICE"],
    "Ariza va hujjat namunalari": ["Образцы заявлений и документов", "Application and document templates"],
    "Andozani tanlang, rekvizitlarni kiriting va matnni tekshiring.": ["Выберите шаблон, заполните реквизиты и проверьте текст.", "Choose a template, fill in the details and review the text."],
    "TAYYOR NAMUNALAR": ["ГОТОВЫЕ ОБРАЗЦЫ", "READY TEMPLATES"],
    "Kiritilgan rekvizitlar ushbu oynada qoladi. Sahifani yangilasangiz, tozalanadi.": ["Введённые реквизиты остаются в этом окне и удаляются при обновлении страницы.", "Entered details stay in this window and are cleared when you reload the page."],
    "HUJJAT TAYYORLASH": ["ПОДГОТОВКА ДОКУМЕНТА", "DOCUMENT PREPARATION"],
    "Ma’lumotlarni to‘ldirish": ["Заполнение данных", "Fill in the details"],
    "Tayyor matnni tekshirish": ["Проверка готового текста", "Review the final text"],
    "Nusxa olish": ["Копировать", "Copy"],
    "Nusxa olindi": ["Скопировано", "Copied"],
    "Nusxa olinmadi": ["Не удалось скопировать", "Copy failed"],
    "Matnni yuklash": ["Скачать текст", "Download text"],
    "Chop etish / PDF": ["Печать / PDF", "Print / PDF"],
    "Bu boshlang‘ich namuna. Holat, rekvizitlar va ilovalarni to‘liq tekshiring.": ["Это базовый образец. Полностью проверьте обстоятельства, реквизиты и приложения.", "This is a starting template. Check the facts, details and attachments carefully."],
    "Nikohdan ajratish": ["Расторжение брака", "Divorce"],
    "Aliment undirish": ["Взыскание алиментов", "Alimony claim"],
    "YHXX jarimasini bekor qilish": ["Отмена штрафа за нарушение ПДД", "Appeal a traffic fine"],
    "Firibgarlik yuzasidan ariza": ["Заявление о мошенничестве", "Fraud report"],
    "To'lanmagan ish haqini talab qilish arizasi": ["Требование о выплате зарплаты", "Unpaid wages claim"],
    "Sifatsiz tovar uchun pulni qaytarish talabnomasi (Pretenziya)": ["Претензия о возврате денег за некачественный товар", "Refund claim for a defective product"],
    "Turar joy ijara shartnomasi (Namuna)": ["Договор найма жилья (образец)", "Residential lease agreement (template)"],
    "O'z xohishi bilan ishdan bo'shash to'g'risida ariza": ["Заявление об увольнении по собственному желанию", "Resignation letter"],
    "ASOSIY QONUNCHILIK": ["ОСНОВНОЕ ЗАКОНОДАТЕЛЬСТВО", "KEY LEGISLATION"],
    "Kodekslar. Sodda tilda.": ["Кодексы. Простым языком.", "Codes. In plain language."],
    "Rasmiy matnni o‘qing yoki murakkab normani misollar bilan tushuntirishni so‘rang.": ["Читайте официальный текст или попросите объяснить сложную норму на примерах.", "Read the official text or ask for a complex rule to be explained with examples."],
    "LEX.UZ MANBALARI": ["ИСТОЧНИКИ LEX.UZ", "LEX.UZ SOURCES"],
    "Rasmiy matn": ["Официальный текст", "Official text"],
    "Sodda tilda tushuntirish": ["Объяснить простым языком", "Explain in plain language"],
    "TALABALAR VA HUQUQSHUNOSLAR UCHUN": ["ДЛЯ СТУДЕНТОВ И ЮРИСТОВ", "FOR STUDENTS AND LAWYERS"],
    "Faktdan asoslangan xulosagacha.": ["От фактов к обоснованному выводу.", "From facts to a reasoned conclusion."],
    "Kazusni tizimli tahlil qiling yoki o‘zingiz yozgan yechimdagi bo‘shliqlarni aniqlang.": ["Разберите казус системно или найдите пробелы в своём решении.", "Analyse a case systematically or find gaps in your own solution."],
    "Kazus ustaxonasiga o‘tish →": ["Перейти в мастерскую казусов →", "Go to the case workshop →"],
    "Talaba rejimi": ["Режим студента", "Student mode"],
    "Faktlar": ["Факты", "Facts"],
    "Huquqiy asos": ["Правовое основание", "Legal basis"],
    "Tahlil va xulosa": ["Анализ и вывод", "Analysis and conclusion"],
    "FOYDALANISHDAN OLDIN": ["ПЕРЕД ИСПОЛЬЗОВАНИЕМ", "BEFORE YOU START"],
    "Muhim savollar": ["Важные вопросы", "Important questions"],
    "Manba, maxfiylik va natijalardan foydalanish haqida.": ["Об источниках, конфиденциальности и использовании результатов.", "About sources, privacy and using the results."],
    "Bu rasmiy davlat saytimi?": ["Это официальный государственный сайт?", "Is this an official government website?"],
    "Yo‘q. HuquqYordamchi mustaqil axborot loyihasi. Rasmiy qonun matnlarini Lex.uz orqali tekshiring.": ["Нет. HuquqYordamchi — независимый информационный проект. Официальные тексты законов проверяйте на Lex.uz.", "No. HuquqYordamchi is an independent information project. Check official legal texts on Lex.uz."],
    "“Katalogga mos” belgisi nimani anglatadi?": ["Что означает отметка «Совпадает с каталогом»?", "What does the “Matches catalogue” label mean?"],
    "Hujjat va modda raqami katalogdagi yozuvga mos. Bu AI xulosasining to‘g‘riligini yoki normaning sizning ishingizga tatbiq etilishini tasdiqlamaydi.": ["Документ и номер статьи совпадают с записью в каталоге. Это не подтверждает правильность вывода AI или применимость нормы к вашему делу.", "The document and article number match a catalogue entry. This does not confirm that the AI's conclusion is correct or that the rule applies to your case."],
    "Ma’lumotlarim saqlanadimi?": ["Сохраняются ли мои данные?", "Is my data stored?"],
    "Bu loyiha savol va hujjatlaringizni o‘z ma’lumotlar bazasida saqlamaydi. AI savollari Google Gemini xizmatiga yuboriladi; provayderning qayta ishlash shartlari qo‘llanadi. Shaxsiy ma’lumotlarni olib tashlang. Ariza generatori rekvizitlarni brauzer oynasi xotirasida saqlaydi.": ["Проект не хранит ваши вопросы и документы в своей базе данных. Вопросы для AI отправляются в Google Gemini; действуют условия обработки этого провайдера. Удаляйте личные данные. Генератор заявлений хранит реквизиты в памяти окна браузера.", "This project does not store your questions or documents in its own database. AI questions are sent to Google Gemini, and the provider's processing terms apply. Remove personal data. The application generator keeps details in the browser window's memory."],
    "Hujjatni darhol sudga topshirsa bo‘ladimi?": ["Можно ли сразу подать документ в суд?", "Can I file the document in court right away?"],
    "Bu boshlang‘ich namuna. Talab, tegishli organ, muddat, dalillar, imzo, ilovalar va to‘lov masalasini tekshirib, holatingizga moslashtiring.": ["Это базовый образец. Проверьте требование, компетентный орган, сроки, доказательства, подпись, приложения и вопрос оплаты и адаптируйте его к своей ситуации.", "This is a starting template. Check the claim, the competent authority, deadlines, evidence, signature, attachments and any fees, and adapt it to your situation."],
    "Yangiliklar qanchalik yangi?": ["Насколько свежие новости?", "How up to date is the news?"],
    "Lex.uz RSS ma’lumotlari yuklanadi. Ulanish bo‘lmasa, sanasi ko‘rsatilgan zaxira ro‘yxat chiqadi. Ayrim hujjatlar kelajakda kuchga kirishi mumkin: sanani alohida tekshiring.": ["Загружаются данные RSS с Lex.uz. Если связи нет, показывается резервный список с датой. Некоторые документы вступают в силу позже — проверяйте дату отдельно.", "Data is loaded from the Lex.uz RSS feed. If there is no connection, a dated backup list is shown. Some documents take effect later, so check the date separately."],
    "← Bosh sahifa": ["← Главная", "← Home"],
    "← Kodekslar va bosh sahifa": ["← Кодексы и главная", "← Codes and home"],
    "QONUNNI TUSHUNISH": ["ПОНИМАНИЕ ЗАКОНА", "UNDERSTANDING THE LAW"],
    "Normaning mazmuni, kimga tegishliligi, kundalik misol va amaliy qadamlar.": ["Смысл нормы, к кому она относится, пример из жизни и практические шаги.", "What the rule means, who it applies to, an everyday example and practical steps."],
    "Kodeksni tanlang": ["Выберите кодекс", "Choose a code"],
    "Rasmiy matnni ochish ↗": ["Открыть официальный текст ↗", "Open the official text ↗"],
    "Modda raqami, matni yoki vaziyat": ["Номер статьи, текст или ситуация", "Article number, text or situation"],
    "Masalan: modda raqami yoki normaning matnini shu yerga qo‘ying.": ["Например: вставьте сюда номер статьи или текст нормы.", "For example: paste an article number or the text of a rule here."],
    "Tushuntirib berish": ["Объяснить", "Explain"],
    "Tushuntirish va manbalar": ["Разъяснение и источники", "Explanation and sources"],
    "Murakkab norma — tushunarli izoh": ["Сложная норма — понятное объяснение", "A complex rule, clearly explained"],
    "Kodeks va savolni tanlang. Javobda mazmun, misol, istisnolar va manbalar keltiriladi.": ["Выберите кодекс и вопрос. В ответе будут смысл, пример, исключения и источники.", "Choose a code and a question. The answer covers meaning, an example, exceptions and sources."],
    "Kim uchun?": ["Для кого?", "Who is it for?"],
    "Nimani tartibga soladi?": ["Что регулирует?", "What does it regulate?"],
    "Oddiy misol": ["Простой пример", "Simple example"],
    "Yechim tuzing yoki o‘z javobingizni tekshirtiring. Fakt → masala → norma → tahlil → xulosa.": ["Составьте решение или проверьте свой ответ. Факт → вопрос → норма → анализ → вывод.", "Build a solution or have your answer checked. Fact → issue → rule → analysis → conclusion."],
    "Huquq sohasi": ["Отрасль права", "Area of law"],
    "Fuqarolik huquqi": ["Гражданское право", "Civil law"],
    "Mehnat huquqi": ["Трудовое право", "Employment law"],
    "Oila huquqi": ["Семейное право", "Family law"],
    "Jinoyat huquqi": ["Уголовное право", "Criminal law"],
    "Ma’muriy huquq": ["Административное право", "Administrative law"],
    "Jinoyat-protsessual": ["Уголовный процесс", "Criminal procedure"],
    "Fuqarolik protsessual": ["Гражданский процесс", "Civil procedure"],
    "Konstitutsiyaviy huquq": ["Конституционное право", "Constitutional law"],
    "Boshqa": ["Другое", "Other"],
    "Maqsad": ["Цель", "Purpose"],
    "Kazusni tahlil qilish": ["Разобрать казус", "Analyse the case"],
    "Javobimni tekshirish": ["Проверить мой ответ", "Check my answer"],
    "Voqea sanasi (ma’lum bo‘lsa)": ["Дата события (если известна)", "Date of events (if known)"],
    "Qonunning vaqt bo‘yicha tegishli tahririni aniqlashga yordam beradi.": ["Помогает определить редакцию закона, действовавшую на тот момент.", "Helps identify the version of the law in force at that time."],
    "Kazus sharti va savollar": ["Условие казуса и вопросы", "Case facts and questions"],
    "Ishtirokchilar, voqea, sanalar, dalillar va hal qilinishi kerak bo‘lgan savollarni yozing.": ["Укажите участников, события, даты, доказательства и вопросы, которые нужно решить.", "Describe the parties, events, dates, evidence and the questions to be resolved."],
    "Mehnat kazusi": ["Трудовой казус", "Employment case"],
    "Shartnoma kazusi": ["Договорный казус", "Contract case"],
    "Siz yozgan yechim": ["Ваше решение", "Your solution"],
    "Tekshirish uchun o‘z javobingizni kiriting.": ["Введите свой ответ для проверки.", "Enter your answer for review."],
    "Javob tuzilishi": ["Структура ответа", "Answer structure"],
    "Javob shakli": ["Формат ответа", "Answer format"],
    "Standart tahlil": ["Стандартный анализ", "Standard analysis"],
    "Fakt, norma, tatbiq va xulosa": ["Факт, норма, применение и вывод", "Fact, rule, application and conclusion"],
    "Taqdim etilgan namuna": ["Предоставленный образец", "Provided sample"],
    "Namunani tanlang": ["Выберите образец", "Choose a sample"],
    "Namunalar yuklanmoqda…": ["Загрузка образцов…", "Loading samples…"],
    "O‘z shaklim": ["Свой формат", "My own format"],
    "O‘qituvchingiz talablariga mos tuzilma": ["Структура по требованиям преподавателя", "Structure that fits your instructor's requirements"],
    "Bo‘limlar, uslub va asoslash talablarini yozing.": ["Опишите разделы, стиль и требования к обоснованию.", "Describe the sections, style and reasoning requirements."],
    "Kazusni tahlil qilish →": ["Разобрать казус →", "Analyse the case →"],
    "Tahlilni boshlash": ["Начать анализ", "Start analysis"],
    "O‘quv tahlili. Haqiqiy ishning shaxsiy ma’lumotlarini yashiring. AI xulosasi o‘qituvchi bahosi emas.": ["Учебный разбор. Скрывайте личные данные реального дела. Вывод AI — не оценка преподавателя.", "Educational analysis. Hide personal data from real cases. The AI's conclusion is not a grade."],
    "Tahlil va huquqiy asoslar": ["Анализ и правовые основания", "Analysis and legal grounds"],
    "Yuklash": ["Скачать", "Download"],
    "FAKT → XULOSA": ["ФАКТ → ВЫВОД", "FACT → CONCLUSION"],
    "Asoslangan xulosaga bosqichma-bosqich": ["Шаг за шагом к обоснованному выводу", "Step by step to a reasoned conclusion"],
    "Faktlarni yozing. Tahlilda tegishli normalar, qarshi dalillar va aniqlashtirish kerak bo‘lgan holatlar ajratiladi.": ["Опишите факты. В разборе будут выделены применимые нормы, контраргументы и обстоятельства, требующие уточнения.", "Write down the facts. The analysis separates the applicable rules, counter-arguments and points that need clarifying."],
    "Kazus tahlil qilinmoqda… Uzun tahlil bir necha daqiqa davom etishi mumkin.": ["Казус анализируется… Длинный разбор может занять несколько минут.", "Analysing the case… A long analysis may take a few minutes."],
    "Davomi yuklanmoqda…": ["Загружается продолжение…", "Loading the rest…"],
    "Kazus shartini to‘liqroq yozing.": ["Опишите условие казуса подробнее.", "Please describe the case in more detail."],
    "Javobingizni to‘liqroq kiriting.": ["Введите ответ подробнее.", "Please enter a fuller answer."],
    "SAVOL-JAVOB": ["ВОПРОС-ОТВЕТ", "Q&A"],
    "AI huquqiy yordamchi": ["AI-юридический помощник", "AI legal assistant"],
    "Suhbat rejimi": ["Режим чата", "Chat mode"],
    "Fuqaro": ["Гражданин", "Citizen"],
    "Talaba": ["Студент", "Student"],
    "Sodda tilda, amaliy qadamlar bilan javob.": ["Простым языком, с практическими шагами.", "Plain-language answers with practical steps."],
    "Chuqur huquqiy tahlil: normaning tuzilishi, dispozitsiya va sud amaliyoti.": ["Глубокий правовой анализ: структура нормы, диспозиция и судебная практика.", "In-depth legal analysis: rule structure, disposition and case law."],
    "Server orqali": ["Через сервер", "Via server"],
    "Ma’lumot": ["Информация", "Info"],
    "+ Yangi suhbat": ["+ Новый чат", "+ New chat"],
    "Savollar Google Gemini xizmatiga yuboriladi. AI javoblari umumiy axborot. Muhim qaror oldidan norma va ish holatini tekshiring.": ["Вопросы отправляются в сервис Google Gemini. Ответы AI — общая информация. Перед важным решением проверьте норму и обстоятельства дела.", "Questions are sent to the Google Gemini service. AI answers are general information. Check the rule and your circumstances before any important decision."],
    "Vaziyatingizni aytib bering": ["Расскажите о своей ситуации", "Tell us about your situation"],
    "Savolni shaxsiy ma’lumotlarsiz yozing. Zarur tafsilotlarni birga aniqlashtiramiz.": ["Пишите вопрос без личных данных. Нужные детали уточним вместе.", "Write your question without personal data. We'll clarify the details together."],
    "Savolingiz": ["Ваш вопрос", "Your question"],
    "Savolingiz… Shift+Enter — yangi qator": ["Ваш вопрос… Shift+Enter — новая строка", "Your question… Shift+Enter for a new line"],
    "Yuborish": ["Отправить", "Send"],
    "AI xizmati haqida": ["Об AI-сервисе", "About the AI service"],
    "Savollar server orqali Google Gemini xizmatiga yuboriladi. API kaliti brauzerda saqlanmaydi. Javobdagi havolalar va moddalarning holatingizga tatbiq etilishini tekshiring.": ["Вопросы отправляются в Google Gemini через сервер. API-ключ не хранится в браузере. Проверяйте ссылки и применимость статей к вашей ситуации.", "Questions are sent to Google Gemini via the server. The API key is not stored in the browser. Check the links and whether the articles apply to your situation."],
    "Tushunarli": ["Понятно", "Got it"],
    "Javob tayyorlanmoqda...": ["Готовим ответ...", "Preparing an answer..."],
    "So‘rov to‘xtatildi yoki kutish vaqti tugadi.": ["Запрос остановлен или время ожидания истекло.", "The request was stopped or timed out."],
    "Hujjatni lex.uz da ochish ↗": ["Открыть документ на lex.uz ↗", "Open the document on lex.uz ↗"],
    "lex.uz da qidirish ↗": ["Искать на lex.uz ↗", "Search on lex.uz ↗"],
    "Saytdagi qo'llanmalar": ["Инструкции на сайте", "Guides on this site"],
    "Ishonch: yuqori": ["Надёжность: высокая", "Confidence: high"],
    "Ishonch: o'rta": ["Надёжность: средняя", "Confidence: medium"],
    "Ishonch: past — tekshiring": ["Надёжность: низкая — проверьте", "Confidence: low — please verify"],
    "Hujjat va modda raqami katalogga mos": ["Документ и номер статьи совпадают с каталогом", "Document and article number match the catalogue"],
    "AI taklifi — norma tekshirilsin": ["Предложение AI — проверьте норму", "AI suggestion — verify the rule"],
    "AI foydalangan manbalar": ["Источники, использованные AI", "Sources used by the AI"],
    "Amaliy qadamlar": ["Практические шаги", "Practical steps"],
    "Kerakli hujjat va dalillar": ["Необходимые документы и доказательства", "Documents and evidence needed"],
    "AI tahlili": ["Анализ AI", "AI analysis"],
    "Aniqroq javob uchun:": ["Для более точного ответа:", "For a more precise answer:"],
    "Qonunchilik bazasidan tegishli moddalar qidirilmoqda...": ["Ищем подходящие статьи в базе законодательства...", "Searching the legislation database for relevant articles..."],
    "Savolni to‘liqroq yozing: vaziyatingiz yoki kodeks va modda.": ["Опишите вопрос подробнее: ситуацию или кодекс и статью.", "Please be more specific: describe your situation or give a code and article."],
    "Qidiruv to‘xtatildi yoki kutish vaqti tugadi.": ["Поиск остановлен или время ожидания истекло.", "The search was stopped or timed out."],
    "AI qidiruv ishlamadi.": ["AI-поиск не сработал.", "The AI search failed."],
    "Belgilar chegarasiga yaqinlashdingiz": ["Вы приближаетесь к лимиту символов", "You are close to the character limit"],
    "Belgilar chegarasiga yetdingiz — matnni qisqartiring": ["Достигнут лимит символов — сократите текст", "Character limit reached — please shorten the text"],
    "⚠️ Bu umumiy ma'lumot, yurist tomonidan tasdiqlanmagan. Modda raqamlari, muddatlar, summalar va telefon raqamlarini": ["⚠️ Это общая информация, не проверенная юристом. Номера статей, сроки, суммы и телефоны сверяйте с действующей редакцией на", "⚠️ This is general information, not verified by a lawyer. Check article numbers, deadlines, amounts and phone numbers against the current version on"],
    "dagi amaldagi tahrir bilan tekshiring.": [".", "."],
    "Asosiy qonunchilik hujjatlari:": ["Основные нормативные акты:", "Key legislation:"],
    "Asosiy qonunchilik hujjatlari": ["Основные нормативные акты", "Key legislation"],
    "AI huquqshunosdan qo'shimcha so'rang": ["Спросите AI-юриста дополнительно", "Ask the AI lawyer for more"],
    "Alohida sahifada ochish (ulashish uchun) ↗": ["Открыть на отдельной странице (чтобы поделиться) ↗", "Open as a separate page (to share) ↗"],
    "Rasmiy tushuntirish (gov.uz)": ["Официальное разъяснение (gov.uz)", "Official explanation (gov.uz)"],
    "Rasmiy manba": ["Официальный источник", "Official source"],
    "Mustaqil huquqiy axborot loyihasi.": ["Независимый правовой информационный проект.", "Independent legal information project."],
    "Rasmiy matnlar —": ["Официальные тексты —", "Official texts —"],
    "Barcha vaziyatlar": ["Все ситуации", "All situations"],
    "Hujjat namunalari": ["Образцы документов", "Document templates"],
    "Foydalanish va maxfiylik": ["Использование и конфиденциальность", "Use and privacy"],
    "Ommaviy oferta": ["Публичная оферта", "Public offer"],
    "Foydalanish shartlari —": ["Условия использования —", "Terms of use —"],
    "ommaviy oferta": ["публичная оферта", "public offer"],
    "HUQUQIY HUJJAT": ["ПРАВОВОЙ ДОКУМЕНТ", "LEGAL DOCUMENT"],
    "Huquqiy asoslar": ["Правовые основания", "Legal basis"],
    "© 2026 HuquqYordamchi · Umumiy ma’lumot advokatning ish bo‘yicha maslahatini almashtirmaydi.": ["© 2026 HuquqYordamchi · Общая информация не заменяет консультацию адвоката по делу.", "© 2026 HuquqYordamchi · General information does not replace a lawyer's advice on your case."],
    "Asosiy menyu": ["Главное меню", "Main menu"],
    "Tungi rejimni almashtirish": ["Переключить тёмную тему", "Toggle dark mode"],
    "Menyuni ochish": ["Открыть меню", "Open menu"],
    "Qonun kitoblari, adolat tarozisi va hujjatlar": ["Книги законов, весы правосудия и документы", "Law books, scales of justice and documents"],
    "Qidiruv turi": ["Тип поиска", "Search type"],
    "HuquqYordamchi — O‘zbekiston qonunchiligi bo‘yicha huquqiy yordamchi": ["HuquqYordamchi — правовой помощник по законодательству Узбекистана", "HuquqYordamchi — legal assistant for the legislation of Uzbekistan"],
    // Statik sahifalar
    "Bosh sahifa": ["Главная", "Home"],
    "Qadamma-qadam nima qilish kerak": ["Что делать: пошагово", "What to do, step by step"],
    "Ko‘p beriladigan savollar": ["Частые вопросы", "Frequently asked questions"],
    "Savolingizni AI yordamchiga bering →": ["Задайте вопрос AI-помощнику →", "Ask the AI assistant →"],
    "Ariza namunasini tayyorlash": ["Подготовить образец заявления", "Prepare an application template"],
    "Boshqa vaziyatlar": ["Другие ситуации", "Other situations"],
    "Huquqiy vaziyatlar bo‘yicha yo‘l-yo‘riq": ["Инструкции по правовым ситуациям", "Guides to legal situations"],
    "Hujjat namunalari ": ["Образцы документов", "Document templates"],
    // Vaziyatlar: sarlavha va qisqa tavsif
    "Ishdan noqonuniy bo‘shatish": ["Незаконное увольнение", "Unlawful dismissal"],
    "Asossiz bo‘shatish, hisob-kitob va kompensatsiya olish": ["Необоснованное увольнение, расчёт и компенсация", "Groundless dismissal, final pay and compensation"],
    "Maosh va ta’til puli kechikishi": ["Задержка зарплаты и отпускных", "Late salary and holiday pay"],
    "Kechiktirilgan ish haqi, jarimalar va foizli kompensatsiya": ["Задержанная зарплата, штрафы и процентная компенсация", "Delayed wages, penalties and interest compensation"],
    "Sinov muddati va undan o‘tmaslik": ["Испытательный срок и его непрохождение", "Probation and failing it"],
    "Sinov qancha davom etadi, kimga belgilanmaydi va qanday bekor qilinadi": ["Сколько длится испытание, кому оно не устанавливается и как расторгается договор", "How long probation lasts, who is exempt and how the contract can be ended"],
    "Yillik mehnat ta’tili": ["Ежегодный трудовой отпуск", "Annual paid leave"],
    "Necha kun, qachondan, ta’til puli va ishdan ketganda kompensatsiya": ["Сколько дней, с какого момента, отпускные и компенсация при увольнении", "How many days, from when, holiday pay and compensation on leaving"],
    "Homiladorlik, tug‘ish va bola parvarishi ta’tili": ["Отпуск по беременности, родам и уходу за ребёнком", "Maternity and childcare leave"],
    "Dekret ta’tili, nafaqa va ishdan bo‘shatishdan himoya": ["Декретный отпуск, пособие и защита от увольнения", "Maternity leave, benefits and protection from dismissal"],
    "Ish vaqti, ortiqcha ish va dam olish kunlari": ["Рабочее время, сверхурочные и выходные", "Working hours, overtime and days off"],
    "Ish vaqti normasi, ortiqcha ish va bayramda ishlash uchun haq": ["Норма рабочего времени, сверхурочные и оплата работы в праздники", "Standard hours, overtime and holiday work pay"],
    "O‘z xohishi bilan ishdan ketish": ["Увольнение по собственному желанию", "Resigning from your job"],
    "Ariza, ogohlantirish muddati, hisob-kitob va hujjatlar": ["Заявление, срок предупреждения, расчёт и документы", "Resignation letter, notice period, final pay and documents"],
    "Xodimdan zarar undirish va maoshdan ushlab qolish": ["Взыскание ущерба с работника и удержания из зарплаты", "Employee liability for damage and salary deductions"],
    "Kamomad, buzilgan jihoz, ushlab qolish chegarasi va xizmat tekshiruvi": ["Недостача, повреждённое оборудование, лимит удержаний и служебная проверка", "Shortages, damaged equipment, deduction limits and internal investigations"],
    "Mehnat shartnomasisiz (norasmiy) ishlash": ["Работа без трудового договора", "Working without an employment contract"],
    "Shartnoma tuzilmagan bo‘lsa ham huquqlaringiz va rasmiylashtirish": ["Ваши права и оформление, даже если договор не заключён", "Your rights and how to formalise work without a contract"],
    "Ajrashish va aliment": ["Развод и алименты", "Divorce and alimony"],
    "Nikohdan ajralish tartibi, bolalar taqdiri va aliment miqdori": ["Порядок развода, судьба детей и размер алиментов", "Divorce procedure, arrangements for children and alimony amount"],
    "Meros va vasiyatnoma": ["Наследство и завещание", "Inheritance and wills"],
    "Meros guvohnomasi, vorislar navbati va notariusga murojaat": ["Свидетельство о наследстве, очерёдность наследников и обращение к нотариусу", "Inheritance certificate, order of heirs and going to a notary"],
    "Nikohdan o‘tish (FHDYo)": ["Регистрация брака (ЗАГС)", "Registering a marriage"],
    "Nikoh yoshi, ariza, bir oylik muddat va tibbiy ko‘rik": ["Брачный возраст, заявление, месячный срок и медосмотр", "Marriage age, application, one-month wait and medical check"],
    "Otalikni belgilash": ["Установление отцовства", "Establishing paternity"],
    "Nikohsiz tug‘ilgan bola: FHDYo orqali yoki sud tartibida": ["Ребёнок, рождённый вне брака: через ЗАГС или в суде", "Child born outside marriage: via the civil registry or in court"],
    "Ajrashgandan keyin bola kim bilan qoladi": ["С кем остаётся ребёнок после развода", "Who the child lives with after divorce"],
    "Yashash joyi, ko‘rishish tartibi va vasiylik organining roli": ["Место жительства, порядок общения и роль органа опеки", "Residence, contact arrangements and the guardianship authority's role"],
    "Er-xotin umumiy mulkini bo‘lish": ["Раздел общего имущества супругов", "Dividing spouses' joint property"],
    "Nikohda orttirilgan mulk, teng ulush va da’vo muddati": ["Имущество, нажитое в браке, равные доли и срок исковой давности", "Property acquired during marriage, equal shares and limitation period"],
    "Turar joy ijarasi va mulk": ["Аренда жилья и имущество", "Renting a home and property"],
    "Ijara shartnomasi, depozitni qaytarish va ijarachi huquqlari": ["Договор найма, возврат депозита и права нанимателя", "Lease agreement, deposit refund and tenant rights"],
    "Bank kreditlari va foizlar": ["Банковские кредиты и проценты", "Bank loans and interest"],
    "Muddati o‘tgan qarz, garov mulki va bank nizolari": ["Просроченный долг, залоговое имущество и споры с банком", "Overdue debt, collateral and disputes with banks"],
    "Bergan qarzim qaytarilmayapti": ["Мне не возвращают долг", "My loan isn't being repaid"],
    "Tilxat, yozma shakl, talabnoma va sudga murojaat": ["Расписка, письменная форма, требование и обращение в суд", "Receipts, written form, demand letter and going to court"],
    "Elektr va gaz hisobi bo‘yicha nizo": ["Спор по счетам за электричество и газ", "Electricity and gas billing disputes"],
    "Noto‘g‘ri yozilgan qarz, hisoblagich va uzib qo‘yish": ["Неверно начисленный долг, счётчик и отключение", "Incorrect charges, meters and disconnection"],
    "Uy yoki kvartira sotib olish": ["Покупка дома или квартиры", "Buying a house or flat"],
    "Notarial shartnoma, hujjatlarni tekshirish va mulk huquqini ro‘yxatdan o‘tkazish": ["Нотариальный договор, проверка документов и регистрация права собственности", "Notarised contract, document checks and registering ownership"],
    "MIB qarzdorligi va karta bloklanishi": ["Долг в БПИ и блокировка карты", "Enforcement debt (MIB) and card blocking"],
    "Qarz asosini aniqlash, ish haqidan ushlab qolish chegarasi va shikoyat": ["Основание долга, лимит удержаний из зарплаты и обжалование", "The basis of the debt, salary deduction limits and appeals"],
    "Sifatsiz tovar va xizmat": ["Некачественный товар и услуга", "Defective goods and services"],
    "Tovarni qaytarish, almashtirish va pulni qaytarib olish": ["Возврат, обмен товара и возврат денег", "Returns, exchanges and refunds"],
    "Kiberfiribgarlik va karta o‘g‘irligi": ["Кибермошенничество и кража с карты", "Cyber fraud and card theft"],
    "Bank kartasidan noqonuniy pul yechilganda nima qilish kerak?": ["Что делать, если с банковской карты незаконно списали деньги?", "What to do if money is taken from your bank card without permission"],
    "Internet-do‘kondan xarid va qaytarish": ["Покупки в интернет-магазине и возврат", "Online shopping and returns"],
    "Nuqsonli, tavsifga mos kelmagan yoki o‘lchami to‘g‘ri kelmagan tovar": ["Товар с браком, не соответствующий описанию или не подошедший по размеру", "Faulty items, items not as described or the wrong size"],
    "YHXX ma’muriy jarimalari": ["Штрафы за нарушение ПДД", "Traffic fines"],
    "Radar, kamera va nohaq jarimaga shikoyat qilish": ["Радары, камеры и обжалование несправедливого штрафа", "Radars, cameras and appealing an unfair fine"],
    "Biznes ochish: YaTT yoki MChJ": ["Открытие бизнеса: ИП или ООО", "Starting a business: sole trader or LLC"],
    "Ro‘yxatdan o‘tish, soliq rejimini tanlash va qonuniy faoliyat": ["Регистрация, выбор налогового режима и законная деятельность", "Registration, choosing a tax regime and operating legally"],
    "Ta’lim krediti va kontrakt": ["Образовательный кредит и контракт", "Student loans and tuition contracts"],
    "Talabalar uchun imtiyozli ta’lim krediti va talabalik huquqlari": ["Льготный образовательный кредит и права студентов", "Preferential student loans and student rights"],
    "Pasport, propiska va xorij": ["Паспорт, прописка и выезд за рубеж", "Passport, residence registration and travel abroad"],
    "ID-karta olish, erkin propiska va xorijga chiqish pasporti": ["Получение ID-карты, прописка и загранпаспорт", "Getting an ID card, residence registration and a travel passport"],
    "Yo‘l-transport hodisasi va OSAGO to‘lovi": ["ДТП и выплата по ОСАГО", "Road accidents and OSAGO payouts"],
    "Avariyadan keyingi qadamlar, yevroprotokol va sug‘urta puli": ["Действия после аварии, европротокол и страховая выплата", "Steps after an accident, the accident notice form and insurance payout"],
    "Yoshga doir pensiya tayinlash": ["Назначение пенсии по возрасту", "Applying for an old-age pension"],
    "Yosh va staj talablari, hujjatlar va murojaat muddati": ["Требования к возрасту и стажу, документы и срок обращения", "Age and work-record requirements, documents and application deadline"],
    "Nogironlikni belgilash va to‘lovlar": ["Установление инвалидности и выплаты", "Disability assessment and payments"],
    "Oilaviy shifokor, tibbiy-ijtimoiy ekspertiza, pensiya va nafaqa": ["Семейный врач, медико-социальная экспертиза, пенсия и пособие", "Family doctor, medical-social assessment, pension and benefits"],
    "Bolalar nafaqasi va moddiy yordam (Ijtimoiy reyestr)": ["Детское пособие и материальная помощь (Социальный реестр)", "Child benefit and financial aid (Social Register)"],
    "Kam ta’minlangan oilalar uchun ariza, daromadni baholash va toifalar": ["Заявление для малообеспеченных семей, оценка дохода и категории", "Applications for low-income families, income assessment and categories"],
    // Vaziyat teglari va kodekslar
    "Mehnat kodeksi": ["Трудовой кодекс", "Labour Code"],
    "Oila kodeksi": ["Семейный кодекс", "Family Code"],
    "Fuqarolik kodeksi": ["Гражданский кодекс", "Civil Code"],
    "Bank qonunchiligi": ["Банковское законодательство", "Banking law"],
    "Ijro qonunchiligi": ["Исполнительное производство", "Enforcement law"],
    "Iste’molchilar huquqlari": ["Права потребителей", "Consumer rights"],
    "Jinoyat qonunchiligi": ["Уголовное законодательство", "Criminal law"],
    "Ma’muriy javobgarlik": ["Административная ответственность", "Administrative liability"],
    "Tadbirkorlik": ["Предпринимательство", "Business"],
    "Ta’lim huquqi": ["Право на образование", "Education law"],
    "Davlat xizmatlari": ["Госуслуги", "Public services"],
    "Sug‘urta": ["Страхование", "Insurance"],
    "Pensiya ta’minoti": ["Пенсионное обеспечение", "Pensions"],
    "Ijtimoiy himoya": ["Социальная защита", "Social protection"],
    "Konstitutsiya": ["Конституция", "Constitution"],
    "Davlatning bosh qonuni: inson qadri, huquq va erkinliklar.": ["Основной закон государства: достоинство человека, права и свободы.", "The supreme law of the state: human dignity, rights and freedoms."],
    "Ishga qabul, maosh, mehnat ta’tili, bo‘shatish va xodim kafolatlari.": ["Приём на работу, зарплата, отпуск, увольнение и гарантии работникам.", "Hiring, pay, leave, dismissal and employee guarantees."],
    "Nikoh, ajrashish, aliment, bolalar tarbiyasi va ota-onalik huquqi.": ["Брак, развод, алименты, воспитание детей и родительские права.", "Marriage, divorce, alimony, raising children and parental rights."],
    "Fuqarolik kodeksi (1-qism)": ["Гражданский кодекс (часть первая)", "Civil Code (Part One)"],
    "Umumiy qoidalar, mulk huquqi, majburiyatlar va shartnomalar.": ["Общие положения, право собственности, обязательства и договоры.", "General provisions, property rights, obligations and contracts."],
    "Fuqarolik kodeksi (2-qism)": ["Гражданский кодекс (часть вторая)", "Civil Code (Part Two)"],
    "Oldi-sotdi, ijara, uy-joy ijarasi, kredit va vorislik (meros).": ["Купля-продажа, аренда, наём жилья, кредит и наследование.", "Sale, lease, residential tenancy, credit and inheritance."],
    "Ma’muriy javobgarlik kodeksi": ["Кодекс об административной ответственности", "Code of Administrative Liability"],
    "Yo‘l harakati, jarimalar va ma’muriy huquqbuzarliklar.": ["Дорожное движение, штрафы и административные правонарушения.", "Road traffic, fines and administrative offences."],
    "Jinoyat kodeksi": ["Уголовный кодекс", "Criminal Code"],
    "Jinoiy javobgarlik, jazolar va jinoyat turlari.": ["Уголовная ответственность, наказания и виды преступлений.", "Criminal liability, penalties and types of crime."],
    "Soliq kodeksi": ["Налоговый кодекс", "Tax Code"],
    "Jismoniy va yuridik shaxslar soliqlari, imtiyozlar va hisobotlar.": ["Налоги физических и юридических лиц, льготы и отчётность.", "Taxes for individuals and companies, reliefs and reporting."],
    "Uy-joy kodeksi": ["Жилищный кодекс", "Housing Code"],
    "Ko‘chmas mulk, xonadondan foydalanish va kommunal munosabatlar.": ["Недвижимость, пользование жильём и коммунальные отношения.", "Real estate, use of housing and utilities."],
    "Fuqarolik protsessual kodeksi": ["Гражданский процессуальный кодекс", "Civil Procedure Code"],
    "Sudga da’vo berish, dalillar, sud majlislari va qarorlar.": ["Подача иска, доказательства, судебные заседания и решения.", "Filing claims, evidence, hearings and judgments."],
    "Iqtisodiy protsessual kodeksi": ["Экономический процессуальный кодекс", "Economic Procedure Code"],
    "Tadbirkorlar va korxonalar o‘rtasidagi iqtisodiy nizolar.": ["Экономические споры между предпринимателями и предприятиями.", "Economic disputes between entrepreneurs and companies."],
    "Jinoyat-protsessual kodeksi": ["Уголовно-процессуальный кодекс", "Criminal Procedure Code"],
    "Ariza, tekshiruv, tergov, dalillar va himoya huquqi.": ["Заявление, проверка, следствие, доказательства и право на защиту.", "Complaints, preliminary checks, investigation, evidence and the right to a defence."],
  };
  const NOTE = {
    ru: "Интерфейс переведён на русский. Тексты инструкций, образцы документов и правовые материалы пока доступны на узбекском языке. AI отвечает на русском.",
    en: "The interface is in English. Guides, document templates and legal materials are currently available in Uzbek. The AI answers in English.",
  };

  const key = (s) => s.normalize("NFC").replace(/[‘’ʻʼ`']/g, "'").replace(/\s+/g, " ").trim();
  const DICT = { ru: new Map(), en: new Map() };
  for (const [uz, [ru, en]] of Object.entries(D)) { DICT.ru.set(key(uz), ru); DICT.en.set(key(uz), en); }

  let lang = "uz";
  try { const v = localStorage.getItem("hk-lang"); if (LANGS[v]) lang = v; } catch {}
  const q = new URLSearchParams(location.search).get("til");
  if (LANGS[q]) lang = q;

  function translate(src) {
    if (lang === "uz" || !src || !/[A-Za-z]/.test(src)) return src;
    if (lang === "cy") return toCyr(src);
    const m = src.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const hit = DICT[lang].get(key(m[2]));
    return hit === undefined ? src : m[1] + hit + m[3];
  }

  // ---------------- DOM bilan ishlash ----------------
  const SKIP = "script,style,textarea,code,pre,[translate=no],.notranslate";
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];
  const origText = new WeakMap(), setText = new WeakMap(), origAttr = new WeakMap();
  let observer = null;

  function doText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest(SKIP)) return;
    const cur = node.nodeValue;
    if (!origText.has(node) || setText.get(node) !== cur) origText.set(node, cur);
    const out = translate(origText.get(node));
    if (out !== cur) node.nodeValue = out;
    setText.set(node, node.nodeValue);
  }
  function doAttrs(el) {
    if (el.closest(SKIP) && !/^(TEXTAREA|INPUT)$/.test(el.tagName)) return;
    let o = origAttr.get(el);
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      if (!o) { o = {}; origAttr.set(el, o); }
      const cur = el.getAttribute(a);
      if (!(a in o) || (o["_" + a] !== cur)) o[a] = cur;
      const out = translate(o[a]);
      if (out !== cur) el.setAttribute(a, out);
      o["_" + a] = el.getAttribute(a);
    }
  }
  function walk(root) {
    if (root.nodeType === 3) return doText(root);
    if (root.nodeType !== 1) return;
    doAttrs(root);
    root.querySelectorAll("*").forEach(doAttrs);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) doText(n);
  }
  let titleOrig = document.title;
  function applyAll() {
    observer?.disconnect();
    walk(document.body);
    document.title = translate(titleOrig);
    document.documentElement.lang = LANGS[lang].html;
    document.documentElement.dataset.uiLang = lang;
    renderNote();
    syncSwitch();
    observe();
  }
  function observe() {
    if (!observer) observer = new MutationObserver((muts) => {
      observer.disconnect();
      for (const m of muts) {
        if (m.type === "characterData") doText(m.target);
        else if (m.type === "attributes") doAttrs(m.target);
        else m.addedNodes.forEach(walk);
      }
      observe();
    });
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  }

  // ---------------- Almashtirgich va ogohlantirish ----------------
  function syncSwitch() {
    document.querySelectorAll(".lang-switch [data-lang]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  }
  function renderNote() {
    let el = document.getElementById("lang-note");
    if (!NOTE[lang]) { el?.remove(); return; }
    if (!el) {
      el = document.createElement("div");
      el.id = "lang-note"; el.className = "lang-note notranslate"; el.setAttribute("role", "note");
      document.querySelector(".header")?.after(el);
    }
    el.textContent = NOTE[lang];
  }
  function setLang(v) {
    if (!LANGS[v] || v === lang) return;
    lang = v;
    try { localStorage.setItem("hk-lang", v); } catch {}
    applyAll();
  }
  document.addEventListener("click", (e) => {
    const b = e.target.closest(".lang-switch [data-lang]");
    if (b) { e.preventDefault(); setLang(b.dataset.lang); }
  });

  globalThis.HK_I18N = { get lang() { return lang; }, setLang, translate, toCyr };
  applyAll();
})();

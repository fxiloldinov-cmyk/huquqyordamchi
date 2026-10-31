// Kazus ustaxonasi: talaba kazus yuboradi, AI uni loyihaga kiritilgan namuna shaklida,
// talabaning o'z shaklida yoki standart tuzilmada yechadi.
//   GET  /api/kazus  -> namunalar ro'yxati (faqat nomlari)
//   POST /api/kazus  -> yechim (matn oqimi)
import {
  guardJsonPost, jsonError, jsonResponse, geminiConfig, callGemini,
  providerError, pipeGeminiStream, isAllowedOrigin, LEGAL_RULES, langNote, sourceTail, redactPII,
  callGeminiResilient, safeSources, dedupeSources, SEARCH_OFF_NOTE,
} from "../shared/common.mjs";
import { KAZUS_NAMUNALAR, STANDART_FORMAT, FANLAR } from "../shared/kazus-namunalar.mjs";
import { retrieve, citationReport } from "../shared/rag.mjs";

const FAN_CODE = { mehnat: "mk", oila: "ok", fuqarolik: "fk", jinoyat: "jk", mamuriy: "mjtk", "jinoyat-protsessual": "jpk", "fuqarolik-protsessual": "fpk", konstitutsiyaviy: "kon" };

export const config = {
  path: "/api/kazus",
  rateLimit: { windowLimit: 12, windowSize: 60, aggregateBy: ["ip", "domain"] },
};

const MAX_KAZUS = 6000;
const MAX_FORMAT = 6000;
// Netlify sinxron funksiyasi 60 soniyada to'xtatiladi: 48 soniyada oqimni xavfsiz yopamiz va brauzer davomini so'raydi.
const deadlineMs = () => Number(process.env.HK_DEADLINE_MS) || 48000; // testlarda qisqartiriladi
const MAX_ROUNDS = 4;            // birinchi so'rov + 3 ta davom
const MAX_PARTIAL = 90000;       // davom uchun qaytarilgan oldingi matn chegarasi (belgi)
const CONTINUE_PROMPT = "Javobingiz texnik vaqt chegarasi sababli uzildi. Aynan to‘xtagan joydan davom ettiring: oldingi matnni takrorlamang, sarlavha yoki bo‘limlarni qaytadan boshlamang, yarim qolgan so‘z yoki gapni to‘g‘ri ulang. Tuzilma, qoidalar va manba talablari avvalgidek. Agar javob tugagan bo‘lsa, faqat yakuniy bo‘lim(lar)ni yozing.";
// Brauzerdagi shaxsiy sessiya server ulanishi degani emas. Ruxsatli retriever
// ishga tushmaguncha kitob matni olinganini hech qayerda da'vo qilmaymiz.
const TSUL_STATUS = Object.freeze({
  connected: false,
  status: "not_connected",
  message: "TSUL kitob matni bu tahlilga avtomatik olinmagan; doimiy ulanish sozlanmagan.",
});

const SYSTEM = LEGAL_RULES + `
Siz O'zbekiston Respublikasi huquqi bo'yicha universitet o'qituvchisi darajasidagi o'quv yordamchisiz.
Talaba yuborgan kazusni (huquqiy masalani) yechasiz.

Qat'iy qoidalar:
- Javobni o'zbek tilida (lotin yozuvida), akademik uslubda yozing.
- Berilgan JAVOB SHAKLIGA aniq amal qiling: bo'limlar tartibi, sarlavhalar, raqamlash, uslub va chuqurlik namunadagidek bo'lsin.
- Voqea sanasiga tegishli qonun tahririga tayaning. Voqea sanasi noma’lum bo‘lsa, buni cheklov sifatida ayting. 2023-yil 30-apreldan oldingi mehnat munosabatlariga yangi Mehnat kodeksini avtomatik qo‘llamang. Konstitutsiyaning 2023-yilgi va oldingi tahrirlari moddalarini farqlang.
- Google qidiruvidan foydalaning va normalarni imkon qadar lex.uz bo'yicha tekshiring.
- Modda raqami, qism yoki band aniq ekaniga ishonchingiz komil bo'lmasa, uni uydirmang: "[lex.uz da tekshirilsin]" deb belgilang.
- Sud amaliyoti va Plenum qarorlarini faqat aniq ma'lum bo'lsa keltiring, aks holda umuman keltirmang.
- Kazus shartida bo'lmagan faktlarni o'ylab topmang; kerak bo'lsa "agar ... bo'lsa" deb muqobil variantlarni ko'rib chiqing.
- Namunadagi kazusning mazmunini ko'chirmang — faqat uning shakli va uslubidan foydalaning.
- Namunadagi raqamlar (masalan, bazaviy hisoblash miqdori, eng kam ish haqi) eskirgan bo'lishi mumkin: amaldagi qiymatni qo'llang yoki "[amaldagi miqdorni tekshiring]" deb belgilang.
- Topshiriqda nazariy savollar bo'lsa, ularga ham namunadagi kabi alohida javob bering.
- Iqtiboslar uchun [1], [2] ko'rinishidagi izohlardan foydalanish mumkin; izohlar va "Foydalanilgan adabiyotlar" ro'yxatini javob oxirida bering.
- Adabiyotlar ro'yxatiga faqat haqiqatan mavjud ekaniga ishonchingiz komil bo'lgan manbalarni yozing. Darslik yoki sharh muallifi, yili, nashriyotini aniq bilmasangiz, ularni yozmang — faqat normativ-huquqiy hujjatlarni keltiring.`;

const BOOK_SOURCE_RULES = `
Kitob manbalari bo'yicha qo'shimcha qat'iy qoidalar:
- Ushbu serverga TSUL hisobidan olingan tasdiqlangan kitob parchalari ulanmagan. TSUL hisobiga kirdim yoki yopiq kitobni o'qidim deb yozmang.
- Katalog havolasi, kitob nomi yoki qidiruv tavsifi kitob matni o'qilganiga dalil emas. Faqat shularga asoslanib kitobdan iqtibos, sahifa yoki muallif xulosasini keltirmang.
- Ochiq manbada haqiqatan mavjud, vaziyatga mos parcha bo'lsa, uni ko'rib chiqing; manbaning cheklovlarini ayting. Talaba bergan parchani mustaqil tasdiqlangan manba deb ko'rsatmang.
- Iqtibos va sahifa raqamini uydirmang. Bosma sahifa va PDF tartib raqamini farqlang; bosma raqam ko'rinmasa, faqat tasdiqlangan PDF sahifasini belgilang.
- Darslikdagi qoidani voqea sanasida amal qilgan qonun tahriri bilan solishtiring. Nashr yili amaldagi tahrir isboti emas. Manba yoki tahrir yetishmasa, buni ochiq ayting.
- Login, parol yoki sessiya tokenini so'ramang va javobga yozmang.`;

function sanitize(s, n) {
  return typeof s === "string" ? redactPII(s.replace(/\r\n/g, "\n").trim()).slice(0, n) : "";
}

function listResponse() {
  return jsonResponse({
    namunalar: KAZUS_NAMUNALAR.map((n) => ({
      id: n.id, title: n.title, fan: n.fan, fanNomi: FANLAR[n.fan] || n.fan, muallif: n.muallif || null,
    })),
    fanlar: FANLAR,
    sources: { tsul: TSUL_STATUS },
  });
}

export default async (req, context) => {
  if (req.method === "GET") {
    if (req.headers.get("origin") && !isAllowedOrigin(req)) return jsonError("Ruxsat etilmagan manba.", 403);
    return listResponse();
  }

  const startedAt = Date.now();
  const { body, error } = await guardJsonPost(req, context, { scope: "kazus", perMinute: 12, perHour: 80, maxBytes: 320000 });
  if (error) return error;

  // Davom so'rovi: brauzer oldingi qism matnini va to'plangan manbalarni qaytaradi.
  const cont = body?.continuation && typeof body.continuation === "object" ? body.continuation : null;
  const round = cont ? Number(cont.round) : 0;
  if (cont && (!Number.isInteger(round) || round < 1 || round >= MAX_ROUNDS)) return jsonError("Davom so‘rovi noto‘g‘ri.", 400);
  const partial = cont && typeof cont.partial === "string" ? cont.partial.slice(0, MAX_PARTIAL + 1) : "";
  if (cont && (!partial.trim() || partial.length > MAX_PARTIAL)) return jsonError("Davom uchun oldingi matn noto‘g‘ri yoki juda uzun.", 400);
  const priorSources = cont && Array.isArray(cont.sources) ? safeSources(cont.sources.slice(0, 20)) : [];

  const kazus = sanitize(body?.kazus, MAX_KAZUS + 1);
  const studentAnswer = sanitize(body?.studentAnswer, 8001);
  if (studentAnswer.length > 8000) return jsonError('Talaba javobi 8000 belgidan oshmasin.', 400);
  const review = body?.task === 'review';
  if (review && studentAnswer.length < 40) return jsonError('Tekshirish uchun javobingizni kiriting (kamida 40 belgi).', 400);
  const eventDate = /^\d{4}-\d{2}-\d{2}$/.test(body?.eventDate || '') ? body.eventDate : 'ko‘rsatilmagan';
  if (kazus.length < 40) return jsonError("Kazus shartini to'liq yozing (kamida 40 belgi).", 400);
  if (kazus.length > MAX_KAZUS) return jsonError(`Kazus juda uzun (maksimal ${MAX_KAZUS} belgi).`, 400);

  const fan = FANLAR[body?.fan] ? body.fan : "boshqa";
  const mode = ["namuna", "ozim", "standart"].includes(body?.mode) ? body.mode : "standart";

  let formatBlock;
  let fewShot = [];
  if (mode === "ozim") {
    const format = sanitize(body?.format, MAX_FORMAT + 1);
    if (format.length < 20) return jsonError("O'zingiz xohlagan javob shaklini (namunasini) kiriting.", 400);
    if (format.length > MAX_FORMAT) return jsonError(`Javob shakli juda uzun (maksimal ${MAX_FORMAT} belgi).`, 400);
    formatBlock = `JAVOB SHAKLI (talaba bergan namuna — tuzilishi va uslubiga aynan amal qiling):\n"""\n${format}\n"""`;
  } else if (mode === "namuna") {
    const sample = KAZUS_NAMUNALAR.find((n) => n.id === body?.namunaId)
      || KAZUS_NAMUNALAR.find((n) => n.fan === fan);
    if (!sample) return jsonError("Tanlangan namuna topilmadi. Standart tuzilmani tanlang.", 400);
    formatBlock = "JAVOB SHAKLI: quyidagi loyihaga kiritilgan namunaviy yechimning tuzilishi, bo'limlari, uslubi va chuqurligiga aynan amal qiling.";
    fewShot = [
      { role: "user", parts: [{ text: `Namunaviy kazus:\n${sample.kazus}` }] },
      { role: "model", parts: [{ text: sample.javob }] },
    ];
  } else {
    formatBlock = `JAVOB SHAKLI (standart tuzilma):\n${STANDART_FORMAT}`;
  }

  const { apiKey, models, thinkingLevel } = geminiConfig();
  if (!apiKey) return jsonError("AI xizmati sozlanmagan. Serverda GEMINI_API_KEY kiritilishi kerak.", 503);

  const contents = [
    ...fewShot,
    { role: "user", parts: [{ text: `Fan: ${FANLAR[fan]}\nVoqea sanasi: ${eventDate}\nVazifa: ${review ? "Talaba javobini baholang: to‘g‘ri jihatlar, xato normalar, yetishmagan dalillar, asoslangan yaxshilangan yechim. Ball yoki bahoni o‘qituvchi bahosi deb bermang. Talaba javobi: " + studentAnswer : "Kazusni asoslantirib tahlil qiling"}\n\n${formatBlock}\n\nYechilishi kerak bo'lgan kazus:\n"""\n${kazus}\n"""` }] },
  ];
  if (cont) contents.push(
    { role: "model", parts: [{ text: partial }] },
    { role: "user", parts: [{ text: CONTINUE_PROMPT }] },
  );

  // RAG: Konstitutsiya, 10 ta kodeks va Isteʼmolchilar qonuni (+ MK bo'yicha Plenum 26-son) rasmiy matnidan mos parchalar.
  // Tanlangan fan kodeksi har doim qidiriladi; kazus matnidagi mavzu so'zlari boshqa kodekslarni ham qo'shadi.
  const rag = retrieve(kazus + (review ? "\n" + studentAnswer : ""), { k: 12, budget: 18000, force: FAN_CODE[fan] });
  const body0 = {
    system_instruction: { parts: [{ text: SYSTEM + BOOK_SOURCE_RULES + rag.block + langNote(body.lang) }] },
    contents,
    // Davom so'rovida qidiruv o'chiriladi: tezroq ishlaydi, manbalar birinchi qismdan olib boriladi.
    ...(cont ? {} : { tools: [{ google_search: {} }] }),
    generationConfig: { temperature: 0.2, maxOutputTokens: 12000 },
  };

  try {
    const r = await callGeminiResilient({ apiKey, models, body: body0, stream: true, signal: req.signal, thinkingLevel, allowNoSearch: true, timeoutMs: 58000 });
    if (!r.ok) return await providerError(r);
    if (!r.upstream.body) return jsonError("AI xizmatidan javob oqimi kelmadi.", 502);
    return pipeGeminiStream(r.upstream, {
      continuable: true,
      canContinue: round < MAX_ROUNDS - 1,
      deadlineAt: startedAt + deadlineMs(),
      prefix: r.searchDropped ? SEARCH_OFF_NOTE : "",
      onEnd: (sources, text) => sourceTail(dedupeSources([...priorSources, ...sources])) + citationReport(partial + text, rag.provided, { bands: rag.bands, eventDate }) + `\n\n**TSUL manbasi:** ${TSUL_STATUS.message}` + "\n\n*O‘quv tahlili. Topshirishdan oldin manbalar va topshiriq talablarini tekshiring.*",
    });
  } catch (e) {
    console.error("Kazus backend error:", e?.name || "unknown");
    return jsonError(e?.name === "TimeoutError" ? "AI javobini kutish vaqti tugadi. Qayta urinib ko‘ring." : "Server bilan bog'lanishda xatolik yuz berdi.", 502);
  }
};

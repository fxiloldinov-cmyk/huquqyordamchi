// FAQAT lokal ko'rik va ekran tasvirlari uchun: Gemini so'rovlari soxta (MOCK) javob bilan almashtiriladi.
// Qolgan hammasi haqiqiy: RAG, manba tekshiruvi, ishlar API, limitlar (xotiradagi ombor). Production'da ishlatilmaydi.
//   node scripts/dev-mock.mjs --port 4174
process.env.GEMINI_API_KEY ||= 'mock-key-not-real';
process.env.HK_DEV_MEMORY_STORE = '1';
const realFetch = globalThis.fetch;
const ANSWERS = [
  [/kazus|talaba|bo.shat|kasal/i, `## Masala\nXodim kasallik varaqasi bilan ishda bo‘lmagan davrda ish beruvchi tashabbusi bilan bo‘shatilgan.\n\n## Tegishli norma\nIsh beruvchi tashabbusi bilan bekor qilish asoslangan bo‘lishi kerak (MK 161-modda 1-qism). Xodim vaqtincha mehnatga qobiliyatsiz bo‘lgan davrda ish beruvchi tashabbusi bilan bo‘shatish mumkin emas, tashkilot tugatilgan hollar bundan mustasno (MK 163-modda).\n\n## Tahlil\nAgar kasallik varaqasi rasmiylashtirilgan bo‘lsa, bo‘shatish qonunga zid bo‘lishi mumkin. Ishga tiklash nizosi bo‘yicha sudga murojaat muddati uch oy (MK 560-modda 1-qism).\n\n## Xulosa\nVoqea sanasi va kasallik varaqasini tekshiring.`],
  [/qarz|tilxat/i, `Muddat belgilanmagan bo‘lsa, qarz oluvchi talab qo‘yilgan kundan boshlab o‘ttiz kun mobaynida qaytarishi kerak (FK 735-modda 2-qism).\n\nFK 735-modda 2-qismida «qarz oluvchi uni qarz beruvchi qarzni qaytarish haqida talab qo‘ygan kundan boshlab o‘ttiz kun mobaynida qaytarishi kerak» deyilgan.\n\nQarzdor 10 kun ichida qaytarishi shart.\n\n**Amaliy qadam:** yozma talabnoma yuboring va tilxatni saqlang.`],
];
globalThis.fetch = async (url, init) => {
  if (!String(url).includes('generativelanguage.googleapis.com')) return realFetch(url, init);
  const body = JSON.parse(init.body), user = JSON.stringify(body.contents.at(-1));
  const text = '⚠️ *MOCK javob (lokal ko‘rik, haqiqiy AI emas).*\n\n' + (ANSWERS.find(([re]) => re.test(user))?.[1] || 'Savolingiz bo‘yicha bazadan mos parcha topilmadi. Voqea sanasi va hujjatlarni aniqlashtiring.');
  const chunks = text.match(/[\s\S]{1,120}/g).map((t) => 'data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: t }] } }] }) + '\n\n');
  chunks.push('data: ' + JSON.stringify({ candidates: [{ content: { parts: [{ text: '' }] }, finishReason: 'STOP' }] }) + '\n\n');
  return new Response(new ReadableStream({ async start(c) { for (const x of chunks) { c.enqueue(new TextEncoder().encode(x)); await new Promise((r) => setTimeout(r, 25)); } c.close(); } }), { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
};
await import('./dev.mjs');

// GET /api/status — AI ulanishini tekshiradi va sababini o'zbekcha tushuntiradi.
// Kalit hech qachon qaytarilmaydi; faqat bor-yo'qligi va formati haqida xulosa beriladi.
// ?search=1 — Google qidiruvi (grounding) ham sinab ko'riladi (oylik bepul limitdan 1 ta so'rov sarflaydi).
import { jsonResponse, geminiConfig, callGemini, diagnoseProvider, isRateLimited, clientIp } from '../shared/common.mjs';
import { LAW_META } from '../shared/rag.mjs';

export const config = { path: '/api/status', method: ['GET'], rateLimit: { windowLimit: 6, windowSize: 60, aggregateBy: ['ip', 'domain'] } };
const VERSION = '11.4.0';

async function probe(apiKey, model, withSearch) {
  const body = { contents: [{ role: 'user', parts: [{ text: 'Faqat "ok" deb javob bering.' }] }], generationConfig: { maxOutputTokens: 16 }, ...(withSearch ? { tools: [{ google_search: {} }] } : {}) };
  try {
    const res = await callGemini({ apiKey, model, body, timeoutMs: 20000 });
    if (res.ok) return { ok: true, status: res.status };
    let info = '';
    try { const e = (await res.json())?.error || {}; info = [(e.details || []).map(d => d?.reason).find(Boolean), e.status, e.message].filter(Boolean).join(': '); } catch {}
    return { ok: false, status: res.status, info: info.split(apiKey).join('***').slice(0, 300) };
  } catch (e) { return { ok: false, status: 0, info: e?.name === 'TimeoutError' ? 'Kutish vaqti tugadi' : 'Tarmoq xatosi' }; }
}

export default async (req, ctx) => {
  const headers = { 'Cache-Control': 'no-store' };
  if (isRateLimited('status:' + clientIp(req, ctx), 6, 30)) return jsonResponse({ ok: false, xabar: 'Juda ko‘p tekshiruv. Bir daqiqadan keyin qayta oching.' }, 429);
  const { apiKey, models } = geminiConfig();
  const raw = process.env.GEMINI_API_KEY || process.env.API_KEY || '';
  const base = { versiya: VERSION, vaqt: new Date().toISOString(), modellar: models, baza: LAW_META };
  if (!apiKey) return jsonResponse({ ...base, ok: false, sabab: 'kalit_yoq', xabar: 'Serverda GEMINI_API_KEY topilmadi. Netlify → Site configuration → Environment variables’da qo‘shing, "Scopes" da Functions belgilanganini tekshiring va saytni qayta deploy qiling (o‘zgaruvchi faqat yangi deploydan keyin ishlaydi).' }, 200);
  const kalit = { mavjud: true, uzunlik: apiKey.length, tozalangan: apiKey !== raw, odatiyFormat: /^AIza[0-9A-Za-z_-]{35}$/.test(apiKey) };
  const sinovlar = [];
  let working = null;
  for (const model of models) {
    const r = await probe(apiKey, model, false);
    sinovlar.push({ model, ...r });
    if (r.ok) { working = model; break; }
    const d = diagnoseProvider(r.status, r.info);
    if (d && d.sabab !== 'model') break; // kalit bilan bog'liq xato — boshqa modelni sinash foydasiz
  }
  let qidiruv = null;
  if (working && new URL(req.url).searchParams.get('search') === '1') {
    const r = await probe(apiKey, working, true);
    qidiruv = r.ok ? { ok: true } : { ok: false, status: r.status, info: r.info, ...(diagnoseProvider(r.status, r.info) || {}) };
  }
  if (working) return jsonResponse({ ...base, ok: true, xabar: `AI ishlayapti: ${working} modeli javob berdi.` + (kalit.tozalangan ? ' Eslatma: kalitda ortiqcha belgi (bo‘sh joy yoki qo‘shtirnoq) bor edi, server uni tozalab ishlatdi — Netlify’da ham tuzatib qo‘ying.' : ''), kalit, ishlaganModel: working, sinovlar, qidiruv }, 200);
  const last = sinovlar.at(-1) || {};
  const d = diagnoseProvider(last.status, last.info) || { sabab: 'nomalum', xabar: 'Google so‘rovni rad etdi. "sinovlar" dagi xabarni o‘qing yoki Netlify → Functions → status loglarini tekshiring.' };
  return jsonResponse({ ...base, ok: false, ...d, kalit, sinovlar, maslahat: kalit.odatiyFormat ? undefined : 'Kalit odatiy AI Studio formatida emas (AIza bilan boshlanadigan 39 belgi). To‘g‘ri kalit nusxalanganini tekshiring.' }, 200);
};

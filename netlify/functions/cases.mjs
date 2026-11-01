// Ishlar (yagona ish oynasi): savol yoki kazus, sana, soha, javoblar, ishlatilgan manbalar, kitob parchalari va hujjat versiyalari
// bitta ish ichida bog'langan holda saqlanadi.
//   GET  /api/account/cases              → ro'yxat (qisqa ma'lumot)
//   GET  /api/account/cases?id=…         → bitta ish to'liq
//   POST /api/account/cases {op:"create", title, kind, soha, eventDate}
//   POST /api/account/cases {op:"update", id, title?, soha?, eventDate?}
//   POST /api/account/cases {op:"append", id, entry:{task, question, answer, sources}}
//   POST /api/account/cases {op:"doc", id, title, text}
//   POST /api/account/cases {op:"delete", id}
//   POST /api/account/cases {op:"import-item", itemId}  → eski saqlangan materialdan ish (asl material o'chirilmaydi)
//
// Ajratish: har bir yozuv kaliti sessiyadagi foydalanuvchi ID'sidan yasaladi ("c_<uid>_<id>", ro'yxat "ci_<uid>").
// So'rovdagi ID faqat shu nom maydoni ichida qidiriladi — boshqa hisobning ishini ID orqali o'qish yoki o'zgartirish imkonsiz.
import { randomUUID } from "node:crypto";
import { guardJsonPost, jsonError, jsonResponse } from "../shared/common.mjs";
import { StoreUnavailable, StoreConflict, openStore } from "../shared/store.mjs";
import { currentUser } from "../shared/auth.mjs";

export const config = { path: "/api/account/cases" };

export const MAX_CASES = 100, MAX_ENTRIES = 30, MAX_DOCS = 20, MAX_ANSWER = 60000, MAX_QUESTION = 9000, MAX_SOURCES_JSON = 120000;
const KINDS = new Set(["vaziyat", "kazus", "savol"]);
const TASKS = new Set(["chat", "kazus", "review", "hint", "search", "note"]);
const clean = (s, n) => String(s ?? "").replace(/\u0000/g, "").slice(0, n);
const validId = (id) => typeof id === "string" && /^[0-9a-f-]{36}$/.test(id);
const date = (d) => (typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null);
const summary = (c) => ({ id: c.id, title: c.title, kind: c.kind, soha: c.soha, eventDate: c.eventDate, createdAt: c.createdAt, updatedAt: c.updatedAt, entries: c.entries.length, docs: c.docs.length, sources: c.entries.reduce((n, e) => n + (e.sources?.passages?.length || 0), 0) });

// Manbalar paneli ma'lumoti: faqat kutilgan maydonlar, hajmi cheklangan (mijoz yuborgan narsa ishonchsiz)
function cleanSources(src) {
  if (!src || typeof src !== "object") return null;
  const pick = (o, keys) => Object.fromEntries(keys.filter((k) => o[k] != null).map((k) => [k, typeof o[k] === "string" ? o[k].slice(0, k === "text" || k === "excerpt" ? 4000 : 400) : o[k]]));
  const out = {
    v: 1,
    passages: (Array.isArray(src.passages) ? src.passages : []).slice(0, 30).map((p) => pick(p, ["sourceId", "kind", "verified", "doc", "code", "art", "label", "url", "asOf", "author", "year", "page", "origin", "text"])),
    claims: (Array.isArray(src.claims) ? src.claims : []).slice(0, 20).map((c) => pick(c, ["claimId", "sourceId", "snippet", "where", "doc", "code", "art", "qism", "band", "level", "icon", "status", "exists", "given", "overlap", "quote", "risks", "reviewed", "model", "url", "asOf", "edition", "method", "excerpt"])),
    unsupported: (Array.isArray(src.unsupported) ? src.unsupported : []).slice(0, 6).map((u) => clean(u, 400)),
    clarify: (Array.isArray(src.clarify) ? src.clarify : []).slice(0, 6).map((u) => clean(u, 300)),
  };
  return JSON.stringify(out).length > MAX_SOURCES_JSON ? { ...out, passages: out.passages.map((p) => ({ ...p, text: (p.text || "").slice(0, 600) })) } : out;
}

export default async (req, ctx) => {
  try {
    if (req.method === "GET") {
      const cur = await currentUser(req);
      if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
      const store = await openStore("cases"), uid = cur.user.id;
      const id = new URL(req.url).searchParams.get("id");
      if (id) {
        if (!validId(id)) return jsonError("Topilmadi.", 404);
        const c = await store.get(`c_${uid}_${id}`);
        return c ? jsonResponse({ case: c }) : jsonError("Topilmadi.", 404);
      }
      return jsonResponse({ cases: (await store.get("ci_" + uid)) || [] });
    }

    const { body, error } = await guardJsonPost(req, ctx, { scope: "cases", perMinute: 30, perHour: 400, maxBytes: 260000 });
    if (error) return error;
    const cur = await currentUser(req);
    if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
    const store = await openStore("cases"), uid = cur.user.id, idxKey = "ci_" + uid;
    const key = (id) => `c_${uid}_${id}`;
    const touchIndex = (c) => store.update(idxKey, (list) => [summary(c), ...(list || []).filter((x) => x.id !== c.id)].slice(0, MAX_CASES));
    // O'zgartirish: faqat shu foydalanuvchi nom maydonidagi mavjud ish
    async function change(id, fn) {
      if (!validId(id)) return null;
      const r = await store.update(key(id), (c) => (c ? fn(c) : undefined));
      if (!r.written) return r.value ? "nochange" : null;
      await touchIndex(r.value);
      return r.value;
    }
    const now = () => new Date().toISOString();

    if (body.op === "create" || body.op === "import-item") {
      let seed = null;
      if (body.op === "import-item") {
        const items = (await (await openStore("items")).get("i_" + uid)) || [];
        const it = items.find((x) => x.id === body.itemId);
        if (!it) return jsonError("Saqlangan material topilmadi.", 404);
        seed = { title: it.title, kind: it.type === "kazus" ? "kazus" : "savol", entries: [{ id: randomUUID(), at: it.createdAt, task: it.type === "kazus" ? "kazus" : "chat", question: "", answer: it.text, sources: null, importedFrom: it.id }] };
      }
      const index = (await store.get(idxKey)) || [];
      if (index.length >= MAX_CASES) return jsonError(`Ko‘pi bilan ${MAX_CASES} ta ish saqlanadi. Eskilarini o‘chiring.`, 409);
      const c = {
        id: randomUUID(), title: clean(seed?.title ?? body.title, 140).trim() || "Yangi ish",
        kind: seed?.kind || (KINDS.has(body.kind) ? body.kind : "savol"), soha: clean(body.soha, 60), eventDate: date(body.eventDate),
        createdAt: now(), updatedAt: now(), entries: seed?.entries || [], docs: [],
      };
      if (!(await store.setIf(key(c.id), c, null))) return jsonError("Qayta urinib ko‘ring.", 409);
      await touchIndex(c);
      return jsonResponse({ case: c }, 201);
    }

    if (body.op === "update") {
      const c = await change(body.id, (c) => {
        if (body.title != null) c.title = clean(body.title, 140).trim() || c.title;
        if (body.soha != null) c.soha = clean(body.soha, 60);
        if (body.eventDate !== undefined) c.eventDate = date(body.eventDate);
        c.updatedAt = now(); return c;
      });
      return c ? jsonResponse({ case: c === "nochange" ? null : summary(c) }) : jsonError("Topilmadi.", 404);
    }

    if (body.op === "append") {
      const e = body.entry || {};
      const answer = clean(e.answer, MAX_ANSWER + 1), question = clean(e.question, MAX_QUESTION + 1);
      if (answer.length > MAX_ANSWER || question.length > MAX_QUESTION) return jsonError("Matn juda uzun — saqlab bo‘lmadi.", 413);
      if (answer.trim().length < 10 && question.trim().length < 10) return jsonError("Saqlash uchun matn yetarli emas.", 400);
      let full = false;
      const entry = { id: randomUUID(), at: now(), task: TASKS.has(e.task) ? e.task : "chat", question, answer, sources: cleanSources(e.sources) };
      const c = await change(body.id, (c) => { if (c.entries.length >= MAX_ENTRIES) { full = true; return undefined; } c.entries.push(entry); c.updatedAt = now(); return c; });
      if (full) return jsonError(`Bitta ishda ko‘pi bilan ${MAX_ENTRIES} ta yozuv. Yangi ish oching.`, 409);
      return c ? jsonResponse({ entry, case: summary(c) }, 201) : jsonError("Topilmadi.", 404);
    }

    if (body.op === "doc") {
      const text = clean(body.text, MAX_ANSWER + 1);
      if (text.trim().length < 20) return jsonError("Hujjat matni yetarli emas.", 400);
      if (text.length > MAX_ANSWER) return jsonError("Hujjat juda uzun.", 413);
      let full = false, doc;
      const c = await change(body.id, (c) => {
        if (c.docs.length >= MAX_DOCS) { full = true; return undefined; }
        doc = { version: (c.docs.at(-1)?.version || 0) + 1, at: now(), title: clean(body.title, 140).trim() || c.title, text };
        c.docs.push(doc); c.updatedAt = now(); return c;
      });
      if (full) return jsonError(`Ko‘pi bilan ${MAX_DOCS} ta hujjat versiyasi.`, 409);
      return c ? jsonResponse({ doc, case: summary(c) }, 201) : jsonError("Topilmadi.", 404);
    }

    if (body.op === "delete") {
      if (!validId(body.id) || !(await store.get(key(body.id)))) return jsonError("Topilmadi.", 404);
      await store.delete(key(body.id));
      await store.update(idxKey, (list) => (list || []).filter((x) => x.id !== body.id));
      return jsonResponse({ ok: true });
    }
    return jsonError("Noma’lum amal.", 400);
  } catch (e) {
    if (e instanceof StoreUnavailable) return jsonError("Ishlarni saqlash xizmati hozircha ulanmagan. Keyinroq urinib ko‘ring.", 503);
    if (e instanceof StoreConflict) return jsonError(e.message, 409);
    console.error("cases error", e?.name);
    return jsonError("Ishni saqlashda xatolik yuz berdi.", 500);
  }
};

// Hisob o'chirilganda: barcha ishlar
export async function deleteAllCases(uid) {
  const store = await openStore("cases");
  for (const c of (await store.get("ci_" + uid)) || []) await store.delete(`c_${uid}_${c.id}`);
  await store.delete("ci_" + uid);
}

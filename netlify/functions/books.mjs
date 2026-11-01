// Foydalanuvchining kitob parchalari (kazusda manba sifatida ishlatish uchun).
//   GET  /api/account/books                 → ro'yxat (metama'lumot, matnsiz)
//   POST /api/account/books {op:"add", title, author, year, edition, origin, firstPage, text, rightsConfirmed:true}
//   POST /api/account/books {op:"delete", id}
// Foydalanuvchi parchani ishlatishga haqli ekanini tasdiqlashi shart. Parol/sessiya ma'lumotlari qabul qilinmaydi.
import { randomUUID } from "node:crypto";
import { guardJsonPost, jsonError, jsonResponse } from "../shared/common.mjs";
import { StoreUnavailable, StoreConflict, openStore } from "../shared/store.mjs";
import { currentUser } from "../shared/auth.mjs";
import { MAX_BOOK_EXCERPTS, MAX_EXCERPT_CHARS, splitPages, SOURCES } from "../shared/books.mjs";

export const config = { path: "/api/account/books" };
const clean = (s, n) => String(s ?? "").replace(/\u0000/g, "").trim().slice(0, n);
const meta = ({ text, ...b }) => ({ ...b, chars: text.length, pages: [...new Set(splitPages(text, b.firstPage).map((p) => p.page).filter((p) => p != null))].length });

export default async (req, ctx) => {
  try {
    if (req.method === "GET") {
      const cur = await currentUser(req);
      if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
      const books = (await (await openStore("books")).get("b_" + cur.user.id)) || [];
      return jsonResponse({ books: books.map(meta), sources: SOURCES.map((s) => ({ id: s.id, name: s.name, ...s.status() })) });
    }
    const { body, error } = await guardJsonPost(req, ctx, { scope: "books", perMinute: 10, perHour: 60, maxBytes: 90000 });
    if (error) return error;
    const cur = await currentUser(req);
    if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
    const store = await openStore("books"), key = "b_" + cur.user.id;
    if (body.op === "delete") {
      let found = false;
      await store.update(key, (list) => { const l = list || []; const n = l.filter((b) => b.id !== body.id); found = n.length !== l.length; return found ? n : undefined; });
      return found ? jsonResponse({ ok: true }) : jsonError("Topilmadi.", 404);
    }
    if (body.op === "add") {
      if (body.rightsConfirmed !== true) return jsonError("Parchadan foydalanishga haqli ekaningizni tasdiqlang.", 400);
      const title = clean(body.title, 200), origin = clean(body.origin, 200), text = String(body.text ?? "").replace(/\u0000/g, "");
      if (title.length < 2) return jsonError("Kitob nomini kiriting.", 400);
      if (origin.length < 3) return jsonError("Parcha qayerdan olinganini yozing (masalan, “TSUL e-kutubxonasi, o‘z hisobim orqali”).", 400);
      if (text.trim().length < 200) return jsonError("Parcha juda qisqa (kamida 200 belgi).", 400);
      if (text.length > MAX_EXCERPT_CHARS) return jsonError(`Parcha ${MAX_EXCERPT_CHARS} belgidan oshmasin — bo‘lib yuklang.`, 413);
      const year = Number(body.year);
      const book = {
        id: randomUUID(), title, author: clean(body.author, 150), year: Number.isInteger(year) && year > 1900 && year < 2100 ? year : null,
        edition: clean(body.edition, 100), origin, firstPage: Number.isInteger(+body.firstPage) && +body.firstPage > 0 ? +body.firstPage : null,
        text, rightsConfirmed: true, addedAt: new Date().toISOString(),
      };
      let full = false;
      await store.update(key, (list) => { const l = list || []; if (l.length >= MAX_BOOK_EXCERPTS) { full = true; return undefined; } return [book, ...l]; });
      if (full) return jsonError(`Ko‘pi bilan ${MAX_BOOK_EXCERPTS} ta parcha saqlash mumkin.`, 409);
      return jsonResponse({ book: meta(book) }, 201);
    }
    return jsonError("Noma’lum amal.", 400);
  } catch (e) {
    if (e instanceof StoreUnavailable) return jsonError("Hisob xizmati hozircha ulanmagan.", 503);
    if (e instanceof StoreConflict) return jsonError(e.message, 409);
    console.error("books:", e?.name);
    return jsonError("Kitob parchasini saqlashda xatolik.", 500);
  }
};

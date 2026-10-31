// Foydalanuvchi saqlagan materiallar: kazus tahlillari va AI suhbatlari.
// Faqat foydalanuvchi o'zi "Saqlash" tugmasini bosganda saqlanadi; hisob o'chirilganda butunlay o'chadi.
import { randomUUID } from "node:crypto";
import { guardJsonPost, jsonError, jsonResponse } from "../shared/common.mjs";
import { StoreUnavailable, openStore } from "../shared/store.mjs";
import { currentUser } from "../shared/auth.mjs";

export const config = { path: "/api/account/items" };

export const MAX_ITEMS = 50, MAX_TEXT = 60000, MAX_TITLE = 120;
const TYPES = new Set(["kazus", "chat", "search", "doc"]);
const clean = (s, n) => String(s ?? "").replace(/\u0000/g, "").slice(0, n);

export default async (req, ctx) => {
  try {
    if (req.method === "GET") {
      const cur = await currentUser(req);
      if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
      const items = (await (await openStore("items")).get("i_" + cur.user.id)) || [];
      // Ro'yxatda matnning qisqa bo'lagi; to'liq matn alohida so'raladi
      const id = new URL(req.url).searchParams.get("id");
      if (id) {
        const it = items.find((x) => x.id === id);
        return it ? jsonResponse({ item: it }) : jsonError("Topilmadi.", 404);
      }
      return jsonResponse({ items: items.map(({ text, ...rest }) => ({ ...rest, preview: text.slice(0, 220) })) });
    }

    const { body, error } = await guardJsonPost(req, ctx, { scope: "account", perMinute: 20, perHour: 200, maxBytes: 200000 });
    if (error) return error;
    const cur = await currentUser(req);
    if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
    const store = await openStore("items");
    const key = "i_" + cur.user.id;
    const items = (await store.get(key)) || [];

    if (body.op === "delete") {
      const next = items.filter((x) => x.id !== body.id);
      if (next.length === items.length) return jsonError("Topilmadi.", 404);
      await store.set(key, next);
      return jsonResponse({ ok: true });
    }
    if (body.op === "add") {
      const type = TYPES.has(body.type) ? body.type : "";
      const text = clean(body.text, MAX_TEXT + 1);
      if (!type) return jsonError("Noma’lum material turi.", 400);
      if (text.trim().length < 20) return jsonError("Saqlash uchun matn yetarli emas.", 400);
      if (text.length > MAX_TEXT) return jsonError("Matn juda uzun — saqlab bo‘lmadi.", 413);
      const item = { id: randomUUID(), type, title: clean(body.title, MAX_TITLE).trim() || "Nomsiz", text, createdAt: new Date().toISOString() };
      const next = [item, ...items].slice(0, MAX_ITEMS);
      await store.set(key, next);
      return jsonResponse({ item: { ...item, text: undefined, preview: text.slice(0, 220) }, trimmed: items.length + 1 > MAX_ITEMS }, 201);
    }
    return jsonError("Noma’lum amal.", 400);
  } catch (e) {
    if (e instanceof StoreUnavailable) return jsonError("Hisob xizmati hozircha ulanmagan. Keyinroq urinib ko‘ring.", 503);
    console.error("account error", e?.message);
    return jsonError("Saqlashda xatolik yuz berdi.", 500);
  }
};

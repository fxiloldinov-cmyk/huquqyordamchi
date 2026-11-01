// Kalit-qiymat ombori. Netlify'da — Netlify Blobs (sayt bilan birga keladi, alohida xizmat kerak emas).
// Lokal ishga tushirish va testlarda — xotiradagi ombor (HK_DEV_MEMORY_STORE=1). Production'da xotiradagi
// omborga hech qachon o'tilmaydi: Blobs ulanmasa, so'rov 503 bilan rad etiladi.
//
// Parallel yozishdan himoya: update(key, fn) — "o'qi → o'zgartir → faqat o'zgarmagan bo'lsa yoz" (compare-and-swap).
// Netlify Blobs'da bu getWithMetadata().etag va setJSON(..., { onlyIfMatch | onlyIfNew }) orqali ishlaydi
// (@netlify/blobs 8.2+). Kutubxona shartli yozishni qo'llamasa, atomarlik yo'qligi bir marta logga yoziladi.
const memory = new Map();

function memoryStore(name) {
  const m = memory.get(name) || new Map();
  memory.set(name, m);
  return {
    atomic: true,
    async get(key) { return m.has(key) ? structuredClone(m.get(key).v) : null; },
    async getWithEtag(key) { const e = m.get(key); return e ? { value: structuredClone(e.v), etag: e.etag } : { value: null, etag: null }; },
    async set(key, value) { m.set(key, { v: structuredClone(value), etag: String((m.get(key)?.etag | 0) + 1) }); },
    // etag === null → faqat kalit yo'q bo'lsa yoziladi
    async setIf(key, value, etag) {
      const cur = m.get(key);
      if (etag === null ? cur : !cur || cur.etag !== etag) return false;
      m.set(key, { v: structuredClone(value), etag: String((cur?.etag | 0) + 1) });
      return true;
    },
    async delete(key) { m.delete(key); },
  };
}

export class StoreUnavailable extends Error {}
export class StoreConflict extends Error {}

let warnedNonAtomic = false;
function blobsStore(blobs, name) {
  const s = blobs.getStore({ name, consistency: "strong" });
  const conditional = typeof s.getWithMetadata === "function";
  return {
    atomic: conditional,
    async get(key) { return (await s.get(key, { type: "json" })) ?? null; },
    async getWithEtag(key) {
      if (!conditional) return { value: (await s.get(key, { type: "json" })) ?? null, etag: null };
      const r = await s.getWithMetadata(key, { type: "json" });
      return r ? { value: r.data ?? null, etag: r.etag ?? null } : { value: null, etag: null };
    },
    async set(key, value) { await s.setJSON(key, value); },
    async setIf(key, value, etag) {
      const r = await s.setJSON(key, value, etag === null ? { onlyIfNew: true } : { onlyIfMatch: etag });
      if (r && typeof r.modified === "boolean") return r.modified;
      if (!warnedNonAtomic) { warnedNonAtomic = true; console.warn("store: shartli yozish qo'llanmadi — @netlify/blobs versiyasini yangilang (>=8.2)"); }
      return true;
    },
    async delete(key) { await s.delete(key); },
  };
}

function withUpdate(st) {
  // fn(joriy qiymat) → yangi qiymat; undefined qaytarsa, hech narsa yozilmaydi. Natija: { value, written }.
  st.update = async (key, fn, { retries = 8 } = {}) => {
    for (let i = 0; i < retries; i++) {
      const { value, etag } = await st.getWithEtag(key);
      const next = await fn(value === null ? null : structuredClone(value));
      if (next === undefined) return { value, written: false };
      if (await st.setIf(key, next, value === null ? null : etag)) return { value: next, written: true };
      await new Promise((r) => setTimeout(r, 5 + Math.random() * 25 * (i + 1)));
    }
    throw new StoreConflict("Bir vaqtda juda ko'p o'zgartish — qayta urinib ko'ring.");
  };
  return st;
}

export async function openStore(name) {
  if (process.env.HK_DEV_MEMORY_STORE === "1") return withUpdate(memoryStore(name));
  let blobs;
  try {
    blobs = await import("@netlify/blobs");
  } catch {
    throw new StoreUnavailable("Netlify Blobs ulanmagan");
  }
  return withUpdate(blobsStore(blobs, name));
}

export function resetMemoryStore() { memory.clear(); }

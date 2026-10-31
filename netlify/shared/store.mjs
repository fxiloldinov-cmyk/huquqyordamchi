// Kalit-qiymat ombori. Netlify'da — Netlify Blobs (sayt bilan birga keladi, alohida xizmat kerak emas).
// Lokal ishga tushirish va testlarda — xotiradagi ombor (HK_DEV_MEMORY_STORE=1). Production'da xotiradagi
// omborga hech qachon o'tilmaydi: Blobs ulanmasa, so'rov 503 bilan rad etiladi.
const memory = new Map();

function memoryStore(name) {
  const m = memory.get(name) || new Map();
  memory.set(name, m);
  return {
    async get(key) { return m.has(key) ? structuredClone(m.get(key)) : null; },
    async set(key, value) { m.set(key, structuredClone(value)); },
    async delete(key) { m.delete(key); },
  };
}

export class StoreUnavailable extends Error {}

export async function openStore(name) {
  if (process.env.HK_DEV_MEMORY_STORE === "1") return memoryStore(name);
  let blobs;
  try {
    blobs = await import("@netlify/blobs");
  } catch {
    throw new StoreUnavailable("Netlify Blobs ulanmagan");
  }
  const s = blobs.getStore({ name, consistency: "strong" });
  return {
    async get(key) { return (await s.get(key, { type: "json" })) ?? null; },
    async set(key, value) { await s.setJSON(key, value); },
    async delete(key) { await s.delete(key); },
  };
}

export function resetMemoryStore() { memory.clear(); }

// Umumiy (bir nechta server nusxasida ishlaydigan) so'rov limiti va AI sarf chegarasi.
// common.mjs dagi xotiradagi limit — tezkor birinchi qatlam (bitta nusxa ichida). Bu yerdagi hisoblagichlar
// Netlify Blobs'da atomar (compare-and-swap) oshiriladi, shuning uchun funksiya nusxalari ko'paysa ham chegara umumiy.
//
// Muhit o'zgaruvchilari (hammasi ixtiyoriy):
//   HK_AI_DISABLED=1          — barcha AI so'rovlarini favqulodda o'chirish
//   HK_AI_DAILY_LIMIT=600     — butun sayt bo'yicha bir kunlik AI so'rovlari (kazus davomi ham hisoblanadi)
//   HK_AI_IP_HOURLY=40        — bitta IP uchun soatlik AI so'rovlari
//   HK_AI_USER_DAILY=150      — bitta hisob uchun kunlik AI so'rovlari
import { openStore, StoreUnavailable } from "./store.mjs";
import { jsonError, clientIp } from "./common.mjs";
import { currentUser, sha256 } from "./auth.mjs";

const num = (v, d) => (Number.isFinite(+v) && +v > 0 ? Math.floor(+v) : d);
export const aiLimits = () => ({
  disabled: process.env.HK_AI_DISABLED === "1",
  daily: num(process.env.HK_AI_DAILY_LIMIT, 600),
  ipHourly: num(process.env.HK_AI_IP_HOURLY, 40),
  userDaily: num(process.env.HK_AI_USER_DAILY, 150),
});

// Hisoblagichni atomar oshiradi; limitdan oshsa oshirmaydi. { allowed, count }
export async function hit(bucket, limit, windowMs, now = Date.now()) {
  const win = Math.floor(now / windowMs);
  const store = await openStore("ratelimit");
  let allowed = false, count = 0;
  await store.update(`${bucket}:${win}`, (cur) => {
    count = cur?.n || 0;
    if (count >= limit) { allowed = false; return undefined; }
    allowed = true; count += 1;
    return { n: count, exp: (win + 1) * windowMs };
  });
  return { allowed, count };
}

// AI so'rovidan oldin: favqulodda o'chirish, IP, foydalanuvchi va kunlik umumiy chegara.
// Ombor ishlamasa, xotiradagi limit (guardJsonPost) himoyasi qoladi va so'rov o'tkaziladi — xato logga yoziladi.
export async function guardAi(req, ctx, scope) {
  const L = aiLimits();
  if (L.disabled) return jsonError("AI xizmati administrator tomonidan vaqtincha o‘chirilgan. Katalog, yo‘riqnomalar va hujjat namunalari ishlaydi.", 503);
  try {
    const ip = sha256("ip:" + clientIp(req, ctx)).slice(0, 24); // IP ochiq holda saqlanmaydi
    const ipHit = await hit(`ai-ip:${ip}`, L.ipHourly, 3600000);
    if (!ipHit.allowed) return jsonError("Bu tarmoqdan AI so‘rovlari soatlik chegarasi tugadi. Birozdan keyin urinib ko‘ring.", 429);
    let cur = null;
    try { cur = await currentUser(req); } catch {}
    if (cur) {
      const u = await hit(`ai-user:${cur.user.id}`, L.userDaily, 86400000);
      if (!u.allowed) return jsonError("Hisobingiz uchun bugungi AI so‘rovlari chegarasi tugadi. Ertaga qayta urinib ko‘ring.", 429);
    }
    const day = await hit("ai-day", L.daily, 86400000);
    if (!day.allowed) return jsonError("Saytning bugungi AI sarf chegarasi tugadi. Katalog va yo‘riqnomalardan foydalanishingiz mumkin; AI ertaga qayta ishlaydi.", 429);
    return null;
  } catch (e) {
    if (!(e instanceof StoreUnavailable)) console.error("limits:", e?.name || "error", "scope", scope);
    return null;
  }
}

// Foydalanuvchi hisoblari: parol xeshi (scrypt), sessiya (HttpOnly cookie), joriy foydalanuvchini aniqlash.
// Parol hech qachon ochiq holda saqlanmaydi, logga yozilmaydi va javobda qaytarilmaydi.
import { scrypt as _scrypt, randomBytes, timingSafeEqual, createHash } from "node:crypto";
import { promisify } from "node:util";
import { openStore } from "./store.mjs";

const scrypt = promisify(_scrypt);
const N = 16384, R = 8, P = 1, KEYLEN = 64;
export const SESSION_COOKIE = "hk_session";
export const SESSION_DAYS = 30;
const MAX_FAILS = 8, LOCK_MINUTES = 15;

export const sha256 = (s) => createHash("sha256").update(String(s)).digest("hex");
export const normEmail = (e) => String(e || "").trim().toLowerCase();
export const validEmail = (e) => e.length <= 120 && /^[^\s@<>()"',;:]+@[^\s@<>()"',;:]+\.[a-z]{2,}$/i.test(e);
export function passwordProblem(p) {
  if (typeof p !== "string" || p.length < 8) return "Parol kamida sakkiz belgidan iborat bo‘lsin.";
  if (p.length > 200) return "Parol juda uzun.";
  if (!/[A-Za-zА-Яа-яЁёЎўҚқҒғҲҳ]/.test(p) || !/\d/.test(p)) return "Parolda harf va raqam bo‘lsin.";
  return "";
}

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const key = await scrypt(password.normalize("NFKC"), salt, KEYLEN, { N, r: R, p: P, maxmem: 64 * 1024 * 1024 });
  return `scrypt$${N}$${R}$${P}$${salt.toString("base64")}$${key.toString("base64")}`;
}
export async function verifyPassword(password, stored) {
  const [alg, n, r, p, salt, hash] = String(stored || "").split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const expected = Buffer.from(hash, "base64");
  const key = await scrypt(String(password).normalize("NFKC"), Buffer.from(salt, "base64"), expected.length, { N: +n, r: +r, p: +p, maxmem: 64 * 1024 * 1024 });
  return expected.length === key.length && timingSafeEqual(expected, key);
}

export const userKey = (email) => "u_" + sha256(normEmail(email));
export const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name || "", createdAt: u.createdAt, emailVerified: Boolean(u.emailVerified) });

export async function findUser(email) { return (await openStore("users")).get(userKey(email)); }
export async function saveUser(u) { await (await openStore("users")).set(userKey(u.email), u); }
// Yangi hisob: kalit band bo'lsa (parallel ro'yxatdan o'tish) false qaytaradi — ustiga yozilmaydi.
export async function createUser(u) { return (await openStore("users")).setIf(userKey(u.email), u, null); }
// Foydalanuvchini atomar o'zgartirish (parallel kirish/parol almashtirishda yozuvlar bir-birini o'chirmaydi).
// fn(user) obyektni o'zgartiradi; false qaytarsa yozilmaydi. Natija — yangilangan user yoki null.
export async function updateUser(email, fn) {
  const r = await (await openStore("users")).update(userKey(email), (u) => {
    if (!u) return undefined;
    return fn(u) === false ? undefined : u;
  });
  return r.written ? r.value : r.value || null;
}

export function isLocked(u, now = Date.now()) { return u.lockUntil && u.lockUntil > now; }
export async function registerFailure(u) {
  await updateUser(u.email, (x) => {
    x.fails = (x.fails || 0) + 1;
    if (x.fails >= MAX_FAILS) { x.lockUntil = Date.now() + LOCK_MINUTES * 60000; x.fails = 0; }
  });
}
export async function clearFailures(u) {
  if (u.fails || u.lockUntil) await updateUser(u.email, (x) => { if (!x.fails && !x.lockUntil) return false; x.fails = 0; x.lockUntil = 0; });
}

// ---- Bir martalik tokenlar (email tasdiqlash, parolni tiklash) ----
// Foydalanuvchiga faqat tasodifiy token boradi; omborda uning SHA-256 xeshi, turi, egasi va muddati saqlanadi.
// consumeToken atomar: bir token faqat bir marta ishlaydi.
export const TOKEN_TTL = { verify: 24 * 3600000, reset: 3600000 };
export async function issueToken(type, user) {
  const token = randomBytes(32).toString("base64url");
  await (await openStore("tokens")).set("t_" + sha256(token), { type, uid: user.id, email: user.email, exp: Date.now() + TOKEN_TTL[type], used: false });
  return token;
}
export async function consumeToken(type, token) {
  if (typeof token !== "string" || token.length < 20 || token.length > 100) return null;
  let rec = null;
  await (await openStore("tokens")).update("t_" + sha256(token), (t) => {
    if (!t || t.used || t.type !== type || t.exp < Date.now()) return undefined;
    rec = t; return { ...t, used: true, usedAt: Date.now() };
  });
  return rec;
}

// ---- Sessiyalar: cookie'da tasodifiy token, omborda faqat uning xeshi ----
export async function createSession(user) {
  const token = randomBytes(32).toString("base64url");
  const exp = Date.now() + SESSION_DAYS * 86400000;
  await (await openStore("sessions")).set("s_" + sha256(token), { uid: user.id, email: user.email, exp });
  const add = (u) => { const set = new Set(u.sessions || []); set.add(sha256(token)); u.sessions = [...set].slice(-10); };
  add(user);
  await updateUser(user.email, add);
  return token;
}
export async function destroySession(token) {
  if (token) await (await openStore("sessions")).delete("s_" + sha256(token));
}
// Barcha sessiyalarni bekor qiladi (parol almashtirilganda/tiklanganda, hisob o'chirilganda).
export async function destroyAllSessions(user) {
  const s = await openStore("sessions");
  const fresh = (await findUser(user.email)) || user;
  for (const h of new Set([...(user.sessions || []), ...(fresh.sessions || [])])) await s.delete("s_" + h);
  user.sessions = [];
  await updateUser(user.email, (u) => { u.sessions = []; });
}

export function readCookie(req, name = SESSION_COOKIE) {
  const raw = req.headers.get("cookie") || "";
  for (const part of raw.split(/;\s*/)) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i) === name) return decodeURIComponent(part.slice(i + 1));
  }
  return "";
}
export function sessionCookie(req, token, maxAgeSec = SESSION_DAYS * 86400) {
  const secure = new URL(req.url).protocol === "https:" ? "; Secure" : "";
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSec}${secure}`;
}
export const clearCookie = (req) => sessionCookie(req, "", 0);

export async function currentUser(req) {
  const token = readCookie(req);
  if (!token || token.length > 100) return null;
  const sess = await (await openStore("sessions")).get("s_" + sha256(token));
  if (!sess || sess.exp < Date.now()) return null;
  const user = await findUser(sess.email);
  if (!user || user.id !== sess.uid || !(user.sessions || []).includes(sha256(token))) return null;
  return { user, token };
}

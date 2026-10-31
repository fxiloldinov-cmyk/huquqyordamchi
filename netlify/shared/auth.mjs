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
export const publicUser = (u) => ({ id: u.id, email: u.email, name: u.name || "", createdAt: u.createdAt });

export async function findUser(email) { return (await openStore("users")).get(userKey(email)); }
export async function saveUser(u) { await (await openStore("users")).set(userKey(u.email), u); }

export function isLocked(u, now = Date.now()) { return u.lockUntil && u.lockUntil > now; }
export async function registerFailure(u) {
  u.fails = (u.fails || 0) + 1;
  if (u.fails >= MAX_FAILS) { u.lockUntil = Date.now() + LOCK_MINUTES * 60000; u.fails = 0; }
  await saveUser(u);
}
export async function clearFailures(u) { if (u.fails || u.lockUntil) { u.fails = 0; u.lockUntil = 0; await saveUser(u); } }

// ---- Sessiyalar: cookie'da tasodifiy token, omborda faqat uning xeshi ----
export async function createSession(user) {
  const token = randomBytes(32).toString("base64url");
  const exp = Date.now() + SESSION_DAYS * 86400000;
  await (await openStore("sessions")).set("s_" + sha256(token), { uid: user.id, email: user.email, exp });
  const sessions = new Set(user.sessions || []);
  sessions.add(sha256(token));
  user.sessions = [...sessions].slice(-10);
  await saveUser(user);
  return token;
}
export async function destroySession(token) {
  if (token) await (await openStore("sessions")).delete("s_" + sha256(token));
}
export async function destroyAllSessions(user) {
  const s = await openStore("sessions");
  for (const h of user.sessions || []) await s.delete("s_" + h);
  user.sessions = [];
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

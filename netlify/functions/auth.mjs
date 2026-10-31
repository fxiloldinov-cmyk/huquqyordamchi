// Hisob API: ro'yxatdan o'tish, kirish, chiqish, joriy foydalanuvchi, parolni almashtirish, hisobni o'chirish.
import { randomUUID } from "node:crypto";
import oferta from "../../data/oferta.json" with { type: "json" };
import { guardJsonPost, jsonError, JSON_HEADERS } from "../shared/common.mjs";
import { StoreUnavailable, openStore } from "../shared/store.mjs";
import {
  sha256, normEmail, validEmail, passwordProblem, hashPassword, verifyPassword, findUser, saveUser, userKey,
  publicUser, isLocked, registerFailure, clearFailures, createSession, destroySession, destroyAllSessions,
  sessionCookie, clearCookie, currentUser, readCookie,
} from "../shared/auth.mjs";

export const config = {
  path: ["/api/auth/register", "/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/password", "/api/auth/delete"],
};

const reply = (data, status = 200, cookie) => {
  const headers = new Headers(JSON_HEADERS);
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
};
const BAD_LOGIN = "Email yoki parol noto‘g‘ri.";

export default async (req, ctx) => {
  const action = new URL(req.url).pathname.split("/").pop();
  try {
    if (action === "me") {
      if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
      const cur = await currentUser(req);
      return cur ? reply({ user: publicUser(cur.user) }) : reply({ user: null }, 200);
    }

    const limits = { register: [3, 10], login: [6, 30], logout: [10, 60], password: [5, 20], delete: [3, 10] }[action];
    if (!limits) return jsonError("Topilmadi.", 404);
    const { body, error } = await guardJsonPost(req, ctx, { scope: "auth-" + action, perMinute: limits[0], perHour: limits[1], maxBytes: 4000 });
    if (error) return error;

    if (action === "register") {
      const email = normEmail(body.email), name = String(body.name || "").trim().slice(0, 60);
      if (!validEmail(email)) return jsonError("Email manzilini to‘g‘ri kiriting.", 400);
      const problem = passwordProblem(body.password);
      if (problem) return jsonError(problem, 400);
      if (body.acceptOferta !== true) return jsonError("Ro‘yxatdan o‘tish uchun ommaviy oferta shartlarini qabul qiling.", 400);
      if (await findUser(email)) return jsonError("Bu email bilan hisob allaqachon mavjud. Kirish bo‘limidan foydalaning.", 409);
      const user = {
        id: randomUUID(), email, name, pass: await hashPassword(body.password), createdAt: new Date().toISOString(),
        oferta: { edition: oferta.edition, acceptedAt: new Date().toISOString() }, sessions: [],
      };
      await saveUser(user);
      const token = await createSession(user);
      return reply({ user: publicUser(user) }, 201, sessionCookie(req, token));
    }

    if (action === "login") {
      const email = normEmail(body.email);
      const user = validEmail(email) ? await findUser(email) : null;
      if (!user) { await verifyPassword(String(body.password || ""), "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$AAAA"); return jsonError(BAD_LOGIN, 401); }
      if (isLocked(user)) return jsonError("Juda ko‘p noto‘g‘ri urinish. Birozdan keyin qayta urinib ko‘ring.", 429);
      if (!(await verifyPassword(String(body.password || ""), user.pass))) { await registerFailure(user); return jsonError(BAD_LOGIN, 401); }
      await clearFailures(user);
      const token = await createSession(user);
      return reply({ user: publicUser(user) }, 200, sessionCookie(req, token));
    }

    if (action === "logout") {
      const cur = await currentUser(req);
      if (cur) {
        await destroySession(cur.token);
        const h = sha256(cur.token);
        cur.user.sessions = (cur.user.sessions || []).filter((x) => x !== h);
        await saveUser(cur.user);
      } else await destroySession(readCookie(req));
      return reply({ ok: true }, 200, clearCookie(req));
    }

    // Quyidagilar faqat tizimga kirgan foydalanuvchi uchun
    const cur = await currentUser(req);
    if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
    const user = cur.user;

    if (action === "password") {
      if (!(await verifyPassword(String(body.current || ""), user.pass))) { await registerFailure(user); return jsonError("Joriy parol noto‘g‘ri.", 401); }
      const problem = passwordProblem(body.next);
      if (problem) return jsonError(problem, 400);
      user.pass = await hashPassword(body.next);
      await destroyAllSessions(user);
      const token = await createSession(user);
      return reply({ ok: true }, 200, sessionCookie(req, token));
    }

    if (action === "delete") {
      if (!(await verifyPassword(String(body.password || ""), user.pass))) { await registerFailure(user); return jsonError("Parol noto‘g‘ri.", 401); }
      await destroyAllSessions(user);
      await (await openStore("items")).delete("i_" + user.id);
      await (await openStore("users")).delete(userKey(user.email));
      return reply({ ok: true }, 200, clearCookie(req));
    }
    return jsonError("Topilmadi.", 404);
  } catch (e) {
    if (e instanceof StoreUnavailable) return jsonError("Hisob xizmati hozircha ulanmagan. Keyinroq urinib ko‘ring.", 503);
    console.error("auth error", action, e?.message);
    return jsonError("Hisob xizmatida xatolik yuz berdi.", 500);
  }
};

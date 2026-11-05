// Hisob API: ro'yxatdan o'tish, kirish, chiqish, joriy foydalanuvchi, parolni almashtirish, hisobni o'chirish,
// emailni tasdiqlash va unutilgan parolni tiklash.
// Xavfsizlik: tokenlar bir martalik, muddati cheklangan, omborda faqat xeshi; parol tiklanganda barcha sessiyalar
// bekor qilinadi; "parolni tiklash" javobi email ro'yxatda bor-yo'qligini oshkor qilmaydi; email xizmati sozlanmagan
// bo'lsa "xat yuborildi" deyilmaydi.
import { randomUUID } from "node:crypto";
import oferta from "../../data/oferta.json" with { type: "json" };
import { guardJsonPost, jsonError, JSON_HEADERS } from "../shared/common.mjs";
import { StoreUnavailable, StoreConflict, openStore } from "../shared/store.mjs";
import { deleteAllCases } from "./cases.mjs";
import { mailConfigured, sendMail } from "../shared/mail.mjs";
import {
  sha256, normEmail, validEmail, passwordProblem, hashPassword, verifyPassword, findUser, userKey, createUser, updateUser,
  publicUser, isLocked, registerFailure, clearFailures, createSession, destroySession, destroyAllSessions,
  sessionCookie, clearCookie, currentUser, readCookie, issueToken, consumeToken,
} from "../shared/auth.mjs";

export const config = {
  path: ["/api/auth/register", "/api/auth/login", "/api/auth/logout", "/api/auth/me", "/api/auth/password", "/api/auth/delete",
    "/api/auth/verify-request", "/api/auth/verify-confirm", "/api/auth/reset-request", "/api/auth/reset-confirm"],
};

const reply = (data, status = 200, cookie) => {
  const headers = new Headers(JSON_HEADERS);
  if (cookie) headers.append("Set-Cookie", cookie);
  return new Response(JSON.stringify(data), { status, headers });
};
const BAD_LOGIN = "Email yoki parol noto‘g‘ri.";
const MAIL_OFF = "Email orqali xat yuborish xizmati hali sozlanmagan, shuning uchun xat yuborilmadi. Sayt administratoriga murojaat qiling.";
const RESET_GENERIC = "Agar bu email bilan hisob mavjud bo‘lsa, parolni tiklash havolasi yuborildi. Havola 1 soat amal qiladi.";
// Havola # bilan beriladi: token server loglariga va Referer sarlavhasiga tushmaydi.
const link = (req, kind, token) => `${process.env.URL || new URL(req.url).origin}/#${kind}=${token}`;

export default async (req, ctx) => {
  const action = new URL(req.url).pathname.split("/").pop();
  try {
    if (action === "me") {
      if (req.method !== "GET") return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
      const cur = await currentUser(req);
      return reply({ user: cur ? publicUser(cur.user) : null, mail: mailConfigured() });
    }

    const limits = {
      register: [3, 10], login: [6, 30], logout: [10, 60], password: [5, 20], delete: [3, 10],
      "verify-request": [2, 6], "verify-confirm": [10, 30], "reset-request": [3, 8], "reset-confirm": [6, 20],
    }[action];
    if (!limits) return jsonError("Topilmadi.", 404);
    const { body, error } = await guardJsonPost(req, ctx, { scope: "auth-" + action, perMinute: limits[0], perHour: limits[1], maxBytes: 4000 });
    if (error) return error;

    if (action === "register") {
      const email = normEmail(body.email), name = String(body.name || "").trim().slice(0, 60);
      if (!validEmail(email)) return jsonError("Email manzilini to‘g‘ri kiriting.", 400);
      const problem = passwordProblem(body.password);
      if (problem) return jsonError(problem, 400);
      if (body.acceptOferta !== true) return jsonError("Ro‘yxatdan o‘tish uchun ommaviy oferta shartlarini qabul qiling.", 400);
      const user = {
        id: randomUUID(), email, name, pass: await hashPassword(body.password), createdAt: new Date().toISOString(),
        oferta: { edition: oferta.edition, acceptedAt: new Date().toISOString() }, sessions: [], emailVerified: false,
      };
      // Atomar yaratish: bir xil email bilan parallel so'rovlardan faqat bittasi o'tadi.
      if (!(await createUser(user))) return jsonError("Bu email bilan hisob allaqachon mavjud. Kirish bo‘limidan foydalaning.", 409);
      const token = await createSession(user);
      let verification = "not_configured";
      if (mailConfigured()) {
        const t = await issueToken("verify", user);
        const r = await sendMail({ to: email, subject: "HuquqYordamchi: emailingizni tasdiqlang", text: `Emailingizni tasdiqlash uchun havola (24 soat amal qiladi):\n${link(req, "verify", t)}\n\nAgar siz ro‘yxatdan o‘tmagan bo‘lsangiz, bu xatga e’tibor bermang.` });
        verification = r.sent ? "sent" : "failed";
      }
      return reply({ user: publicUser(user), verification }, 201, sessionCookie(req, token));
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
        await updateUser(cur.user.email, (u) => { u.sessions = (u.sessions || []).filter((x) => x !== h); });
      } else await destroySession(readCookie(req));
      return reply({ ok: true }, 200, clearCookie(req));
    }

    if (action === "reset-request") {
      if (!mailConfigured()) return jsonError(MAIL_OFF, 503);
      const email = normEmail(body.email);
      const user = validEmail(email) ? await findUser(email) : null;
      if (user) {
        const t = await issueToken("reset", user);
        await sendMail({ to: user.email, subject: "HuquqYordamchi: parolni tiklash", text: `Yangi parol o‘rnatish uchun havola (1 soat amal qiladi, bir marta ishlaydi):\n${link(req, "reset", t)}\n\nAgar parolni tiklashni so‘ramagan bo‘lsangiz, bu xatga e’tibor bermang — parolingiz o‘zgarmaydi.` });
      }
      // Javob email mavjud yoki yo'qligidan qat'i nazar bir xil
      return reply({ ok: true, message: RESET_GENERIC });
    }

    if (action === "reset-confirm") {
      const problem = passwordProblem(body.password);
      if (problem) return jsonError(problem, 400);
      const rec = await consumeToken("reset", body.token);
      if (!rec) return jsonError("Havola yaroqsiz, ishlatilgan yoki muddati tugagan. Parolni tiklashni qaytadan so‘rang.", 400);
      const pass = await hashPassword(body.password);
      const user = await updateUser(rec.email, (u) => { if (u.id !== rec.uid) return false; u.pass = pass; u.fails = 0; u.lockUntil = 0; u.emailVerified = true; });
      if (!user || user.id !== rec.uid) return jsonError("Hisob topilmadi.", 400);
      await destroyAllSessions(user); // eski sessiyalar (o'g'irlangan bo'lishi mumkin) bekor qilinadi
      const token = await createSession(user);
      return reply({ ok: true, user: publicUser(user) }, 200, sessionCookie(req, token));
    }

    if (action === "verify-confirm") {
      const rec = await consumeToken("verify", body.token);
      if (!rec) return jsonError("Tasdiqlash havolasi yaroqsiz, ishlatilgan yoki muddati tugagan.", 400);
      const user = await updateUser(rec.email, (u) => { if (u.id !== rec.uid) return false; u.emailVerified = true; });
      if (!user || user.id !== rec.uid) return jsonError("Hisob topilmadi.", 400);
      return reply({ ok: true, user: publicUser(user) });
    }

    // Quyidagilar faqat tizimga kirgan foydalanuvchi uchun
    const cur = await currentUser(req);
    if (!cur) return jsonError("Avval hisobingizga kiring.", 401);
    const user = cur.user;

    if (action === "verify-request") {
      if (user.emailVerified) return reply({ ok: true, already: true });
      if (!mailConfigured()) return jsonError(MAIL_OFF, 503);
      const t = await issueToken("verify", user);
      const r = await sendMail({ to: user.email, subject: "HuquqYordamchi: emailingizni tasdiqlang", text: `Emailingizni tasdiqlash uchun havola (24 soat amal qiladi):\n${link(req, "verify", t)}` });
      if (!r.sent) return jsonError("Xatni yuborib bo‘lmadi. Keyinroq qayta urinib ko‘ring.", 502);
      return reply({ ok: true, message: "Tasdiqlash xati yuborildi. Pochtangizni (Spam papkasini ham) tekshiring." });
    }

    if (action === "password") {
      if (!(await verifyPassword(String(body.current || ""), user.pass))) { await registerFailure(user); return jsonError("Joriy parol noto‘g‘ri.", 401); }
      const problem = passwordProblem(body.next);
      if (problem) return jsonError(problem, 400);
      const pass = await hashPassword(body.next);
      await updateUser(user.email, (u) => { u.pass = pass; });
      await destroyAllSessions(user);
      const token = await createSession(user);
      return reply({ ok: true }, 200, sessionCookie(req, token));
    }

    if (action === "delete") {
      if (!(await verifyPassword(String(body.password || ""), user.pass))) { await registerFailure(user); return jsonError("Parol noto‘g‘ri.", 401); }
      await destroyAllSessions(user);
      await (await openStore("items")).delete("i_" + user.id);
      await (await openStore("books")).delete("b_" + user.id);
      await deleteAllCases(user.id);
      await (await openStore("kazus-usage")).delete("u_" + user.id);
      await (await openStore("users")).delete(userKey(user.email));
      return reply({ ok: true }, 200, clearCookie(req));
    }
    return jsonError("Topilmadi.", 404);
  } catch (e) {
    if (e instanceof StoreUnavailable) return jsonError("Hisob xizmati hozircha ulanmagan. Keyinroq urinib ko‘ring.", 503);
    if (e instanceof StoreConflict) return jsonError(e.message, 409);
    console.error("auth error", action, e?.name);
    return jsonError("Hisob xizmatida xatolik yuz berdi.", 500);
  }
};

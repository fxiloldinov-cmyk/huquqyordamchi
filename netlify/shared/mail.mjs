// Email yuborish. Hozircha Resend (https://resend.com) HTTP API orqali; sozlanmagan bo'lsa hech narsa
// yuborilmaydi va chaqiruvchi foydalanuvchiga "sozlanmagan" deb ochiq aytadi — "xat yuborildi" deb ko'rsatilmaydi.
//   RESEND_API_KEY — Resend kaliti (Netlify environment variables'da; repozitoriyga yozilmaydi)
//   HK_MAIL_FROM   — tasdiqlangan domendagi jo'natuvchi, masalan: "HuquqYordamchi <noreply@sizning-domen.uz>"
// Xat matni, token va email manzili logga yozilmaydi.
export const mailConfigured = () => Boolean((process.env.RESEND_API_KEY || "").trim() && (process.env.HK_MAIL_FROM || "").trim());

export async function sendMail({ to, subject, text }) {
  if (!mailConfigured()) return { sent: false, reason: "not_configured" };
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY.trim()}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.HK_MAIL_FROM.trim(), to: [to], subject, text }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) { console.error("mail: provider status", res.status); return { sent: false, reason: "provider_error" }; }
    return { sent: true };
  } catch (e) {
    console.error("mail:", e?.name || "error");
    return { sent: false, reason: "network" };
  }
}

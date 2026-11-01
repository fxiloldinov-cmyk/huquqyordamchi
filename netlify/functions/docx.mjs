// Word (.docx) bilan ishlash:
//   POST /api/docx/inspect  { file: base64, name }        → namunaning formati, bo'limlar tartibi, ogohlantirishlar
//   POST /api/docx/build    { text, title, template?, templateName? } → haqiqiy .docx (namuna formatida yoki standart)
// Fayl faqat xotirada qayta ishlanadi (diskka yozilmaydi), saqlanmaydi va logga yozilmaydi.
import { guardJsonPost, jsonError, jsonResponse } from "../shared/common.mjs";
import { inspectDocx, buildDocx, DocxError, MAX_DOCX_BYTES, DOCX_MIME } from "../shared/docx.mjs";

export const config = { path: ["/api/docx/inspect", "/api/docx/build"] };
const MAX_TEXT = 120000;

function decodeFile(b64, name) {
  if (typeof b64 !== "string" || !b64) throw new DocxError("Fayl yuborilmadi.");
  if (name != null && !/\.docx$/i.test(String(name))) {
    if (/\.doc$/i.test(String(name))) throw new DocxError("Eski .doc format qo‘llab-quvvatlanmaydi. Word’da .docx qilib saqlang.");
    throw new DocxError("Faqat .docx fayl qabul qilinadi.");
  }
  if (b64.length > Math.ceil((MAX_DOCX_BYTES * 4) / 3) + 8) throw new DocxError("Fayl 2 MB dan katta.");
  const buf = Buffer.from(b64.replace(/^data:[^,]*,/, ""), "base64");
  if (buf.length > MAX_DOCX_BYTES) throw new DocxError("Fayl 2 MB dan katta.");
  return buf;
}

export default async (req, ctx) => {
  const action = new URL(req.url).pathname.split("/").pop();
  const { body, error } = await guardJsonPost(req, ctx, { scope: "docx", perMinute: 15, perHour: 120, maxBytes: 3_000_000 });
  if (error) return error;
  try {
    if (action === "inspect") {
      return jsonResponse(inspectDocx(decodeFile(body.file, body.name)));
    }
    if (action === "build") {
      const text = typeof body.text === "string" ? body.text : "";
      if (text.trim().length < 20) return jsonError("Hujjat uchun matn yetarli emas.", 400);
      if (text.length > MAX_TEXT) return jsonError("Matn juda uzun.", 413);
      const title = String(body.title || "Kazus yechimi").slice(0, 120);
      const tpl = body.template ? decodeFile(body.template, body.templateName ?? "namuna.docx") : null;
      const { buffer, warnings } = buildDocx(tpl, text, { title });
      return new Response(buffer, { status: 200, headers: {
        "Content-Type": DOCX_MIME, "Content-Disposition": 'attachment; filename="kazus-yechim.docx"', "Cache-Control": "no-store",
        "X-Content-Type-Options": "nosniff", "X-HK-Warnings": encodeURIComponent(JSON.stringify(warnings.slice(0, 8))),
      } });
    }
    return jsonError("Topilmadi.", 404);
  } catch (e) {
    if (e instanceof DocxError) return jsonError(e.message, 400);
    console.error("docx:", e?.name || "error");
    return jsonError("Word faylini qayta ishlashda xatolik.", 500);
  }
};

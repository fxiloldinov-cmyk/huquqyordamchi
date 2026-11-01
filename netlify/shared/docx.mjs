// Word (.docx) namunasi: formatni o'qish va shu format bilan yangi hujjat yaratish.
// Format AI'ga emas, shu kodga topshiriladi: namunadagi sahifa (o'lcham, chegaralar), uslublar (styles.xml),
// raqamlash (numbering.xml) va paragraf/harf formatlari (w:pPr / w:rPr) aynan nusxalanadi; namunadagi MATN,
// shaxslar va xulosalar yangi hujjatga o'tmaydi (faqat yangi javob matni yoziladi).
// Hammasi xotirada bajariladi — vaqtinchalik fayl yaratilmaydi.
import { readZip, writeZip, ZipError } from "./zip.mjs";

export const MAX_DOCX_BYTES = 2 * 1024 * 1024;
export class DocxError extends Error {}
const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
export { DOCX_MIME };

const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c])).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "");
const attr = (xml, tag, name) => { const m = xml.match(new RegExp(`<w:${tag}\\b[^>]*\\bw:${name}="([^"]*)"`)); return m ? m[1] : null; };
const textOf = (pXml) => [...pXml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join("").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
const twipToMm = (v) => (v == null ? null : Math.round((+v / 1440) * 25.4 * 10) / 10);

export function openDocx(buf) {
  if (!Buffer.isBuffer(buf) || !buf.length) throw new DocxError("Fayl bo‘sh.");
  if (buf.length > MAX_DOCX_BYTES) throw new DocxError("Fayl 2 MB dan katta. Rasmlarsiz namunani yuboring.");
  if (buf.subarray(0, 4).toString("hex") === "d0cf11e0") throw new DocxError("Bu eski .doc formatidagi fayl. Word’da “Fayl → Saqlash → .docx” qilib qayta yuboring.");
  let files;
  try { files = readZip(buf); } catch (e) { throw new DocxError(e instanceof ZipError ? e.message : "Faylni o‘qib bo‘lmadi."); }
  const ct = files.get("[Content_Types].xml")?.toString("utf8") || "";
  if (!files.has("word/document.xml") || !ct.includes("wordprocessingml")) throw new DocxError("Bu Word (.docx) hujjat emas.");
  if (files.has("word/vbaProject.bin") || /macroEnabled/i.test(ct)) throw new DocxError("Makrosli hujjat (.docm) qabul qilinmaydi.");
  return files;
}

function paragraphs(docXml) {
  const body = docXml.slice(docXml.indexOf("<w:body"), docXml.lastIndexOf("</w:body>"));
  // Jadval va matn qutilari ichidagi paragraflar namuna sifatida olinmaydi
  const flat = body.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, "").replace(/<w:txbxContent>[\s\S]*?<\/w:txbxContent>/g, "");
  return [...flat.matchAll(/<w:p\b[^>]*?(?:\/>|>([\s\S]*?)<\/w:p>)/g)].map((m) => {
    const inner = m[1] || "";
    const pPr = (inner.match(/<w:pPr>[\s\S]*?<\/w:pPr>/) || [""])[0];
    const rPr = ((inner.replace(/<w:pPr>[\s\S]*?<\/w:pPr>/, "").match(/<w:r\b[^>]*>\s*(<w:rPr>[\s\S]*?<\/w:rPr>)/) || [])[1]) || "";
    const runs = [...inner.matchAll(/<w:r\b[^>]*>([\s\S]*?)<\/w:r>/g)].filter((r) => /<w:t[\s>]/.test(r[1]));
    const allBold = runs.length > 0 && runs.every((r) => /<w:b(?:\s+w:val="(?:1|true|on)")?\s*\/>/.test(r[1]));
    return { pPr, rPr, text: textOf(inner).trim(), style: attr(pPr, "pStyle", "val"), list: /<w:numPr>/.test(pPr), numId: attr(pPr, "numId", "val"), ilvl: attr(pPr, "ilvl", "val") || "0", allBold, jc: attr(pPr, "jc", "val") };
  });
}

function styleInfo(stylesXml = "") {
  const names = {}, levels = {}, byId = {};
  for (const m of stylesXml.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g)) {
    const name = (m[2].match(/<w:name w:val="([^"]+)"/) || [])[1] || m[1];
    names[m[1]] = name;
    byId[m[1]] = { xml: m[2], basedOn: (m[2].match(/<w:basedOn w:val="([^"]+)"/) || [])[1] || null };
    const h = name.match(/^heading\s*(\d)$/i) || m[1].match(/^(?:Heading|Sarlavha|Заголовок)(\d)$/i);
    if (h) levels[m[1]] = +h[1]; else if (/^title$/i.test(name)) levels[m[1]] = 1;
  }
  const defaults = (stylesXml.match(/<w:docDefaults>[\s\S]*?<\/w:docDefaults>/) || [""])[0];
  const normal = (stylesXml.match(/<w:style\b[^>]*w:styleId="Normal"[^>]*>[\s\S]*?<\/w:style>/) || [""])[0];
  // Xususiyatni samarali qiymati: to'g'ridan-to'g'ri format → uslub zanjiri (basedOn) → Normal → docDefaults
  const chain = (id) => { const out = []; const seen = new Set(); while (id && byId[id] && !seen.has(id)) { seen.add(id); out.push(byId[id].xml); id = byId[id].basedOn; } return out; };
  const resolve = (direct, styleId, get) => { for (const x of [direct, ...chain(styleId), normal, defaults]) { const v = x && get(x); if (v != null) return v; } return null; };
  return { names, levels, defaults, normal, resolve };
}

function numFmt(numberingXml = "", numId, ilvl = "0") {
  if (!numId) return null;
  const abs = (numberingXml.match(new RegExp(`<w:num w:numId="${numId}"[^>]*>[\\s\\S]*?<w:abstractNumId w:val="(\\d+)"`)) || [])[1];
  if (!abs) return null;
  const a = (numberingXml.match(new RegExp(`<w:abstractNum\\b[^>]*w:abstractNumId="${abs}"[^>]*>([\\s\\S]*?)<\\/w:abstractNum>`)) || [])[1] || "";
  const lvl = (a.match(new RegExp(`<w:lvl w:ilvl="${ilvl}"[^>]*>([\\s\\S]*?)<\\/w:lvl>`)) || [])[1] || "";
  return attr(lvl, "numFmt", "val");
}

const looksHeading = (p) => p.text.length > 0 && p.text.length <= 90 && !/[.,;:]$/.test(p.text) && (p.allBold || (p.jc === "center" && p.text === p.text.toUpperCase()));

// Namunani tahlil qiladi: formatlar, bo'limlar tartibi (faqat sarlavhalar), ogohlantirishlar.
export function analyzeTemplate(files) {
  const doc = files.get("word/document.xml").toString("utf8");
  const styles = styleInfo(files.get("word/styles.xml")?.toString("utf8"));
  const numbering = files.get("word/numbering.xml")?.toString("utf8") || "";
  const ps = paragraphs(doc).filter((p) => p.text);
  const levelOf = (p) => (p.style && styles.levels[p.style]) || (!p.list && looksHeading(p) ? 2 : 0);
  const headings = {}, sig = new Map(); let listProto = null;
  const outline = [];
  for (const p of ps) {
    const lv = levelOf(p);
    if (lv) { if (!headings[lv]) headings[lv] = p; if (outline.length < 25) outline.push({ level: lv, text: p.text.slice(0, 80) }); continue; }
    if (p.list) { if (!listProto) listProto = { ...p, fmt: numFmt(numbering, p.numId, p.ilvl) }; continue; }
    if (p.text.length < 40) continue;
    const key = p.pPr + "|" + p.rPr; const e = sig.get(key) || { p, n: 0 }; e.n++; sig.set(key, e);
  }
  const body = [...sig.values()].sort((a, b) => b.n - a.n)[0]?.p || ps.find((p) => !levelOf(p) && !p.list) || { pPr: "", rPr: "" };
  // Sahifa: oxirgi (asosiy) bo'lim sozlamalari
  const sects = [...doc.matchAll(/<w:sectPr\b[\s\S]*?<\/w:sectPr>/g)].map((m) => m[0]);
  const sectPr = sects.at(-1) || "";
  const warnings = [];
  if (/<w:tbl>/.test(doc)) warnings.push("Namunadagi jadvallar ko‘chirilmaydi: yangi javob oddiy matn sifatida yoziladi.");
  if (/<w:drawing\b|<w:pict\b/.test(doc)) warnings.push("Rasmlar va shakllar yangi hujjatga o‘tmaydi.");
  if (/<w:txbxContent\b/.test(doc)) warnings.push("Matn qutilari (text box) qo‘llab-quvvatlanmaydi.");
  if (/<w:footnoteReference/.test(doc)) warnings.push("Sahifa ostidagi izohlar (footnote) avtomatik yaratilmaydi; manbalar matn ichida beriladi.");
  if (/<w:(ins|del)\b/.test(doc)) warnings.push("Namunada tuzatishlar rejimi (track changes) bor — ular hisobga olinmadi.");
  if (sects.length > 1) warnings.push("Namunada bir nechta bo‘lim (section) bor — faqat oxirgi bo‘limning sahifa sozlamalari olinadi.");
  if (/TOC \\/.test(doc)) warnings.push("Mundarija avtomatik yangilanmaydi; Word’da “Mundarijani yangilash”ni bosing.");
  if (Number(attr(sectPr, "cols", "num") || 1) > 1) warnings.push("Ko‘p ustunli sahifa qo‘llab-quvvatlanmaydi.");
  if (!Object.keys(headings).length) warnings.push("Namunada sarlavha uslubi topilmadi — sarlavhalar asosiy matn formati va qalin shrift bilan yoziladi.");
  const hfText = [...files.entries()].filter(([n]) => /^word\/(header|footer)\d*\.xml$/.test(n)).some(([, b]) => /[A-Za-zА-Яа-яЎўҚқҒғҲҳ]{2}/.test(textOf(b.toString("utf8"))));
  if (hfText) warnings.push("Kolontitul (header/footer) matni ko‘chirilmaydi — unda namuna muallifining ma’lumoti bo‘lishi mumkin; sahifa raqami saqlanmasligi mumkin.");
  const rFonts = (x) => attr(x, "rFonts", "ascii") || attr(x, "rFonts", "hAnsi") || (attr(x, "rFonts", "asciiTheme") ? "mavzu shrifti" : null);
  const sz = (x) => attr(x, "sz", "val");
  const R = (get) => styles.resolve(body.pPr + body.rPr, body.style, get);
  const font = R(rFonts) || "aniqlanmadi";
  const size = R(sz);
  const line = R((x) => attr(x, "spacing", "line"));
  const lineRule = R((x) => attr(x, "spacing", "lineRule")) || "auto";
  const format = {
    font, sizePt: size ? +size / 2 : null,
    lineSpacing: line ? (lineRule === "auto" ? Math.round((+line / 240) * 100) / 100 : `${Math.round(+line / 20)} pt`) : 1,
    align: R((x) => attr(x, "jc", "val")) || "left",
    firstLineMm: twipToMm(R((x) => attr(x, "ind", "firstLine"))),
    page: { widthMm: twipToMm(attr(sectPr, "pgSz", "w")), heightMm: twipToMm(attr(sectPr, "pgSz", "h")) },
    marginsMm: { top: twipToMm(attr(sectPr, "pgMar", "top")), right: twipToMm(attr(sectPr, "pgMar", "right")), bottom: twipToMm(attr(sectPr, "pgMar", "bottom")), left: twipToMm(attr(sectPr, "pgMar", "left")) },
    headingLevels: Object.keys(headings).map(Number).sort(), numberedList: Boolean(listProto),
  };
  return { format, outline, warnings, proto: { body, headings, list: listProto, sectPr, hfText } };
}

export function inspectDocx(buf) {
  const files = openDocx(buf);
  const { format, outline, warnings } = analyzeTemplate(files);
  return { format, outline, warnings };
}

// ---- Markdown → WordprocessingML ----
function runs(text, rPr) {
  const out = [];
  const clean = text.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "$1 ($2)").replace(/`([^`]+)`/g, "$1");
  for (const m of clean.matchAll(/\*\*([^*]+)\*\*|\*([^*\s][^*]*)\*|([^*]+|\*)/g)) {
    const [txt, b, i] = [m[1] ?? m[2] ?? m[3], m[1] != null, m[2] != null];
    if (!txt) continue;
    let pr = rPr || "";
    const extra = (b ? "<w:b/><w:bCs/>" : "") + (i ? "<w:i/><w:iCs/>" : "");
    if (extra) pr = pr ? pr.replace(/<w:rPr>/, "<w:rPr>" + extra).replace(/<w:b\s+w:val="(?:0|false)"\s*\/>/, "") : `<w:rPr>${extra}</w:rPr>`;
    out.push(`<w:r>${pr}<w:t xml:space="preserve">${xmlEsc(txt)}</w:t></w:r>`);
  }
  return out.join("");
}
const stripNum = (pPr) => pPr.replace(/<w:numPr>[\s\S]*?<\/w:numPr>/, "");
const boldRPr = (rPr) => (rPr ? (/<w:b\s*\/>/.test(rPr) ? rPr : rPr.replace("<w:rPr>", "<w:rPr><w:b/><w:bCs/>")) : "<w:rPr><w:b/><w:bCs/></w:rPr>");

export function markdownToBody(md, proto) {
  const out = [];
  const para = (pPr, rPr, text) => out.push(`<w:p>${pPr}${runs(text, rPr)}</w:p>`);
  const body = { pPr: stripNum(proto.body.pPr || ""), rPr: proto.body.rPr || "" };
  const heading = (lv) => proto.headings[lv] || proto.headings[lv - 1] || proto.headings[lv + 1] || null;
  for (let line of String(md).replace(/\r\n/g, "\n").split("\n")) {
    line = line.replace(/⁣HK:[^⁣]*⁣?/g, "").trimEnd();
    if (!line.trim() || /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) continue;
    const h = line.match(/^(#{1,4})\s+(.*)$/);
    if (h) {
      const lv = Math.min(h[1].length, 3), hp = heading(lv), t = h[2].replace(/\*\*/g, "");
      if (hp) para(stripNum(hp.pPr), hp.rPr, t); else para(body.pPr, boldRPr(body.rPr), t);
      continue;
    }
    if (/^\s*\|.*\|\s*$/.test(line)) { if (/^\s*\|[\s:|-]+\|\s*$/.test(line)) continue; line = line.trim().slice(1, -1).split("|").map((c) => c.trim()).join(" — "); }
    const li = line.match(/^\s*(?:([-*+•])|(\d+)[.)])\s+(.*)$/);
    if (li) {
      const lp = proto.list, numbered = Boolean(li[2]);
      const fmtOk = lp && (numbered ? lp.fmt && lp.fmt !== "bullet" : lp.fmt === "bullet");
      if (fmtOk) para(lp.pPr, lp.rPr, li[3]); else para(body.pPr, body.rPr, (numbered ? `${li[2]}) ` : "– ") + li[3]);
      continue;
    }
    para(body.pPr, body.rPr, line.replace(/^>\s?/, ""));
  }
  return out.join("");
}

const CORE = (title) => `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:dcterms="http://purl.org/dc/terms/" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"><dc:title>${xmlEsc(title)}</dc:title><dc:creator>HuquqYordamchi</dc:creator><dcterms:created xsi:type="dcterms:W3CDTF">${new Date().toISOString().replace(/\.\d+Z$/, "Z")}</dcterms:created></cp:coreProperties>`;
const APP = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>HuquqYordamchi</Application></Properties>`;

// Namuna (yoki standart shablon) formatida yangi .docx yaratadi.
export function buildDocx(templateBuf, markdown, { title = "Kazus yechimi" } = {}) {
  const files = openDocx(templateBuf || defaultTemplate());
  const { proto, warnings } = analyzeTemplate(files);
  const doc = files.get("word/document.xml").toString("utf8");
  const head = doc.slice(0, doc.indexOf(">", doc.indexOf("<w:body")) + 1);
  let sectPr = proto.sectPr;
  // Matnli kolontitullar (namuna muallifi ma'lumoti bo'lishi mumkin) ulanmaydi
  if (proto.hfText) sectPr = sectPr.replace(/<w:(header|footer)Reference\b[^>]*\/>/g, "");
  const out = new Map(files);
  out.set("word/document.xml", Buffer.from(`${head}${markdownToBody(markdown, proto)}${sectPr}</w:body></w:document>`, "utf8"));
  // Namuna muallifi/kompaniyasi haqidagi xususiyatlar yangilanadi; izohlar va maxsus xususiyatlar matni tozalanadi
  if (out.has("docProps/core.xml")) out.set("docProps/core.xml", Buffer.from(CORE(title)));
  if (out.has("docProps/app.xml")) out.set("docProps/app.xml", Buffer.from(APP));
  if (out.has("word/comments.xml")) out.set("word/comments.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:comments xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>`));
  if (out.has("docProps/custom.xml")) out.set("docProps/custom.xml", Buffer.from(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/custom-properties" xmlns:vt="http://schemas.openxmlformats.org/officeDocument/2006/docPropsVTypes"/>`));
  return { buffer: writeZip(out), warnings };
}

// ---- Standart shablon: Times New Roman 14, 1,5 interval, kenglik bo'yicha, xatboshi 1,25 sm; A4, chap 30, o'ng 15, yuqori/past 20 mm ----
let cachedDefault = null;
export function defaultTemplate() {
  if (cachedDefault) return cachedDefault;
  const W = 'xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"';
  const files = new Map([
    ["[Content_Types].xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>`],
    ["_rels/.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/extended-properties" Target="docProps/app.xml"/></Relationships>`],
    ["word/_rels/document.xml.rels", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ["word/styles.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles ${W}><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman" w:eastAsia="Times New Roman"/><w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="uz-Latn-UZ"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="0" w:line="360" w:lineRule="auto"/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:pPr><w:jc w:val="both"/><w:ind w:firstLine="709"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="120"/><w:jc w:val="center"/><w:ind w:firstLine="0"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:bCs/><w:caps/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="60"/><w:ind w:firstLine="709"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:bCs/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:basedOn w:val="Normal"/><w:next w:val="Normal"/><w:pPr><w:keepNext/><w:outlineLvl w:val="2"/></w:pPr><w:rPr><w:b/><w:i/></w:rPr></w:style></w:styles>`],
    ["word/document.xml", `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document ${W}><w:body><w:p><w:pPr><w:pStyle w:val="Heading1"/></w:pPr><w:r><w:t>Sarlavha</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading2"/></w:pPr><w:r><w:t>Bo‘lim</w:t></w:r></w:p><w:p><w:pPr><w:pStyle w:val="Heading3"/></w:pPr><w:r><w:t>Kichik bo‘lim</w:t></w:r></w:p><w:p><w:r><w:t>Asosiy matn shu formatda yoziladi: Times New Roman, 14 pt, bir yarim interval, kenglik bo‘yicha tekislash.</w:t></w:r></w:p><w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="851" w:bottom="1134" w:left="1701" w:header="709" w:footer="709" w:gutter="0"/></w:sectPr></w:body></w:document>`],
    ["docProps/core.xml", CORE("HuquqYordamchi")],
    ["docProps/app.xml", APP],
  ]);
  cachedDefault = writeZip(files);
  return cachedDefault;
}

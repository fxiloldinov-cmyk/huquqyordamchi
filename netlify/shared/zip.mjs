// Minimal, xavfsiz ZIP o'quvchi/yozuvchi (DOCX uchun). Tashqi kutubxona kerak emas — node:zlib.
// Himoya: fayl soni, har bir fayl va umumiy ochilgan hajm chegarasi (zip-bomba), shifrlangan va ZIP64 arxiv,
// "../" yoki absolyut yo'lli nomlar rad etiladi; ochishda maxOutputLength bilan cheklanadi; CRC tekshiriladi.
import zlib from "node:zlib";

export class ZipError extends Error {}

const TABLE = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
export const crc32 = typeof zlib.crc32 === "function" ? (b) => zlib.crc32(b) >>> 0 : (b) => { let c = 0xffffffff; for (const x of b) c = TABLE[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };

export function readZip(buf, { maxEntries = 400, maxEntryBytes = 12 * 1024 * 1024, maxTotalBytes = 30 * 1024 * 1024 } = {}) {
  if (!Buffer.isBuffer(buf) || buf.length < 22) throw new ZipError("Fayl ZIP/DOCX emas.");
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new ZipError("Fayl buzilgan yoki DOCX emas.");
  const count = buf.readUInt16LE(eocd + 10), cdSize = buf.readUInt32LE(eocd + 12), cdOff = buf.readUInt32LE(eocd + 16);
  if (count === 0xffff || cdOff === 0xffffffff) throw new ZipError("ZIP64 arxivlar qo‘llab-quvvatlanmaydi.");
  if (count > maxEntries) throw new ZipError("Fayl ichida juda ko‘p qism bor.");
  if (cdOff + cdSize > buf.length) throw new ZipError("Fayl buzilgan.");
  const out = new Map(); let total = 0, p = cdOff;
  for (let i = 0; i < count; i++) {
    if (p + 46 > buf.length || buf.readUInt32LE(p) !== 0x02014b50) throw new ZipError("Fayl buzilgan.");
    const flags = buf.readUInt16LE(p + 8), method = buf.readUInt16LE(p + 10), crc = buf.readUInt32LE(p + 16);
    const csize = buf.readUInt32LE(p + 20), usize = buf.readUInt32LE(p + 24);
    const nl = buf.readUInt16LE(p + 28), el = buf.readUInt16LE(p + 30), cl = buf.readUInt16LE(p + 32), lo = buf.readUInt32LE(p + 42);
    const name = buf.subarray(p + 46, p + 46 + nl).toString("utf8");
    p += 46 + nl + el + cl;
    if (flags & 1) throw new ZipError("Parol bilan himoyalangan fayl qo‘llab-quvvatlanmaydi.");
    if (/(^|\/)\.\.(\/|$)|^\/|\\|\0/.test(name)) throw new ZipError("Fayl ichida xavfli nom bor.");
    if (name.endsWith("/")) continue;
    if (usize > maxEntryBytes || (total += usize) > maxTotalBytes) throw new ZipError("Fayl ochilganda juda katta (ehtimoliy zip-bomba).");
    if (lo + 30 > buf.length || buf.readUInt32LE(lo) !== 0x04034b50) throw new ZipError("Fayl buzilgan.");
    const start = lo + 30 + buf.readUInt16LE(lo + 26) + buf.readUInt16LE(lo + 28);
    const raw = buf.subarray(start, start + csize);
    let data;
    if (method === 0) data = Buffer.from(raw);
    else if (method === 8) { try { data = zlib.inflateRawSync(raw, { maxOutputLength: usize + 1 }); } catch { throw new ZipError("Fayl qismini ochib bo‘lmadi."); } }
    else throw new ZipError("Qo‘llab-quvvatlanmaydigan siqish usuli.");
    if (data.length !== usize || crc32(data) !== crc) throw new ZipError("Fayl buzilgan (nazorat summasi mos emas).");
    out.set(name, data);
  }
  return out;
}

// entries: Map yoki [[name, Buffer|string]]; [Content_Types].xml birinchi yoziladi (Word talabi emas, lekin odatiy).
export function writeZip(entries) {
  const list = [...(entries instanceof Map ? entries : new Map(entries))].sort(([a], [b]) => (a === "[Content_Types].xml" ? -1 : b === "[Content_Types].xml" ? 1 : 0));
  const locals = [], centrals = []; let off = 0;
  for (const [name, val] of list) {
    const data = Buffer.isBuffer(val) ? val : Buffer.from(String(val), "utf8");
    const comp = zlib.deflateRawSync(data, { level: 6 }), nameB = Buffer.from(name, "utf8"), crc = crc32(data);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x0800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt16LE(0, 10); lh.writeUInt16LE(0x5a21, 12); lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(data.length, 22); lh.writeUInt16LE(nameB.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x0800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt16LE(0, 12); ch.writeUInt16LE(0x5a21, 14); ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(data.length, 24); ch.writeUInt16LE(nameB.length, 28); ch.writeUInt32LE(off, 42);
    locals.push(lh, nameB, comp); centrals.push(ch, nameB); off += 30 + nameB.length + comp.length;
  }
  const cd = Buffer.concat(centrals), e = Buffer.alloc(22);
  e.writeUInt32LE(0x06054b50, 0); e.writeUInt16LE(list.length, 8); e.writeUInt16LE(list.length, 10); e.writeUInt32LE(cd.length, 12); e.writeUInt32LE(off, 16);
  return Buffer.concat([...locals, cd, e]);
}

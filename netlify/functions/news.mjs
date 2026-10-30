// Qonunchilikdagi yangiliklar: lex.uz rasmiy RSS lentasini o'qib, JSON ko'rinishida qaytaradi.
//   GET /api/news  -> { source, updated, items: [{ title, url, organ, reg, adopted, effective }] }
// Javob Netlify CDN'da 6 soat keshlanadi (keyingi 24 soat davomida eski nusxa berilib, fonda yangilanadi),
// shuning uchun lex.uz ga kuniga bir necha marta so'rov yuboriladi, xolos.
// lex.uz javob bermasa, frontend /data/news.json dagi zaxira ro'yxatni ko'rsatadi.

export const config = { path: "/api/news" };

const RSS_URLS = ["https://lex.uz/rss", "https://lex.uz/uz/rss"];
const MAX_ITEMS = 150;

function decode(s) {
  return String(s || "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'").replace(/&amp;/g, "&")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  return m ? decode(m[1]) : "";
}

export function parseRss(xml) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/gi;
  let m;
  while ((m = re.exec(xml)) && items.length < MAX_ITEMS) {
    const block = m[1];
    const title = tag(block, "title").slice(0, 400);
    let link = tag(block, "link") || tag(block, "guid");
    if (link.startsWith("/")) link = "https://lex.uz" + link;
    if (!/^https:\/\/(www\.)?lex\.uz\//.test(link)) continue; // faqat lex.uz havolalari
    const desc = tag(block, "description");
    const dm = desc.match(/^(.*?)\s*(?:рег\.\s*№\s*([^.]*?)\.)?\s*Qabul qilingan sana\s*([\d.]+)\.?\s*Kuchga kirish sanasi\s*([\d.]+)/);
    items.push({
      title,
      url: link,
      organ: (dm ? dm[1] : desc).trim().slice(0, 300),
      reg: dm && dm[2] ? dm[2].trim().slice(0, 40) : null,
      adopted: dm ? dm[3].replace(/\.$/, "") : null,
      effective: dm ? dm[4].replace(/\.$/, "") : null,
    });
  }
  return items;
}

async function fetchWithTimeout(url, ms) {
  return fetch(url, {
    signal: AbortSignal.timeout(ms),
    headers: { "User-Agent": "HuquqYordamchi/10.0 (+RSS reader)", Accept: "application/rss+xml, application/xml, text/xml" },
  });
}

export default async (req) => {
  if (req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET" } });
  }

  for (const url of RSS_URLS) {
    try {
      const res = await fetchWithTimeout(url, 8000);
      if (!res.ok) continue;
      const items = parseRss(await res.text());
      if (!items.length) continue;
      return new Response(JSON.stringify({ source: url, updated: new Date().toISOString(), items }), {
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": "public, max-age=600",
          "Netlify-CDN-Cache-Control": "public, durable, s-maxage=21600, stale-while-revalidate=86400",
        },
      });
    } catch (e) {
      console.error("lex.uz RSS error:", url, e?.name || "unknown");
    }
  }

  return new Response(JSON.stringify({ error: "lex.uz lentasi vaqtincha mavjud emas." }), {
    status: 502,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
};

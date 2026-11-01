# HuquqYordamchi — project guide for Claude

## The business

**HuquqYordamchi** ("Legal Assistant") is an independent, free legal-information website for **Uzbekistan law**.
Live site: https://huquqyordamchiuz.netlify.app/ (Netlify). Current version: **v11.7** (`package.json`; live site may still run an older deploy). Latest change report: `docs/V11_7_HISOBOT_UZ.md`.

- **Tagline (hero):** "Huquqingizni biling. Yechimni toping." — *Know your rights. Find the solution.*
  Kicker: "Huquqiy ma'lumot. Amaliy yechim." Motto under the hero: "Har bir qaror — asos bilan" (Law • Explanation • Practical step).
- **Audiences:**
  1. Ordinary citizens with everyday problems (unpaid wages, alimony, divorce, fines, consumer returns, inheritance, rent, loans…).
  2. Law students and lawyers — the **Kazus ustaxonasi** (case-study workshop) analyses a fact pattern or checks a student's own answer.
- **Positioning:** informational/educational only — *not* legal advice, not a government site. Every answer must be grounded in official text (lex.uz) and say so honestly. Never invent articles, page numbers, or book quotes.
- **Monetisation:** free right now (see `data/oferta.json`). Paid services would require updating the public offer first.
- **Status:** the site is currently in a **test phase**; the oferta requisites intentionally remain placeholders until launch — don't fill them with invented data.
- **Open business TODOs:** fill real requisites (name, STIR/TIN, address, email, phone) in `data/oferta.json` → `requisites`; lawyer review of the oferta and of `eval/cases.json` expectations; email (Resend) not yet configured; TSUL library integration not connected; Telegram bot has no RAG yet; personal-data storage abroad (Netlify) needs legal check.

## Brand

- **Logo — "Hidoya" mark:** an arched portal/niche (off-white `#f5f7fa`) with a gold four-point star (`#c9a24b`) on a rounded navy square (`#123a66`). Source: `public/assets/favicon.svg`. Used in header, footer, hero caption, favicon and all static pages. Wordmark: **Huquq**Yordamchi.
- **Look:** blue-white portal style inspired by Lex.uz, calm and official. Light + dark themes.
- **Tokens** (`public/styles.css` `:root`): `--blue #153f70`, `--deep #102d50`, `--accent #2266ad`, `--bg #f5f7fa`, `--text #172b43`, `--muted #62768b`, `--line #dce5ee`, `--soft #edf3fa`, `--gold #b48c49`, `--radius 12px`. Font: "Segoe UI", Arial, sans-serif.
- **Hero image:** `public/assets/legal-hero.png` (AI-generated for this project).
- **Motion:** `public/motion.js` — all animation is disabled under `prefers-reduced-motion`.
- **Languages:** Uzbek Latin (primary), Uzbek Cyrillic (auto-transliterated), Russian, English (`public/i18n.js`, `?til=ru`). Guides and templates are Uzbek-only so far.
- **Copy language:** all user-facing text, docs and comments in this repo are in **Uzbek (Latin, with ‘ ’ apostrophes: o‘, g‘)**. Keep new UI text in that style; add i18n keys for ru/en/kirill.

## Product features (what's on the site)

| Section | What it does | Code |
|---|---|---|
| Aqlli qidiruv (smart search) | Situation or article lookup, Latin/Cyrillic, `JK 168`-style refs | `/api/search`, `public/app.js` |
| AI bilan suhbat (chat) | Gemini answer grounded in RAG excerpts + source check | `/api/chat` |
| Kundalik vaziyatlar | 32 everyday-situation guides in 5 groups; static SEO pages `/vaziyat/<slug>/` | `data/legal.json` → build |
| Ariza namunalari | 8 application/document templates, copy / TXT / print-PDF | `public/templates.js` |
| Kodekslar. Sodda tilda | Official code texts + "explain simply" | `public/explain.js` |
| Kazus ustaxonasi | Case analysis / student-answer check, Word (.docx) export using an uploaded style template | `/api/kazus`, `/api/docx/*` |
| Yangiliklar | Lex.uz RSS news (laws, decrees, resolutions, orders) with fallback | `/api/news`, `public/data/news.json` |
| Accounts | Register/login, email verify, password reset, saved items, uploaded book excerpts | `/api/auth/*`, `/api/account/*` |
| Ommaviy oferta, cookie consent | `/oferta/`, `public/consent.js` | |
| Ishlarim (unified workspace) | Cases with question, date, field, answers, structured sources, book excerpts, doc versions; left/center/right panes, mobile tabs | `#ish`, `public/workspace.js`, `/api/account/cases` |
| Two starts + student hint mode | "Huquqiy vaziyatim bor" / "Kazus ustida ishlayapman"; `task:"hint"` gives guidance, not a finished answer | home `.start-paths`, `/api/kazus` |
| Baza qamrovi | Coverage computed from data files at build | `#qamrov`, `public/coverage.json` |
| PWA | Manifest, icons, `sw.js` (static cache only, never `/api/*`), update prompt, bottom nav | `public/pwa.js`, `public/sw.js` |

## Architecture

- **Frontend:** plain static HTML/CSS/vanilla JS in `public/` — no framework, no bundler.
- **Backend:** Netlify Functions (Node 22, ESM `.mjs`) in `netlify/functions/`; routes declared via `export const config = { path: ... }` in each file (not in `netlify.toml`). Shared logic in `netlify/shared/`:
  - `rag.mjs` — retrieval (BM25, Uzbek suffix stripping, Cyrillic→Latin, topic routing, per-field focus in multi-field questions, colloquial synonyms, Russian glossary) and structured claim ↔ source checks (🔎 📄 ℹ️ ⚠️ ❌ 🚫 ❔ — lexical overlap is **never** a green confirmation). Answers end with a hidden `⁣HK:SRC:<json>⁣` marker for the sources panel. Topic regexes are global: always use `topicIn()` (resets `lastIndex`).
  - `court.mjs` — separate document kind for individual court decisions (empty; import via `scripts/import-court.mjs` only from permitted sources in `data/court/sources.json`).
  - `common.mjs` — Gemini calls, model fallback, streaming, CORS/origin checks, log redaction.
  - `limits.mjs` — AI quotas (IP hourly / user daily / site daily, `HK_AI_DISABLED` kill switch).
  - `store.mjs` — Netlify Blobs (in-memory locally/tests). Conditional writes must return `modified:boolean`, else `StoreNotAtomic`; AI limits then fail **closed** (503). `@netlify/blobs` pinned in `package-lock.json`.
  - `auth.mjs`, `mail.mjs` (Resend), `docx.mjs`, `zip.mjs`, `books.mjs`, `kazus-namunalar.mjs`.
- **AI provider:** Google **Gemini** (`GEMINI_API_KEY`, default `gemini-3.8-flash` with fallbacks). Keys live only in Netlify env vars — never in code, frontend, ZIPs or chat.
- **Law database:** `data/laws/*.json` — official lex.uz texts of 15 documents (Constitution `kon`, Labour `mk`, Family `ok`, Civil `fk1`/`fk2`, Civil Procedure `fpk`, Criminal `jk`, Criminal Procedure `jpk`, Admin Liability `mjtk`, Tax `sk`, Housing `ujk`, Economic Procedure `ipk`, Consumer Rights `ist`, Penal Enforcement `jik`, Administrative Court Procedure `msk`) + Supreme Court Plenum resolutions. `manifest.json` tracks edition dates and sha256.
- **Weekly law-update check:** `.github/workflows/law-update.yml` (Mondays 08:37 Tashkent) → opens a PR or issue.
- **Telegram bot:** `telegram_bot/` (Python, separate).

## Commands

```bash
npm run build      # data/legal.json -> public/legal-data.js, /vaziyat pages, sitemap, oferta
npm test           # node --test tests/*.test.mjs (regression + v115 + v116)
npm run dev        # local server on http://localhost:3000 (no extra deps)
node scripts/dev-mock.mjs --port 4174   # local preview with MOCK Gemini answers (no key needed)
npm run eval       # offline RAG eval over eval/cases.json (46 cases; never calls AI)
npm run law:update -- --file ok=<file.doc>   # import a new lex.uz edition (needs python + beautifulsoup4)
```

Windows note: this machine uses PowerShell; `server.ps1` exists as an alternative local server. Node.js, Git, GitHub CLI are installed portably in `%LOCALAPPDATA%\Programs` (on user PATH); Netlify CLI via npm global. In the agent sandbox, run Netlify CLI through a Terminal tab (`powershell -ExecutionPolicy Bypass -File …`) — the sandbox cannot see the Netlify login config.

## Deployment state (2026-11-01)

- GitHub repo: `fxiloldinov-cmyk/huquqyordamchi` (public), branch `main`; local folder is a git checkout of it.
- Netlify site `huquqyordamchiuz` lives in team "huquqchilar" (owner account farrukhbekfarruxfx@gmail.com). Builds from GitHub pushes are being **skipped** by Netlify; the connected account fxiloldinov@gmail.com cannot deploy it. Deploy needs that owner account (or an invite).
- v11.7 work is not committed/pushed yet; user asked to deliver a ZIP for review before any deploy.

## Rules when working here

- After editing `data/legal.json` or `data/oferta.json`, run `npm run build`; then `npm test`.
- Any article reference added to a guide must exist in `data/laws/*.json` — tests verify this.
- Don't hand-edit generated files: `public/legal-data.js`, `public/vaziyat/**`, `public/sitemap.xml`, `public/oferta/index.html`.
- Respect the honesty rules: no fabricated sources, show uncertainty, keep "not legal advice" disclaimers.
- Privacy: the site masks phone/email/passport/card/JSHSHIR in user input before sending to AI — don't weaken this.
- Deploy = push the whole folder to the repo; Netlify builds it. Uploading only `public/` breaks the API.
- Further docs: `README.md` (changelog per version), `SOZLASH_UZ.md` (env setup), `TECHNICAL_REVIEW_UZ.md` (known limitations), `TSUL_INTEGRATION_UZ.md`.

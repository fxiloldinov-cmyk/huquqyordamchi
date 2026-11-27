# HuquqYordamchi — dizayn tizimi

Yo‘nalish: **kino-kadrli, tahririy, sokin.** Bosh sahifa tepasida butun ekranli haqiqiy video (Toshkent), uning ustida katta ingichka sarlavha va qidiruv; pastda iliq oq fonli keng bo‘limlar va bitta siyoh rangli tasma. Sayt baribir matn va qidiruvdan iborat: foydalanuvchi muammo bilan keladi, unga tez javob va manba kerak.

Nimadan qochamiz (avvalgi versiyani "AI yasagan" qilib ko‘rsatgan narsalar): AI chizgan yoki xira stok rasm, serif + oltin kursiv sarlavha, karta ichida karta, mayda kulrang matn, bir xil kartalar qatori, emoji ikonalar, gradient fonlar.

Manba: legora.com bosh sahifasi ko‘rib chiqildi (2026-11-27): butun ekranli haqiqiy video, 400 og‘irlikdagi katta sarlavha, iliq oq fon, yorug‘/to‘q bo‘limlar almashinuvi, pill CTA. Ularning brendi, yashil rangi, matni va videolari ishlatilmaydi; ranglar o‘zimizning tamg‘a logosidan (egasining tanlovi).

## Hero

- Video: `public/assets/hero/hazrati-imom.mp4` (Hazrati Imom majmuasi, quyosh botishi; Pexels 17874608, Pexels litsenziyasi, 1920×1080, 2,3 MB). Poster: `hazrati-imom.jpg`.
- Video faqat kompyuterda (≥701px), "harakatni kamaytirish" va trafik tejash o‘chiq bo‘lsa yuklanadi va ko‘rinib turganda o‘ynaydi (`motion.js`). Telefonda faqat poster. SW keshiga kirmaydi.
- Ustida qorong‘i gradient (yuqori 60%, o‘rta 20%, past 88%) — oq matn har doim o‘qiladi.
- Bosh sahifa tepasida sarlavha (header) shaffof, oq matnli; aylantirilganda oddiy holatga qaytadi.

Kod: tokenlar `public/theme.css` da (oxirgi yuklanadi). Sahifalarda faqat token nomlari ishlatiladi.

## Logo — tamg‘a

Qadimiy turkiy tamg‘a uslubidagi belgi: muhr doirasi ichida **H** va uning ostidan chiqqan ikki oyoq. Turkiy tillarda "tamg‘a" so‘zining o‘zi "muhr" demakdir. Belgi qozi muhri va qadimiy huquq an’anasiga ishora qiladi, kayfiyati chuqur va tarixiy (egasining tanlovi, 2026-11-27).

| Qism | Rang | Izoh |
|---|---|---|
| Doira (muhr) | `#1d2b3a` | to‘q siyoh |
| Ichki halqa | `#b48c49` | eskirgan bronza; faqat 32 px dan katta o‘lchamda |
| H va oyoqlar | `#e8dcc0` | eski qog‘oz rangi, chiziq 3.8/64, uchlari yumaloq |

- Manba: `public/assets/favicon.svg` (kichik o‘lcham, halqasiz). Sahifalarda inline SVG `class="hidoya"` (halqa bilan). PNG ikonkalar: `scripts/make-icons.ps1`.
- Logo ranglari interfeysga ham o‘tdi (egasining tanlovi, 2026-11-27): siyoh — asosiy, bronza — urg‘u, qog‘oz — tungi rejimdagi asosiy rang.
- Yozuv: **Huquq**Yordamchi, tizim shrifti.

## Rang

Asosiy rang — tamg‘a siyohi. Bronza `--c-accent` faqat bezak (sarlavha ustidagi chiziq, faol chegara); matnda uning to‘q varianti `--c-link`.

| Token | Yorug‘ | Tungi | Vazifasi |
|---|---|---|---|
| `--c-bg` | `#fbfaf7` | `#111519` | Sahifa foni (iliq oq) |
| `--c-surface` | `#f3f1ec` | `#171c22` | Ikkinchi darajali yuzalar, footer |
| `--c-border` | `#e6e2d9` | `#29303a` | Chegaralar, ajratgichlar |
| `--c-border-strong` | `#cfc8ba` | `#3b4350` | Maydon chegaralari (input) |
| `--c-text` | `#1a1f26` | `#ece8df` | Asosiy matn, sarlavhalar |
| `--c-muted` | `#4d525a` | `#b3b0a8` | Ikkinchi darajali matn (7.5:1) |
| `--c-subtle` | `#666a71` | `#95928b` | Izohlar, faqat 14px+ (surface ustida 4.8:1) |
| `--c-primary` | `#1d2b3a` | `#e8dcc0` | Asosiy tugma foni, faol holat |
| `--c-primary-hover` | `#121c27` | `#f3ead6` | Asosiy tugma hover |
| `--c-on-primary` | `#ffffff` | `#111519` | Asosiy tugma ustidagi matn |
| `--c-link` | `#6e5220` | `#d6b77c` | Havolalar (to‘q bronza, 7:1) |
| `--c-primary-soft` | `#efe9dc` | `#262117` | Tanlangan chip, belgilangan qator foni |
| `--c-accent` | `#b48c49` | `#c9a465` | Bezak: chiziqlar, fokusdagi qidiruv chegarasi. Matnda emas |
| `--c-ink` / `--c-paper` | `#1d2b3a` / `#e8dcc0` | xuddi shu | Hero, yuqori qator, manba tasmasi foni / ular ustidagi urg‘u |
| `--c-success` | `#1a7f4b` | `#5fc58f` | Muvaffaqiyat |
| `--c-warning` | `#9a5b06` | `#e3a94c` | Ogohlantirish (manba ⚠️) |
| `--c-danger` | `#b42318` | `#f08a80` | Xato |
| `--c-focus` | `#9a7536` | `#d6b77c` | Fokus halqasi (3px, 4:1); siyoh fon ustida `--c-paper` |

Kontrast: matn ≥ 4.5:1, katta matn ≥ 3:1 (ikkala rejimda tekshirilgan qiymatlar).

## Tipografiya

Bitta oila: **tizim shrifti** — Windows’da Segoe UI, Apple’da SF Pro, Android’da Roboto.
Sabab: o‘zbek lotin (o‘ g‘) va kirill (ў қ ғ ҳ) harflari hamma joyda to‘g‘ri chiqadi, tashqi shrift yuklanmaydi (tezlik va maxfiylik), sayt foydalanuvchi qurilmasiga "o‘zinikidek" ko‘rinadi. Serif ishlatilmaydi.

`--font: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif`

| Token | O‘lcham / qator | Og‘irlik | Qayerda |
|---|---|---|---|
| `--t-display` | 60px / 1.05 (mobil 36px) | 400 | Faqat bosh sahifa sarlavhasi, oq, video ustida |
| `--t-h1` | 40px / 1.2 (mobil 30px) | 700 | Sahifa sarlavhasi |
| `--t-h2` | 36px / 1.15 (mobil 28px) | 450 | Bo‘lim sarlavhasi; ustida 32×2px bronza chiziq |
| `--t-h3` | 19px / 1.35 | 600 | Karta/blok sarlavhasi |
| `--t-body-lg` | 18px / 1.6 | 400 | Kirish matni, qidiruv maydoni |
| `--t-body` | 16px / 1.6 | 400 | Asosiy matn (minimal) |
| `--t-small` | 14px / 1.5 | 400/500 | Izoh, meta, chip |

Harf oralig‘i: sarlavhalarda −0.02em, matnda 0. Matn kengligi 60–75 belgi (`--w-read: 680px`). Katta harfli "eyebrow" yozuvlar ishlatilmaydi.

## Masofa

4 asosli shkala: `--s-1 4px · --s-2 8px · --s-3 12px · --s-4 16px · --s-5 24px · --s-6 32px · --s-7 48px · --s-8 80px · --s-9 120px` (mobilda s-8 56px, s-9 80px).
Bo‘limlar orasi `--s-8`. Kontent kengligi `--w-page: 1200px`, chet 24px (mobil 16px). Hero va manba tasmasi butun ekran kengligida.

## Shakl va chuqurlik

Radius: `--r-sm 6px` (tugma, input, chip), `--r-md 10px` (karta, blok), `--r-lg 14px` (katta qidiruv). `--r-pill` faqat sarlavhadagi asosiy tugmada.
Soya: faqat bittasi — `--shadow-1: 0 1px 2px rgb(16 24 40 / .06), 0 1px 3px rgb(16 24 40 / .04)` qidiruv maydoni va ochiladigan menyular uchun. Kartalar soyasiz, faqat chegara bilan. Blur va shisha effekti yo‘q.

## Komponentlar

- **Tugmalar** (balandlik 44px, `--r-sm`, 15–16px, 600):
  - *Asosiy*: `--c-primary` fon, `--c-on-primary` matn; hover `--c-primary-hover`. Sahifa bo‘limida bittadan ortiq emas.
  - *Ikkinchi darajali*: oq fon, `--c-border-strong` chegara, `--c-text`; hover `--c-surface`.
  - *Sokin*: fon va chegarasiz, `--c-link` matn; hover — tagiga chiziq.
  - Fokus: 3px `--c-focus` halqa, 2px masofa. O‘chiq: 50% shaffoflik, kursor oddiy.
- **Havolalar**: `--c-link`, hover’da tagiga chiziq. Matn ichida doim tagiga chiziq.
- **Input**: 44px (qidiruv 56px), `--c-border-strong`, `--r-sm`; fokusda chegara `--c-primary` + halqa. Placeholder `--c-subtle`.
- **Chip** (misol savollar, filtr): 32px, `--c-border` chegara, `--r-sm`; tanlangan — `--c-primary-soft` fon, `--c-primary` matn.
- **Karta**: `--c-bg` fon, `--c-border` chegara, `--r-md`, ichki masofa 20–24px, soyasiz. Karta ichida karta yo‘q. Hover’da faqat chegara `--c-border-strong` ga o‘zgaradi (ko‘tarilish yo‘q).
- **Ro‘yxat qatori**: ko‘p bir xil narsa (vaziyatlar, kodekslar) karta to‘ri emas, chegarali ro‘yxat qatorlari sifatida.
- **Navigatsiya**: oq fon, pastki chegara, 64px. Chapda logotip; o‘rtada 4 ta asosiy havola; o‘ngda "Kirish" (sokin) va bitta asosiy tugma. Qolganlari footer’da.
- **Footer**: `--c-surface` fon, 3–4 ustunli havolalar, pastda huquqiy eslatma.
- **Ogohlantirish bloki**: chap tomonda 3px rangli chiziq (warning/danger/primary), fon `--c-surface`.

## Rasmlar va ikonalar

- Ikonalar: bitta to‘plam — mavjud ichki SVG ikonalar (`app.js → getSvgIcon`), 20px, chiziq 1.75px, `currentColor`. Emoji ikona sifatida ishlatilmaydi (manba belgilaridagi 🔎📄⚠️ — holat belgisi, istisno).
- Fotosurat/video: faqat haqiqiy kadr (hero videosi). AI chizgan rasm yo‘q; `legal-hero.png` ishlatilmaydi.
- Illyustratsiya yo‘q. Vizual ishonchni haqiqiy narsalar beradi: rasmiy manba nomlari (lex.uz), modda raqamlari, haqiqiy interfeys qismlari.

## Harakat

Animatsiya faqat holat o‘zgarishi uchun (hover, ochilish): 150ms, `ease-out`; yagona istisno — hero videosi. Sahifaga kirganda paydo bo‘lish, parallaks va suzuvchi effektlar yo‘q. `prefers-reduced-motion` da hammasi o‘chadi, video o‘rniga poster.

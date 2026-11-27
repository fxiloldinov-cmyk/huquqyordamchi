# HuquqYordamchi — dizayn tizimi

Yo‘nalish: **toza, sokin, ishonchli.** Davlat xizmati kabi aniq, lekin zamonaviy. Sayt bezakdan emas, matn va qidiruvdan iborat: foydalanuvchi muammo bilan keladi, unga tez javob va manba kerak.

Nimadan qochamiz (avvalgi versiyani "AI yasagan" qilib ko‘rsatgan narsalar): to‘q ko‘k hero ustida xira stok rasm, serif + oltin kursiv sarlavha, krem fon, karta ichida karta, hamma narsa markazda, mayda kulrang matn, bir xil kartalar qatori, emoji ikonalar.

Manba: real saytlar bilan solishtirilmagan (UXKIN ulanmagan). Qarorlar loyiha, egasining tanlovi ("toza va zamonaviy") va o‘qilishi qoidalaridan.

Kod: tokenlar `public/theme.css` da (oxirgi yuklanadi). Sahifalarda faqat token nomlari ishlatiladi.

## Rang

Bitta asosiy rang — logotipdagi to‘q ko‘k. Oltin faqat logotip yulduzida qoladi, interfeysda ishlatilmaydi.

| Token | Yorug‘ | Tungi | Vazifasi |
|---|---|---|---|
| `--c-bg` | `#ffffff` | `#0f151c` | Sahifa foni |
| `--c-surface` | `#f5f7fa` | `#151d26` | Ikkinchi darajali yuzalar: qidiruv bloki, footer, kod/iqtibos |
| `--c-border` | `#e2e6eb` | `#263240` | Chegaralar, ajratgichlar |
| `--c-border-strong` | `#c9d0d8` | `#3a4757` | Maydon chegaralari (input) |
| `--c-text` | `#16202c` | `#e7ecf2` | Asosiy matn, sarlavhalar |
| `--c-muted` | `#4a5563` | `#a9b4c1` | Ikkinchi darajali matn (7:1 dan yuqori) |
| `--c-subtle` | `#667180` | `#8794a3` | Izohlar, sana, faqat 14px+ (4.8:1) |
| `--c-primary` | `#123a66` | `#9cc0ec` | Asosiy tugma foni, faol holat |
| `--c-primary-hover` | `#0d2c4f` | `#b6d1f2` | Asosiy tugma hover |
| `--c-on-primary` | `#ffffff` | `#0f151c` | Asosiy tugma ustidagi matn |
| `--c-link` | `#1b5aa6` | `#9cc0ec` | Havolalar |
| `--c-primary-soft` | `#eaf1f9` | `#18283a` | Tanlangan chip, belgilangan qator foni |
| `--c-success` | `#1a7f4b` | `#5fc58f` | Muvaffaqiyat |
| `--c-warning` | `#9a5b06` | `#e3a94c` | Ogohlantirish (manba ⚠️) |
| `--c-danger` | `#b42318` | `#f08a80` | Xato |
| `--c-focus` | `#1b5aa6` | `#9cc0ec` | Fokus halqasi (3px) |

Kontrast: matn ≥ 4.5:1, katta matn ≥ 3:1 (ikkala rejimda tekshirilgan qiymatlar).

## Tipografiya

Bitta oila: **tizim shrifti** — Windows’da Segoe UI, Apple’da SF Pro, Android’da Roboto.
Sabab: o‘zbek lotin (o‘ g‘) va kirill (ў қ ғ ҳ) harflari hamma joyda to‘g‘ri chiqadi, tashqi shrift yuklanmaydi (tezlik va maxfiylik), sayt foydalanuvchi qurilmasiga "o‘zinikidek" ko‘rinadi. Serif ishlatilmaydi.

`--font: system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans", Arial, sans-serif`

| Token | O‘lcham / qator | Og‘irlik | Qayerda |
|---|---|---|---|
| `--t-display` | 44px / 1.1 (mobil 32px) | 700 | Faqat bosh sahifa sarlavhasi |
| `--t-h1` | 32px / 1.2 (mobil 26px) | 700 | Sahifa sarlavhasi |
| `--t-h2` | 24px / 1.25 | 650 | Bo‘lim sarlavhasi |
| `--t-h3` | 18px / 1.35 | 600 | Karta/blok sarlavhasi |
| `--t-body-lg` | 18px / 1.6 | 400 | Kirish matni, qidiruv maydoni |
| `--t-body` | 16px / 1.6 | 400 | Asosiy matn (minimal) |
| `--t-small` | 14px / 1.5 | 400/500 | Izoh, meta, chip |

Harf oralig‘i: sarlavhalarda −0.02em, matnda 0. Matn kengligi 60–75 belgi (`--w-read: 680px`). Katta harfli "eyebrow" yozuvlar ishlatilmaydi.

## Masofa

4 asosli shkala: `--s-1 4px · --s-2 8px · --s-3 12px · --s-4 16px · --s-5 24px · --s-6 32px · --s-7 48px · --s-8 64px · --s-9 96px`.
Bo‘limlar orasi: desktop `--s-8` (64px), mobil `--s-7` (48px). Kontent kengligi `--w-page: 1120px`, chet 24px (mobil 16px).

## Shakl va chuqurlik

Radius: `--r-sm 6px` (tugma, input, chip), `--r-md 10px` (karta, blok), `--r-lg 14px` (katta qidiruv). Pill (999px) yo‘q.
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
- Fotosuratlar: bosh sahifada stok rasm yo‘q. Mavjud `legal-hero.png` ishlatilmaydi.
- Illyustratsiya yo‘q. Vizual ishonchni haqiqiy narsalar beradi: rasmiy manba nomlari (lex.uz), modda raqamlari, haqiqiy interfeys qismlari.

## Harakat

Animatsiya faqat holat o‘zgarishi uchun (hover, ochilish): 150ms, `ease-out`. Sahifaga kirganda paydo bo‘lish, parallaks va suzuvchi effektlar yo‘q. `prefers-reduced-motion` da hammasi o‘chadi.

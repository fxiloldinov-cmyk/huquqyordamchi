"""Lex.uz'dan yuklab olingan hujjatni (Word/HTML eksport, .doc) RAG bazasiga aylantiradi.

Ishlatish:  python3 scripts/import_lexuz.py <fayl.doc> data/laws/mk.json --doc mk --lex-id -6257288
            python3 scripts/import_lexuz.py <plenum.doc> data/laws/plenum-26-2023.json --doc plenum26   (bandli hujjat)
Talab:      pip install beautifulsoup4
Natija:     modda bo'yicha JSON — sarlavha, bo'lim/bob/§, qismlar (xatboshilar) va o'zgartish izohlari.
"""
import sys, re, json, argparse, datetime
from bs4 import BeautifulSoup

ap = argparse.ArgumentParser()
ap.add_argument('src'); ap.add_argument('out')
ap.add_argument('--doc', required=True); ap.add_argument('--lex-id', default=None)
ap.add_argument('--name', default=None, help="ko'rsatiladigan nom (masalan, 'Oʻzbekiston Respublikasining Fuqarolik kodeksi (1-qism)')")
a = ap.parse_args()

# Kirill yozuvidagi eksport (masalan, Jinoyat-protsessual kodeksi) uchun: sarlavha, modda va sana belgilarini
# aniqlashda matn lotinga o'giriladi. Saqlanadigan matn o'zgarmaydi — rasmiy yozuvda qoladi.
CYR = dict(zip('абвгдежзийклмнопрстуфхцчшщъыьэюяёўқғҳ', ['a','b','v','g','d','e','j','z','i','y','k','l','m','n','o','p','r','s','t','u','f','x','ts','ch','sh','sh','ʼ','i','','e','yu','ya','yo','oʻ','q','gʻ','h']))
def lat(t):
    return ''.join((CYR[c.lower()].upper() if c.isupper() else CYR[c]) if c.lower() in CYR else c for c in t)

# Ko'rsatish uchun sarlavhani o'zbek lotin alifbosiga o'girish (rasmiy qoidalar: е → ye so'z boshida va unlidan keyin,
# ц → ts unlidan keyin, aks holda s; ъ → ʼ). Faqat "titleLatn" uchun — rasmiy matn o'zgarmaydi.
def cyr2lat(t):
    out = []
    for i, c in enumerate(t):
        lo, prev = c.lower(), (t[i - 1] if i else ' ')
        if lo not in CYR: out.append(c); continue
        if lo == 'е': r = 'ye' if (not prev.isalpha() or prev.lower() in 'аеёиоуэюяўъь') else 'e'
        elif lo == 'ц': r = 'ts' if prev.lower() in 'аеёиоуэюяў' else 's'
        else: r = CYR[lo]
        if c.isupper() and r:
            nxt = t[i + 1] if i + 1 < len(t) else ''
            r = r.upper() if (nxt.isupper() or (prev.isalpha() and prev.isupper())) else r[0].upper() + r[1:]
        out.append(r)
    return ''.join(out)

def clean(t):
    t = re.sub(r'\s+', ' ', t.replace('\xa0', ' ')).strip()
    t = re.sub(r'\s+([,.;:)»”])', r'\1', t)
    return re.sub(r'([(«“])\s+', r'\1', t)

soup = BeautifulSoup(open(a.src, encoding='utf8').read(), 'html.parser')
title = clean(soup.find(class_='ACT_TITLE').get_text(' ', strip=True))
po = soup.find(class_='PUBLICATION_ORIGIN'); pub = clean(po.get_text(' ', strip=True)) if po else ''
dates = re.findall(r'(\d{2})\.(\d{2})\.(\d{4})\s*-?\s*y\.', lat(pub))
asof = max((f'{y}-{m}-{d}' for d, m, y in dates), default=None)
ctx = {'bolim': None, 'bob': None, 'par': None}
arts, cur, problems = [], None, []
AP = "[ʻ‘'’`]"
GONE = rf"(?:chiqarilgan|chiqarildi|o{AP}z kuchini yo{AP}qot(?:gan|adi)|o{AP}z kuchini yo{AP}qotish sanasi)"
# Butun bob kuchini yo'qotgan bo'lsa ("(43-bob ... oʻz kuchini yoʻqotgan)"), keyingi moddagacha bo'lgan bo'shliq ham chiqarilgan.
bob_gone, last_whole, gone_by_bob = False, 0, set()
for e in soup.find_all(class_=['TEXT_HEADER_DEFAULT', 'CLAUSE_DEFAULT', 'ACT_TEXT', 'CHANGES_ORIGINS']):
    c, t = e.get('class')[0], clean(e.get_text(' ', strip=True))
    if not t: continue
    lt = lat(t)
    if c != 'ACT_TEXT' and re.search(rf"\(\s*\d+(?:[\s-]+\d+)?\s*-\s*bob\b[^()]{{0,300}}?{GONE}", lt, re.I): bob_gone = True
    if c == 'TEXT_HEADER_DEFAULT':
        # Fuqarolik kodeksida sarlavhalar har xil yozilgan: "1-BOB.", "IV boʻlim.", "2-kichik boʻlim", "IKKINCHI QISM"
        if re.match(r'^(UMUMIY|MAXSUS|BIRINCHI|IKKINCHI|UCHINCHI) QISM', lt, re.I): ctx.update(bolim=None, bob=None, par=None)
        elif re.match(r'^([IVXLC]+(?:\s+\d+)?\.?\s+|\d+-kichik\s+)bo[ʻ‘\'’]lim', lt, re.I) or re.match(r'^(?:\S+\s){0,2}?\S*NCHI\.?\s+BO[ʻ‘\'’]LIM', lt, re.I): ctx.update(bolim=t, bob=None, par=None)
        elif re.match(r'^\d+(?:[\s-]+\d+)?\s*-\s*bob', lt, re.I) or re.match(r'^[IVXLC]+(?:\s*\d+)?\.?\s+bob\b', lt, re.I): ctx.update(bob=t, par=None)
        elif re.match(r'^\d+(-\d+)?-§', lt): ctx['par'] = t
        else: problems.append(t[:80])
        continue
    if c == 'CLAUSE_DEFAULT':
        # "163-modda", "599- modda", "26 1 -modda" (26¹ — lex.uz eksportida yuqori indeks bo'sh joy bilan keladi) → "26-1"
        m = re.match(r'^(\d+)(?:[\s-]+(\d+))?\s*-\s*(?:modda|модда)\.?\s*(.*)$', t)
        if not m: problems.append(t[:80]); continue
        cur = {'art': m.group(1) + (f'-{m.group(2)}' if m.group(2) else ''), 'title': m.group(3).strip(), 'bolim': ctx['bolim'], 'bob': ctx['bob'], 'par': ctx['par'], 'parts': [], 'changes': []}
        if not m.group(2):
            n_ = int(m.group(1))
            if bob_gone: gone_by_bob.update(range(last_whole + 1, n_))
            last_whole, bob_gone = max(last_whole, n_), False
        arts.append(cur); continue
    if cur is None: continue
    (cur['parts'] if c == 'ACT_TEXT' else cur['changes']).append(t)

# Moddasiz hujjat (masalan, Oliy sud Plenumi qarori): "1.", "2." bilan boshlangan xatboshilar — bandlar.
kind = 'modda'
if not arts:
    kind = 'band'
    for e in soup.find_all(class_='ACT_TEXT'):
        t = clean(e.get_text(' ', strip=True))
        if not t: continue
        m = re.match(r'^(\d{1,3})\.\s+(.*)$', t)
        if m:
            cur = {'art': m.group(1), 'title': (m.group(2)[:140] + ('…' if len(m.group(2)) > 140 else '')), 'bolim': None, 'bob': None, 'par': None, 'parts': [t], 'changes': []}
            arts.append(cur)
        elif cur is None:
            arts.append({'art': '0', 'title': 'Kirish qismi', 'bolim': None, 'bob': None, 'par': None, 'parts': [t], 'changes': []}); cur = arts[-1]
        else:
            cur['parts'].append(t)
    form = soup.find(class_='ACT_FORM'); body = soup.find(class_='ACCEPTING_BODY')
    ess = [clean(x.get_text(' ', strip=True)).rstrip(',') for x in soup.find_all(class_=['ACT_ESSENTIAL_ELEMENTS', 'ACT_ESSENTIAL_ELEMENTS_NUM'])]
    title = ' '.join(x for x in [clean(body.get_text(' ', strip=True)) if body else '', ' '.join(ess[1:]), clean(form.get_text(' ', strip=True)) if form else ''] if x) + f' “{title}”'
    d = re.search(r'(\d{4})-yil (\d{1,2})-(\w+)', ' '.join(ess))
    months = {'yanvar': 1, 'fevral': 2, 'mart': 3, 'aprel': 4, 'may': 5, 'iyun': 6, 'iyul': 7, 'avgust': 8, 'sentabr': 9, 'oktabr': 10, 'noyabr': 11, 'dekabr': 12}
    if d and d.group(3) in months: asof = f'{d.group(1)}-{months[d.group(3)]:02d}-{int(d.group(2)):02d}'
nums = [x['art'] for x in arts]
assert len(nums) == len(set(nums)), 'takroriy raqam'
# Kirill yozuvidagi hujjat: sarlavhalarning lotincha nusxasi (qidiruv natijasida ko'rsatish uchun).
script = 'cyrl' if sum(ch.lower() in CYR for ch in ' '.join(x['title'] for x in arts[:50])) > 200 else 'latn'
if script == 'cyrl':
    for x in arts: x['titleLatn'] = cyr2lat(x['title'])
# Raqamlar orasidagi bo'shliqlar: lex.uz izohida "chiqarilgan" / "oʻz kuchini yoʻqotgan" deyilgan moddalar → repealed.
# Izohsiz bo'shliq importda xato bo'lishi mumkin — muammo sifatida chiqariladi.
repealed = []
if kind == 'modda':
    full = lat(clean(soup.get_text(' ', strip=True)))
    gone = set(gone_by_bob)
    for m in re.finditer(rf"\((\d+)-moddas?i?\b[^()]{{0,400}}?{GONE}", full): gone.add(int(m.group(1)))
    for m in re.finditer(rf"\((\d+)\s*[—–-]\s*(\d+)-moddalar\w*[^()]{{0,400}}?{GONE}", full): gone.update(range(int(m.group(1)), int(m.group(2)) + 1))
    for m in re.finditer(rf"\(((?:\d+\s*(?:,|va)\s*)+\d+)-moddalar\w*[^()]{{0,400}}?{GONE}", full): gone.update(int(x) for x in re.findall(r'\d+', m.group(1)))
    for m in re.finditer(rf"(\d+)-moddaning o{AP}z kuchini yo{AP}qot", full): gone.add(int(m.group(1)))
    # Yuqori indeksli modda ("186 3 -modda ... oʻz kuchini yoʻqotgan") — bazada bo'lmasa, chiqarilgan deb belgilanadi.
    have_all = set(nums)
    sub_gone = sorted({f'{m.group(1)}-{m.group(2)}' for m in re.finditer(rf"\(\s*(\d+)\s+(\d+)\s*-\s*moddas?i?\b[^()]{{0,400}}?{GONE}", full)} - have_all, key=lambda x: [int(y) for y in x.split('-')])
    whole = sorted(int(x) for x in nums if x.isdigit())
    have = set(whole)
    for n in range(whole[0], whole[-1] + 1):
        if n in have: continue
        if n in gone: repealed.append(str(n))
        else: problems.append(f'{n}-modda topilmadi va kuchini yoʻqotgani haqida izoh yoʻq')
    repealed += sub_gone
if a.name: title = a.name
elif title.isupper(): title = title.capitalize().replace('respublikasi', 'Respublikasi')
assert all(x['parts'] for x in arts), 'matnsiz qism'
url = f'https://lex.uz/docs/{a.lex_id}' if a.lex_id else 'https://lex.uz/search/all?searchtitle=' + __import__('urllib.parse').parse.quote(re.sub(r'.*“|”', '', title))
out = {'doc': a.doc, 'kind': kind, 'name': title, 'lexId': a.lex_id, 'url': url,
       'asOf': asof, 'importedAt': datetime.date.today().isoformat(), 'publication': pub, 'script': script, 'repealed': repealed, 'articles': arts}
json.dump(out, open(a.out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'{title}: {len(arts)} {kind}, holat {asof}, kuchini yoʻqotgan: {len(repealed)}, muammolar: {len(problems)}')
for p_ in problems[:int(__import__('os').environ.get('SHOW', 20))]: print('  ?', p_)

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
a = ap.parse_args()

def clean(t):
    t = re.sub(r'\s+', ' ', t.replace('\xa0', ' ')).strip()
    t = re.sub(r'\s+([,.;:)»”])', r'\1', t)
    return re.sub(r'([(«“])\s+', r'\1', t)

soup = BeautifulSoup(open(a.src, encoding='utf8').read(), 'html.parser')
title = clean(soup.find(class_='ACT_TITLE').get_text(' ', strip=True))
po = soup.find(class_='PUBLICATION_ORIGIN'); pub = clean(po.get_text(' ', strip=True)) if po else ''
dates = re.findall(r'(\d{2})\.(\d{2})\.(\d{4})-y\.', pub)
asof = max((f'{y}-{m}-{d}' for d, m, y in dates), default=None)
ctx = {'bolim': None, 'bob': None, 'par': None}
arts, cur, problems = [], None, []
for e in soup.find_all(class_=['TEXT_HEADER_DEFAULT', 'CLAUSE_DEFAULT', 'ACT_TEXT', 'CHANGES_ORIGINS']):
    c, t = e.get('class')[0], clean(e.get_text(' ', strip=True))
    if not t: continue
    if c == 'TEXT_HEADER_DEFAULT':
        if re.match(r'^(UMUMIY|MAXSUS) QISM', t): ctx.update(bolim=None, bob=None, par=None)
        elif re.match(r'^[IVXLC]+ BO[ʻ‘\']LIM', t): ctx.update(bolim=t, bob=None, par=None)
        elif re.match(r'^\d+(-\d+)?-bob', t): ctx.update(bob=t, par=None)
        elif re.match(r'^\d+(-\d+)?-§', t): ctx['par'] = t
        else: problems.append(t[:80])
        continue
    if c == 'CLAUSE_DEFAULT':
        m = re.match(r'^(\d+(?:-\d+)?)-modda\.?\s*(.*)$', t)
        if not m: problems.append(t[:80]); continue
        cur = {'art': m.group(1), 'title': m.group(2).strip(), 'bolim': ctx['bolim'], 'bob': ctx['bob'], 'par': ctx['par'], 'parts': [], 'changes': []}
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
assert all(x['parts'] for x in arts), 'matnsiz qism'
url = f'https://lex.uz/docs/{a.lex_id}' if a.lex_id else 'https://lex.uz/search/all?searchtitle=' + __import__('urllib.parse').parse.quote(re.sub(r'.*“|”', '', title))
out = {'doc': a.doc, 'kind': kind, 'name': title, 'lexId': a.lex_id, 'url': url,
       'asOf': asof, 'importedAt': datetime.date.today().isoformat(), 'publication': pub, 'articles': arts}
json.dump(out, open(a.out, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'{title}: {len(arts)} {kind}, holat {asof}, muammolar: {len(problems)}')

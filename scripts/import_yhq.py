"""YHQ Word/HTML eksporti uchun lokal adapter. Tarmoq va qoida yaratish yo‘q."""
import argparse, datetime, json, re
from pathlib import Path
from html.parser import HTMLParser

CLASSES={'ACT_TITLE','ACT_TITLE_APPL','PUBLICATION_ORIGIN','TEXT_HEADER_DEFAULT','CLAUSE_DEFAULT','ACT_TEXT','CHANGES_ORIGINS'}
VOID={'br','hr','img','meta','link','input','wbr','area','base','source','embed','param','col'}
def clean(text): return re.sub(r'\s+',' ',text.replace('\xa0',' ')).strip()
class Blocks(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True);self.stack=[];self.current=None;self.blocks=[]
    def handle_starttag(self,tag,attrs):
        attrs=dict(attrs);classes=set(attrs.get('class','').split())
        if self.current is None and classes&CLASSES:
            self.current={'kind':next(k for k in CLASSES if k in classes),'depth':len(self.stack),'text':[]}
        if tag in VOID:
            if self.current:self.current['text'].append(' ')
        else:self.stack.append(tag)
    def handle_startendtag(self,tag,attrs):
        self.handle_starttag(tag,attrs)
        if tag not in VOID:self.handle_endtag(tag)
    def handle_data(self,data):
        if self.current:self.current['text'].append(data.translate(str.maketrans('0123456789','⁰¹²³⁴⁵⁶⁷⁸⁹')) if 'sup' in self.stack else data)
    def handle_endtag(self,tag):
        if tag not in self.stack:return
        idx=len(self.stack)-1-self.stack[::-1].index(tag)
        if self.current and idx<=self.current['depth']:
            self.blocks.append((self.current['kind'],clean(''.join(self.current['text']))));self.current=None
        self.stack=self.stack[:idx]

def main(argv=None):
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('src');ap.add_argument('out');ap.add_argument('--doc',choices=['yhq','ypx975'],required=True)
    ap.add_argument('--lex-id',required=True);ap.add_argument('--start-at',required=True)
    ap.add_argument('--end-before');ap.add_argument('--name');ap.add_argument('--manifest')
    a=ap.parse_args(argv)
    if not re.fullmatch(r'-?\d+',a.lex_id):ap.error('lex-id raqam bo‘lsin.')
    parser=Blocks();parser.feed(Path(a.src).read_text(encoding='utf-8'));blocks=parser.blocks
    names=[t for k,t in blocks if k=='ACT_TITLE'];origins=[t for k,t in blocks if k=='PUBLICATION_ORIGIN']
    if not names:raise ValueError('ACT_TITLE topilmadi. Ikkilik Word/DOCX emas, Word/HTML eksporti kerak.')
    dates=[f'{y}-{m}-{d}' for d,m,y in re.findall(r'(\d{2})\.(\d{2})\.(\d{4})',' '.join(origins))]
    if not dates:raise ValueError('Nashr sanasi topilmadi. Hech narsa yozilmadi.')
    asof=max(dates);datetime.date.fromisoformat(asof)
    starts=[i for i,(_,t) in enumerate(blocks) if t==clean(a.start_at)]
    if len(starts)!=1:raise ValueError('Boshlang‘ich sarlavha aynan bir marta uchrashi kerak.')
    body=blocks[starts[0]+1:]
    if a.end_before:
        ends=[i for i,(_,t) in enumerate(body) if t==clean(a.end_before)]
        if len(ends)!=1:raise ValueError('Yakuniy chegara aynan bir marta uchrashi kerak.')
        body=body[:ends[0]]
    arts=[];cur=None;seen=set();heading=None
    for kind,text in body:
        if not text:continue
        if kind=='TEXT_HEADER_DEFAULT':heading=text;continue
        if kind=='CHANGES_ORIGINS':
            if cur:cur['changes'].append(text)
            continue
        if kind not in {'ACT_TEXT','CLAUSE_DEFAULT'}:continue
        m=re.match(r'^(\d+(?:\.\d+)*)([⁰¹²³⁴⁵⁶⁷⁸⁹]+)?\.(?!\d)\s*(.*)$',text)
        if m:
            number=m[1]+('-'+m[2].translate(str.maketrans('⁰¹²³⁴⁵⁶⁷⁸⁹','0123456789')) if m[2] else '')
            if number in seen:raise ValueError('Takroriy band. Ilovalar chegarasini tekshiring.')
            seen.add(number);cur={'art':number,'title':m[3][:140],'bolim':None,'bob':heading,'par':None,'parts':[text],'changes':[]};arts.append(cur)
        elif cur:cur['parts'].append(text)
        else:raise ValueError('Banddan oldingi matn topildi. Boshlang‘ich sarlavhani tekshiring.')
    if not arts:raise ValueError('Raqamlangan YHQ bandlari topilmadi.')
    repealed=[]
    for kind,text in body:
        if kind!='CHANGES_ORIGINS':continue
        normalized=text.replace('ʻ',"'").replace('‘',"'").replace('’',"'")
        gone=re.match(r"^\((\d+)-band\b.*o'z kuchini yo'qotgan",normalized)
        if gone and gone[1] not in seen:repealed.append(gone[1])
    result={'doc':a.doc,'kind':'band','name':a.name or names[0],'lexId':a.lex_id,'url':f'https://lex.uz/docs/{a.lex_id}','asOf':asof,'publishedAt':asof,'importedAt':datetime.date.today().isoformat(),'publication':' '.join(origins),'script':'source','repealed':list(dict.fromkeys(repealed)),'articles':arts}
    manifest=None
    if a.manifest:
        manifest=json.loads(Path(a.manifest).read_text(encoding='utf-8'))
        manifest[a.doc]={'file':Path(a.out).name,'name':result['name'],'kind':'band','status':'imported','articles':len(arts),'publishedAt':asof,'importedAt':result['importedAt'],'autoUpdate':False,'lexId':a.lex_id}
    Path(a.out).write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')),encoding='utf-8')
    if manifest is not None:Path(a.manifest).write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Import: {len(arts)} band. Asl eksport bilan solishtiring.')
if __name__=='__main__':main()

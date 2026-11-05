from pathlib import Path
import re,json
root=Path(__file__).resolve().parents[3]
lessons=[]
for p in sorted((root/'docs/57-konu-anlatimi/anayasa/01-giris').glob('0[345]-*.md')):
 text=p.read_text();main,notes=text.split('## Kaynak ve inceleme notları',1)
 title=main.splitlines()[0][2:];goal=re.search(r'(?:Bu dersin hedefi:|Hedef:) (.*)',main).group(1)
 sections=[]
 for chunk in re.split(r'\n## ',main)[1:]:
  heading,body=chunk.split('\n',1);body=body.strip().removesuffix('---').strip()
  blocks=[];lines=body.splitlines();i=0
  while i<len(lines):
   if lines[i].startswith('|'):
    table=[]
    while i<len(lines) and lines[i].startswith('|'):
     cells=[c.strip() for c in lines[i].strip('|').split('|')];i+=1
     if not all(re.fullmatch(r'[:\s-]+',c) for c in cells):table.append(cells)
    blocks.append({'kind':'table','headers':table[0],'rows':table[1:]})
   else:
    para=[]
    while i<len(lines) and not lines[i].startswith('|'):para.append(lines[i]);i+=1
    content='\n'.join(para).strip()
    if content:blocks.append({'kind':'text','text':content})
  sections.append({'title':heading,'blocks':blocks})
 sources=[]
 for line in notes.splitlines():
  urls=re.findall(r'https?://[^\s]+',line)
  if urls:sources.append({'label':line.lstrip('- ').split('https:')[0].strip().rstrip(':'),'url':urls[0]})
 sources.insert(0,{'label':'THEMIS Anayasa Hukuku · 24. baskı, 2020 · Giriş bölümü; özgün anlatım için kaynak','url':None})
 lessons.append({'slug':p.stem,'title':title,'goal':goal,'sections':sections,'sources':sources})
data={'id':'anayasa-giris','title':'Anayasa Türleri','topicId':'716f57ed-9618-41e0-8079-74d264f33abc','version':2,'lessons':lessons}
(root/'apps/app/src/features/lessons/content.ts').write_text('// Editoryal inceleme paketi. Kaynak: docs/57-konu-anlatimi/anayasa/01-giris.\nexport const INTRODUCTION = '+json.dumps(data,ensure_ascii=False,indent=2)+' as const;\n')
assert len(lessons)==3
assert all(x['sections'] and all(s['blocks'] for s in x['sections']) for x in lessons)
print('3 ders: Anayasa türleri. Kaynaklar ve tablolar aktarıldı.')

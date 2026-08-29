#!/usr/bin/env python3
"""Doc 32 denetim defterine toplu kayit + articleNo tablosunu hazirlama.

stdin'den JSON okur:
{ "kaynak": "...", "kayitlar": [
    {"id":"...", "konu":"...", "dayanak":"...", "bulgu":"...",
     "acik":"..."|null, "bagla":"11"|null, "sinif":"yayimlanabilir"} ] }

Guvenlik: aciklama metni Turkce diakritik icermeli ve >60 karakter olmali.
"""
import json, re, sys, datetime, io

sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")

DEFTER = "/Users/ahmetcnd/Developer/paemisyon/docs/32-yayin-denetimi/ilerleme.jsonl"
BAGLA  = "/Users/ahmetcnd/Developer/paemisyon/apps/api/scripts/articleno-bagla.ts"
TR = re.compile(r'[çğıöşüÇĞİÖŞÜâîû]')

d = json.load(sys.stdin)
bugun = datetime.date.today().isoformat()
kayitlar = d["kayitlar"]
konu_kod = d.get("konu_kod")  # articleno-bagla.ts icin konu adi parcasi

for k in kayitlar:
    a = k.get("acik")
    if a is not None:
        assert TR.search(a), f"{k['id']}: aciklama Turkce diakritik icermiyor"
        assert len(a) > 60, f"{k['id']}: aciklama cok kisa"

with open(DEFTER, "a", encoding="utf-8") as f:
    for k in kayitlar:
        o = {"id": k["id"], "sinif": k.get("sinif", "yayimlanabilir"),
             "karar": k.get("sinif", "yayimlanabilir"),
             "konu": k["konu"], "dayanak": k["dayanak"], "bulgu": k["bulgu"],
             "kaynak": d["kaynak"], "erisim": bugun}
        if k.get("acik"): o["oneri_aciklama"] = k["acik"]
        f.write(json.dumps(o, ensure_ascii=False) + "\n")
print(f"defter += {len(kayitlar)}")

bagli = [k for k in kayitlar if k.get("bagla")]
if bagli and konu_kod:
    s = open(BAGLA, encoding="utf-8").read()
    liste = "".join(f"  ['{k['id']}', '{konu_kod}', '{k['bagla']}'],\n" for k in bagli)
    s = re.sub(r'const B: Array<\[string, string, string\]> = \[[\s\S]*?\n\];',
               "const B: Array<[string, string, string]> = [\n" + liste + "];", s, count=1)
    open(BAGLA, "w", encoding="utf-8").write(s)
    print(f"articleno-bagla tablosu: {len(bagli)} satir")
else:
    print("articleno-bagla tablosu: degistirilmedi")

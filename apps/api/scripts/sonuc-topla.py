#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Workflow journal.jsonl -> birlesik denetim sonucu JSON.

DENETIM sonuclari (sonuclar dizisi tasiyanlar) duzlestirilir. CURUTME
sonuclari (curutuldu alani tasiyanlar) id ile eslestirilir; id yoksa
(eski surum) yalniz sayilir ve raporlanir.

Cogunluk kurali: curutenSayi >= ceil(oy/2) ise iddia DUSER ve karar
'yayimlanabilir' olur. Bu, kusur ilan etmeyi bilerek zorlastirir.
"""
import json, sys, math, io
sys.stdin = io.TextIOWrapper(sys.stdin.buffer, encoding="utf-8")

journal, kaynak, cikti = sys.argv[1], sys.argv[2], sys.argv[3]

denetim, curutme = [], []
for line in open(journal, encoding="utf-8"):
    o = json.loads(line)
    if o.get("type") != "result":
        continue
    r = o.get("result")
    if not isinstance(r, dict):
        continue
    if "sonuclar" in r:
        denetim.extend(r["sonuclar"])
    elif "curutuldu" in r:
        curutme.append(r)

oylar = {}
esleshmeyen = 0
for c in curutme:
    qid = c.get("id")
    if qid:
        oylar.setdefault(qid, []).append(c)
    else:
        esleshmeyen += 1

for s in denetim:
    if s["karar"] == "yayimlanabilir":
        continue
    v = oylar.get(s["id"])
    if not v:
        continue
    curuten = sum(1 for x in v if x.get("curutuldu"))
    ayakta = curuten < math.ceil(len(v) / 2)
    s["karsiDogrulama"] = {"oySayisi": len(v), "curutenSayi": curuten, "ayakta": ayakta,
                           "gerekceler": [f"[{x.get('duzeltilmisKarar')}] {x.get('gerekce','')}" for x in v]}
    if not ayakta:
        s["karar"] = "yayimlanabilir"

sayim = {}
for s in denetim:
    sayim[s["karar"]] = sayim.get(s["karar"], 0) + 1
json.dump({"toplam": len(denetim), "sayim": sayim, "kaynakUrl": kaynak, "sonuclar": denetim},
          open(cikti, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print(f"toplam {len(denetim)} soru | {sayim}")
print(f"curutme oyu: {len(curutme)} (id ile eslesen: {len(curutme)-esleshmeyen}, eslesmeyen: {esleshmeyen})")
print(f"yazildi: {cikti}")

#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Secilen etiketlerden duz aday listesi kurar (cmk-aday-bNN.json).
Kullanim: aday-kur.py <cikti.json> <etiket-dosyasi>   (etiket dosyasi: her satir "s-043 S.7")"""
import json, sys, glob
SC = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/20ed2718-7038-4dee-b298-9e861d231aee/scratchpad"
cikti, etiket_dosya = sys.argv[1], sys.argv[2]
istenen = [l.strip() for l in open(etiket_dosya, encoding="utf-8") if l.strip() and not l.startswith("#")]

havuz = {}
for yol in sorted(glob.glob(SC + "/cmk-okunan-0*.json")):
    d = json.load(open(yol, encoding="utf-8"))
    for s in d["sayfalar"]:
        for q in s["sorular"]:
            havuz["%s S.%s" % (s["sayfa"], q["no"])] = dict(q, sayfa=s["sayfa"])

out, eksik = [], []
for et in istenen:
    q = havuz.get(et)
    if not q:
        eksik.append(et); continue
    out.append({"sayfa": q["sayfa"], "no": q["no"], "kok": q["kok"],
                "siklar": q["siklar"], "dogru": q["dogru"],
                "dayanak": q.get("dayanakTahmini")})
json.dump(out, open(SC + "/" + cikti, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("aday yazildi: %s | %d soru" % (cikti, len(out)))
if eksik: print("BULUNAMAYAN:", eksik)

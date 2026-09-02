#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""PARTI ICI mukerrer taramasi.

mukerrer-tara.py adaylari yalnizca BANKAYLA karsilastirir. Ama ayni kitabin
ardisik sayfalarinda ayni kuralin iki kez sorulmasi cok yaygin (ornegin s-043 ve
s-045'te iki ayri "Otopsi hakkinda hangisi yanlistir"). Bunlar bankada
olmadigi icin tarayicidan TEMIZ gecer, sonra ayni partiyle birlikte bankaya
girer. Bu betik aday havuzunu KENDI ICINDE ciftler halinde tarar.

Kullanim: python3 ic-tarama.py <aday1.json> [<aday2.json> ...]
"""
import sys, importlib.util
SC = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/20ed2718-7038-4dee-b298-9e861d231aee/scratchpad"
spec = importlib.util.spec_from_file_location("mt", SC + "/mukerrer-tara.py")
mt = importlib.util.module_from_spec(spec); spec.loader.exec_module(mt)

havuz = []
for yol in sys.argv[1:]:
    for sayfa, q in mt.adaylari_cikar(yol if "/" in yol else SC + "/" + yol):
        siklar = list((q.get("siklar") or {}).values())
        havuz.append({
            "etiket": "%s S.%s" % (sayfa, q.get("no")),
            "kok": q.get("kok", ""), "siklar": siklar,
            "dogru": (q.get("siklar") or {}).get(q.get("dogru"), ""),
            "dayanak": q.get("dayanakTahmini"),
            "kw": mt.kelimeler(q.get("kok", "")),
            "sw": mt.kelimeler(" ".join(siklar)),
            "dw": mt.kelimeler((q.get("siklar") or {}).get(q.get("dogru"), "")),
        })
print("aday havuzu: %d soru\n" % len(havuz))

def ort(a, b):
    return len(a & b) / len(a | b) if (a and b) else 0.0

bulundu = 0
for i in range(len(havuz)):
    for j in range(i + 1, len(havuz)):
        a, b = havuz[i], havuz[j]
        k, s, dg = ort(a["kw"], b["kw"]), ort(a["sw"], b["sw"]), ort(a["dw"], b["dw"])
        # Ayni esikler: mukerrer-tara.py YAKIN katmani.
        if (k >= 0.60 and s >= 0.35) or (k >= 0.55 and dg >= 0.45):
            bulundu += 1
            print("!! %s  <->  %s   [kok %%%d / sik %%%d / dogru %%%d]" %
                  (a["etiket"], b["etiket"], k * 100, s * 100, dg * 100))
            print("   %s  | %s" % (a["etiket"], a["kok"][:88]))
            print("      DOGRU: %s" % a["dogru"][:110])
            print("   %s  | %s" % (b["etiket"], b["kok"][:88]))
            print("      DOGRU: %s" % b["dogru"][:110])
            print()
print("parti ici cakisma: %d" % bulundu)

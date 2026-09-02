#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Aday soru ile bankadaki muhtemel esini yan yana dok — mukerrer kararini ELLE ver.
Kullanim: python3 karsilastir.py <aday.json> <sayfa> <soruNo> <banka-id-onegi>"""
import json, sys
SC = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/20ed2718-7038-4dee-b298-9e861d231aee/scratchpad"
aday_yol, sayfa, no, onek = sys.argv[1], sys.argv[2], int(sys.argv[3]), sys.argv[4]

d = json.load(open(aday_yol if "/" in aday_yol else SC + "/" + aday_yol))
aday = None
for s in d["sayfalar"]:
    if s["sayfa"] != sayfa:
        continue
    for q in s["sorular"]:
        if q["no"] == no:
            aday = q
if aday is None:
    sys.exit("aday bulunamadi")

banka = json.load(open(SC + "/cmk-mevcut.json"))
b = next((x for x in banka if x["id"].startswith(onek)), None)
if b is None:
    sys.exit("banka kaydi bulunamadi")

print("=" * 78)
print("ADAY  %s S.%d   dogru=%s  dayanak=%s" % (sayfa, no, aday["dogru"], aday.get("dayanakTahmini")))
print("-" * 78)
print(aday["kok"])
for k in "ABCDE":
    v = aday["siklar"].get(k)
    if v:
        print("  %s %s) %s" % (">>" if k == aday["dogru"] else "  ", k, v))
print()
print("=" * 78)
print("BANKA %s  [%s]  m.%s" % (b["id"], b.get("durum"), b.get("madde")))
print("-" * 78)
print(b["kok"])
for t in b.get("siklar", []):
    print("  %s %s" % (">>" if t == b.get("dogruSik") else "  ", t))

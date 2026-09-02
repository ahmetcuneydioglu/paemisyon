#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Aday havuzundan secilen sorulari tam metinle dok. Kullanim: dok.py "s-043 S.7" "s-045 S.6" ..."""
import sys, json, glob
SC = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/20ed2718-7038-4dee-b298-9e861d231aee/scratchpad"
istenen = set(sys.argv[1:])
for yol in sorted(glob.glob(SC + "/cmk-okunan-0*.json")):
    d = json.load(open(yol, encoding="utf-8"))
    for s in d["sayfalar"]:
        for q in s["sorular"]:
            et = "%s S.%s" % (s["sayfa"], q["no"])
            if et not in istenen: continue
            print("=" * 76)
            print("%s   dogru=%s   %s" % (et, q.get("dogru"), q.get("dayanakTahmini")))
            print(q["kok"])
            for k in "ABCDE":
                v = (q.get("siklar") or {}).get(k)
                if v: print("  %s %s) %s" % (">>" if k == q.get("dogru") else "  ", k, v))
            print()

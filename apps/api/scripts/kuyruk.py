#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Doc 32 gece turu kuyruk yoneticisi.

  kuyruk.py durum          -> ozet
  kuyruk.py al <N>         -> siradaki N dosyayi KILITLER ve Workflow args JSON'u basar
  kuyruk.py bitir          -> kilitli partiyi 'bitmis'e tasir, kilidi acar
  kuyruk.py birak          -> kilidi acar, parti kuyruga geri doner (hata halinde)
"""
import json, sys, os, time

S = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/891199a9-e6ff-4a94-9006-5b5db4c48d6e/scratchpad"
Q = f"{S}/kuyruk.json"
KILIT = f"{S}/kuyruk.lock"
KILIT_SANIYE = 1500          # 25 dk: bir parti bundan uzun surerse dusmus sayilir

def yukle(): return json.load(open(Q, encoding="utf-8"))
def yaz(d): json.dump(d, open(Q, "w"), ensure_ascii=False, indent=1)

def kilit_yasi():
    if not os.path.exists(KILIT): return None
    return time.time() - os.path.getmtime(KILIT)

cmd = sys.argv[1] if len(sys.argv) > 1 else "durum"
d = yukle()

if cmd == "durum":
    y = kilit_yasi()
    print(f"bekleyen: {len(d['bekleyen'])} dosya | bitmis: {len(d['bitmis'])}")
    if y is None:
        durum = "YOK"
    else:
        etiket = "TAZE - PARTI SURUYOR" if y < KILIT_SANIYE else "BAYAT - dusmus sayilir"
        durum = f"{int(y)}sn once ({etiket})"
    print(f"kilit: {durum}")

elif cmd == "al":
    n = int(sys.argv[2])
    y = kilit_yasi()
    if y is not None and y < KILIT_SANIYE:
        print(json.dumps({"durum": "MESGUL", "kilitYasiSn": int(y)}, ensure_ascii=False)); sys.exit(0)
    if not d["bekleyen"]:
        print(json.dumps({"durum": "BITTI"}, ensure_ascii=False)); sys.exit(0)
    parti = d["bekleyen"][:n]
    json.dump(parti, open(KILIT, "w"), ensure_ascii=False)
    print(json.dumps({"durum": "HAZIR", "adet": len(parti),
                      "args": {"kok": d["kok"], "dosyalar": parti}}, ensure_ascii=False))

elif cmd == "bitir":
    if not os.path.exists(KILIT): print("kilit yok"); sys.exit(1)
    parti = json.load(open(KILIT, encoding="utf-8"))
    d["bekleyen"] = [x for x in d["bekleyen"] if x not in parti]
    d["bitmis"] += parti
    yaz(d); os.remove(KILIT)
    print(f"bitti: {len(parti)} dosya | kalan bekleyen: {len(d['bekleyen'])}")

elif cmd == "birak":
    if os.path.exists(KILIT): os.remove(KILIT); print("kilit birakildi")
    else: print("kilit yoktu")

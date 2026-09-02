# -*- coding: utf-8 -*-
"""Denetim haritasi kurar. IKI KURAL:
   1) FIKRA NUMARASI YAZILMAZ (eslesmez, soru sessizce kumeden duser).
   2) Eslestirme kok+SIK anahtariyla yapilir; iki soru ayni koke sahip olabilir."""
import json, re, sys, unicodedata
SC = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/20ed2718-7038-4dee-b298-9e861d231aee/scratchpad"
aday_yol, kuyruk_yol, imp_yol, cikti = sys.argv[1:5]

def norm(s):
    s = unicodedata.normalize("NFC", s or "").lower()
    return re.sub(r"[^0-9a-zçğıöşü]+", " ", s).strip()
def anahtar(kok, siklar):
    return norm(kok) + "||" + "|".join(sorted(norm(x) for x in siklar))

KANUN = {"PVSK": "Polis Vazife", "AY": "Anayasa", "CMK": "Ceza Muhakemesi"}
aday = json.load(open(SC + "/" + aday_yol, encoding="utf-8"))
kuy  = json.load(open(SC + "/" + kuyruk_yol, encoding="utf-8"))
imp  = json.load(open(imp_yol, encoding="utf-8"))
kidx = {anahtar(k["stem"], [o["text"] for o in k["options"]]): k["id"] for k in kuy}
assert len(kidx) == len(kuy), "kuyrukta anahtar cakismasi"

harita = {}
for q, im in zip(aday, imp):
    kid = kidx[anahtar(q["kok"], list((q["siklar"] or {}).values()))][:8]
    kaynaklar = list(q.get("dayanak") or [])
    for m in re.finditer(r"m\.\s*(\d+)", im["explanation"]):
        onc = im["explanation"][max(0, m.start() - 30):m.start()]
        if re.search(r"(TCK|Türk Ceza|5237|5651|6384|ÇKK|5726|Avukatlık)[^.]{0,30}$", onc): continue
        kaynaklar.append("CMK m." + m.group(1))
    no = []
    for d in kaynaklar:
        mm = re.match(r"\s*([A-ZÇĞİÖŞÜ]+)?\s*m\.\s*(\d+(?:/[A-Za-zÂÎÛ])?)", d.strip())
        if not mm: continue
        kanun = KANUN.get(mm.group(1) or "CMK")
        if kanun: no.append(kanun + "|" + mm.group(2))
    assert kid not in harita, "id onegi cakismasi: " + kid
    harita[kid] = list(dict.fromkeys(no))

json.dump(harita, open(SC + "/" + cikti, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("HARITA: %d soru (aday %d)" % (len(harita), len(aday)))

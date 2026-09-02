#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""CMK mukerrer tarayici.

Bir aday soru JSON'unu (alt ajan ciktisi) bankadaki TUM CMK sorulariyla
(yayinda 453 + kuyrukta 454 = 907) karsilastirir.

Kullanim:  python3 mukerrer-tara.py <aday.json> [<aday2.json> ...]

Uc kademeli olcut — sadece kok benzerligine guvenmek 2 Eyl 2026'da alti
mukerrerin bankaya girmesine yol acti, o yuzden uc katman var:
  1. TAM   : kok + tum sik metinleri ayni (normalize)
  2. KOK   : yalniz kok ayni (siklar yeniden yazilmis olabilir)
  3. YAKIN : kok kelime kumesi %75+ ortusuyor (isim/yas degistirilmis varyantlar)
"""
import json, re, sys, unicodedata

MEVCUT = "/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/20ed2718-7038-4dee-b298-9e861d231aee/scratchpad/cmk-mevcut.json"

# Iki tur gurultu:
# 1) varyant uretirken degistirilen isimler,
# 2) her soru kokunde tekrarlanan KALIP ifadeler. Kalip kelimeler cikarilmazsa
#    "5271 sayili Ceza Muhakemesi Yasasi'na gore ... asagidakilerden hangisi
#    yanlistir?" gibi iki alakasiz soru %60+ benzer gorunuyor ve iyi sorular
#    yanlislikla mukerrer sayiliyor (2 Eyl 2026'da 4 isaretin 3'u yanlis pozitifti).
GURULTU = {
    # isimler / harfler
    "a","b","c","d","e","k","m","ahmet","burak","kemal","merve","ali","ayse",
    "buse","cem","aslan","yakup","asli","bay","bayan","kisi",
    # kanun adi kaliplari
    "5271","5237","sayili","ceza","muhakemesi","yasasi","yasasina","kanunu","kanununa",
    "cmk","tck","turk","gore","hukuk","hukuku",
    # soru kokU kaliplari
    "asagidaki","asagidakilerden","hangisi","hangileri","hangisine","hangisinin",
    "yanlistir","dogrudur","ifadelerden","ilgili","iliskin","hakkinda","bakimindan",
    "arasinda","yer","almaz","alir","degildir","olan","olarak","ile","icin","gerekir",
    "durumunda","halinde","uzerine","karsi","soru","ifade","secenek","verilir",
}

# Turkce hukuk metinlerinde sapkali harfler sik gecer (hal, mahkum, kagit, ilam...).
# Bunlar temizlenmezse regex onlari BOSLUGA cevirip kelimeyi ikiye boler:
# "halde" -> "h lde", "mahkum" -> "mahk m". Sonuc: kelime ortusmesi yapay olarak duser
# ve gercek mukerrerler kacar. Once duz harfe indirgiyoruz.
SAPKA = str.maketrans({"â": "a", "Â": "a", "î": "i", "Î": "i", "û": "u", "Û": "u"})

def sadelestir(s):
    s = unicodedata.normalize("NFC", s or "").lower().translate(SAPKA)
    s = re.sub(r"[^0-9a-zçğıöşü]+", " ", s)
    return re.sub(r"\s+", " ", s).strip()

def kelimeler(s):
    return {w for w in sadelestir(s).split() if len(w) > 2 and w not in GURULTU}

def parmak(kok, siklar):
    return sadelestir(kok) + "||" + "|".join(sorted(sadelestir(x) for x in siklar))

def yukle():
    kayit = json.load(open(MEVCUT, encoding="utf-8"))
    tam, kok, kel = {}, {}, []
    for k in kayit:
        tam.setdefault(parmak(k["kok"], k["siklar"]), k)
        kok.setdefault(sadelestir(k["kok"]), k)
        dogru = k.get("dogruSik") or ""
        kel.append((kelimeler(k["kok"]), kelimeler(" ".join(k["siklar"])), kelimeler(dogru), k))
    return tam, kok, kel

def adaylari_cikar(yol):
    d = json.load(open(yol, encoding="utf-8"))
    out = []
    sayfalar = d.get("sayfalar") or [{"sayfa": d.get("orneklenenSayfa", "?"),
                                      "sorular": d.get("sorular", [])}]
    for s in sayfalar:
        for q in s.get("sorular", []):
            if q.get("durum") != "alindi":
                continue
            out.append((s.get("sayfa", "?"), q))
    return out

def main():
    if len(sys.argv) < 2:
        sys.exit("kullanim: mukerrer-tara.py <aday.json> [...]")
    tam, kok, kel = yukle()
    print(f"banka: {len(kel)} CMK sorusu (yayinda + kuyrukta)\n")
    temiz, elenen = [], []
    for yol in sys.argv[1:]:
        for sayfa, q in adaylari_cikar(yol):
            siklar = list((q.get("siklar") or {}).values())
            etiket = f"{sayfa} S.{q.get('no')}"
            p = parmak(q.get("kok", ""), siklar)
            if p in tam:
                elenen.append((etiket, "TAM", tam[p])); continue
            # KOK katmani: kok BIREBIR ayni. Ama "Temyiz yasa yolu hakkinda asagidaki
            # ifadelerden hangisi yanlistir?" gibi JENERIK kokler bircok farkli soruda
            # ayni oldugu icin tek basina yetmez; sik ortusmesi de aranir.
            k = sadelestir(q.get("kok", ""))
            if k in kok:
                b = kok[k]
                sw0 = kelimeler(" ".join(siklar))
                sw1 = kelimeler(" ".join(b["siklar"]))
                ort = len(sw0 & sw1) / len(sw0 | sw1) if (sw0 and sw1) else 0.0
                if ort >= 0.30:
                    elenen.append((etiket, f"KOK s%{ort*100:.0f}", b)); continue
            kw = kelimeler(q.get("kok", ""))
            sw = kelimeler(" ".join(siklar))
            dogruHarf = q.get("dogru")
            dw = kelimeler((q.get("siklar") or {}).get(dogruHarf, ""))
            enIyi, enSkor, enSik, enDogru = None, 0.0, 0.0, 0.0
            adaylar = []
            for kw2, sw2, dw2, kayit in kel:
                if not kw or not kw2:
                    continue
                skor = len(kw & kw2) / len(kw | kw2)
                sskor = len(sw & sw2) / len(sw | sw2) if (sw and sw2) else 0.0
                dskor = len(dw & dw2) / len(dw | dw2) if (dw and dw2) else 0.0
                if skor >= 0.50:
                    adaylar.append((skor, sskor, dskor, kayit))
                if skor > enSkor:
                    enIyi, enSkor, enSik, enDogru = kayit, skor, sskor, dskor
            # Ayni kurali ayni kurguyla olcen sorular SIKLARINI da paylasir.
            # Kok benzerligi tek basina yetmez: "... asagidakilerden hangisi
            # yanlistir?" kalibi alakasiz sorulari birbirine benzetiyor.
            # (a) kok + tum siklar benzer  ya da  (b) kok + DOGRU SIK benzer.
            # (b) sarti, ayni kurali ayni kurguyla olcen ama ce;driciler icin farkli
            # ornekler secilmis sorulari yakalar (s-084 S.3 <-> 4d912313 gibi):
            # sik kumeleri farkli gorunur ama DOGRU SIK ayni kurali soyler.
            vur = None
            for skor, sskor, dskor, kayit in sorted(adaylar, key=lambda x: -(x[1] + x[2])):
                if skor >= 0.60 and sskor >= 0.35:
                    vur = (f"YAKIN k%{skor*100:.0f}/s%{sskor*100:.0f}", kayit); break
                if skor >= 0.55 and dskor >= 0.45:
                    vur = (f"AYNI-KURAL k%{skor*100:.0f}/d%{dskor*100:.0f}", kayit); break
            if vur:
                elenen.append((etiket, vur[0], vur[1])); continue
            temiz.append((etiket, q, enSkor, enIyi))

    print(f"=== MUKERRER: {len(elenen)} ===")
    for e, tur, k in elenen:
        print(f"  {e:12s} [{tur:9s}] -> {k['id']} m.{k['madde'] or '-'} ({k['durum']}) {k['kok'][:62]}")
    print(f"\n=== TEMIZ (bankada YOK): {len(temiz)} ===")
    for e, q, skor, k in temiz:
        yakin = f"  (en yakin kok %{skor*100:.0f}: {k['kok'][:40]})" if k and skor > 0.45 else ""
        print(f"  {e:12s} dogru={q.get('dogru')} {str(q.get('dayanakTahmini'))[:34]}")
        print(f"               {q.get('kok','')[:96]}{yakin}")

if __name__ == "__main__":
    main()

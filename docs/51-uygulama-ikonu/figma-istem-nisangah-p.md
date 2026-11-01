# Figma'ya verilecek istem — Nişangâh P ikonunun Nöbet paletine uyarlanması

Kullanım: Figma'da **Actions → Make / First Draft** ya da bir Figma AI tasarım aracına
aşağıdaki İngilizce istemi olduğu gibi yapıştırın. Kaynak geometriyi istemin içine
koyduk; AI'nın P'yi "yeniden çizmesine" izin vermeyin, yalnız renk ve zemin varyasyonu
istiyoruz. Karşılaştırma için hazır altı seçenek Figma dosyasında da duruyor:
https://www.figma.com/design/cLaFSekHPMGK2tCqmcBVAV → sayfa
"Nişangâh P — Nöbet uyarlaması (canlı ikon)".

---

## İstem (İngilizce, yapıştırmaya hazır)

```
You are a senior app-icon designer. Produce 6 editable app-icon variants (1024×1024
square frames, vector only, no raster, no text) by RECOLORING an existing mark.
Do NOT redraw or reshape the mark; keep its geometry exactly as specified.

THE MARK ("Nişangâh P" — a lowercase p with a target dot):
- Canvas 1024×1024, origin top-left.
- Stem: rounded rectangle x=252.8 y=240.6 w=119.5 h=565 corner-radius 59.7.
- Ring: circle center (549.4, 440.4), radius 162.1, stroke width 119.5
  (equivalently a filled disc r=221.85 minus a disc r=102.35), no fill.
- Center dot: filled circle at the same center, radius 60.8.
- Stem and ring share one color ("ink"); the center dot is the accent.

NEW BRAND PALETTE (use ONLY these hex values; no other hues, no neon, no purple):
- Navy (ground)      #121A26
- Navy surface       #1E2B3C
- Navy deep          #0C1119
- Cream (ink)        #F5F0E5
- Amber (accent)     #E8B46C

PRODUCE THESE 6 VARIANTS, each in its own 1024×1024 frame named as given:
1. "N1 Flat navy"   — ground #121A26 flat; stem+ring #F5F0E5; dot #E8B46C.
2. "N2 Deep navy"   — ground: linear gradient top-left #1E2B3C → 55% #121A26 →
   bottom-right #0C1119, plus a very soft radial warm glow (#E8B46C at 12–15% opacity,
   centered slightly above the ring, fading to 0 by 60% radius); stem+ring #F5F0E5;
   dot #E8B46C.
3. "N3 Amber ground"— ground #E8B46C flat; stem+ring #121A26; dot #F5F0E5.
4. "N4 Cream ground"— ground #F5F0E5 flat; stem+ring #121A26; dot #E8B46C.
5. "N5 Amber ring"  — ground #121A26; stem #F5F0E5; ring #E8B46C; dot #F5F0E5.
6. "N6 Star center" — like N1 but replace the center dot with a 5-point star,
   outer diameter 150, inner radius 46%, corner radius 8, color #E8B46C, same center.

RULES:
- Full-bleed square; do NOT round the frame corners (the OS applies the mask).
- Keep all mark edges at least 180 px from the frame edges.
- No gradients other than the one described in N2. No shadows, no bevels, no glow
  on the mark itself, no outlines, no text, no extra symbols.
- Name layers: "Ground", "Stem", "Ring", "Dot" (or "Star").
- Place the six frames in one row, 120 px apart, with a 180×180 and a 60×60 scaled
  copy under each (rounded 22.37% to preview the iOS mask).
```

---

## Türkçe özet (ne istiyoruz)

Canlı ikonun P'si aynen kalır; yalnız renkler yeni Nöbet temasına geçer:
lacivert zemin #121A26 (ya da #1E2B3C→#121A26→#0C1119 gradyanı), krem P #F5F0E5,
amber merkez #E8B46C. Altı varyant: düz lacivert, derin lacivert (gradyan + sıcak ışık),
amber zemin, krem zemin, amber halka, yıldız merkez. Köşe yuvarlatma yok (platform
maskeler), kenar boşluğu en az 180 px, ek sembol ya da metin yok.

## Seçim notu (öneri)

- **N2 Derin lacivert** canlı ikonun hissini (gradyan + ışık) en çok koruyan, yeni
  temayla en uyumlu seçenektir; mağazada "aynı uygulama, yenilenmiş" okunur.
- **N1 Düz** en sade ve en temiz; Android adaptive katmanlarında sorunsuz.
- **N6 Yıldız merkez** rütbe çağrışımı ister
  seniz tek adımda ekler; 32 px'te yıldız noktaya iner (kayıp yok).
- N3/N4 açık zeminler ana ekranda ayrışır ama koyu tema birincil olduğu için
  ikincil kullanım (web favicon açık tema) için daha uygundur.

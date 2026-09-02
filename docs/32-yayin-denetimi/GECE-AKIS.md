# SORU EKLEME AKISI — kota-optimize (2 Eyl 2026)

Olcum (2 Eyl, 27 soruluk tur): ana dongu 8,9M cache-read + 0,5M write; denetim
2,4M + 0,5M. Yani maliyetin ~%80'i denetimde DEGIL, ana dongunun sisen
context'indeydi. Asagidaki akis bunu hedefler.

## 1. Sayfa okuma ALT AJANA devredilir  (ana dongu context'i icin en buyuk kalem)
Gorseller ana context'e ASLA girmez. Bkz. SAYFA-OKUYUCU.md — oradaki prompt
sablonu Agent tool ile (subagent_type: general-purpose) calistirilir.
Alt ajan 3-4 sayfa okur, secilmis sorulari JSON dondurur, context'i olur.
Ciktisini kendisine dosyaya yazdir (SendMessage ile) — ana dongunun output
tokenini harcama.
Ana donguye dusen is: alt ajanin "elendi"/"supheli" kararlarini gozden gecirmek
ve JSON'u import formatina cevirmek.

## 2. Denetim PARTI BASINA DEGIL, 30-40 SORUDA BIR
Her 9-10 soruluk parti icin ayri workflow acmak, kume dosyasinin sabit
maliyetini (talimat + madde tam metinleri) her seferinde yeniden odetiyordu.
Sorular in_review'de BIRIKIR; 30-40'a ulasinca tek workflow, tek harita.
hedefli-kume.ts zaten SORU_SINIR=12 ile otomatik dosyalara boler.

## 3. Kume dosyasinda komsu madde YOK
hedefli-kume.ts artik m-1 / m+1 eklemiyor (--komsu ile acilir). Kume dosyasi
~%20-40 kuculdu; iki denetci de bunu bastan sona okudugundan tasarruf ikiye
katlaniyor. Denetci "gercek dayanak m.X, kumede yok" derse o madde haritaya
elle eklenir ve yalniz o soru icin tur tekrarlanir.

## 4. (UYGULANMADI — kullanici karari) Iki denetci korunuyor
Tek denetci + kosullu ikinci okuma onerildi, kullanici iki bagimsiz okumayi
korumayi tercih etti. Denetim kalitesi degismedi.

## 5. OTURUMU UZUN TUTMA
Bu oturumda 09:00-10:00 diliminde saatte 19M cache-WRITE olctum: context'in
surekli yeniden insasi. Ayrica onceki isten kalan skill metinleri (artifact-design,
claude-api) hala context'te tasiniyordu ve bu isle ilgisi yok.
KURAL: ~30-40 soruda bir (ya da denetim turu kapandiginda) oturumu kapat,
yeni oturumda GECE-DURUM.md okuyarak devam et. Durum dosyasi bunun icin var.

## Tur sablonu
1. Alt ajan -> 3-4 sayfa oku, JSON'u dosyaya yazdir
2. JSON'u gozden gecir -> cX.py yaz -> themis-*.json uret
3. import-ozgun-sorular.ts --yaz  ->  kaynak-etiket-temizle.ts --yaz
4. (30-40 soru birikene kadar 1-3'u tekrarla)
5. surum id'lerini cek -> harita yaz -> hedefli-kume.ts --inceleme
6. denetim-hat.js workflow -> denetim-yayinla.ts --sonuc <task .output> --yaz
7. GECE-DURUM.md guncelle -> OTURUMU KAPAT

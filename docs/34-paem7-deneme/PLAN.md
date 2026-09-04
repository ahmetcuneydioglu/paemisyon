# Doc 34 — PAEM 7 Deneme Sınavı Partisi (Mayıs 2022)

Başlangıç: 5 Eylül 2026 · Kaynak: kullanıcının ortak yazarı olduğu 2022 tarihli
deneme sınavı (21 sayfa, 100 soru). **Kaynak etiketi kullanılmaz** — özgün soru
(kullanıcı kararı, Doc 33 ile aynı gerekçe).

Kullanıcı isteği: denetim + **2026 değişikliklerine göre güncelleme** + açıklama.

## 0. Kaynak taranmış PDF — metin katmanı YOK

3-21. sayfalarda yalnız 97 karakterlik altbilgi reklamı var; sorular görüntü.
`ih-pdf-ayristir.ts` bu dosyadan hiçbir şey çıkaramaz.

**Çözüm — yerel OCR hattı (token yakmaz):**

```
pdftoppm -r 300 -png ...            # sayfa → PNG
scripts/pdf-ocr (macOS Vision)      # PNG → metin, tr-TR, satır kümeleme
scripts/deneme-ocr-ayristir.ts      # metin → yapılandırılmış soru
```

Vision'ın Türkçesi iyi; sütun düzeni için gözlemler önce sütuna ayrılır, sonra
y-bandına göre SATIR kümelenir (aksi hâlde iki yana yaslı satırlarda kelimeler
satır başına kaçar). Dikey filigran ("SÜLEYMAN ARSLANTÜRK") soru numarasıyla
aynı banda düşüp satır başına yapışıyor — **satır atılmaz, filigran sökülür**,
yoksa o sorular kaybolur (ilk denemede 64 ve 81 böyle kaybolmuştu).

**Cevap anahtarı tek kaynağa bırakılmaz:** OCR çıktısı, gözle okunmuş referans
listeyle karşılaştırılır (`deneme-anahtar-cikar.ts`); 3'ten çok ayrışma varsa
script HATA verir. Bu turda yalnız bilinen `49→48` karışıklığı çıktı.

## 1. Külliyat

100 soru → bankada zaten var 4 → **96 aday**.
Güncel kültür bloğu (8 soru: 2021-22 olayları) **kullanıcı kararıyla elendi** —
yanlış değiller ama 2026 adayına "güncel" gelmezler ve güncellenemezler.
Denetime giren: **88 soru**, 8 derse dağılmış.

## 2. OCR hasarı ve onarımı

Denetçilerin uyarılarının yarısı sorunun değil ÇIKARMANIN kusuruydu. En
sistematik hasar **Roma rakamlarında**: Vision küçük puntoda `III`ü `II`
okuyor, bu da sıralama sorularını çözülemez yapıyor.

İki onarım turu (`deneme-ocr-onarim-parti.ts` → ajan sayfa GÖRÜNTÜSÜNÜ okur →
`deneme-onarim-uygula.ts`) **32 sorunun metnini düzeltti**; metni değişen
sorular yeniden denetlendi. Sonuç: ONAY 27 → 37 → 44, ÇELİŞKİ 14 → 9.

Onarım ajanlarına konan kural işe yaradı: **kitabın kendi dizgi hatasına
dokunma** (o bir soru kusurudur), yalnız OCR'ın bozduğunu onar. Örnek: s79'un
E şıkkı sayfada gerçekten `I-II-II` basılmış, ajan dokunmadı.

## 3. 2026 güncelliği — sonuç: DEĞİŞİKLİK GEREKMEDİ

Denetçiler 2026 yürürlükteki metne baktı; kitabın 2022 anahtarıyla ayrışma
doğrudan "mevzuat değişmiş" sinyali olacaktı. **Tek bir `eskime` çıkmadı.**

Bu tahmin değil: 7499/2024, 7589/2026, 7590/2026, 7565/2025, 7533, 7445, 7423,
7420 değişiklikleri tek tek tarandı. Sebep, denemenin zaten Cumhurbaşkanlığı
sistemi sonrası (2022) hazırlanmış olması — büyük kırılma sorulardan önce.

Yakalanan tek incelik: bir denetçi 2911 md 22'deki AYM iptallerini "eskime"
sandı; diğeri iptallerin **2017 ve 2020** tarihli, yani sınavdan ÖNCE olduğunu
gösterdi. Hakem turu bu tür ayrımı çözer.

## 4. Sonuç

| | Soru |
|---|---:|
| Bankaya yazıldı (ONAY) | 44 |
| Rapora düştü | 44 |
| Güncel kültür (elendi) | 8 |
| Bankada zaten vardı | 4 |

Panele eklenen mevzuat: **2860** Yardım Toplama (33 md), **5188** Özel Güvenlik
(32 md), **7190** Özel Güvenlik Yönetmeliği (57 md) — üçü de yayında.

## 5. Bu turda öğrenilenler

- **İçe aktarma transaction'da olmalı.** 5188 yazılırken maddeler hata verince
  konu + kanun + bölümler ortada kalmıştı (`mevzuat-ekle.ts` artık transaction).
- **Mülga madde ELENMEZ.** PDF sonundaki değişiklik cetvelini eleyen kural,
  7190'ın mülga md 19'unu da eliyordu. "Bu madde yürürlükten kalkmış" bilgisi
  çoğu zaman cevabın kendisidir; "metnimiz yok" ile karıştırılmamalı.
- **Aynı madde numarası iki kez çıkarsa** (`topic_id, article_no` tekilliği)
  yazma yarıda kalır — cetvel/tekrar ayıklaması yazmadan ÖNCE yapılır.
- Parti dosyalarındaki `dayanak` notu yanlışsa denetçi metne bakmak yerine
  hafızadan çalışır. Bu turda `insan-haklari` partisine "AİHS elde yok" yazmıştım,
  oysa vardı; şans eseri o partide AİHS sorusu çıkmadı.

## 6. Türetilebilir klasörler (commit'lenmez)

- `mevzuat/` → `scripts/mevzuat-dosyaya-dok.ts <dizin> [kanunNo...]`
- `sayfa/` → `pdftoppm -r 300 -png -f 2 -l 20 <pdf> sayfa/s`
  (kaynak PDF depoda DEĞİL — üçüncü tarafın tam sayfa taraması)

## 7. Hat

```
pdftoppm + pdf-ocr           taranmış PDF → metin
deneme-ocr-ayristir          metin → sorular
deneme-anahtar-cikar         anahtar (çift okuma doğrulamalı)
deneme-mukerrer-tara         bankaya karşı mükerrer
deneme-parti-kur             ders bazında kör partiler
[denetçi ajanlar]            → denetim/<parti>-d{1,2}.json
deneme-denetim-birlestir     → karar (ONAY/UYARI/ESKIMIS/CELISKI)
deneme-ocr-onarim-parti      hasarlı metin → sayfa görüntüsüyle onarım
deneme-onarim-uygula         onarımı partilere işle
deneme-onarilan-isle <tur>   yeniden denetimi asıl partilere işle
deneme-hakem-parti/topla     çelişki → bağlayıcı hakem kararı
[açıklama ajanları]          → aciklama/<parti>.json
deneme-kunye-dogrula         künyeleri resmî metinde MEKANİK arar
deneme-rapor                 → RAPOR.md
deneme-bankaya-yaz           ONAY + açıklamalı → banka (in_review)
deneme-kurtarma-parti        kalanlar → kurtarma turu
```

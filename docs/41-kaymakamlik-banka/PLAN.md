# Doc 41 — Bankadaki Kaymakamlık Sorularının Güncellik Denetimi

Doc 40 yalnız **2022** Kaymakamlık sınavını denetledi. Bankada `sourceLabel`'ı
"KAYMAKAMLIK" içeren **124 sürüm** var ve bunların çoğu o denetimin dışında
kaldı. Hepsi 25 Ağustos 2026'da içe aktarılmış, hiçbiri güncellik denetiminden
geçmemişti.

## 0. Kapsam — pencere sanılandan geniş

Sorular tek sınavdan değil, **dört ayrı sınavdan** geliyor:

| Yıl | Sürüm | Durum |
|---|--:|---|
| 2020 | 24 | denetlendi (bu doc) |
| 2021 | 22 | denetlendi (bu doc) |
| 2022 | 32 | **Doc 40'ta denetlenmişti** |
| 2023 | 46 | 43'ü denetlendi, 3'ü arşivde |

En eski parti 2020'nin — altı yıllık bir mevzuat penceresi.

### Doc 40 kesişimi 12 değil 32

İlk ölçüm kesişimi 12 gösteriyordu; o ölçüm tam metin eşleşmesine dayanıyordu.
Doc 40'ın kanonik metni **taranmış sayfadan**, bankadaki metin **ayrı bir içe
aktarımdan** geldiği için birebir tutmuyor. Kelime örtüşmesiyle (Jaccard ≥ 0,6)
bakınca bankadaki **32 adet 2022 sorusunun tamamı** Doc 40'ın denetlediği 62'nin
içinde. Eşleşme yılla sınırlandı: Doc 40 yalnız 2022'yi denetlediği için başka
yılın sorusu "denetlenmiş" sayılamaz. 2020'de eşiği aşan tek soru (İl Özel
İdaresi/vali) elle bakıldı — gerçekten farklı bir soru, kapsamda tutuldu.

**Denetlenen: 89 yayındaki soru.** Kapsam dışı: 32 Doc 40 sorusu + 3 arşivdeki
(yayında değil, adaya gitmiyor — üçü de 1 ve 4 sayılı CBK teşkilat sorusu).

## 1. Hat

Doc 40'ın hattı, tek farkla: **kaynak PDF değil bankanın kendisi.** Soru zaten
yayında ve doğru şıkkı işaretli, bu yüzden kör dosyaya ne `dogru` bayrağı ne de
açıklama konuldu; bankanın cevabı ayrı `anahtar-banka.json`'a yazılıp yalnız
birleştiriciye verildi.

Partiler **yıla göre** kuruldu ki denetçiye tek bir tarih söylenebilsin:
"bu sorular 2020'nin, sen 2026'ya bakıyorsun."

- `kaym-banka-cikar.ts` — bankadan çıkarma + Doc 40 kesişimi (salt okuma)
- `kaym-parti-kur.ts` — kör partilere bölme, anahtar ve eşleme dosyaları
- `kaym-hakem-parti.ts` — uyarı alan soruları hakem dosyasına toplama
- `ogm-denetim-birlestir.ts` — Doc 40'ın iki eskime dallı birleştiricisi
  (bu dala `doc32/yayin-denetimi`'nden alındı)

8 parti × 3 bağımsız denetçi = 24 denetçi; ardından 11 soruda 2 hakem.

**mevzuat.gov.tr notu:** konsolide metin uç noktası `User-Agent` başlığı
olmadan zaman aşımına uğruyor; arama uç noktası UA'yla bile 302 dönebiliyor.
İlk denetçi bunu keşfedince talimata yazıldı.

## 2. Sonuç

**89 sorunun 87'si temiz. 2 soru kusurlu; iki hakem 11/11 mutabakatla aynı
kararı ve aynı doğru cevabı verdi.**

### Kusurlu (2)

| Soru | Banka | Doğru | Kusur |
|---|---|---|---|
| k21-11 | D | **A** | İşaretli şık ("Hatay İl Özel İdaresi") 6360 s.K. ile 2014'te tüzel kişiliği sona ermiş bir idare. Sınav 2021'de yapıldığına göre bu eskime değil, **cevap anahtarı hatası**. |
| k23-32 | C | (D) | "Hangisi yanlıştır" sorusunda **hiçbir şık kesin yanlış değil.** İşaretli C, 5442 md 1'in yürürlükteki lafzı; D ise 4483 md 3/(b) ile desteklenebiliyor. Aday hangi şıkkı işaretlerse itiraz edebilir. |

İkisi de hiçbir denemede kullanılmamış — düzeltme/çekme geçmiş sonuçları bozmaz.

### Cevabı bozan mevzuat değişikliği: YOK

Dört yıllık üç sınav, 89 soru, altı yıla varan pencere — ve **2022'den bu yana
cevabı değişen tek soru çıkmadı.** Bulunan iki kusurun ikisi de mevzuat
takibinden değil, **içe aktarımdan/kaynaktan** geliyor. Bu, Doc 32'nin bulgusunu
tekrarlıyor: bankanın sorunu üretim kalitesi değil.

Mevzuat gerçekten değişmiş ama cevabı bozmamış üç yer bulundu:
- **k20-04** — 4483 md 3/(g)'de 7547 s.K. (2025) değişikliği, 2020'de çift
  yanlış şık taşıyan soruyu **düzeltmiş**. Eskime soruyu iyileştirdi.
- **k23-05** — 5326 md 42/A, 7547 s.K. ile başlığıyla yeniden yazıldı; yetki
  valide kaldığı için cevap sağlam, kök lafzı eskidi.
- **k23-20** — kök 2018'de kaldırılan "Aile ve Sosyal Politikalar Bakanlığı"nı
  anıyor.

### Metin düzeltmesi adayları (cevap doğru, TEMİZ)

| Soru | Düzeltme | Hakem |
|---|---|---|
| k23-20 | kökte "Aile ve Sosyal Politikalar Bakanlığı" → "Aile ve Sosyal Hizmetler Bakanlığı" | h1+h2 |
| k21-09 | A şıkkında "Sermaye Piyasaları Kurulu" → "Sermaye Piyasası Kurulu" | h1+h2 |
| k21-13 | B şıkkında "Devlet Denetleme Kurumu" → "Devlet Denetleme Kurulu" | h1 |
| k23-24 | kökte "Hatay/Reyhanlı" → "Edirne/İpsala" (şıklarla uyum) | h1+h2 — **önerilmiyor**, aşağıda |

k23-24'te kök Hatay/Reyhanlı derken A ve B şıkları Edirne Valisi/İpsala
Kaymakamı diyor. Cevap (İçişleri Bakanı, 2803 md 10) etkilenmiyor. İki hakem de
kökü değiştirmeyi önerdi ama **uygulanması önerilmiyor**: hangi tarafın bozuk
olduğunu bilmiyoruz, düzeltme senaryoyu yeniden yazmak olur ve bu soru bir
denemede kullanılmış. Doc 40'ta p41 aynı gerekçeyle bırakılmıştı.

## 3. kaym2020-2 — geciken denetçi

Bu partinin d1 denetçisi 54 dakika sürdü; diğer 23'ü ortalama beş dakikada
bitmişti. Yarı yoldaki ajan öldürülmedi, beklendi. Sonuç **12/12 ONAY** —
uyarı yok, eskime yok, hakem gerekmedi. Yani 89 sorunun tamamı üç bağımsız
denetçiden geçti.

Bu denetçinin bir notu k23-32 kararını ayrıca destekliyor: 6360 s.K. md 1/(6)
ilgili illerin **bucak teşkilatlarını kaldırmış**. Yani "ilçeler bucaklara
bölünmüştür" ifadesi 5442'nin lafzında dururken fiiliyatta büyükşehir
illerinde karşılıksız — hangi şıkkın "yanlış" olduğu gerçekten tartışmalı.

## 4. Uygulanan (10 Eyl 2026, kullanıcı kararı)

| Soru | İşlem | Sonuç |
|---|---|---|
| k21-11 `3ee990f5` | cevap anahtarı **D → A** | published, doğru şık A, kök/şıklar aynen |
| k23-20 `5e0ea80a` | kökte bakanlık adı güncellendi | published, "Aile ve Sosyal Hizmetler Bakanlığında" |
| k23-32 `ca64bb8e` | **yayından çekildi** | archived + soft-delete, currentVersionId null |

Yayındaki KAYMAKAMLIK sorusu: 120 → **119**.

Uygulanmayanlar (kullanıcı kararı): k21-09 ve k21-13'teki kurum adı yazımları,
k23-24'ün kökü. Üçü de cevabı etkilemiyor.

`soru-onar.ts`'e bu iş için **kök onarımı** (`tur: 'kok'`) eklendi — daha önce
yalnız cevap anahtarı ve şık metni onarılabiliyordu. Tüm kökü yeniden yazmaz;
verilen ibareyi değiştirir ve ibarenin kökte tam bir kez geçtiğini doğrular.
Ayrıca `soru-onar.ts` ve `soru-arsivle.ts` artık defterlerini `DOC_DIR` ile
seçiyor; Doc 32'nin kayıtları Doc 41'inkilerle karışmıyor.

Değişiklikler yedeklendi: `onarim-yedek.json`, `arsiv-yedek.json`; defter:
`ilerleme.jsonl`. Geri alma: `arsiv-geri-al.ts`.

# Doc 42 — 2025 KPSS Kamu Yönetimi çıkmış soruları

**Durum:** kapandı · 22 soru onay kuyruğunda (`in_review`) · 11 Eyl 2026

Kaynak: `KPSS 2025 KAMU YÖNETİMİ.pdf` — ÖSYM'nin 2025 KPSS A Grubu **Kamu
Yönetimi** alan sınavının 40 sorusu. Bir mobil uygulamadan telefonla çekilmiş
sayfa görüntüleri (Microsoft Lens, 40 sayfa, sayfa başına tek soru).
**Metin katmanı yok** — sorular görüntüden yazıya döküldü.

## 1. Kapsam: 40 sorunun 22'si alındı

Bu sınav bizim müfredatımız değil; Kamu Yönetimi alan sınavı siyasi düşünceler
tarihi, siyaset bilimi, yönetim bilimi ve kentleşmeyi de kapsıyor. Yalnız
derslerimize (Anayasa, İdare Hukuku, Polis Mevzuatı, İnkılap Tarihi) giren
sorular alındı. Karar gerekçeleriyle birlikte `kapsam.json`'da; özeti:

| | soru |
|---|--:|
| Sınavdaki toplam | 40 |
| **Alınan** | **22** |
| Siyasi düşünceler / siyaset bilimi (1-7) | 7 |
| Yönetim bilimi / kamu yönetimi (15-19) | 5 |
| Kentleşme, çevre, AB, OSB, afet (31-36) | 6 |

Dağılım: Anayasa Hukuku 10, İdare Hukuku 7, İnkılap Tarihi 3, 657 DMK 2.

**Sınırdaki üç karar** — alınmadı: 4562 sayılı OSB Kanunu (s31), 4 sayılı CBK
afet yönetimi aşamaları (s35), 2873 sayılı Millî Parklar Kanunu (s36). Üçü de
idari mevzuat ama PAEM idare hukuku müfredatının içinde değil.

**Alınan sınır kararları:** s18 (Fayol ilkeleri) kökünde polis memuru geçtiği
hâlde ALINMADI — konu yönetim bilimi. s20 ve s37 (1876 Kanunuesasi, Sened-i
İttifak) Anayasa Hukuku'nun "Türk anayasa tarihi" başlığına ALINDI.

## 2. Hat

```
sayfa görüntüsü → iki bağımsız transkriber → karşılaştırma
   → mükerrer taraması (banka) → kör çift denetim → hakem
   → açıklama → bankaya in_review
```

### Transkripsiyon
İki bağımsız ajan 22 sayfayı ayrı ayrı okudu. Sonuç **22/22 bayt bayt aynı** —
şapkalı harfler (`hükûmet`, `imkân`, `Malî`, `dâhilindeki`, `âyanlarla`,
`Askerî`, `Millî`) dâhil. Doc 37'de öğrenilen ders gereği bu ittifak kanıt
sayılmadı; anahtarın E şıkkına düştüğü sorulardan ikisi (q13, q27) sayfa
görüntüsüne karşı elle doğrulandı, ikisi de birebir tuttu.

Kaynağın kendine özgü tuzağı: her sayfanın ortasında soluk turuncu bir **ÖSYM
filigranı** metnin üstüne biniyor. Transkript talimatında filigranın kapattığı
kelimenin tahmin edilmemesi ayrıca yazıldı.

### Cevap anahtarı
Her sayfanın altında basılı (`Cevap Anahtarı : C`). 40 sayfanın alt şeridi
kırpılıp tek görüntüde birleştirilerek okundu (`anahtar/tumu.png`);
`anahtar-40.json` ve `anahtar-22.json`. Denetçilerin gördüğü parti
dosyalarında anahtar YOK.

### Mükerrer taraması
Bankada tam eşleşme **0**. İki yakın eş (q10 ~0.61, q24 ~0.57) elle
incelendi; ikisi de aynı konuda başka soru çıktı, elenmedi.

Tarama silinmiş soruları da kapsıyor (`kpss-mukerrer-tara.ts`): kullanıcının
panelden elediği bir soruyu yeni parti diye geri getirmek onun kararını geri
almaktır.

### Kör çift denetim
Üç parti, her partiye iki bağımsız denetçi (toplam 6). Denetçiler cevap
anahtarını görmedi ve 2026'nın yürürlükteki metnine karşı çözdü.

**Sonuç: 22/22 soruda iki denetçi de birbiriyle ve ÖSYM anahtarıyla uyuştu.**
Çelişki 0, anahtar-şüpheli 0, düşük güven 0.

| karar | soru |
|---|--:|
| ONAY | 19 |
| UYARI → hakem | 3 |

### Güncellik ekseni: bu sınavda eskime çıkmadı
Sınav 2025'te yapıldı, denetim 2026'da; aradaki bir yılda 46 mevzuat sorusunun
hiçbirinde cevabı değiştiren ya da metni eskiten bir değişiklik bulunmadı.
Doc 40'ta (2022 sınavı, dört yıl) oran %8'di — fark beklenen yönde.

Denetçi çıktısında eskime bu docta İKİ AYRI ALAN olarak toplandı:
`eskime` (cevabı değiştiren) ve `guncellenecek` (yalnız metni eskiten).
Doc 40'ta bu ayrım tek alandan türetiliyordu ve denetçinin hangisini kastettiği
kaybolabiliyordu (`kpss-denetim-birlestir.ts`).

### Hakem
Üç uyarının üçü de iki hakem tarafından oybirliğiyle **TEMİZ** bulundu:

- **q9, q22** — denetçiler kökün dayandığı madde numarasını tartıştı
  (2820 md 22 mi 27 mi; 657 md 135 mi mülga 136 mı). Kök madde numarası
  vermiyor; aday bunu hiç görmüyor.
- **q24** — A çeldiricisi "Cumhurbaşkanlığı Genel Sekreterliği", 2018'de
  kaldırılmış bir birim. Bu ÖSYM'nin kendi kusuru (sınav 2025'te yapıldı),
  eskime değil. Soru olumlu sorulduğu için ikinci doğru cevap yaratmıyor:
  var olmayan bir birimin ayrı tüzel kişiliği de yok. Doc 40'taki p41 ile aynı
  şekil, aynı karar. **Şık değiştirilmedi** — şık değiştirmek soruyu yeniden
  yazmaktır.

### Açıklamalar
22/22 yazıldı, 17'sinde künye. Beş soruda (q8, q26, q38, q39, q40) dayanak
mevzuat değil teori/tarihsel olgu olduğu için künye alanı boş.

## 3. Bankaya yazılan

```
22 soru · hepsi in_review · doğrudan yayın YOK
   10  Anayasa Hukuku      (T.C. Anayasası 7 · 2820 · 6216 · 6085)
    7  İdare Hukuku        (İdare Hukuku 3 · 5393 2 · 5302 · 5018)
    3  Atatürk İlkeleri ve İnkılap Tarihi
    2  Polis Mevzuatı      (657 DMK)
açıklamalı 22/22 · künyeli 17
```

`sourceLabel`: `2025 KPSS Kamu Yönetimi (ÖSYM)` — son kullanıcıya gösterilmez
(`SettingsService.showQuestionSource`, varsayılan kapalı).

**Beş şık kuralı:** 22 sorunun hepsi beş şıklı; dört şıklı soruya
rastlanmadı.

## 4. Bir tercih notu

Anayasa Hukuku dersinde hem "T.C. Anayasası" (897 soru) hem "Anayasa"
(54 soru) hem "Temel Kavramlar" (4) hem "Yasama" (3) başlıkları var — aynı
konunun dört ayrı kovası. Bu partideki genel anayasa soruları büyük kovaya
("T.C. Anayasası") yazıldı; küçük kovaları büyütmek bölünmeyi kalıcılaştırırdı.
Kullanıcı İnkılap Tarihi'nde aynı bölünmeyi birleştirmişti; Anayasa'da da
benzer bir birleştirme ileride yapılabilir.

## 5. Dosyalar

| | |
|---|---|
| `kapsam.json` | 40 sorunun tek tek alma/almama kararı ve gerekçesi |
| `siniflandirma.json` | 22 sorunun ders/konu ataması (konuId ile) |
| `anahtar-40.json` · `anahtar-22.json` | sayfa altlarından okunan cevap anahtarı |
| `transkript/a.json` · `b.json` | iki bağımsız transkript (birebir aynı) |
| `aday.json` | kanonik metin + anahtar + konu (bankaya yazılan) |
| `parti/k-*-kor.json` | denetçilere verilen kör dosyalar |
| `denetim/k-*-d[12].json` | denetçi çıktıları |
| `denetim/k-*-karar.json` | birleştirilmiş kararlar (+ hakem) |
| `denetim/hakem-h[12].json` | hakem kararları |
| `aciklama/k-*.json` | açıklamalar |
| `soru/` · `sayfa/` · `anahtar/` | sayfa görüntüleri — **commit edilmez** (27 MB), kaynak PDF'ten `pdftoppm -r 200 -png` ile yeniden üretilir |

Hat scriptleri: `kpss-mukerrer-tara.ts`, `kpss-denetim-birlestir.ts`,
`kpss-hakem-uygula.ts` (+ ortak `ogm-transkript-karsilastir.ts`,
`ogm-bankaya-yaz.ts`).

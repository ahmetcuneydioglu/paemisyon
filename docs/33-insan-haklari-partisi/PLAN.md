# Doc 33 — İnsan Hakları Özgün Soru Partisi

Başlangıç: 4 Eylül 2026 · Kaynak: kullanıcının ortak yazarı olduğu İnsan Hakları
soru bankası (72 sayfa PDF). **Kaynak etiketi kullanılmaz** — özgün soru
(kullanıcı kararı, 4 Eyl 2026). Telif sorunu yok; kullanıcı eser sahiplerinden.

## 0. Külliyat

PDF → `scripts/ih-pdf-ayristir.ts` ile ayrıştırıldı. 474 soru çıktı, 3'ü dosya içi
tekrar, bankayla çakışan **0** → **471 aday** (`aday-471.json`).

Ayrıştırma doğrulaması: 22 bölümün hepsinde *soru sayısı = cevap anahtarı sayısı*,
tüm sorular 5 şıklı, boş şık yok, cevapsız soru yok.

## 1. Dayanak haritası

| Bölüm | Soru | Dayanak | Panelde |
|---|---:|---|---|
| b1-b6 | 114 | Doktrin/tarihsel (Rawls, Hart, Dworkin, Vasak, Magna Carta) | yetkili metin YOK |
| b7-b10 | 81 | Anayasa md 146-153 + 6216 s.K. | ✓ |
| b11 | 9 | 3686 s.K. | ✗ PDF gerek |
| b12 | 42 | 6701 s.K. (TİHEK) | ✗ PDF gerek |
| b13-b14 | 56 | 6328 s.K. (KDK) + Anayasa md 74 | ✗ PDF gerek |
| b15-b18 | 72 | BM Şartı, UAD Statüsü, BM sözleşmeleri | ✗ |
| b19-b21 | 81 | AİHS (116 md) | ✓ |
| b22 | 16 | Avrupa Konseyi Statüsü, AB antlaşmaları | ✗ |

Eksik kanun PDF'leri **insan indirir** (mevzuat.gov.tr otomatik erişime kapalı,
Doc 29 §13): `1.5.6701.pdf`, `1.5.6328.pdf`, `1.5.3686.pdf` → `~/Downloads`,
ardından `scripts/mevzuat-toplu-import.ts`.

## 2. Kullanıcı kararları (4 Eyl 2026)

1. **Doktrin bloğu (114) alınacak**, akademik dayanakla denetlenecek — kanun
   maddesi yerine kaynak eser gösterilir.
2. **Konu ağacı değişmiyor**: b19-b21 (81 soru) → *AİHS* konusu; kalan 390 →
   *İnsan Hakları* konusu.
3. Her soru denetimden geçecek, her soruya açıklama yazılacak.

## 3. Denetim hattı

**Kör denetim**: denetçi cevap anahtarını görmez (`parti/bNN-kor.json` içinde
cevap yoktur; anahtar `parti/bNN-anahtar.json` dosyasında ayrı durur). Her bölüm
iki bağımsız denetçiye gider; sonuçlar `denetim/bNN-d{1,2}.json`.

Resmî metin `scripts/madde-ara.ts` ile çekilir (salt okuma):

    npx tsx scripts/madde-ara.ts --kanun Anayasa --md 148
    npx tsx scripts/madde-ara.ts --kanun 6216 --ara "bireysel başvuru"

Karar birleştirme: `scripts/ih-denetim-birlestir.ts <bolum|--hepsi>`

| Karar | Anlamı |
|---|---|
| ONAY | iki denetçi de anahtarla aynı, güven yüksek/orta |
| ZAYIF-ONAY | cevap tutuyor ama en az bir denetçi düşük güvende |
| UYARI | cevap tutuyor, denetçi kusur bildirdi → insan bakar |
| ÇELİŞKİ | denetçiler birbiriyle/anahtarla ayrıştı → 3. tur çürütme |

## 4. MUTLAK KURAL — denetim turlarında yazma yok

Denetçi ajanlar DB'ye tek satır yazmaz. `--yaz` / `--apply` / `APPLY=1` /
`PUBLISH=1` yasak. Bankaya yazma yalnız denetim bittikten sonra, tek script'le
ve `in_review` durumunda yapılır; yayını kullanıcı panelden verir.

---

## 5. Yürütme kaydı (4 Eylül 2026)

### 5.1 Bölüm haritası — etiketler bir kayıyordu

Kitabın sayfa üstbilgisi bir ÖNCEKİ bölümün başlığını taşıyor. İlk ayrıştırmada
üç bölümün dayanağı yanlış saptandı; denetçi uyarısıyla yakalandı:

| Bölüm | Sanılan | Gerçek |
|---|---|---|
| b14 | 6328 (KDK) | BM sözleşme ve belgeleri |
| b18 | BM mekanizmaları | Avrupa Konseyi ve organları |
| b21 | AİHM | Avrupa Toplulukları Adalet Divanı (ABAD) |

Doğru etiketler `parti/bNN-kor.json` içindeki `baslik`/`kaynakKodu` alanlarında.

### 5.2 Ayrıştırıcı kusuru — bilgi kutusu son şıkka yapışıyordu

Kitap bazı soruların altına bilgi kutusu koyuyor; naif "devam satırı" mantığı
bunu E şıkkına ekliyordu (`"E) Otuz Herkes, Anayasada güvence altına…"`).
**37 soru** etkilenmişti. Çözüm üç katmanlı (`ih-pdf-ayristir.ts`):

1. Beş şık tamamlanmışsa ve son şık cümle bitirmişse → not
2. Sütun genişliğinin %75'inin altında biten satırdan sonrası → not
3. Yine de şişen son şık, kendi ham satırına kırpılır

Ayrılan 37 not `kitap-notlari.json` dosyasında — açıklama üretiminde kullanıldı.

### 5.3 Denetçiler DB'ye bağlanmaz

12 paralel denetçi çalışırken bağlantı sayısı 14'e çıktı (havuzda 15 slot,
canlı kullanıcılarla ORTAK). Madde metinleri `mevzuat/*.md` dosyalarına
döküldü; denetçiler `grep`/`sed` ile okuyor. `scripts/madde-ara.ts` insan
kullanımı için duruyor.

### 5.4 Hakem turu sonuçları

Çelişkiler iki hakemle çözüldü; **ancak ikisi mutabıksa** karar bağlayıcı
(`scripts/ih-hakem-topla.ts`, birikimli).

| Soru | Karar | Not |
|---|---|---|
| b8-13 | kitap haklı | 6216 md 2/1-ç tanımı "altı üye" diyor |
| b19-5 | **anahtar hatalı** | Türkiye AİHS'i 1950'de imzaladı, kitap 1952 diyor |
| b20-23 | kusurlu | AİHS md 27 ve 28 iki şıkkı da doğru kılıyor |
| b12-15 | kitap haklı | |
| b12-2, b18-7 | kusurlu | |
| b20-41, b20-42 | **anahtar hatalı** | |

### 5.5 Hat (çalışma sırası)

```
ih-pdf-ayristir.ts      PDF metni → sorular + kitap notları
ih-mukerrer-tara.ts   bankaya + kendi içine karşı mükerrer taraması
                      → parti/bNN-kor.json (kör) + bNN-anahtar.json (ayrı)
[denetçi ajanlar]     → denetim/bNN-d{1,2}.json
ih-denetim-birlestir  → denetim/bNN-karar.json  (hakem kararlarını uygular)
ih-hakem-parti        çelişkileri toplar → parti/b91-hakem.json
[hakem ajanlar]       → denetim/b91-hakem{1,2}.json
ih-hakem-topla        mutabık olanları bağlar → denetim/hakem-kararlari.json
[açıklama ajanlar]    → aciklama/bNN.json
ih-kunye-dogrula      künyeleri resmî metinde ARAR (mekanik, LLM yok)
ih-rapor              → RAPOR.md (UYARI/ÇELİŞKİ/KUSURLU — insana giden)
ih-bankaya-yaz        ONAY + açıklaması olanlar → banka (in_review)
```

### 5.6 Gömülü font madde işareti (U+F050)

Kitabın PDF'i madde işareti için **kendi fontuna gömülü glif** kullanıyor
(Private Use Area, U+F050). O font dışında karşılığı yok: panelde kutu,
uygulamada soru işareti çıkıyor. Ayrıca PDF metninde maddeler tek satıra
diziliyor.

Onarım (`scripts/ih-madde-isareti-onar.ts`, yedek `madde-isareti-yedek.json`):
PUA → `•`, her madde ayrı satır, kapanış sorusu boş satırla ayrılıyor.
Kök değiştiği için `contentHash` yeniden hesaplanır. 5 sürüm onarıldı
(1'i yayında), hat dosyalarında 16 alan düzeltildi.

**Render tarafında değişiklik gerekmedi:** `exam-player`, `session-player`,
`review-list`, `daily-quiz`, `question-of-day` zaten `whitespace-pre-line`
kullanıyor; Flutter `Text` widget'ı `\n`'i doğrudan basıyor.

Kaynak kural `scripts/madde-listesi-duzelt.ts`'e alındı ve ayrıştırıcıya
bağlandı. **Sıra önemli:** önce `\s{2,}` boşluk temizliği, SONRA liste kurulumu
— ters sırada temizlik listedeki boş satırı yiyor ve kapanış sorusu son maddeye
yapışıyor (bu hata bir tur yaşandı).

Yeni bir kitap partisi işlerken PUA taraması `scripts/pua-tara.ts` ile
yapılır; farklı kitap farklı kod noktası kullanabilir.

---

## 6. Parti kapanışı (4 Eylül 2026)

| | Soru | Durum |
|---|---:|---|
| Bankaya alınan (ONAY) | 368 | yayınlandı |
| Bankaya alınan (kurtarma A+B+C+D) | 71 | onay kuyruğundan geçti |
| **Toplam alınan** | **439** | %93 |
| E — editoryal karar gerektiren | 31 | **kullanıcı kararı: PAS** |
| F — kurtarılamaz | 1 | **PAS** |

**Kullanıcı kararı (4 Eyl 2026):** E ve F grubu alınmayacak. Gerekçe: banka
zaten yeterli hacimde; bu 32 sorunun düzeltilmesi soruyu neyi ölçtüğünü
değiştiren yazarlık kararları gerektiriyor ve kazanç (%6 hacim) riski
karşılamıyor.

E grubundaki kusur tipleri (ileride ele alınmak istenirse
`kurtarma/parca-*-oneri.json` içinde her soru için somut öneri hazır):

| Tip | Soru | Risk |
|---|---:|---|
| İki cevap birden savunulabilir | 14 | aday doğru bildiği hâlde yanlış sayılır |
| Hiçbir şık doğru değil / anahtar yanlış | 9 | aday yanlış bilgi öğrenir |
| Cevap doğru, kök mevzuatı yanlış aktarıyor | 5 | yanlış kural öğretilir |
| Dayanak elde yok, doğrulanamıyor | 2 | bilinmiyor |

Bu sorular bankaya **hiç girmedi**; rapor ve öneri dosyaları arşiv olarak durur.

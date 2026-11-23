# "Özgün soru" etiketli sorular — kör denetim raporu (21 Kasım 2026)

Kapsam: kaynak etiketi "Özgün soru" ile başlayan yayındaki 218 soru (Kabahatler 79, PVSK 77, Anayasa 15, CMK 10,
TCK 10, İnkılap Tarihi 9, İYUK 8, 1774 4, 5442 3, 6458 3). Girdi: `soru-denetim-girdisi.ts` (anahtar girdide YOK).
Yedi denetçi soruları kör çözdü ve her şıkkı bankadaki güncel madde metniyle karşılaştırdı; anahtarla karşılaştırma
ana oturumda yapıldı. Yazım yok; karar kullanıcıda.

| | Soru |
|---|---|
| Denetçinin kör cevabı anahtarla aynı | 218 / 218 |
| Tek cevap, madde metninden doğrulandı | 201 |
| Metin yetmiyor (cevap bilgiye dayalı) | 16 (9'u İnkılap Tarihi; 7'si bankada olmayan kanunlar) |
| Birden çok yanlış/doğru şık | 1 |

Bankada olmayan kanunlara dayanan 7 soru ana oturumda mevzuat.gov.tr konsolide metinleriyle (4207, 4250, 7258, 2860,
2920, 5199, 4733) ayrıca karşılaştırıldı.

## Arşiv önerisi (4)

| Soru | Dayanak | Gerekçe |
|---|---|---|
| `492b4f42` | 5326 md 27 / 6458 md 102 | "Hangisi yanlıştır": anahtar D doğru biçimde yanlış; ancak B ("6458 — idare mahkemesine 30 gün içinde başvuru") de madde metninde yok. 6458 md 102/5'teki otuz gün ÖDEME süresidir. İki yanlış ifade. (Aynı hata 20 Kas'ta arşivlenen b178c67d'de vardı.) |
| `a399ab37` | 6458 md 102 | Anahtar, 6458 md 102 cezalarında itiraz merciinin idare mahkemesi (30 gün) olduğu kabulüne dayanıyor; maddede kanun yolu düzenlenmiyor. |
| `30a457d0` | 2860 md 29 | Eskimiş: anahtar "toplanan yardıma elkonularak mülkiyetin kamuya geçirilmesi" diyor; md 29'un üçüncü ve sekizinci fıkraları Anayasa Mahkemesinin 18/1/2024 tarihli kararıyla iptal edildi, güncel metinde elkoyma/mülkiyetin kamuya geçirilmesi hükmü yok. (İptal edilen fıkraların içeriği güncel metinden değil hafızadan; elkoyma ibaresinin metinde kalmadığı doğrulandı.) |
| `a5274e89` | Anayasa md 101 | Kök yüzde beş oy şartını "siyasi parti grupları"na bağlıyor; md 101/3'te parti grupları için oy şartı yok. Cevap değişmiyor ama kök maddeyi yanlış öğretiyor. |

## Doğrulananlar (bankada olmayan kanunlar)

- `6f5938d5` (7258 md 5/1-d: oynayana cezayı mahallin en büyük mülki idare amiri verir) — doğrulandı.
- `9234e990` (4250: on sekiz yaşından küçüğe satış yasağı; beş yıl içinde üçüncü defada satış belgesi iptali; mahalli mülki amir) — doğrulandı.
- `3dc788e5`, `5e57ed04` (4207 md 5/16: bir yıllık dönemde tekerrürde bir kat, ikinci tekerrürde iki kat) — doğrulandı; sürücü koltuğunda cezayı kolluğun verdiği md 5/1'in Kabahatler md 39'a yollamasına dayanıyor.
- `fa8fec6c` (2920 md 144: izinsiz İHA uçurana mahallin en büyük mülki idare amiri ceza verir) — doğrulandı.
- `61cf72cf` (5199 Geçici 3: ağızlıksız/tasmasız dolaştırma cezası) — yasak ve ceza doğrulandı; cezayı veren makam (mülkî amir) metinden doğrulanamadı.

## Notlar

- "2026 İPC uygulama tablosu" etiketli 23 sorunun hiçbiri tutar sormuyor; cevaplar kanun metninden çıkıyor.
- 5326 md 22 ya da md 27'ye bağlı altı sorunun gerçek dayanağı bankada olmayan kanunlar (2860, 4207, 2920, 5199, 7258, 4250).
  **21 Kas 2026 (kullanıcı onayı):** yayında kalan beşinde (`fa8fec6c`, `61cf72cf`, `3dc788e5`, `6f5938d5`, `9234e990`) 5326 md 22 bağı kaldırıldı; altıncısı (`30a457d0`, 2860) zaten arşivde. Ayrıca `3dea855a`'nın birincil bağı md 22'den md 32'ye alındı (md 22 ilgili madde). Plan: `planlar/2026-11-21-ozgun-bag.json`.
- 9 İnkılap Tarihi sorusu mevzuatla doğrulanamaz; denetçilerin bilgisine göre cevapları tartışmasız.
- Kör çözümde anahtarla uyuşmayan soru çıkmadı; 20 Kas'ta arşivlenen b178c67d ile bu rapordaki dört soru dışında bu grupta kusur görülmedi.

## 23 Kas 2026 — dört kanun bankaya alındı (kullanıcı onayı)

- mevzuat.gov.tr konsolide metninden (`mevzuat-kaynaktan-json.ts` → `mevzuat-json-import.ts`) Polis Mevzuatı dersine: 4207 (15 madde), 4250 (50), 5199 (40), 7258 (13). Madde JSON'ları `mevzuat-kaynak/` altında. 4250'de madde başlığı yok (kaynaktaki başlıklar kısım başlığı), başlıksız aktarıldı.
- Bağlanan sorular (`planlar/2026-11-23-ozgun-yeni-kanun-bag.json`): `3dc788e5` → 4207 md 5; `6f5938d5` → 7258 md 5; `9234e990` → 4250 md 7; `61cf72cf` → 5199 Geçici md 3; `5e57ed04`'e 4207 md 5 ilgili madde olarak eklendi. `fa8fec6c` (2920) maddesiz kaldı; 2920 alınmadı.
- `61cf72cf`: md 25 cezayı "17 nci maddede belirtilen denetime yetkili merci"ye veriyor; md 17'ye göre yetki Bakanlığındır, mahallin en büyük mülkî amirine DEVREDİLEBİLİR. Şıktaki "mülkî amir tarafından" ifadesi devir hâlinde doğru; metin tek başına bunu kesin kılmıyor.
- Dipnot kaybı: 7258'de md 1, 3, 4, Ek 2, Geçici 1–3 kaynakta "Mülga (KHK-703)" görünüyor; Anayasa Mahkemesi 7/12/2023 tarihli kararıyla (E: 2021/125, K: 2023/213) bu yürürlükten kaldırmayı iptal etmiş (dipnotta; bankada dipnot yok). Md 5 etkilenmiyor.

## 23 Kas 2026 — iki soru daha arşivlendi (kullanıcı kararı)

- `3dc788e5` (4207, sürücü koltuğu): anahtar "kolluk verir"; md 5/1 yalnız 5326 md 39'a gönderir, md 39 hususi araç için makam saymaz.
- `61cf72cf` (5199, tehlikeli ırk): anahtar "mülkî amir verir"; md 25 → md 17'ye göre yetki Bakanlıkta, mülkî amire devredilebilir.
- Plan: `planlar/2026-11-23-ozgun-arsiv.json`; yedek ve defter `arsiv-2026-11-23/`.

## 23 Kas 2026 — 2920 bankaya alındı (kullanıcı onayı)

- 2920 sayılı Türk Sivil Havacılık Kanunu (154 madde) mevzuat.gov.tr konsolide metninden Polis Mevzuatı dersine alındı (`mevzuat-kaynak/2920.json`). İçe aktarmada md 150'nin sonuna yapışan ceza tutarı cetveli kesildi; "Son Hükümler" kısım başlığı Ek 1'in başlığından çıkarıldı.
- `fa8fec6c` → 2920 md 144 (birincil). Anahtar ("mülkî amir") md 144'le uyumlu. Konu özeti ve bilgi kartı yok.

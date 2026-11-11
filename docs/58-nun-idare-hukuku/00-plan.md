# Doc 58 — Nun Akademi "İdare Hukuku 333 Çözümlü Soru" alımı (12 Kas 2026)

Kaynak: Nun Akademi YouTube kanalının hâkimlik sınavı için hazırladığı 333
soruluk PDF (Ekim 2026). Kullanıcı yayıncıyla görüştü: PDF herkesin kullanımına
açık, alınmasında sakınca yok (kullanıcı beyanı, 11 Kas 2026). Sorular
YAYINCININDIR — AI üretimi değil; biz yalnız CEVAP ANAHTARINI çıkarıyoruz.
Cevaplar PDF'te yok; 7 çözüm videosunda (1/7 = soru 1–33) anlatılıyor.

## Hat (pilot: soru 1–33)
1. PDF → aday/nun-001-033.json (kök + beş şık, PDF metni AYNEN; düzeltme yok).
2. İki BAĞIMSIZ çözücü (altyazıyı görmez) → cozum/cozucu-1.json, cozucu-2.json.
3. Altyazı gözcüsü: altyazi/video1.txt (YouTube otomatik Türkçe altyazı, yt-dlp)
   → anlatıcının her soru için söylediği cevap → cozum/altyazi.json.
   Anlatıcı şıkları 1–5 diye okur: 1=A, 2=B, 3=C, 4=D, 5=E.
4. Birleştirme: üçü aynıysa anahtar kesin. Ayrışma → altyazı gözcüsü SON ONAYI
   verir (kullanıcı kararı): video ne diyorsa o; video belirsizse soru alınmaz.
5. PAEM süzgeci + banka mükerreri (İdare Hukuku dersi) → in_review.
   sourceLabel: "Nun Akademi — İdare Hukuku 333 Çözümlü Soru — No <n>"
   (kullanıcıya gösterilmez).

## Pilot sonucu (12 Kas 2026, soru 1–33)
- Ayıklama 33/33 (kökü "A…" ile başlayan 7 soruda kök A şıkkına kayıyordu —
  ayrıştırma kökün sonundaki soru numarasına bağlandı).
- Anahtar: iki bağımsız çözücü + altyazı 33/33 aynı; altyazı 33/33 "kesin".
- Uygunluk: 22 KABUL, 11 RED (8 banka mükerreri — 7 ve 21 Anayasa bankasıyla,
  2 düşük değer, 1 aday içi tekrar). Hepsi "İdare Hukuku" konusu.
- Açıklama: anlatıcı 9 (ESK 2001/2010), 33 (ikame yasağı) ve 13'te doktrinden
  ayrıldı; açıklamalar doktrine göre. 5-C şıkkı tartışmalı — yayın öncesi insan bakışı.
- 22 soru in_review yazıldı (`scripts/nun-bankaya-yaz.ts nun-001-033`), 7 künye.
- Araç: yt-dlp (Homebrew) — yalnız otomatik Türkçe altyazı indirilir.

## 34–333 sonucu (12 Kas 2026)
Video 2–7 kanalın ÜYELERİNE kapalı (yt-dlp: "available to this channel's members")
— altyazı doğrulaması yapılamadı. Kullanıcı kararı: üç bağımsız çözücü, oy birliği
(`anahtar-birlestir.py`; biri "dusuk" ya da ayrışma → soru alınmaz). Etikete
"(anahtar: 3 çözücü)" eklendi. PDF ligatürleri (ﬂ→fl) düzeltildi (pilot No 9 bankada da).

| Parti | Kesin anahtar | KABUL | in_review |
|---|---:|---:|---:|
| 34–133 | 92 | 50 | 50 |
| 134–233 | 89 | 74 | 74 |
| 234–333 | 85 | 35 | 35 |
| **Toplam (pilot dahil)** | | | **181** |

RED'lerin çoğu banka mükerreri (İdare Hukuku, Anayasa, Polis Mevzuatı 657/4483
bankaları). 657 (7) ve 4483 (1) kabulleri Polis Mevzuatı dersindeki konularına yazıldı.
Yayın öncesi insan bakışı: metni repoda olmayan kanunlardaki sayılar (4734, 2942,
3194, 1 sayılı CBK) açıklamada metinden doğrulanmadı — 136, 139, 140, 142, 147,
162, 163, 167, 168, 170, 171, 174, 177, 183, 274; doktrin tartışmalı: 5, 86, 92,
110, 111, 127, 149, 169, 190, 197, 272, 314.

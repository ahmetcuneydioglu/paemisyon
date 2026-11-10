# 19 — Liderlik v2 (Expo) · 5 Kas 2026

Figma (PaemisyonNew `91lHqxSXl25Gz585TnXqfi`, sayfa **Liderlik**, bölüm `177:1079`):
Liderlik · Koyu `172:990` · Açık `175:992` · Puanı yok (koyu) `176:989` · Rütbe sistemi
(sheet, koyu) `183:989` · Lig renkleri `177:989`. **Onay: kod bu çizime göre yazıldı.**

## 1. Neden

İlk Expo aktarımı web liderliğini birebir taşıdı (lig degradeli piller, altın hale, XP/başarı
alt satırı, tablo başlığı, üçlü istatistik şeridi). Telefonda karmaşık göründü; büyük yazı
ayarında sabit yükseklikli piller kırpıldı, "puan" taştı. Kullanıcının istediği şey web'deki
**renk sistemi**ydi, yerleşim değil.

## 2. Karar

- **Lig yalnız renktir** ve yalnız iki yerde yaşar: avatar halkası (2 pt) ve rütbe adı metni.
  Koyu şemada açık ton, açık şemada koyu ton (beyaz yüzeyde okunur). Pil, hale, degrade yok
  (Doc 49/16 §7 "Yapma" listesiyle uyumlu).
- **Kürsü tek kart** (surface, 1 px line): 2·1·3; 1. 72 pt avatar + taç (accent), 2./3. 56 pt;
  sıra rozeti avatarın sağ altında; ad Inter 600 15; rütbe 12/500 lig renginde; puan Lora 600 22
  + "puan" 12. Aynı blokta üç yazı boyu (15 · 12 · 22).
- **Liste** başlıksız: sıra (inkSoft 15) · halka 36 · ad + lig renkli rütbe · puan. "Sen" satırı
  accentSoft zemin + SEN etiketi. XP/başarı alt satırı ve sütunlar kaldırıldı.
- **Senin sıran** (altta sabit, accent %40 kenar): listedeki satırla AYNI dil (sıra küçük ve soluk;
  "SIRAN #51" büyük bloğu kullanıcı isteğiyle kaldırıldı) + takip cümlesi + 4 pt lig renkli
  ilerleme + "Bir üst rütbeye N XP". Puanı yoksa sıra "—", 0 puan, "Bir tur çöz, tabloda yerini al."
- **Rütbe sistemi sayfası**: başlık çubuğunda bilgi düğmesi → kit `Sheet`: puan/XP farkı (katsayı
  sunucudan), senin rütben + ilerleme, 8 rütbe kataloğu (halka, ad, lig, eşik XP; ulaşılmamışlar
  inkSoft), "Anladım".

## 3. Sözleşme

`GET /progress/leaderboard` cevabına **`ranks`** (`{level, name, minScore}[]`, `rank.logic`
RANKS) ve **`activeDayPoints`** eklendi. Rütbe adları ve eşikler SUNUCUDA; istemci yalnız
seviye → renk eşlemesini tutar (`src/theme/rank-tier.ts`). Eski sunucuya karşı yedek eşik dizisi
yalnız "bir üst rütbeye kaç XP" için kalır; katalog yoksa sheet'te liste gizlenir.

## 4. Kodda

- `src/components/domain/leaderboard.tsx`: `RankAvatar`, `RankLabel`, `LeaderboardPodium`,
  `LeaderboardList`, `LeaderboardMyRank`, `RankSystemSheet`. Dinamik yazı tavanı 1,3× (kit
  `AppText` artık `maxFontSizeMultiplier` prop'unu üstteki varsayılanla ezmiyor — `BigNumber`'ın
  1,2× isteği de bu düzeltmeyle fiilen uygulanır).
- Kit: `ProgressBar` `color` / `track` parametreleri (lig rengi dolum, line rayı).
- Galeri: Liderlik bölümü (8 rütbe metni, 4 avatar boyu, kürsü, liste, sen kartı — puanı yok dahil).

## 5. Cihazda bakılacaklar → simülatör turu (10 Kas 2026)

iPhone SE (3. nesil, 375 pt) simülatöründe galeri Liderlik bölümü ve Rütbe sistemi sayfası;
açık + koyu şema; yazı boyutu Large ve AX3 (accessibility-extra-large).

- **SE genişliği, kürsü adları:** uzun adlar ("muhammedozdogan39", "Mustafa ÖZDALAR") tek satırda
  üç noktayla kısalıyor. Sorun yok.
- **Açık şema okunurluğu — DÜZELTİLDİ:** rütbe adı 12 pt metin; eski açık tonlardan Altın
  `#B7791F` ve Elmas `#0891B2` beyaz kartta 3,6:1'de kalıyordu (AA 4,5:1). "Sen" satırının
  accentSoft zemininde (#F6E9D2) Demir, Bronz ve Gümüş de eşiğin altındaydı. Yeni açık tonlar
  (her biri beyazda ve #F6E9D2'de ≥ 4,5:1, `rank-tier.test.mjs` bunu sınar):
  Demir `#5A697E`, Bronz `#8B4E1C`, Gümüş `#606977`, **Altın `#866300`** (zeytin-altın; Bronz'dan
  ayrışsın diye ton kaydırıldı), Zümrüt `#04704F`, Safir `#1E40AF` (aynı), Ametist `#6D28D9`
  (aynı), **Elmas `#06718B`**. Koyu şema tonları değişmedi. Web'in pil degradesi değişmedi (orada
  renk zemindir, yazı `ink`). Figma "Lig renkleri" 177:989 açık tonları henüz eski değerlerde.
- **AX3, sıra numarası — DÜZELTİLDİ:** sabit 22 pt sütunda iki basamaklı sıralar ("12", "51")
  iki satıra kırılıyordu (listede ve "senin sıran" kartında). Sütun artık `minWidth: 22` +
  tek satır.
- **AX3, kürsü puanı — DÜZELTİLDİ:** üç sütunun "1.316 puan" satırları yan sütuna taşıp
  çakışıyordu. Kürsüde yazı ölçeği 1,15'i aşınca "puan" üç sütunda birden sayının altına iner;
  sayı tek satırda kalır, gerekirse %75'e kadar küçülür. Normal boyda Figma'daki yan yana düzen.
- **AX3, Rütbe sistemi sayfası:** katalog satırları ve XP sütunu (12.000 XP) taşmıyor.
- Kapsam dışı, ayrıca not: Bugün v3 parçaları AX3'te bozuluyor (geri sayım satırında "PAEM" ile
  "Bu hafta" üst üste biniyor, gün kutularında "Cum"/"Cmt" kırılıyor; "Bugünün tahtası"nda
  "1." kırılıyor). Bu PR'ın değil, ana daldan.
- Gerçek liderlik ekranı (oturum açık, sunucudan `ranks`) bu turda açılmadı: simülatörde oturum
  yoktu. Galeri aynı parçaları kullanıyor.

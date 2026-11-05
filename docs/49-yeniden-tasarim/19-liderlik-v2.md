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

## 5. Cihazda bakılacaklar

iPhone SE genişliğinde kürsü adlarının kırpılması (ellipsis), büyük yazı ayarı (AX3) ile sabit
kart yüksekliği, açık şemada Altın/Gümüş rütbe metninin okunurluğu.

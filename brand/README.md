# Paemisyon Marka Varlıkları — Nişangâh P

Ana ikon: **Nişangâh P** (Faz 2, varyant A — navy gradyan zemin, beyaz P,
amber #F3A93C merkez). Konsept raporu ve usta çizim onayı: 13 Ağu 2026.

## Kaynaklar (tek doğruluk noktası)

| Dosya | Ne |
|---|---|
| `app-icon-master.svg` | 1024 ızgara, tam kanama ana ikon (iOS/Play/favicon kaynağı) |
| `app-icon-adaptive-fg.svg` | Android adaptive ÖN katman (şeffaf, güvenli alana %92 ölçek) |
| `splash-glyph.svg` | Splash glifi (şeffaf; zemin platformdan #1B3A6B gelir) |

Renkler: zemin `#27548F→#1B3A6B→#122A52`, glif `#FFFFFF`, nokta `#F3A93C`,
adaptive/splash zemini `#1B3A6B` (design token `AppColors.seed`).

## Yeniden üretim

```bash
cd brand
npx sharp-cli -i app-icon-master.svg -o out/app_icon_1024.png resize 1024 1024
npx sharp-cli -i app-icon-adaptive-fg.svg -o out/adaptive_fg_1024.png resize 1024 1024
cp out/app_icon_1024.png out/adaptive_fg_1024.png ../apps/mobile/assets/icon/
cd ../apps/mobile && dart run flutter_launcher_icons   # iOS seti + Android mipmap'ler
```

Splash PNG'leri (120/180/240/360/480) `splash-glyph.svg`'den üretilir ve
iOS `LaunchImage.imageset` + Android `drawable-*/launch_image.png` içine kopyalanır.
Web: `favicon.ico` (`png-to-ico` ile 32+16), `src/app/apple-icon.png` (180).

Play Store konsol görseli: `out/play_store_512.png`.

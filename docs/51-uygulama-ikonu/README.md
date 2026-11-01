# Doc 51 — PAEMisyon uygulama ikonu ("Rütbe")

Tarih: 24 Eki 2026. Figma dosyası: **PAEMisyon — Uygulama İkonu**
https://www.figma.com/design/cLaFSekHPMGK2tCqmcBVAV (anahtar `cLaFSekHPMGK2tCqmcBVAV`, ahmet cuneydioğlu's team / Drafts).

## Sayfalar

| Sayfa | İçerik |
|---|---|
| PAEMisyon — İkon Tasarım Keşfi | 10 konsept (K1–K10) × 1024/180/60/32 boyut testi; 3 finalist × 6 varyasyon (ana, alternatif yön, tek renk, açık zemin, koyu zemin); değerlendirme ve seçim gerekçesi |
| PAEMisyon — Ana Uygulama İkonu | Bölüm A: bileşen `İkon / PAEMisyon — Ana (1024)` + Android ön plan / arka plan / tek renk katmanları + siyah/beyaz silüet (export ayarları hazır). Bölüm B: tek başına, iPhone ana ekranı, benzer uygulamalarla karşılaştırma (temsilî), açık/koyu küçük boyutlar |
| PAEMisyon — İkon Teslim Paketi | Nihai ikon, HEX paleti (paint stillerine bağlı), katmanlar, iOS/Android güvenli alan kılavuzu, minimum boyut, export ayarları, geliştirici notları |

## Nihai tasarım

Krem **kama** (yükseliş, PAEM'in A'sı) içinde amber **rütbe çevronu**, lacivert zemin.
Kama köşeleri 64 px, çevron köşeleri 24 px (1024 ızgarasında). Sembol 672×608 px
(x 176–848, y 200–808); Android ön planında %68 ölçek (güvenli bölge 66 dp içinde).

| Rol | HEX | Figma stili |
|---|---|---|
| Zemin / Android arka plan | `#121A26` | D Nöbet Marka/Lacivert |
| Kama | `#F5F0E5` | D Nöbet Marka/Krem |
| Rütbe çevronu | `#E8B46C` | D Nöbet Marka/Amber |
| Tek renk (Android monochrome, favicon açık) | `#FFFFFF` | — |
| Tek renk (baskı, açık zemin) | `#111111` | — |

Paletin tamamı uygulamanın onaylı Nöbet değişkenleriyle (`color/bg`, `color/ink`, `color/accent`) aynıdır.

## Bu klasördeki dosyalar

| Dosya | Kaynak çerçeve | Not |
|---|---|---|
| `icon-1024.png` | İkon / PAEMisyon — Ana (1024) | 1024×1024, **alfasız** (App Store şartı), Expo `icon` ve Flutter `image_path` |
| `android-icon-foreground.png` | Android — Ön plan katmanı | 1024×1024 şeffaf, sembol %68 |
| `android-icon-background.png` | Android — Arka plan katmanı | 1024×1024 düz `#121A26` |
| `android-icon-monochrome.png` | Android — Tek renk katmanı | 1024×1024 şeffaf, beyaz silüet |
| `ikon-1024.svg` | Ana ikon | Tam ikon vektörü (web/og) |
| `sembol-siyah-siluet.svg` / `sembol-beyaz-siluet.svg` | Silüet çerçeveleri | Zeminsiz sembol; favicon 16/32, bildirim, baskı |
| `sembol-kama-negatif-cevron.svg`, `sembol-rutbe-cevronu.svg` | Ana ikonun iki katmanı | Ayrı ayrı |

PNG'ler Figma MCP `download_assets` ile 1x dışa aktarıldı; `icon-1024.png` ve arka plan
PIL ile `#121A26` üzerine düzleştirildi (Figma PNG'leri alfa kanalı taşır).

## Uygulama (henüz YAPILMADI — ayrı karar)

Expo `apps/app/app.config.ts`:
- `icon: ./assets/icon.png` ← `icon-1024.png`
- `android.adaptiveIcon.{foregroundImage,backgroundImage,monochromeImage}` ← üç katman
- `android.adaptiveIcon.backgroundColor: "#17161A"` → `"#121A26"`
- `splash-icon.png` bu paketin dışında; istenirse beyaz silüetten üretilir.

Flutter `apps/mobile/pubspec.yaml` (`flutter_launcher_icons`): `image_path` ← ana,
`adaptive_icon_foreground` ← ön plan, `adaptive_icon_background: "#121A26"`, sonra
`dart run flutter_launcher_icons`.

Aynı bundle id'yle mağaza sürümünün ikonu değişir; yayın kararı kullanıcınındır.

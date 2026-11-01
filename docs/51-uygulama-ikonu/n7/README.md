# N7 — Nişangâh P × Nöbet (SEÇİLEN, 24 Eki 2026)

Canlı ikonun P'si (gövde 119.5×565 r59.7, halka r162.1/kalınlık 119.5) aynen korunur;
merkez nokta yerine amber yıldız (çap 166, iç yarıçap %46, köşe 8), zemin lacivert
gradyan #1E2B3C → #121A26 → #0C1119 + halkanın altında %14 amber ışık. Glif optik
merkezde (brand/splash-glyph.svg ile aynı kaydırma).

Figma: sayfa "Nişangâh P — Nöbet uyarlaması (canlı ikon)" › bileşen
`Nişangâh P / N7 Yıldız merkez + derin zemin` (24:221) ve bölüm "N7 — Üretim katmanları".

| Dosya | Kullanım |
|---|---|
| `icon-1024.png` | iOS / Expo `icon` — alfasız |
| `android-icon-foreground.png` | Expo `adaptiveIcon.foregroundImage` — şeffaf, glif %92 |
| `android-icon-background.png` | Expo `adaptiveIcon.backgroundImage` — gradyan, alfasız |
| `android-icon-monochrome.png` | Expo `adaptiveIcon.monochromeImage` — beyaz, şeffaf |
| `ikon-1024.svg` | Tam ikon vektörü (web / og) |
| `sembol-siyah-siluet.svg`, `sembol-beyaz-siluet.svg` | Favicon, bildirim ikonu, splash glifi kaynağı |

Uygulandı (commit yok): `apps/app/assets/icon.png` + üç Android katmanı,
`app.config.ts` adaptiveIcon.backgroundColor → #121A26. 24 Eki 2026'da telefona
dev build olarak kuruldu (a0-guven-onarimi worktree, xcodebuild + devicectl).

Yapılmadı: `brand/` kaynak SVG'leri, Flutter (`apps/mobile`) ikonu, splash glifi,
Android bildirim ikonu, web favicon/apple-icon.

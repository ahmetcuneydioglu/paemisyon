# Doc 49 / 03 — F0: Token v3 ("Nöbet") ve üç hedefe üretim

Tarih: 16 Ekim 2026. Dal `claude/f0-token-v3`. Plan: `00-plan.md` §1 ve §3 F0.

## Ne yapıldı

- `packages/tokens/design-tokens.json` v3: Nöbet kimliği (21 renk tokenı × iki şema,
  8 tipografi rolü ve iki aile, boşluk, köşe, ölçü, hareket, erişilebilirlik eşikleri) ve
  **kontrast çiftleri listesi** (18 çift). Eski dosya `design-tokens.v2.json` olarak
  referans için duruyor; Flutter ve mevcut web hâlâ ona göre yazılı.
- `packages/tokens/build.mjs`: bağımlılıksız üretim. `build/tokens.css` (CSS değişkenleri,
  koyu varsayılan, `data-theme` ile zorlama, sistem tercihi, azaltılmış hareket),
  `build/tokens.ts` (tipli sabitler; Expo ve web bileşenleri için), `build/tokens.dart`
  (yalnız bakım süresince Flutter paritesi). `--check` kipi CI'da kaynakla eşitliği
  doğrular; üretilenler repoda tutulur.
- `packages/tokens/kontrast.test.mjs`: her çift iki şemada WCAG eşiğini (metin 4.5,
  büyük 3.0) geçmeli; ayrıca hex geçerliliği, tipografi tutarlılığı, dokunma hedefi.
- CI'a `tokens` işi; kökte `tokens:build`, `tokens:check`; `check` artık token'larla başlar.

## Kontrast testinin ilk bulgusu

Açık temada üç değer eşiğin altındaydı ve koyulaştırıldı (koyu tema değişmedi):

| Token | Eski | Yeni | Çift ve oran |
|---|---|---|---|
| `accent` (light) | #C9633A | #B5532E | beyaz üstünde 3.94 → 4.95; zeminde 3.38 → 4.25 |
| `accentInk` (light) | #A54E2A | #9C4827 | accentSoft üstünde 4.49 → 4.96 |
| `warning` (light) | #B9853A | #A87530 | zeminde 2.78 → 3.43 |

Keşif tuvalindeki açık tema görselleri eski değerlerle çizildi; fark gözle zor ayırt
edilir, tuval güncellenmedi. `00-plan.md` §1.1 tablosu güncellendi.

## Kullanım sözleşmesi

- Değer değişikliği yalnız JSON'da; ardından `node packages/tokens/build.mjs` ve
  `node --test packages/tokens/`; üretilenlerle birlikte commit.
- Yeni bir metin/zemin çifti tasarıma girmeden önce `contrastPairs`'e eklenir.
- `warning` ve `inkSubtle` küçük metinde kullanılmaz; `*Ink` türevleri kullanılır.
- Expo (F1): `palette[scheme]`, `type` (RN'de `letterSpacing = tracking * size`),
  `space`, `radius`, `motion`. Web (F7): `globals.css` içinden `tokens.css` import edilir ve
  Tailwind `@theme inline` köprüsü bu değişkenlere bağlanır.

## Doğrulama

- `build.mjs --check` eşit; 39 test geçti.
- `tokens.ts` `tsc --strict` ile temiz.
- `tokens.dart` Flutter projesi bağlamında `flutter analyze`: sorun yok.

## Dışarıda bırakılanlar

- Figma değişken koleksiyonu: F2 bileşen galerisiyle birlikte, koddan Figma'ya ayna olarak.
- Font dosyalarının paketlenmesi: Expo'da F1 (`expo-font`), web'de F7 (`next/font`).

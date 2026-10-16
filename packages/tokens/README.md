# @paemisyon/tokens — tasarım token'ları (v3 "Nöbet")

Tek kaynak `design-tokens.json`. Üç hedef `build/` altında ÜRETİLİR, elle düzenlenmez:

| Hedef | Tüketen | Nasıl |
|---|---|---|
| `build/tokens.css` | `apps/web`, `apps/admin` | `globals.css` içinden `@import` (F7 ile); CSS değişkenleri `--color-*`, `--type-*`, `--space-*`, `--radius-*`, `--motion-*` |
| `build/tokens.ts` | Expo uygulaması (F1+), web bileşenleri | `palette`, `typeRoles`, `space`, `radius`, `motion`, `size`, `a11y` sabitleri; tipli |
| `build/tokens.dart` | Flutter (yalnız bakım süresince) | `NobetDark`, `NobetLight`, `NobetSpace`, `NobetRadius`, `NobetSize` |

## Komutlar

```bash
node packages/tokens/build.mjs          # üret
node packages/tokens/build.mjs --check  # CI: üretilen kaynakla eşit mi
node --test packages/tokens/kontrast.test.mjs            # kontrast ve tutarlılık testleri
```

Değer değiştirme akışı: JSON'u düzenle → `build.mjs` çalıştır → testler → üretilen
dosyalarla birlikte commit. CI, build'in güncel olmadığı ya da bir çiftin kontrast
eşiğini geçmediği her PR'ı düşürür.

## Kurallar (Doc 49 §1)

- Koyu tema birincil, açık türev. `defaultScheme` JSON'da; CSS'te `data-theme` zorlar,
  yoksa sistem tercihi izlenir.
- Tek vurgu (`accent`). Ders rengi yok; ders farkı ikonla.
- Durum yalnız renkle anlatılmaz. `warning` ve `inkSubtle` metin olarak yalnız 24 px+
  (large) boylarda; küçük metin için `*Ink` türevleri (`warningInk` vb.) kullanılır.
- Gölge yok; yüzey tonu farkı ve `line`.
- `contrastPairs` listesi tasarımda kullanılan her metin/zemin çiftini içerir; yeni bir
  çift kullanılacaksa önce buraya eklenir, test geçmeden tasarıma girmez.

`design-tokens.v2.json` önceki (Doc 26/48) sistemdir; Flutter ve mevcut web hâlâ ona
göre yazılmıştır, F7 ve Expo geçişiyle emekli olur.

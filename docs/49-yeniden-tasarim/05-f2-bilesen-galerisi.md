# Doc 49 / 05 — F2: Tasarım sistemi v3 bileşenleri ve uygulama içi galeri

Tarih: 16 Ekim 2026. Dal `claude/f2-bilesen-galerisi`. Plan: `00-plan.md` §1.4 ve §3 F2.
Kapanış ölçütü: galeri açık/koyu, AX ve SE'de göz testinden geçti.

## Kit yapısı (`apps/app/src/components`)

`ui/` temel kit, `domain/` ürün kavramlarını taşıyan parçalar; ikisi de yalnız token'lardan
beslenir, ekrana özel bileşen yoktur (CLAUDE.md §3). Barrel: `@/components/ui`,
`@/components/domain`.

| Bileşen | Varyant / durum | Not |
|---|---|---|
| `AppText` | 8 tipografi rolü (`variant`), 8 ton | `variant` adı: RN `Text`in `role` prop'uyla çakışmasın diye |
| `Screen` | scroll, padded, `inset="safe|none"` | modal sunumda `none` |
| `Card` | surface / alt / accent | gölge yok, hairline çizgi |
| `Button` | primary / secondary / ghost / destructive, loading | 54 pt, haptic |
| `IconButton` | primary / secondary / ghost | 44 pt, zorunlu etiket |
| `TextField` | error | 52 pt |
| `Notice` | info / success / warning / error | `*Soft` zemin + `*Ink` metin |
| `Badge` | neutral / accent / success / warning / danger | metin zorunlu |
| `Chip` | selected, disabled, icon | 44 pt |
| `ProgressBar` | accent / success / warning / danger | `accessibilityRole="progressbar"` |
| `SegmentBar` | ≤ 20 dilim | görev kartı ilerlemesi |
| `WeekDots` | done / today / empty | D1 haftalık gün |
| `ListRow` | leading, trailing, chevron, divider | ≥ 52 pt |
| `StatTile` | unit, hint, progress, emphasis, boş değer "—" | büyük yazıda etiket 2 satıra sarar |
| `Sheet` | başlık, footer | alt sayfa; tam ekran oynatıcılar Stack ekranıdır |
| `EmptyState` | icon, action | "Henüz yeterli veri yok" dili |
| `Skeleton` | yükseklik, köşe | |
| `ActionBar` | primary, secondary slot | Yerleşim B sabit eylem |
| `CountdownHeader` | tarih var / yok | tarih yoksa büyük rakam değil sakin cümle |
| `TaskHero` | 7 görev türü, ilerleme, meta | eylem kartta değil ActionBar'da (D4) |
| `CourseTile` | normal / weak / sparse | ders ikonu veriden (`CourseIcon`), renk yok |
| `QuestionStem` | numara, konu rozeti | kaynak etiketi GÖSTERİLMEZ |
| `QuestionOption` | default / selected / correct / incorrect / missed / disabled | ikon eşlik eder, animasyonsuz |
| `LegislationRow` | meta (doğrulama tarihi) | Doc 29 §13 |

Galeri: `app/galeri.tsx`; Ben › Geliştirici'den ve `paemisyon://galeri` ile açılır. Yalnız
geliştirme derlemesinde; oturumsuz da açılır (SE gibi oturum açılmamış cihazlarda göz testi).

## Göz testi (16 Eki 2026, 00-plan §4)

- **iPhone 17, açık ve koyu:** bütün bölümler tarandı; iki düzeltme: başlık satırı çiplerle
  sıkışıp "Galeri"yi bölüyordu (çipler ayrı satıra), modal sunumda üst boşluk fazlaydı
  (`inset="none"`). Tarih yokken geri sayımda dev bir "—" çizgisi vardı → sakin cümle.
- **AX büyük yazı (accessibility-extra-large), iPhone 17 koyu:** yerleşim tutuyor; istatistik
  kutusu etiketi kırpılıyordu → 2 satır; eylem çubuğu düğmesi iki satıra sarıyor (kabul).
- **iPhone SE (375 pt), açık:** dar ekran ölçeği (17 pt üstü boylar %6 küçük) devrede;
  geri sayımın iki hâli, görev kartı, liste satırları (uzun madde başlığı üç noktayla) ve
  tipografi tarandı, taşma yok. Not: galeri oturumsuz cihazda da açılsın diye kök kapı
  geliştirme derlemesinde `galeri` rotasını muaf tutar. **F2 kapandı.**

## Dışarıda bırakılanlar

- `ExamTimer`, `ExamMap`, `ResultSummary`, `Paywall`: veri sözleşmeleri deneme ve ödeme
  ekranlarıyla birlikte F4/F5'te; galeriye o zaman eklenir.
- Figma aynası: F3 Bugün kapanınca kapanan ekranlarla birlikte.

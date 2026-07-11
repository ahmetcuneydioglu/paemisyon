# Doc 5 — İstemci Teknolojisi Karar Raporu

> **Durum:** ✅ Onaylandı (2026-07-11) · **Karar sahibi:** Kullanıcı onayı ile CTO

## Karar
**Flutter (Dart) — tek codebase, iOS-first başla, Android'e aynı kodla geç.**

## Belirleyici gerçekler
- **Solo geliştirici** (kullanıcı beyanı).
- **iOS önce, Android sonra** (ama Android kaçınılmaz).
- **Türkiye Android-ağırlıklı pazar (~%70+)**; polis-adayı kitle daha da fazla Android + fiyat-duyarlı.

## Sana karşı çıkılan nokta
Kullanıcının 1. tercihi **Native (SwiftUI + Jetpack Compose)** idi. Bu en yüksek kalite tavanına sahip ama kullanıcının kendi kriterleriyle çelişir: solo geliştirici + iki native codebase = her özellik iki kez yazılır, "tek geliştirici ile yönetilebilir" ve "10 yıl sürdürülebilir" hedeflerini öldürür. Android kaçınılmaz olduğu için bu maliyet de kaçınılmaz.

## Değerlendirme (özet)

| Kriter | Native | React Native | **Flutter** |
|---|---|---|---|
| Premium his (bu uygulama tipi) | 10 | 7 | **9** |
| Geliştirme süresi (solo) | 3 | 7 | **9** |
| Bakım (10 yıl, solo) | 2 | 6 | **9** |
| Tek geliştirici yönetilebilirlik | 1 | 7 | **10** |
| App/Play Store kalitesi | 10 | 7 | **9** |
| Uzun vadeli sürdürülebilirlik | 3 | 6 | **9** |

## Gerekçe
- Quiz/içerik/istatistik uygulaması; ağır GPU/3B yok → Flutter'ın performansı fazlasıyla yeter.
- "iOS önce" planı Flutter ile ölmez: tek codebase'i iOS'a odaklanıp başlatırsın, Android'e ikinci uygulama yazmadan geçersin.
- Duolingo/Brilliant seviyesi premium his Flutter ile ulaşılabilir.

## Kararı değiştirecek koşul
"Sonsuza dek sadece iOS" veya ayrı iOS+Android mühendisleri tutacak bütçe → native önerilirdi. Mevcut gerçeklerde Flutter net kazanan.

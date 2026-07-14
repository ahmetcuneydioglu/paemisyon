# Doc 20 — Hedef Seçim Ekranı (eski "Kategoriler")

> Durum: ONAYLANDI (tasarım A) — uygulandı
> Bağımlılık: Doc 12 (katalog akışı), Doc 19 (koç/preferredModule)

## 1. Eski uygulama analizi (gerçek dosyalardan)

**Eski iOS** (`paemisyonIOS705/CategoryViewController.swift` + `paem705.sql`):
- Collection view grid'i; kartta PNG ikon + ad + "Soru: N" + şablonun
  SIRAYA göre atadığı renkler (anlamsız).
- Gerçek kategoriler sınav yolları değil İÇERİK ALANLARIYDI:
  Genel Mevzuat / Polis Mevzuatı / Misyon Koruma (+A.Ö.F).
- Akış: Home (zone listesi) → kategori → alt kategori (Anayasa, PVSK…)
  → seviye (LevelView) → soru. Soru sayısı 0 ise giriş engelleniyordu.
- Eski web'de kategori ekranı YOKTU (yalnız denemeler).

**Korunanlar**: soru sayısı gösterimi, görsel kimlikli kartlar, tek dokunuş
dalış, bilinen adlandırma. **Eskiyenler**: sıraya göre renk, dekoratif süsler,
reklam bandı, sınav yolu ↔ içerik alanı karışıklığı (yeni şemada modül/ders
ayrımıyla çözüldü). **Eklenen**: kullanıcı bağlamı (ilerleme) + hedef işareti.

## 2. Karar: Tasarım A — Hedef kartları

İki eşit büyük kart (PAEM mavi / Misyon teal), her kartta amblem + ad +
tek satır açıklama + "N soru · %X doğruluk" meta; kayıtlı hedef
(preferredModule) "Hedefin" rozetiyle işaretli; karttan derslere Hero geçişi.

Reddedilenler: B (tam ekran split — 2 kategoriye kilitli, erişilebilirlik
riski), C (hedef odaklı — seçim hissini zayıflatır, koç hero'suyla görev
tekrarı).

## 3. Uygulama

- **Backend**: `GET /catalog/modules` zenginleştirildi — questionCount
  (yayındaki sorular, modül bazında tek SQL), solvedCount/accuracy
  (user_topic_progress'ten), isPreferred. POMEM/PMYO seed'de
  `isActive=false` (veri durur, uçlar filtreler; ileride açılabilir).
  PAEM/Misyon açıklamaları seed'de.
- **Mobile**: `ModulesScreen` → hedef seçim ekranı ("Hedefini Seç").
  ≤3 modül ekranı eşit paylaşır (Expanded); daha fazlası listeye düşer —
  modül eklemek kod değişikliği gerektirmez. Kimlik eşlemesi key ile:
  paem→polis rozeti/mavi, misyon→kalkan/teal. Hero tag `module-<id>`
  CoursesScreen başlık bloğuna uçar. Mikro etkileşimler ortak
  (StaggeredReveal/PressableScale).

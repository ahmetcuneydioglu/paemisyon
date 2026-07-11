# Paemisyon Mobil (Flutter)

Flutter + Riverpod + go_router + Dio. iOS-first (sonra Android — aynı codebase).

## Önemli: platform klasörleri henüz yok
Bu iskelet `lib/` + `pubspec.yaml` içeriyor ama `ios/` / `android/` runner'ları yok
(bu ortamda Flutter kurulu değildi). Kendi makinende bir kez üret:

```bash
cd apps/mobile
# platform klasörlerini üret (pubspec.yaml ve lib/main.dart'ı ŞABLONLA EZEBİLİR):
flutter create --platforms=ios,android --org com.paemisyon --project-name paemisyon .
# flutter create bizim dosyaları ezdiyse geri al (önce commit'lenmiş olmalı):
git checkout -- pubspec.yaml lib/
# bağımlılıklar:
flutter pub get
```

## Çalıştırma
```bash
# Backend'i ayrı terminalde başlat: cd ../api && npm run start:dev
flutter run
# Fiziksel cihazda API'ye erişim için makinenin LAN IP'sini ver:
flutter run --dart-define=API_BASE_URL=http://192.168.1.X:3000/api/v1
```
Açılışta **health ekranı** backend'e bağlanır; "Backend bağlantısı kuruldu · Veritabanı: up"
görüyorsan mobil↔API walking skeleton uçtan uca çalışıyor demektir.

## Yapı (Doc 3 — feature-first + Clean Architecture)
```
lib/
├── main.dart                # ProviderScope kökü
├── app/
│   ├── app.dart             # MaterialApp.router (tema + router)
│   └── router/              # go_router yapılandırması
├── core/                    # feature'a bağımsız altyapı
│   ├── config/              # API adresi (secret YOK)
│   ├── network/             # Dio client + interceptor
│   ├── error/               # Failure tipleri
│   └── theme/               # tasarım sistemi (renk/spacing/tema)
├── shared/widgets/          # buton, skeleton, hata/boş durum
└── features/                # her feature: domain / data / presentation
    └── health/              # walking skeleton dikey dilimi
```

## Sonraki adımlar (Doc 13 sprint sırası)
`auth` → `catalog` → `quiz` → `result/progress` → `review` → `subscription` → `home` ...
Model katmanı Sprint 2'de **freezed**'e, offline Sprint 5'te **drift**'e taşınır (pubspec'te not).

## İlkeler
- Secret istemcide yok; iş mantığı backend'de — istemci yalnızca gösterir.
- Her feature bağımsız dilim; ortak şey `core`/`shared`'da.
- Skeleton/hata/boş durumlar tasarım sisteminden (premium his).

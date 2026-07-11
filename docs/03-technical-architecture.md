# Doc 3 — Teknik Mimari Dokümanı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 1 (Vision), Doc 2 (PRD), kilitli kararlar (Flutter + Supabase/Postgres + NestJS + Next.js).
> **Kapsam:** Sistemin *nasıl* kurulacağı — katmanlar, teknoloji seçimleri, proje yapısı, veri akışı. DB şeması Doc 6, API sözleşmesi Doc 7, auth detayı Doc 8'de.

---

## 1. Sistem Genel Görünümü (High-Level)

```
   ┌────────────┐   ┌────────────┐   ┌────────────┐   ┌──────────────┐
   │  iOS App   │   │ Android    │   │  Web (ileri │   │ Admin Panel  │
   │  (Flutter) │   │ (Flutter)  │   │  faz)       │   │ (Next.js/TS) │
   └─────┬──────┘   └─────┬──────┘   └─────┬──────┘   └──────┬───────┘
         │                │                │                 │
         └────────────────┴───────HTTPS────┴─────────────────┘
                                   │
                        ┌──────────▼───────────┐
                        │   NestJS API (TS)     │  ◄── TÜM İŞ MANTIĞI BURADA
                        │  REST + JWT + DTO      │
                        │  Controller→Service    │
                        │  →Repository (Prisma)  │
                        └──────────┬───────────┘
                                   │
              ┌────────────────────┼──────────────────────┐
              │                    │                       │
      ┌───────▼──────┐    ┌────────▼────────┐     ┌────────▼─────────┐
      │  PostgreSQL   │    │ Supabase Auth   │     │ Supabase Storage │
      │  (Supabase)   │    │ + Storage       │     │ (görseller/PDF)  │
      └───────────────┘    └─────────────────┘     └──────────────────┘
                                   │
        ┌──────────────────────────┼───────────────────────────┐
     ┌──▼───────────┐   ┌──────────▼─────────┐   ┌──────────────▼──┐
     │ AI Servisi   │   │ Push (APNs/FCM)     │   │ App/Play Store  │
     │ (LLM API)    │   │                     │   │ Server API (IAP)│
     └──────────────┘   └─────────────────────┘   └─────────────────┘
```

**Altın kural:** İstemciler (mobil + web + admin) yalnızca **NestJS API** ile konuşur. Hiçbir istemci doğrudan Postgres'e, LLM'e veya Store API'ye gitmez. İş mantığı tek yerde yaşar. Android eklendiğinde backend'de sıfır değişiklik.

> **Not — Supabase rolü:** Supabase burada "BaaS" olarak değil, **managed altyapı** (Postgres + Auth primitives + Storage) olarak kullanılır. İş mantığı Supabase Edge Functions'a değil, NestJS'e yazılır. Böylece ileride Supabase'den saf bir managed Postgres'e (Neon/RDS) geçmek gerekirse, iş mantığı taşınmaz.

---

## 2. Mimari İlke: Clean Architecture (her iki tarafta)

Hem Flutter hem NestJS, katmanları dışa bağımlılık kuralıyla ayırır: **iç katmanlar dışı bilmez.**

```
Presentation / API  →  Application (use cases)  →  Domain (entities, rules)  ←  Data (impl)
```

- **Domain:** Saf iş kuralları, framework-bağımsız. Değişmesi en zor katman.
- **Application:** Use case'ler (orkestrasyon).
- **Data:** Repository implementasyonları, dış dünya (DB, API, cache).
- **Presentation/API:** UI (Flutter) veya HTTP controller (NestJS).

Bu, "her dosyanın tek sorumluluğu" ve "test edilebilirlik" ilkelerini yapısal olarak zorlar.

---

## 3. Mobil Mimari (Flutter)

### 3.1 Teknoloji seçimleri (karar + gerekçe)

| İhtiyaç | Seçim | Neden (alternatif) |
|---|---|---|
| State management + DI | **Riverpod v2** | Derleme-zamanı güvenli, test edilebilir, DI'yi de çözer, boilerplate az. (Alternatif: Bloc — daha çok kod, güçlü ama solo için ağır.) |
| Routing | **go_router** | Declarative, deep-link/push yönlendirme desteği. |
| Network | **Dio** + interceptor'lar | Retry, auth token yenileme, logging interceptor'ları. |
| Model/serialization | **freezed** + **json_serializable** | Değişmez (immutable) modeller, union type'lar, boilerplate üretimi. |
| Yerel DB (offline) | **Drift** (SQLite) | Tip-güvenli SQL, offline içerik + devam eden oturum. |
| Güvenli depolama | **flutter_secure_storage** | Token/refresh token (Keychain/Keystore). |
| Basit tercihler | **shared_preferences** | Bayraklar, onboarding durumu. |
| Analitik/Crash | **Firebase Crashlytics + Analytics** (yalnızca telemetri) | Not: Firebase burada *sadece* gözlemlenebilirlik için; iş verisi/mantık ASLA burada değil. |
| Push | **APNs (iOS) / FCM (Android)** | Backend'den tetiklenir. |

> Riverpod tercihi kesin değil, güçlü öneri. Bloc'u tercih edersen mimari aynı kalır, sadece presentation katmanı değişir — söyle, gerekçeleri açarım.

### 3.2 Proje yapısı (feature-first + katmanlı)

```
lib/
├── main.dart
├── app/                      # Uygulama kabuğu
│   ├── app.dart              # MaterialApp, router, tema
│   ├── router/               # go_router yapılandırması
│   └── di/                   # ProviderScope, global providers
│
├── core/                     # Paylaşılan altyapı (feature'a bağımsız)
│   ├── network/              # Dio client, interceptors, error mapping
│   ├── storage/              # secure storage, drift db, prefs
│   ├── error/                # Failure tipleri, exception→failure eşleme
│   ├── config/              # Env (dev/prod), API base URL (secret YOK)
│   ├── theme/                # Design system: renk, tipografi, spacing, komponentler
│   ├── localization/         # String katalog (TR birincil)
│   └── utils/
│
├── features/                 # Her feature kendi clean-arch dilimini taşır
│   ├── auth/
│   │   ├── domain/           # entity, repository arayüzü, use case
│   │   ├── data/             # repository impl, DTO, datasource (remote/local)
│   │   └── presentation/     # ekranlar, widget'lar, riverpod controller/state
│   ├── catalog/              # Modül→Ders→Konu keşfi
│   ├── quiz/                 # Quiz Engine (en kritik feature)
│   ├── progress/             # Sonuç, ilerleme, istatistik
│   ├── review/               # Yanlışlarım, favoriler, tekrar
│   ├── subscription/         # IAP, premium durum (backend'den doğrulanır)
│   ├── profile/
│   └── notifications/
│
└── shared/                   # Feature'lar arası paylaşılan widget/model
```

**Kural:** Bir feature başka bir feature'ın `data` veya `presentation`'ına doğrudan erişemez; ortak şey `core`/`shared`'a çıkar. Bu, modüllerin bağımsız büyümesini sağlar (yeni sınav modülü = yeni feature dilimi).

### 3.3 Katman içi veri akışı (örnek: quiz çözme)

```
UI (QuizScreen)
  → Riverpod Controller (quizControllerProvider)
    → SubmitAnswerUseCase (application/domain)
      → QuizRepository (arayüz, domain)
        → QuizRepositoryImpl (data)
          → RemoteDataSource (Dio → NestJS /quiz/answer)
          → LocalDataSource (Drift — offline kuyruk)
```

UI yalnızca controller'ı bilir. İş kuralı (skor, doğru/yanlış, süre) **sunucuda** hesaplanır; istemci gösterir. Offline'da yanıt yerel kuyruğa yazılır, bağlantı gelince senkronlanır (bkz. §5).

---

## 4. Backend Mimari (NestJS)

### 4.1 Teknoloji seçimleri

| İhtiyaç | Seçim | Neden |
|---|---|---|
| Framework | **NestJS** | Modüler, DI yerleşik, katmanlı, TS-native, kurumsal olgunluk. |
| ORM | **Prisma** | Tip-güvenli, migration yönetimi, okunabilir şema. (Alt: TypeORM — daha eski/dağınık.) |
| DB | **PostgreSQL** (Supabase) | İlişkisel veri (sınav/soru/abonelik/istatistik) için doğru. |
| Doğrulama | **class-validator + DTO** | Girdi doğrulama sınırda; iç katman temiz kalır. |
| Auth | **JWT (access+refresh)** + Supabase Auth entegrasyonu | Detay Doc 8. |
| Dokümantasyon | **OpenAPI/Swagger** (otomatik) | API sözleşmesi tek kaynaktan. |
| Job/zamanlama | **BullMQ (Redis)** | Push gönderimi, günlük soru üretimi, makbuz yeniden doğrulama. |

### 4.2 Modüler yapı (feature = NestJS module)

```
src/
├── main.ts
├── app.module.ts
├── common/                   # Guard, interceptor, filter, decorator, pipe
│   ├── guards/               # JwtAuthGuard, RolesGuard, SubscriptionGuard
│   ├── filters/              # Global exception filter (tutarlı hata formatı)
│   └── interceptors/         # Logging, response transform
├── config/                   # Env şeması (secret'lar ortam değişkeninden)
├── infra/
│   ├── prisma/               # PrismaService, migrations
│   ├── storage/              # Supabase Storage adapter
│   ├── ai/                   # LLM sağlayıcı adapter (soyutlanmış)
│   └── push/                 # APNs/FCM adapter
└── modules/
    ├── auth/                 # login, refresh, register, göç
    ├── users/
    ├── catalog/              # modül/ders/konu/soru okuma
    ├── content/              # içerik yönetimi + editoryal onay (admin)
    ├── quiz/                 # oturum, cevap değerlendirme (İŞ KURALI)
    ├── progress/             # ilerleme, istatistik hesaplama
    ├── subscription/         # IAP makbuz doğrulama, premium durum
    ├── notifications/
    └── ai/                   # çalışma planı, öneri
```

Her modül: `controller` (HTTP) → `service` (iş mantığı) → `repository` (Prisma). Controller ince, service kalın, repository veri erişimi. God-service oluşmasını önlemek için karmaşık iş kuralları ayrı use-case/domain servislerine bölünür.

### 4.3 Kritik prensip: İş kuralları nerede?

- **Quiz skorlama, doğru/yanlış, süre, freemium günlük limit** → `quiz`/`subscription` servisleri (backend).
- **Premium erişim kararı** → `SubscriptionGuard` (backend). İstemci asla kendi "premium'um" demez.
- **Günlük soru limiti** → backend'de sayaç. İstemci UI'da gösterir ama zorlamaz.

---

## 5. Çapraz Kesen Konular (Cross-cutting)

### 5.1 Offline stratejisi
- **Okuma:** Konu içeriği ve devam eden oturum Drift'e cache'lenir; offline erişilebilir.
- **Yazma:** Cevap/sonuç offline'da yerel kuyruğa yazılır, `SyncService` bağlantı gelince backend'e gönderir (idempotent — çift gönderim güvenli).
- **Doğruluk kaynağı:** Çakışmada backend kazanır.

### 5.2 Kimlik/Token akışı (özet, detay Doc 8)
- Access token (kısa ömürlü) + refresh token (uzun, secure storage).
- Dio interceptor 401'de otomatik refresh; başarısızsa login'e yönlendirir.
- Secret istemcide yok; token'lar sunucudan alınır.

### 5.3 Yapılandırma & ortamlar
- `dev` / `staging` / `prod` ayrı. API base URL derleme-zamanı flavor ile gelir.
- Backend secret'ları (DB, LLM key, Store key) yalnızca sunucu ortam değişkenlerinde.

### 5.4 Hata yönetimi
- Backend: global exception filter → tutarlı `{ code, message, details }` formatı.
- Flutter: exception → `Failure` eşlemesi → kullanıcıya anlamlı, moral bozmayan mesaj.

### 5.5 Gözlemlenebilirlik
- Backend: yapılandırılmış log + hata izleme (Sentry). İstek trace ID'si.
- Mobil: Crashlytics + analitik olay şeması (Doc 15/analitik ile hizalı).

### 5.6 Tasarım Sistemi (premium UX'in mimari temeli)
- `core/theme` altında tek kaynaklı design system: renk token'ları, tipografi ölçeği, spacing, köşe/gölge, animasyon süreleri, yeniden kullanılabilir komponentler (buton, kart, quiz option, boş-durum, skeleton loader).
- Amaç: her ekranın tutarlı ve premium hissetmesi kod düzeyinde garanti altına alınır — "boş ekran bile kaliteli görünsün" ilkesi.

---

## 6. Test Stratejisi (QA Lead perspektifi)

| Katman | Test türü | Araç |
|---|---|---|
| Domain/Application (Flutter) | Unit | `flutter_test`, `mocktail` |
| Repository/Datasource | Unit + entegrasyon | mock Dio, in-memory Drift |
| Presentation | Widget test | `flutter_test` |
| Kritik akış (quiz, ödeme) | Integration/E2E | `integration_test`, `patrol` |
| Backend service | Unit | Jest |
| Backend API | E2E | Jest + Supertest, test DB |

Kritik iş kuralları (skorlama, freemium limiti, abonelik durumu) **zorunlu unit test kapsamında**. "Test edilebilir mimari" bu yüzden Clean Arch ile kuruldu.

---

## 7. CI/CD (özet)
- **Backend:** GitHub Actions → lint + test + Prisma migrate → container → managed host (Fly.io/Railway/Render başlangıç, ileride ölçek).
- **Mobil:** Actions/Codemagic → analyze + test → TestFlight (iOS). Fastlane ile imzalama/dağıtım.
- **Admin:** Vercel (Next.js).

---

## 8. Bu mimarinin vizyona hizmeti (özet)

| Vizyon ilkesi | Mimari karşılığı |
|---|---|
| Backend tek gerçek kaynak | NestJS tüm iş mantığını sahiplenir; istemci sadece görüntüler |
| 10 yıl sürdürülebilir | Clean Arch + modüler feature dilimleri + test |
| Solo geliştirilebilir | TypeScript (API+admin) + Dart tek codebase; managed altyapı |
| Yeni sınav modülü kolay | Feature-first Flutter + modül tabanlı içerik modeli |
| Secret istemcide yok | Token akışı + sunucu-taraflı doğrulama |
| Premium UX | Kod düzeyinde tasarım sistemi |
| Android'de sıfır backend değişikliği | İstemci-agnostik REST API sözleşmesi |
```

# Paemisyon API (backend)

NestJS + TypeScript + Prisma + PostgreSQL. **Tüm iş mantığının tek gerçek kaynağı** — istemciler (mobil, admin, web) yalnızca bu API'yi çağırır.

## Kurulum
```bash
cd apps/api
npm install
cp .env.example .env          # değerleri doldur (DATABASE_URL zorunlu)
npm run prisma:generate       # Prisma client üret
```

## Çalıştırma
```bash
npm run start:dev             # geliştirme (watch)
```
Doğrulama: `curl http://localhost:3000/api/v1/health`

Beklenen yanıt:
```json
{ "data": { "status": "ok", "service": "paemisyon-api", "database": "up", ... } }
```
> `database: "down"` görürsen `DATABASE_URL` ayarlı değil demektir — uygulama yine açılır (walking skeleton).

## Veritabanı (Supabase)
1. Supabase projesi oluştur → `Settings → Database` connection string'i `DATABASE_URL`'e koy.
2. İlk migration: `npm run prisma:migrate` (şema: `prisma/schema.prisma`).

## Yapı (Doc 3 — Clean Architecture)
```
src/
├── main.ts                  # bootstrap, global prefix /api/v1, pipe/filter/interceptor
├── app.module.ts            # kök modül + trace middleware
├── config/                  # ortam değişkeni doğrulama (açılışta)
├── common/                  # guard/filter/interceptor/middleware (çapraz kesen)
│   ├── filters/             # tutarlı hata formatı (Doc 7)
│   ├── interceptors/        # yanıt zarfı { data }
│   └── middleware/          # trace_id
├── infra/prisma/            # PrismaService (tek DB noktası)
└── modules/                 # feature modülleri (controller→service→repository)
    └── health/              # walking skeleton doğrulama ucu
```

## Sıradaki modüller (Doc 13 sprint sırası)
`auth` → `catalog` → `quiz` → `progress` → `subscription` → `notifications` → `admin`

## İlkeler
- İş kuralları burada; istemci mantık yazmaz.
- Secret yalnızca `.env` (sunucu); istemcide asla.
- Girdi doğrulama sınırda (DTO); iç katman temiz.
- Her yanıt `trace_id` taşır (log korelasyonu).

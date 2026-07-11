# Paemisyon Platform

Türkiye'nin polis adayları ve personeli için dijital eğitim platformu.

> Mimari plan: [`docs/`](docs/README.md) (17 doküman). Kod yazımına Faz 0 (walking skeleton) ile başlandı.

## Monorepo Yapısı

```
paemisyon/
├── apps/
│   ├── api/          # Backend — NestJS + TypeScript + Prisma (iskelet kuruldu, Supabase bağlı)
│   ├── mobile/       # Flutter — Riverpod/go_router/Dio (iskelet kuruldu)
│   └── admin/        # Next.js admin paneli                  [Sprint 8]
├── docs/             # Mimari dokümanlar (01-17)
├── paemisyonIOS705/  # ESKİ iOS — yalnızca ÜRÜN DOKÜMANI/referans (kullanılmıyor)
├── paemisyoncom/     # ESKİ PHP — yalnızca referans (kullanılmıyor)
└── *.sql             # Eski DB dökümleri (PII — .gitignore'da, göç için)
```

## Teknoloji (kilitli kararlar)
- **Backend:** NestJS + TypeScript + Prisma + PostgreSQL (Supabase) — [Doc 4](docs/04-backend-decision.md)
- **Mobil:** Flutter (Dart) + Riverpod + go_router + Dio + Drift — [Doc 5](docs/05-client-tech-decision.md)
- **Admin:** Next.js + TypeScript + TailwindCSS — [Doc 9](docs/09-admin-panel.md)

## Başlangıç
Her uygulama kendi klasöründe kendi README'sine sahiptir. Backend için: [`apps/api/README.md`](apps/api/README.md).

## İlke
Backend tek gerçek kaynaktır; hiçbir istemci iş mantığı yazmaz. Hiçbir secret istemcide bulunmaz. Ayrıntı: [Doc 3 — Teknik Mimari](docs/03-technical-architecture.md).

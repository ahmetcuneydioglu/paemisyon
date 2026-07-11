# Doc 4 — Backend Karar Raporu

> **Durum:** ✅ Onaylandı (2026-07-11) · **Karar sahibi:** Kullanıcı onayı ile CTO

## Karar
**Managed PostgreSQL (Supabase: Postgres + Auth + Storage) altyapısı + iş mantığını tümüyle sahiplenen NestJS/TypeScript API katmanı.**

## Elenen: Firebase
Kullanıcının temel felsefesi — *"tüm iş kuralları backend'de, hiçbir istemci business logic yazmaz, backend tek gerçek kaynak"* — Firebase/Firestore modeliyle çelişir; Firestore iş mantığını istemciye + güvenlik kurallarına iter, gerçek bir API katmanı sunmaz. Eski uygulamanın en büyük güvenlik hatası da buydu.

## Değerlendirme

| Kriter | Firebase | Supabase (yalın) | **Supabase + NestJS** | Tam özel |
|---|---|---|---|---|
| İş mantığı tek yerde | 3 | 6 | **10** | 10 |
| Solo geliştirici dostu | 8 | 9 | **8** | 3 |
| Ölçeklenebilirlik (10 yıl) | 5 | 7 | **9** | 10 |
| Ortak API (mobil+web+admin) | 4 | 7 | **10** | 10 |
| TypeScript uçtan uca | — | ✓ | **✓** | — |
| Ops yükü | Düşük | Düşük | **Orta** | Çok yüksek |
| Vendor lock-in | Yüksek | Orta | **Düşük (Postgres taşınır)** | Yok |

## Gerekçe
- Postgres = ilişkisel içerik (sınav/soru/abonelik/istatistik) için doğru model.
- Supabase managed altyapı → solo ops yükünü düşürür; ama iş mantığı Edge Functions'a değil NestJS'e yazılır (taşınabilirlik).
- NestJS + Next.js admin → **TypeScript uçtan uca**, solo verimlilik.
- Android geldiğinde backend değişmez (istemci-agnostik API).

## Sonuç
İstemciler yalnızca NestJS API'yi çağırır. Prisma ORM, JWT auth, sunucu-taraflı IAP makbuz doğrulama. Detaylar Doc 6 (DB), Doc 7 (API), Doc 8 (Auth).

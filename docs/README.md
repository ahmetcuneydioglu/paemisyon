# Paemisyon — Mimari Doküman Seti

> Türkiye'nin polis adayları ve personeli için dijital eğitim platformu.
> Bu klasör, kod yazımı öncesi kurulan tam mimari planı içerir. Sıra ile okunur; her doküman öncekinin üzerine inşa edilir.

## Kilit Kararlar (özet)
- **İstemci:** Flutter (Dart) — tek codebase, iOS-first, sonra Android
- **Backend:** Supabase (managed Postgres + Auth + Storage) + NestJS/TypeScript API (tüm iş mantığı burada)
- **Admin:** Next.js + TypeScript + TailwindCSS
- **Gelir:** Freemium (günlük soru sınırı) + abonelik (sunucu-doğrulamalı IAP)
- **Marka:** Paemisyon (devam)
- **Göç:** `paem705` ~4.400 kullanıcı taşınır; soru verisi taşınmaz (mevzuat)

## Dokümanlar
| # | Doküman | İçerik |
|---|---|---|
| 1 | [Product Vision](01-product-vision.md) | Vizyon, kitle, değer önermesi |
| 2 | [PRD](02-prd.md) | Kapsam, MVP→V3 önceliklendirme |
| 3 | [Teknik Mimari](03-technical-architecture.md) | Katmanlar, Flutter/NestJS yapısı, DI |
| 4 | [Backend Kararı](04-backend-decision.md) | Supabase + NestJS gerekçesi |
| 5 | [İstemci Kararı](05-client-tech-decision.md) | Flutter gerekçesi |
| 6 | [Veritabanı Tasarımı](06-database-design.md) | Şema, içerik sürümleme, göç |
| 7 | [API Tasarımı](07-api-design.md) | REST sözleşmesi, güvenlik kuralları |
| 8 | [Authentication](08-authentication.md) | Kimlik, RBAC, kullanıcı göçü |
| 9 | [Admin Paneli](09-admin-panel.md) | İçerik yönetimi + editoryal onay |
| 10 | [Mobil Modüller](10-mobile-modules.md) | Feature modülleri, quiz engine |
| 11 | [User Flow](11-user-flow.md) | Uçtan uca kullanıcı akışları |
| 12 | [Wireframe Planı](12-wireframe-plan.md) | Ekran yerleşimleri |
| 13 | [Sprint Planı](13-sprint-plan.md) | Faz faz iş kırılımı |
| 14 | [Risk Analizi](14-risk-analysis.md) | Teknik/operasyonel/ticari riskler |
| 15 | [AI Entegrasyonu](15-ai-integration.md) | AI kullanımı, model, maliyet |
| 16 | [Monetization](16-monetization.md) | Abonelik, fiyatlama, dönüşüm |
| 17 | [Yol Haritası](17-roadmap.md) | 10 yıllık ufuk |

## Açık İş Kararları (kullanıcı girdisi bekleyen)
- Fiyat aralığı (aylık/yıllık)
- Freemium günlük soru sayısı (öneri 10-20)
- Ücretsiz deneme (trial) olacak mı
- Marka adının "PAEM" darlığı sorunu (şimdilik Paemisyon devam)

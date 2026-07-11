# Doc 9 — Admin Paneli Tasarımı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 2 (içerik/editoryal), Doc 6 (şema), Doc 7 (admin API), Doc 8 (RBAC).
> **Teknoloji (kilitli):** Next.js + React + TypeScript + TailwindCSS. Eski PHP Harmedya panel tümüyle kaldırılır.

---

## 1. Amaç ve İlkeler
Admin paneli, platformun **operasyon merkezi**. En kritik işlevi: **doğru ve güncel içerik üretimi** (mevzuat değişimini yöneten editoryal akış). İkincil: kullanıcı/abonelik/analitik yönetimi.

**İlkeler:**
1. Panel **yalnızca NestJS admin API'sini** çağırır (kendi iş mantığı yazmaz) — Doc 7 §4.10.
2. RBAC: `admin` (tam yetki) ve `editor` (yalnızca içerik) rolleri (Doc 8).
3. İçerik **yayına editoryal onayla** çıkar — yanlış mevzuat engellenir.
4. Kalite: iç araç bile olsa temiz, hızlı, hatasız (Linear/Notion netliği referans).

## 2. Teknoloji Detayı
| İhtiyaç | Seçim | Neden |
|---|---|---|
| Framework | **Next.js (App Router)** | SSR/RSC, hızlı, TS-native, Vercel dağıtımı |
| Dil | **TypeScript** | Backend ile paylaşılan tipler (OpenAPI'den üretilmiş istemci) |
| Stil | **TailwindCSS** + başsız komponent (shadcn/ui) | Hızlı, tutarlı, erişilebilir |
| Veri | **TanStack Query** | Sunucu durumu, cache, optimistic update |
| Form | **React Hook Form + Zod** | Doğrulama, tip-güvenli |
| Tablo | **TanStack Table** | Sıralama/filtre/sayfalama |
| Grafik | **Recharts / Tremor** | İstatistik ekranları |
| Editör | **Zengin metin** (soru açıklaması, mevzuat) | TipTap tabanlı |
| Auth | Supabase Auth (admin/editor rolü) | Doc 8 ile aynı sistem |

> **Not:** Panel ve mobil aynı NestJS API'yi kullandığı için, OpenAPI'den üretilen TS tipleri hem admin hem (Dart tarafında) mobil ile hizalı kalır → sözleşme kayması olmaz.

## 3. Bilgi Mimarisi (menü yapısı)
```
Dashboard (özet)
İçerik
  ├─ Modüller (PAEM, POMEM, PMYO, Misyon…)
  ├─ Dersler
  ├─ Konular
  ├─ Sorular  ← en yoğun ekran (sürüm + onay akışı)
  └─ İçerik Onay Kuyruğu (in_review)
Günlük Soru (takvim)
Kullanıcılar
  ├─ Kullanıcı listesi/arama
  ├─ Kullanıcı detay (ilerleme, abonelik, cihazlar)
  └─ Roller/yetkiler (yalnızca admin)
Abonelik & Gelir
  ├─ Abonelikler (durum, sağlayıcı)
  ├─ Planlar
  └─ Gelir raporları (MRR, dönüşüm, churn)
Analitik
  ├─ Aktif kullanıcılar (DAU/WAU/MAU)
  ├─ Öğrenme metrikleri (skor artışı, konu zayıflıkları)
  └─ AI raporları
Bildirimler (push oluştur/gönder/segment)
Ayarlar (uygulama config, min sürüm, planlar)
```

## 4. Kilit Ekran: Soru Yönetimi + Editoryal Onay (en kritik)

### 4.1 Soru listesi
- Filtre: modül/ders/konu, durum (taslak/incelemede/yayında/arşiv), zorluk, güncelleme tarihi.
- Sütunlar: soru kökü (kısalt), konu, durum rozeti, güncel sürüm no, son güncelleyen.
- Toplu işlem: onaya gönder, arşivle.

### 4.2 Soru düzenleme (sürümlü — Doc 6 §5 karşılığı)
- Editör bir soruyu düzenlediğinde **yeni sürüm taslağı** oluşur (yayındaki bozulmaz).
- Alanlar: kök, 4-5 şık (doğru işaretle), açıklama (zengin metin), zorluk, görsel (Supabase Storage upload), **mevzuat referansı + yürürlük tarihi**.
- "Önizleme" — kullanıcı nasıl görecek.
- Aksiyon: **Kaydet (taslak)** → **İncelemeye gönder** (`in_review`).

### 4.3 Onay akışı (mevzuat güvencesi)
```
[Editör] taslak → incelemeye gönder
        ↓
[Admin/Onaylayan] Onay Kuyruğu → gözden geçir
        ↓ onayla                    ↓ reddet (not ile)
   published (yayına çıkar,       geri taslağa
   eski sürüm archived,
   current_version_id güncellenir)
```
- **Yayın öncesi zorunlu kontrol:** doğru cevap işaretli mi, mevzuat referansı var mı.
- Mevzuat değişince: yeni sürüm aç → onayla → eski otomatik arşiv. Kullanıcının eski sonuçları bozulmaz.

### 4.4 İçe aktarma (opsiyonel, V1)
- Toplu soru içe aktarma (Excel/CSV) — editör iş yükünü azaltır. **Ama içe aktarılan içerik doğrudan yayına çıkmaz**, `in_review` kuyruğuna düşer. (Eski sistemin doğrudan-yayın hatasını tekrarlamayız.)

## 5. Diğer Ekranlar (özet)

**Dashboard:** DAU/WAU, yeni kayıt, aktif abonelik, MRR, onay bekleyen içerik sayısı, son aktiviteler.

**Kullanıcı yönetimi:** arama, detay (ilerleme/istatistik, abonelik geçmişi, cihazlar), hesap askıya alma, KVKK silme talebi işleme. **Parola göremez/değiştiremez** (Supabase Auth'ta; yalnızca reset tetikler).

**Abonelik & Gelir:** aktif/iptal/grace abonelikler, sağlayıcı (Apple/Google), plan bazlı gelir, dönüşüm hunisi, churn. Veriler **sunucu-doğrulamalı** `subscriptions`/`entitlements`'tan.

**Analitik:** aktif kullanıcı trendi, retention/streak, konu bazlı başarı (hangi konular zayıf → içerik önceliği), deneme skoru artışı. AI raporları V1+.

**Bildirimler:** push kampanyası oluştur, segment (tüm/premium/aktif olmayan), zamanla, gönder. Backend BullMQ ile gönderir.

**Ayarlar:** uygulama config (min desteklenen sürüm — Doc 7 §6), planlar/fiyatlar, freemium günlük limit, feature flag'ler.

## 6. Güvenlik (panel)
- Yalnızca `admin`/`editor` rolü giriş yapabilir (RBAC, sunucuda).
- Editör içerik dışına erişemez (kullanıcı/gelir gizli).
- Tüm işlemler **audit log**'a yazılır (kim, ne, ne zaman) — eski sistemdeki `ekip_loglar` fikrinin sağlıklı hali.
- Eski panelin RCE/dosya-editörü gibi tehlikeli özellikleri **yok** (sunucu dosyası düzenleme, autoupdate, ham SQL — hiçbiri).
- 2FA (admin için) — V1 hedefi.

## 7. Dağıtım
- **Vercel** (Next.js). Ayrı subdomain: `admin.paemisyon.com`.
- Ortam ayrımı: staging/prod. Erişim IP/rol kısıtlı.

## 8. Vizyona hizmet (özet)
| İlke | Panel karşılığı |
|---|---|
| Güncel/doğru içerik = güvenlik | Sürümlü sorular + zorunlu editoryal onay |
| Backend tek gerçek kaynak | Panel yalnızca admin API çağırır |
| Eski panelin hatalarını tekrarlama | RCE/autoupdate/doğrudan-yayın yok; audit log var |
| Solo yönetilebilir | TS uçtan uca, managed dağıtım |
| Veri odaklı ürün | Analitik + gelir + öğrenme metrikleri |

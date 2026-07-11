# Doc 13 — Sprint Planı (MVP → V1 → V2 → V3)

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Tüm önceki dökümanlar (1-12).
> **Kapsam:** İş kırılımı, öncelik, bağımlılık, her sprintin çıktısı.

---

## 1. Planlama Felsefesi
1. **Dikey dilimler (vertical slices):** Her sprint uçtan uca çalışan bir değer üretir (UI→API→DB), katman-katman değil. "Walking skeleton" önce.
2. **Sonuç-odaklı, takvim-ikincil:** Solo + haftalık saat değişken. Sprint = 2 haftalık iş birimi *tahmini*; gerçek takvim haftalık kapasiteye bağlı. Tarih vermek yerine **sıra ve bağımlılık** sabitlenir.
3. **Her dilim bit: test + demo edilebilir.** Yarım özellik "bitti" sayılmaz (Doc 1: teknik borç yok).
4. **Risk önce:** Belirsizlik/risk taşıyan işler (auth, ödeme, göç erişimi) erkene çekilir.

> **Not:** Aşağıdaki "sprint" sayıları göreli efor birimidir, kesin hafta değil. Haftalık saat kapasiteni söylersen gerçek takvime çeviririm.

---

## 2. FAZ 0 — Temel & Karar Doğrulama (kod öncesi + walking skeleton)

**Sprint 0.1 — Kritik doğrulamalar (kod öncesi)**
- 🔴 **Göç erişim doğrulaması:** Firebase `paem-45a67` + eski MySQL erişimi kontrol (Doc 8 §7.5 gating riski). Sonuç göç kapsamını belirler.
- App Store Developer hesabı, Apple sign-in yeterlilikleri, marka/bundle kararı.
- Supabase projesi, alan adları (`api.` / `admin.paemisyon.com`), repo yapısı (mono-repo mü ayrı mı).

**Sprint 0.2 — Walking skeleton (uçtan uca en ince dilim)**
- NestJS iskelet + Supabase Postgres bağlantısı + Prisma + 1 sağlık endpoint'i.
- Flutter iskelet + Riverpod + go_router + Dio + `core` katmanları.
- CI/CD boru hattı (backend deploy + TestFlight ilk build).
- **Çıktı:** Flutter uygulaması API'den "hello" çekiyor, mağazaya build gidiyor. Tüm altyapı kanıtlı.

**Sprint 0.3 — Tasarım sistemi çekirdeği**
- `core/theme`: renk token, tipografi, spacing, temel komponentler (buton, kart, quiz option, skeleton, boş/hata durum).
- **Çıktı:** Premium hissin temeli; sonraki tüm ekranlar bunu kullanır.

---

## 3. FAZ 1 — MVP (ilk yayın, iOS)

**Sprint 1 — Kimlik (auth)**
- Supabase Auth entegrasyonu; e-posta + Apple + Google giriş/kayıt; e-posta doğrulama; token yaşam döngüsü (secure storage, refresh interceptor).
- NestJS: JWT doğrulama guard, `users` eşleme, RBAC iskeleti.
- **Çıktı:** Kullanıcı kayıt olup giriş yapabiliyor.

**Sprint 2 — İçerik modeli & Katalog**
- DB: modules/courses/topics/questions/question_versions/options (Doc 6).
- NestJS: catalog API (okuma) + admin panel için içerik CRUD temeli.
- Flutter: catalog modülü (modül→ders→konu→detay), ETag cache, offline cache.
- **Çıktı:** Kullanıcı içerik hiyerarşisinde gezinebiliyor. (İçerik girişi için minimal admin gerekli.)

**Sprint 3 — Quiz Engine (çekirdek, en büyük sprint)**
- NestJS: session başlat/cevapla/bitir; **sunucu-taraflı değerlendirme**; doğru cevap sızdırmama; idempotency.
- Flutter: tek quiz motoru (practice + exam modu), durum makinesi, kesintiye dayanıklılık.
- **Çıktı:** Kullanıcı bir konuyu uçtan uca çözebiliyor. Ürünün kalbi çalışıyor.

**Sprint 4 — Sonuç, İlerleme, Tekrar**
- NestJS: skor/istatistik hesaplama, progress, bookmarks, wrong_answers.
- Flutter: result, progress, review modülleri (review = quiz motoru yeniden kullanımı).
- **Çıktı:** Öğrenme döngüsü tamam (çöz→sonuç→tekrar→ilerleme).

**Sprint 5 — Offline & Senkron sağlamlaştırma**
- Drift yerel kuyruk, sync servisi, çakışma çözümü, offline durum kalıpları.
- **Çıktı:** Ağ kesintisinde veri kaybı yok.

**Sprint 6 — Abonelik & Freemium**
- NestJS: planlar, StoreKit makbuz **sunucu doğrulama** (App Store Server API), entitlements, günlük limit.
- Flutter: paywall, StoreKit 2 satın alma, premium kilitler, günlük limit göstergesi.
- **Çıktı:** Gelir motoru çalışıyor; freemium→premium dönüşümü mümkün.

**Sprint 7 — Onboarding, Home, Bildirimler, Profil**
- Onboarding + hedef seçimi; Home (streak, günlük hedef, kısayollar); push (APNs) + bildirim merkezi; profil/ayarlar; KVKK hesap silme.
- **Çıktı:** Uygulama bütünsel; ilk açılıştan günlük dönüşe tam deneyim.

**Sprint 8 — İçerik girişi & Admin paneli (MVP kapsamı)**
- Next.js admin: içerik yönetimi + **editoryal onay akışı** (Doc 9), soru sürümleme UI, temel kullanıcı/abonelik görünümü.
- **İçerik doldurma:** ilk gerçek soru bankası (editoryal — operasyonel iş, teknikten bağımsız başlayabilir).
- **Çıktı:** Gerçek içerikle dolu, yönetilebilir uygulama.

**Sprint 9 — Sertleştirme & Yayın**
- QA geçişi (kritik akış E2E testleri), erişilebilirlik, performans, gizlilik manifesti (`PrivacyInfo.xcprivacy`), ATT, App Store metadatası.
- Beta (TestFlight) → geri bildirim → düzeltme.
- (Varsa) kullanıcı göçü çalıştırma.
- **Çıktı:** 🚀 **App Store lansmanı.**

---

## 4. FAZ 2 — V1 (ilk büyük güncelleme)
- **Günlük Soru** (daily quiz + Home entegrasyonu).
- **AI Çalışma Planı v1:** zayıf konu tespiti → öneri (ai modülü aktif).
- **Detaylı istatistik** ekranları.
- **Leaderboard** (moral bozmayan tasarımla, opsiyonel).
- İçerik genişleme: PAEM/POMEM/PMYO ayrışması.
- Admin: analitik/gelir raporları derinleşir, 2FA.

## 5. FAZ 3 — V2 (platform genişleme)
- **Android sürümü** (aynı Flutter codebase; platform-özel: IAP Google Play, push FCM, mağaza uyumu). **Backend değişikliği yok.**
- **Yeni modüller:** Misyon, Rütbe Terfi, Komiser Yardımcılığı.
- **Mevzuat Kütüphanesi** (aranabilir güncel kanun/yönetmelik).
- **AI Koç v2** (soru-cevap, adaptif plan).

## 6. FAZ 4 — V3+ (ölçek)
- Meslek içi eğitim, canlı deneme sınavları, topluluk, kurumsal/kampüs paketleri, web istemci.

---

## 7. Bağımlılık Zinciri (kritik sıra)
```
0.1 erişim/karar → 0.2 skeleton → 0.3 tasarım sistemi
   → S1 auth → S2 katalog → S3 quiz(çekirdek) → S4 sonuç/ilerleme
   → S5 offline → S6 abonelik → S7 kabuk → S8 admin/içerik → S9 yayın
Not: S8 admin'in bir çekirdeği S2 sırasında gerekir (içerik girişi);
     tam editoryal akış S8'de olgunlaşır.
İçerik üretimi (editoryal) S2'den itibaren PARALEL yürür — teknikten bağımsız.
```

## 8. Definition of Done (her dilim için)
- [ ] Kod: tek sorumluluk, god-object yok, lint temiz.
- [ ] Test: domain/kritik mantık unit; kritik akış integration.
- [ ] Güvenlik: secret yok, yetki sunucuda, girdi doğrulama.
- [ ] Durumlar: yükleme/boş/hata/offline ele alınmış.
- [ ] Erişilebilirlik: temel kontrol.
- [ ] Demo edilebilir + belge güncel.

## 9. En Büyük Zaman Riskleri (Doc 14 detay)
1. **İçerik üretimi** (güncel/doğru soru bankası) — teknik değil ama en yavaş iş; erken başla, paralel yürüt.
2. **Abonelik/makbuz doğrulama** — kaygan; S6'da yeterli tampon.
3. **Göç erişimi** — S0.1'de netleşmezse sona ötelenir (temiz başlangıç fallback).
4. **Solo darboğaz** — kapsam disiplini; MVP'ye özellik sızmasına izin verme.

## 10. Vizyona hizmet
| İlke | Sprint karşılığı |
|---|---|
| Doğru > hızlı | Dikey dilim + DoD + risk-önce |
| 10 yıl sürdürülebilir | Skeleton + tasarım sistemi + test önce |
| Solo yönetilebilir | Sıra/bağımlılık net, kapsam dar |
| Android sıfır backend değişimi | V2'de yalnızca istemci işi |

# Doc 16 — Monetization Planı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 2 (abonelik + freemium=günlük soru), Doc 6 (plans/subscriptions/entitlements), Doc 7 (verify), Doc 11 (paywall akışı), Doc 14 (R10 maliyet).
> **Kapsam:** Gelir modeli, plan yapısı, fiyatlama çerçevesi, dönüşüm, ölçüm. *Fiyatların kesin rakamı senin iş kararın; ben çerçeve ve öneri sunarım.*

---

## 1. Model: Freemium + Abonelik

**Karar (Doc 2/4):** Ücretsiz giriş + günlük soru sınırı (Duolingo modeli) → premium abonelik ile sınırsız.

**Neden bu model:**
- **Alışkanlık kurar:** Ücretsiz kullanıcı her gün girer, streak yapar, değeri hisseder — sonra sınıra takılıp abone olur.
- **Türkiye kitlesine uygun:** Fiyat-duyarlı kitle önce denemek ister; freemium giriş bariyerini düşürür.
- **Reklamdan üstün:** Eski uygulamanın reklam-bombardımanı UX'i düşürüyordu. Abonelik hem premium his hem sürdürülebilir gelir verir. (Reklam MVP'de yok; istenirse ücretsiz katmanda çok sınırlı ölçüde V2'de değerlendirilebilir.)

---

## 2. Plan Yapısı

| Plan | Erişim | Fiyatlama |
|---|---|---|
| **Ücretsiz** | Günde X soru, tüm konulara erişim (kilitli premium konular hariç), temel istatistik, streak | ₺0 |
| **Premium Aylık** | Sınırsız soru, tüm konular, detaylı analiz, AI çalışma planı (V1), reklamsız | Aylık abonelik |
| **Premium Yıllık** | Aynı + ~2 ay indirim | Yıllık (vurgulu — en iyi dönüşüm) |

**Freemium sınırı (senin kararın: günlük soru):**
- Öneri başlangıç: **günde 10-20 soru** ücretsiz. Alışkanlık kurmaya yeter, ciddi çalışana dar gelir.
- Bu bir **sunucu-taraflı sayaç** (Doc 6 `daily_usage`, Doc 7 `403 DAILY_LIMIT_REACHED`). İstemci zorlamaz.
- Sınır, admin panelden **feature-flag** ile ayarlanabilir (Doc 9) → A/B test ederek optimize edilir.

**Premium tetikleyicileri (Doc 11):** günlük limit dolunca, premium konuya dokununca, detaylı analiz/deneme sınavı istenince — hepsi nazik paywall'a yönlendirir.

---

## 3. Fiyatlandırma Çerçevesi (Türkiye)

Kesin rakam senin iş kararın; karar verirken çerçeve:

- **Referans:** Türkiye'de sınav-hazırlık aboneliklerinin aylık aralığını ve rakip fiyatlarını gözlemle. Kitle fiyat-duyarlı → agresif değil, erişilebilir konumlan.
- **Yıllık cazip olmalı:** Aylık×12'ye göre belirgin indirim (örn. ~%30-40) → churn'ü düşürür, nakit akışını öne çeker.
- **Psikolojik fiyat:** ".99" yerine net, güven veren rakam (Stripe/premium his).
- **App Store/Play kesintisi:** İlk yıl %30, sonra %15 (küçük geliştirici programıyla baştan %15 mümkün) — fiyatı buna göre planla.
- **KDV:** App Store fiyatı KDV dahil gösterir; net gelir hesabında ayır.
- **Bölgesel:** Türkiye fiyatını TRY olarak ayrıca ayarla (App Store global fiyat matrisine bırakma — TL değer kaybı fiyatı bozar).

> Ürün adı Paemisyon marka bilinirliğini taşıyor; bu, ilk dönüşümde fiyat direncini bir miktar azaltır.

---

## 4. Ödeme Altyapısı (teknik — Doc 6/7 ile hizalı)

- **iOS: StoreKit 2** (App Store IAP). Android'de (V2): Google Play Billing.
- **Sunucu-taraflı doğrulama zorunlu:** İstemci makbuzu API'ye yollar → backend Apple **App Store Server API** ile doğrular → `subscriptions` + `entitlements` günceller. İstemci asla "premium'um" demez.
- **Server Notifications (webhook):** Yenileme/iptal/iade/grace durumları Apple'dan sunucuya bildirilir → abonelik durumu güncel kalır.
- **Restore:** "Satın alımları geri yükle" (App Store zorunluluğu).
- **Denetim izi:** `iap_transactions` her makbuzu tutar (Doc 6).

---

## 5. Dönüşüm Optimizasyonu

- **Değer önce, teklif sonra:** Paywall kullanıcı çalıştıktan sonra, moral bozmadan gelir ("bugün harika iş çıkardın").
- **Yıllık planı vurgula** (en iyi LTV).
- **Onboarding'de değer göster:** Kullanıcı ilk oturumda "aha" yaşasın (kaliteli soru + akıcı UX) → dönüşüm artar.
- **Streak + kayıp korkusu:** Süreklilik premium'a bağlılık yaratır.
- **A/B test:** Freemium limiti, paywall metni, fiyat sunumu — admin feature-flag ile denenir.
- **Deneme (trial):** İsteğe bağlı — kısa ücretsiz deneme dönüşümü artırabilir; churn'e dikkat.

---

## 6. Ölçüm (Doc 1 metrikleriyle hizalı)

| Metrik | Neden |
|---|---|
| **Dönüşüm oranı** (ücretsiz→premium) | Modelin sağlığı |
| **MRR / ARR** | Sürdürülebilirlik |
| **Churn** (aylık iptal) | Elde tutma |
| **LTV** (yaşam boyu değer) | Fiyat/pazarlama kararları |
| **ARPU / ARPPU** | Ortalama gelir |
| **Trial→paid** (varsa) | Deneme etkisi |
| **Paywall görüntüleme→satın alma** | Huni verimliliği |

Hepsi admin panel gelir ekranında (Doc 9), **sunucu-doğrulamalı** verilerden.

---

## 7. Gelir–Maliyet Dengesi (R10 ile)
- Premium gelir; altyapı (Supabase/hosting/push) + **AI çağrı maliyetini** (Doc 15) karşılamalı.
- AI özellikleri premium-öncelikli → maliyetli özellik geliri olan kullanıcıya.
- Solo geliştirici sabit gideri düşük → başabaş noktası erişilebilir; her premium abone marj.

---

## 8. Yasal / Uyum
- **App Store/Play abonelik kuralları:** şeffaf fiyat, otomatik yenileme bildirimi, kolay iptal yönlendirmesi, restore.
- **KVKK:** ödeme verisi Apple/Google'da; biz kart bilgisi tutmayız (güvenlik + yük azalması).
- **Tüketici hakları:** iptal/iade akışı mağaza politikasına uygun.

---

## 9. Senden karar bekleyen (iş)
1. **Aylık/yıllık hedef fiyat** (Türkiye rakip gözlemiyle — istersen birlikte bir aralık belirleriz).
2. **Freemium günlük soru sayısı** başlangıç değeri (öneri 10-20; A/B ile optimize).
3. **Ücretsiz deneme (trial) olacak mı** — dönüşüm↑ ama churn riski.

## 10. Vizyona hizmet
| İlke | Monetization karşılığı |
|---|---|
| Sürdürülebilir 10 yıl | Abonelik (tekrarlayan gelir), reklam bağımlılığı yok |
| Premium UX | Nazik paywall, reklamsız, değer-önce |
| Backend tek kaynak | Premium kararı + limit sunucuda; makbuz sunucu-doğrulamalı |
| Kullanıcıya saygı | Şeffaf fiyat, kolay iptal, moral bozmayan teklif |

# Doc 2 — Product Requirement Document (PRD)

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Bağlam:** Doc 1 (Vision) girdi alınarak yazıldı. Bu doküman *ne* inşa edeceğimizi kapsam ve öncelik olarak tanımlar. *Nasıl* (mimari) Doc 3'te.

---

## 1. Kapsam Stratejisi: Modüler Platform

Platform, ortak bir çekirdek üzerine oturan **modüllerden** oluşur. Her sınav/eğitim türü bir modüldür ama hepsi aynı motoru (quiz engine, ilerleme, abonelik, AI) paylaşır. Yeni modül eklemek = veri + içerik eklemek, yeni mimari yazmamak.

```
                 ┌─────────────────────────────┐
                 │        ORTAK ÇEKİRDEK        │
                 │ Auth · Quiz Engine · Progress│
                 │ Subscription · AI · Analytics│
                 └─────────────┬───────────────┘
        ┌───────────┬──────────┼──────────┬───────────┐
      PAEM        POMEM       PMYO      Misyon    Rütbe Terfi ...
```

## 2. Sürüm Önceliklendirmesi (MoSCoW)

Solo geliştirici + "doğru yap" felsefesi → MVP dar ama sağlam olmalı. Her şeyi V1'e sıkıştırmak teknik borçtur.

### MVP (Yıl 1, ilk yayın — iOS)
**Amaç:** Tek sınav dikeyinde (PAEM/POMEM/PMYO ortak konuları) *tam ve premium* bir öğrenme döngüsü kanıtlamak.

**Must-have:**
- **M1 — Kimlik & Hesap:** Kayıt/giriş (e-posta + Apple ile Giriş — App Store zorunluluğu), şifre sıfırlama, profil. Eski kullanıcı göçü (bkz. §6).
- **M2 — Sınav/Konu keşfi:** Modül → ders/kategori → konu hiyerarşisi, arama.
- **M3 — Quiz Engine:** Konu bazlı çözüm, deneme sınavı (süreli), soru gösterimi (çoktan seçmeli, açıklamalı), anlık geri bildirim.
- **M4 — Sonuç & İlerleme:** Sınav sonucu, doğru/yanlış/boş analizi, konu bazlı ilerleme, geçmiş.
- **M5 — İşaretleme/Tekrar:** Yanlışlarım, favoriler, "tekrar çöz".
- **M6 — Abonelik:** Freemium sınır + aylık/yıllık abonelik (StoreKit 2 / IAP), sunucu-taraflı makbuz doğrulama, premium içerik kilidi.
- **M7 — Bildirimler:** Push (çalışma hatırlatması, streak). Sunucudan tetiklenen.
- **M8 — Temel motivasyon:** Streak, günlük hedef, basit rozet.

### V1 (İlk büyük güncelleme)
- **Günlük Soru** (daily quiz)
- **AI Çalışma Planı v1:** Zayıf konu tespiti → kişiselleştirilmiş öneri.
- **Detaylı istatistik** ekranları (trend, karşılaştırma).
- **Leaderboard / sıralama** (opsiyonel, morali bozmayan tasarımla).
- İçerik genişlemesi: PAEM + POMEM + PMYO ayrışması.

### V2
- **Android sürümü** (aynı Flutter codebase).
- **Misyon**, **Rütbe Terfi**, **Komiser Yardımcılığı** modülleri.
- **Mevzuat Kütüphanesi** (güncel kanun/yönetmelik, aranabilir).
- **AI Koç v2:** Soru-cevap, açıklama, çalışma planı adaptasyonu.

### V3+
- Meslek içi eğitim, canlı deneme sınavları, topluluk, kurumsal paketler.

## 3. Fonksiyonel Gereksinimler (MVP detay — örnek kabul kriterleriyle)

**M3 — Quiz Engine (kritik modül)**
- Kullanıcı bir konu seçtiğinde, o konunun sorularından süreli/süresiz oturum başlatabilir.
- Her soru: kök, 4-5 şık, (varsa) görsel, doğru cevap, açıklama.
- Cevap sonrası: doğru/yanlış anlık gösterim + açıklama (öğrenme modu) VEYA sınav modunda sona ertelenir.
- Oturum kesilirse (uygulama kapanırsa) kaldığı yerden devam edebilmeli.
- *Kabul:* 50 soruluk süreli deneme, ağ kesildiğinde bile ilerleme kaybolmadan tamamlanabilir; sonuç sunucuya senkronlanır.

**M6 — Abonelik**
- Ücretsiz kullanıcı: sınırlı günlük soru / kilitli premium içerik.
- Premium: tam erişim.
- Satın alma StoreKit 2 üzerinden; **makbuz doğrulaması sunucuda** (App Store Server API). İstemci "premium mi" kararını asla tek başına vermez — backend'den gelir.
- *Kabul:* Abonelik iptal/yenileme durumunda erişim, sunucu doğrulamasıyla en geç bir sonraki oturumda güncellenir.

## 4. Fonksiyonel-Olmayan Gereksinimler (NFR)

| Kategori | Gereksinim |
|---|---|
| Performans | Ekran geçişleri <300ms hissi; quiz etkileşimi anlık; soğuk açılış <2.5s |
| Offline | Çözülmüş içerik ve devam eden oturum offline dayanıklı; senkron online olunca |
| Güvenlik | Secret istemcide yok; tüm trafik HTTPS; token tabanlı auth; makbuz doğrulama sunucuda |
| Erişilebilirlik | Dinamik font, VoiceOver/TalkBack uyumu, kontrast (WCAG AA hedefi) |
| Gizlilik | KVKK + App Store gizlilik manifest'i; minimum veri toplama |
| Gözlemlenebilirlik | Hata izleme (crash), analitik olayları, sunucu logları |
| Lokalizasyon | Türkçe birincil; mimari çok-dilliğe hazır (string katalog) |
| Ölçek | 100K+ kullanıcı ve çok modüllü içerik altında bozulmadan çalışma |

## 5. İçerik Modeli Gereksinimi (kritik)

Soru verisini taşımıyoruz ama **içerik yapısını** doğru kurmalıyız çünkü platformun kalbi bu:
- Hiyerarşi: `Modül → Ders → Konu → Soru`.
- Soru: sürümlenebilir (mevzuat değişince eski sürüm arşivlenir, yenisi yayınlanır).
- İçerik durumu: taslak / yayında / arşiv. **Yanlış/güncelolmayan içerik yayına çıkamaz** (editoryal onay akışı — admin panelde).
- Her içerik parçası mevzuat referansı/kaynak tutabilmeli (güven ilkesi).

## 6. Kullanıcı Göçü Gereksinimi

- **Taşınır:** Kullanıcı hesapları (kimlik + varsa abonelik geçmişi/kıdem).
- **Taşınmaz:** Soru/sınav içeriği (mevzuat riski).
- **Açık soru (Doc 8'de çözülecek):** Gerçek aktif kullanıcı tabanı hangisi — iOS'un Firebase Auth'u (`paem-45a67`) mu, web'in MySQL `ekip_uyeler`'i (MD5 parolalı) mi? Parola göçü stratejisi buna bağlı (MD5 parolalar taşınamaz → zorunlu şifre sıfırlama akışı gerekebilir).

## 7. Kapsam Dışı (MVP'de kesinlikle yok)

Battle/1v1/grup yarışması, robot rakip, coin store, refer&earn (eski template özellikleri) — MVP'de **yok**. Bunlar eski uygulamanın template artığıydı; gerçek öğrenme değeri kanıtlanmadan eklenmeyecek. Gerekirse V2+ değerlendirilir.

## 8. Riskler (özet — tam analiz Doc 14'te)

- İçerik üretimi (güncel, doğru soru bankası) en büyük *operasyonel* risk — teknik değil.
- Solo geliştirici hız darboğazı → kapsam disiplini şart.
- App Store abonelik/gizlilik uyumu.

## 9. Açık Kararlar (senin girdin gerekli)

1. **Ürün/marka adı** — "Paemisyon" devam mı, yeni marka mı? (Platform çok-sınavlı olacağı için "PAEM" adı dar kalabilir.)
2. **Freemium sınırı** — ücretsiz kullanıcı ne kadar içerik görür? (dönüşümü belirler)
3. **Fiyatlandırma** — aylık/yıllık hedef fiyat aralığı (Türkiye fiyat-duyarlılığı göz önünde).

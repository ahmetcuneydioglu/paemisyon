# Doc 1 — Product Vision

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Bağlam:** Bu doküman platformun *neden* var olduğunu tanımlar. Tüm sonraki teknik kararların anayasasıdır.

---

## 1. Vizyon Cümlesi (Kuzey Yıldızı)

> **Türkiye'deki polis adaylarının ve aktif polis personelinin, sınav ve mesleki gelişim yolculuğunun tamamını yöneten; güvenilir, kişiselleştirilmiş ve dünya standardında dijital eğitim platformu olmak.**

Kullanıcı uygulamayı açtığında hissetmesi gereken: *"Türkiye'de böyle kaliteli bir polis uygulaması mı varmış?"*

## 2. Ne İnşa Etmiyoruz (Sınırları netleştirmek için)

- Bir "soru bankası uygulaması" değil. Soru bankası bir **özelliktir**, ürün değil.
- Eski PAEM uygulamasının yeni versiyonu değil. Eski uygulama yalnızca **ürün dokümanı / UX referansı**.
- Tek sınava (PAEM) özel bir uygulama değil. PAEM, çok sınavlı bir platformun **ilk modülü**.

## 3. Hedef Kitle (Kişiler)

| Persona | Kim | Temel ihtiyaç | Ödeme eğilimi |
|---|---|---|---|
| **Aday Ahmet** | Polis olmak isteyen lise/üniversite mezunu (PAEM/POMEM/PMYO) | Sınavı kazanmak; sistemli, moral bozmayan çalışma | Yüksek (kariyer yatırımı) |
| **Personel Mert** | Aktif polis memuru (rütbe terfi, komiser yardımcılığı) | Meşgul; verimli, mobil, kısa oturumlu çalışma | Orta-Yüksek |
| **Mevzuat takipçisi** | Güncel kanun/yönetmelik takibi gereken personel | Güncel ve doğru mevzuat içeriği | Orta |

**Kritik pazar gerçeği:** Kitle Türkiye ortalamasının da üzerinde **Android-ağırlıklı** ve **fiyat-duyarlı**. Bu, hem teknoloji (Flutter) hem fiyatlama kararlarını doğrudan belirler.

## 4. Değer Önermesi

1. **Güven:** İçerik güncel ve doğru (mevzuat değişimlerini takip eden içerik yönetimi). Eski soru bankasını taşımama kararımızın nedeni budur.
2. **Kişiselleştirme:** AI destekli, kişiye özel çalışma planı ve zayıf nokta analizi.
3. **Motivasyon:** Duolingo-benzeri süreklilik (streak), ilerleme hissi, moral bozmayan geri bildirim.
4. **Premium deneyim:** Her ekran akıcı, hızlı ve özenli — sektörde eşi olmayan kalite.

## 5. Farklılaşma (Neden biz?)

Mevcut Türk polis-sınavı uygulamaları genelde: eski template'ler, reklam-bombardımanı, statik PDF/soru yığınları, kötü UX. Bizim ayrımımız: **platform mimarisi + AI kişiselleştirme + premium UX + güncel içerik disiplini.** Rakip bir uygulama değil, bir *öğrenme deneyimi* satıyoruz.

## 6. Kalite Referansları

- **UX/akıcılık:** Duolingo, Brilliant, Headway
- **Netlik/sistem:** Notion, Linear
- **Güven/profesyonellik:** Stripe
- **Platform standardı:** Apple HIG + Material Design

Amaç kopyalamak değil, bu kalite *seviyesine* ulaşmak.

## 7. Başarı Ne Demek? (Kuzey Yıldızı Metrikleri)

| Katman | Metrik | Neden |
|---|---|---|
| Kuzey Yıldızı | Haftalık aktif çalışan kullanıcı (WAU, en az 1 quiz tamamlayan) | Gerçek öğrenme kullanımı |
| Etkileşim | 7 günlük retention, ortalama streak | Alışkanlık oluşumu |
| Öğrenme | Deneme sınavı skor artışı (kohort bazlı) | Ürün gerçekten işe yarıyor mu |
| Gelir | Abonelik dönüşüm oranı, MRR, churn | Sürdürülebilirlik |

## 8. 10 Yıllık Bakış (Ürün Ufku)

- **Yıl 1:** PAEM/POMEM/PMYO odaklı MVP → V1. iOS. Abonelik. Temel AI çalışma planı.
- **Yıl 2-3:** Android. Misyon, Rütbe Terfi, Komiser Yardımcılığı modülleri. Mevzuat kütüphanesi. Gelişmiş AI koç.
- **Yıl 4+:** Meslek içi eğitim, kurumsal/kampüs anlaşmaları, canlı deneme sınavları, topluluk. Platformun "polis eğitimi işletim sistemi" haline gelmesi.

## 9. Yol Gösteren İlkeler (Teknik Anayasa)

1. **Backend tek gerçek kaynaktır.** Hiçbir istemci iş mantığı yazmaz.
2. **Teknik borç kabul edilmez.** Doğru olan, uzun sürse bile tercih edilir.
3. **Her dosyanın tek sorumluluğu vardır.** God object yok.
4. **Hiçbir secret istemcide bulunmaz.**
5. **İçerik güncelliği bir güvenlik meselesidir** (yanlış mevzuat = kullanıcı zararı).
6. **Modülerlik:** Yeni sınav türü eklemek, mimariyi değiştirmeden mümkün olmalı.

# Doc 14 — Risk Analizi

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Tüm dökümanlar + gerçek DB dökümleri (paem705/701, ekip_uyeler).
> **Kapsam:** Teknik, operasyonel, ticari, yasal riskler; olasılık×etki; azaltma.

Ölçek: Olasılık (Düşük/Orta/Yüksek) × Etki (Düşük/Orta/Yüksek/Kritik).

---

## 1. Risk Matrisi (özet)

| # | Risk | Olasılık | Etki | Öncelik |
|---|---|---|---|---|
| R1 | İçerik üretim hızı (güncel/doğru soru bankası) | Yüksek | Kritik | 🔴 1 |
| R2 | Solo geliştirici darboğazı / tükenmişlik | Yüksek | Yüksek | 🔴 2 |
| R3 | Kapsam kayması (feature creep) | Yüksek | Yüksek | 🔴 3 |
| R4 | Abonelik/makbuz doğrulama karmaşıklığı | Orta | Yüksek | 🟠 4 |
| R5 | PII veri güvenliği (DB dökümleri) | Orta | Kritik | 🔴 5 |
| R6 | App Store reddi / politika | Orta | Yüksek | 🟠 6 |
| R7 | Kullanıcı göçü sürtünmesi / kayıp | Orta | Orta | 🟡 7 |
| R8 | Mevzuat yanlışlığı (yanlış içerik yayını) | Orta | Kritik | 🔴 8 |
| R9 | KVKK / yasal uyum | Orta | Yüksek | 🟠 9 |
| R10 | Maliyet (altyapı + AI) ölçekte | Orta | Orta | 🟡 10 |
| R11 | Flutter/ekosistem bağımlılık değişimleri | Düşük | Orta | 🟢 11 |
| R12 | Vendor (Supabase) lock-in / fiyat | Düşük | Orta | 🟢 12 |
| R13 | Rakip / pazar zamanlaması | Orta | Orta | 🟡 13 |

---

## 2. Detaylı Riskler ve Azaltma

### 🔴 R1 — İçerik üretim hızı (EN BÜYÜK RİSK)
- **Neden:** Platformun değeri içerikte. Eski soru bankasını taşımıyoruz (mevzuat). Sıfırdan güncel, doğru, telifsiz soru üretmek yavaş ve teknik olmayan iştir. Mevcut mobil DB'de sadece ~342 soru var — yetersiz.
- **Etki:** Uygulama teknik olarak hazır ama içerik yoksa lansman anlamsız.
- **Azaltma:**
  - İçerik üretimini **S2'den itibaren paralel** başlat (Doc 13); teknikten bağımsız yürüsün.
  - Editör(ler)/konu uzmanı kaynağı planla; toplu içe aktarma aracı (V1) editör hızını artırır.
  - **AI-destekli taslak üretimi** (Doc 15): LLM soru taslağı üretir, uzman **doğrular** (asla otomatik yayın değil).
  - MVP'yi tek dikeyle (PAEM/POMEM ortak konuları) sınırla — tüm sınavları doldurmaya çalışma.

### 🔴 R2 — Solo darboğaz / tükenmişlik
- **Neden:** Tek kişi mobil+backend+admin+içerik+operasyon. 10 yıllık vizyon maratonu.
- **Azaltma:** Flutter tek codebase + TS uçtan uca (bilinçli seçim, yükü azaltır); AI-destekli geliştirme; dikey dilim + DoD ile "bitmiş" hissi; gerçekçi kapasite planı; kritik olmayan işleri (içerik, tasarım detayı) ileride devretmeye açık mimari.

### 🔴 R3 — Kapsam kayması
- **Neden:** Vizyon geniş (15+ modül). Her şeyi MVP'ye sıkıştırma cazibesi.
- **Azaltma:** Doc 2 MoSCoW sıkı uygulanır; battle/coin/refer MVP dışı sabit; her yeni fikir "MVP mi V1+ mı" filtresinden geçer. **CTO olarak görevim: kapsam kaymasında seni durdurmak** (senin de talebin).

### 🟠 R4 — Abonelik/makbuz doğrulama
- **Neden:** StoreKit 2 + App Store Server API + Google Play Billing sunucu doğrulaması kaygan; yenileme/iptal/grace/iade durumları çok.
- **Azaltma:** S6'da yeterli tampon; sunucu-taraflı doğrulama (Doc 6/7); iyi test edilmiş kütüphaneler; sandbox test; webhook (Server Notifications) ile durum senkronu.

### 🔴 R5 — PII veri güvenliği (DB dökümleri)
- **Neden:** `paem705.sql` vb. **4.400 kullanıcının e-posta/telefon/IP'sini** içeriyor. Repoda tutulması sızıntı riski (eski projenin secret-in-repo hatasının tekrarı).
- **Azaltma (kısmen uygulandı):** SQL dökümleri **`.gitignore`'a alındı** (commit engellendi). Ek: şifreli/erişimi kısıtlı ortamda işle, göç sonrası güvenli sil, KVKK saklama ilkelerine uy. Göç ETL'i izole ortamda çalışsın.

### 🟠 R6 — App Store reddi / politika
- **Neden:** Abonelik uygulamaları için katı kurallar (restore, fiyat şeffaflığı), gizlilik manifesti, ATT, sign-in with Apple zorunluluğu.
- **Azaltma:** Doc 8/12'de Apple ile Giriş + restore + KVKK zaten planlı; `PrivacyInfo.xcprivacy`; S9 sertleştirme; beta ile erken tespit.

### 🟡 R7 — Kullanıcı göçü sürtünmesi
- **Neden:** ~%51 kullanıcı (e-posta/telefon/FB) ilk girişte şifre sıfırlamalı; bazıları geri dönmeyebilir. FB girişi kaldırılıyor (129 kullanıcı).
- **Azaltma:** %49 sosyal kullanıcı sorunsuz; iyi lansman iletişimi ("daha iyi platform, tek seferlik güvenlik adımı"); reset akışı sürtünmesiz; FB kullanıcılarına e-posta ile alternatif. **Risk düşük çünkü veri elde ve seed edilebilir** (Doc 8 §7.5).

### 🔴 R8 — Mevzuat yanlışlığı
- **Neden:** Yanlış/güncelolmayan hukuk/mevzuat içeriği kullanıcıya doğrudan zarar (sınavda yanlış öğrenme) + itibar kaybı.
- **Azaltma:** Sürümlü içerik + **zorunlu editoryal onay** (Doc 6/9); mevzuat referansı + yürürlük tarihi alanı; AI üretimi asla otomatik yayın değil; güncelleme süreci (mevzuat değişince yeni sürüm).

### 🟠 R9 — KVKK / yasal uyum
- **Neden:** Türkiye'de kişisel veri işleme; hesap silme, aydınlatma metni, veri saklama.
- **Azaltma:** Hesap silme akışı (Doc 8/12); gizlilik politikası + KVKK aydınlatma; minimum veri; veri işleme sözleşmeleri (Supabase/analitik); göç PII'sinin güvenli imhası.

### 🟡 R10 — Ölçekte maliyet
- **Neden:** Supabase + hosting + push + **AI/LLM çağrı maliyeti** kullanıcı artınca yükselir.
- **Azaltma:** AI kullanımını akıllı sınırla (Doc 15: cache, batch, premium-özel); managed servislerin ücretsiz/başlangıç katmanı; maliyet izleme; abonelik geliriyle dengeleme.

### 🟢 R11 — Flutter/ekosistem değişimi
- **Azaltma:** Olgun paketler; clean arch ile paket değişimini izole et; Flutter kurumsal destekli, düşük risk.

### 🟢 R12 — Vendor lock-in (Supabase)
- **Azaltma:** İş mantığı NestJS'te (Supabase'e değil) → Postgres başka managed servise taşınabilir (Doc 4). Auth taşınırsa reset kohortu tekrarı riski — kabul edilebilir.

### 🟡 R13 — Rakip / zamanlama
- **Azaltma:** Farklılaşma kalite + AI + güncel içerikte (Doc 1); MVP'yi makul sürede çıkar ama kaliteden ödün verme dengesi.

---

## 3. En Kritik 3 Riskin Sahiplenilmesi
1. **İçerik (R1):** Teknik değil ama projeyi en çok geciktirecek. **Bugünden içerik stratejisi + kaynak planı gerekir.** (Doc 15 AI bunu hızlandırır.)
2. **Mevzuat doğruluğu (R8):** Ürünün güven temeli. Editoryal onay tavizsiz.
3. **Kapsam disiplini (R3):** Solo + geniş vizyon = en yaygın başarısızlık nedeni. CTO olarak aktif frenlerim.

## 4. Erken Uyarı Göstergeleri
- İçerik: sprint başına eklenen onaylı soru sayısı hedefin altındaysa → kaynak artır.
- Kapsam: MVP backlog büyüyorsa → durdur, önceliklendir.
- Maliyet: AI/altyapı faturası gelir projeksiyonunu aşıyorsa → kullanım sınırla.

## 5. Vizyona hizmet
Riskleri şimdiden görünür kılmak, "doğru geliştir" felsefesinin parçası. En büyük riskler teknik değil **operasyonel** (içerik) ve **disiplin** (kapsam) — bu ikisini yönetmek CTO ortaklığımızın asıl işi.

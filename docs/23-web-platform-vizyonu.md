# Doc 23 — paemisyon.com Ürün Vizyonu

> Durum: KONSEPT C ONAYLANDI (16 Tem 2026) — wireframe onayı bekleniyor
> Bu bir kod dokümanı değil; ürün/UX/SEO/growth dokümanı.
> Düzeltme: mobil uygulama SwiftUI değil **Flutter**'dır (tek kod, iOS+Android).

---

## 1. Elimizdeki gerçek cephane (varsayımsız envanter, 16 Tem 2026)

| Varlık | Değer | Ürün anlamı |
|---|---|---|
| Yayında soru | **866** (900 sürüm) | Çekirdek değer; her gün büyüyor (PDF import hattı çalışıyor) |
| Kaynak etiketli soru | **109** ("30 Kasım 2025 Adalet Bakanlığı GYS…") | **"Çıkmış soru" iddiası kanıtlı** — güven + SEO |
| Kanun-numaralı konu | **30** (2559 PVSK, 7068, 5271 CMK…) | **SEO altın madeni**: her kanun bir landing page |
| Ders / müfredat bölümü | 12 küresel ders, 16 bölüm (**%ağırlıklı**) | "PAEM'de ne çıkar?" sayfaları — resmi format bilgisiyle |
| Deneme motoru | randevulu canlı sınav + NET + sıralama | **Etkinlik** üretir: "Çarşamba 20:00 canlı deneme" |
| Koç motoru | 13 kural, kartlar **sunucudan** (Doc 19) | Web dashboard'u neredeyse bedava: aynı /me/coach |
| Gamification | 10 rozet, seri, haftalık hedef, rekorlar | Retention çekirdeği hazır |
| Kişisel veri | mastery, yanlış havuzu, haftalık snapshot | AI analiz/rapor hammaddesi |
| Tekrar tespiti + kaynak | contentHash + sourceLabel | İçerik kalite iddiası: "mükerrersiz, kaynaklı banka" |

**Dürüst eksikler** (yeni altyapı ister): blog/rehber CMS'i yok · sınav takvimi
tablosu yok · kanun değişikliği takibi yok · zorluk verisi tek tip (899 medium)
· kullanıcı 1 (lansman öncesi) → sosyal kanıt/topluluk özellikleri "boş oda"
riski taşır, faz 2'ye.

---

## 2. Öğrenci gerçeği (20 yıllık eğitimci + aday gözüyle)

### Google'da ne arıyor? (gerçek arama niyetleri)
1. **Bilgi/duyuru:** "paem sınavı ne zaman 2026", "komiser yardımcılığı şartları", "misyon koruma sınavı başvuru"
2. **İçerik:** "2559 pvsk çıkmış sorular", "7068 disiplin kanunu test", "paem konuları ve ağırlıkları", "polis meslek mevzuatı pdf"
3. **Araç:** "paem puan hesaplama", "net hesaplama", "kaç doğru gerekir"
4. **Deneyim:** "paem deneme sınavı çöz", "misyon koruma soruları"

→ 1 ve 3 **trafik mıknatısı** (yüksek hacim), 2 **bizim tekelimiz olabilecek
long-tail** (30 kanun sayfamız hazır), 4 **dönüşüm noktası** (kayıt/indirme).

### Adayın gerçek acıları
- Dağınık kaynak: PDF'ler, YouTube, WhatsApp grupları — **tek güvenilir merkez yok**
- "Neyi bilmiyorum?" belirsizliği — zayıflık analizi yok
- Yalnızlık/motivasyon çöküşü — uzun maraton, ölçülemeyen ilerleme
- Güncellik korkusu: "bu soru eski kanuna göre mi?"

### Her gün geri getiren şey ne olur?
Alışkanlık döngüsü: **tetik** (günün sorusu / canlı deneme saati / seri) →
**eylem** (2 dk'lık soru) → **ödül** (anında sonuç + seri + sıralama) →
**yatırım** (mastery/istatistik birikir → bırakmak pahalılaşır).

---

## 3. Üç ürün konsepti

### Konsept A — "Vitrin" (Minimal / Apple tarzı)
Tek odak: ürünü anlat, uygulamaya/webapp'e yönlendir. Az sayfa, çok cila.
Hero + özellikler + indirme + fiyat + birkaç SEO sayfası.

| Boyut | Değerlendirme |
|---|---|
| Ürün | Web bir **broşür**; asıl ürün mobil/webapp |
| UX | Kusursuz ilk izlenim; derinlik yok |
| SEO | **Zayıf** — az sayfa, az sorgu karşılığı |
| Gelir | İndirme funnel'ı; web'de dönüşüm anı yok |
| Psikoloji | "Etkileyici ama neden her gün geleyim?" |
| Bakım | **Çok düşük** (statik) |
| ✅ | Hızlı, ucuz, şık; marka algısı güçlü |
| ❌ | "Yaşayan platform / her gün ziyaret / Google'da 1. sıra" hedeflerinin ÜÇÜNÜ de ıskalıyor |

### Konsept B — "Antrenör" (Duolingo tarzı / gamification odaklı)
Web = giriş yapılan **günlük antrenman istasyonu**. Ana sayfa girişli
kullanıcıya koç dashboard'u (mevcut /me/coach!), girişsize "bugünün meydan
okuması". Seri, rozet, canlı deneme saati, sıralamalar ön planda.

| Boyut | Değerlendirme |
|---|---|
| Ürün | Mobilin gücünü web'e taşır; alışkanlık makinesi |
| UX | Enerjik, oyunlaştırılmış; hedefi net |
| SEO | **Orta** — dashboard'lar girişli (Google göremez); yalnız birkaç public sayfa |
| Gelir | Retention ↑ → premium dönüşümü ↑ |
| Psikoloji | Seri + canlı deneme = güçlü geri-gelme tetiği |
| Bakım | Orta (çoğu altyapı hazır: koç, rozet, deneme) |
| ✅ | En hızlı "yaşayan ürün" hissi; mevcut backend'le ~sıfır yeni API |
| ❌ | **Trafik nereden gelecek?** Kapalı bahçe Google'a görünmez; büyüme reklam/ağızdan-ağıza bağımlı |

### Konsept C — "Ansiklopedi + Antrenör" (Notion/Brilliant hibrit)
İki katman tek sitede:
1. **Public bilgi katmanı** (Google'ın gördüğü): kanun sayfaları (30 hazır
   konu!), müfredat sayfaları (%ağırlıklarla), çıkmış soru sayfaları
   (kaynaklı 109+), puan/net hesaplayıcı, sınav rehberleri, günün sorusu.
   Her sayfanın sonunda doğal geçiş: "bu konudan 34 soru çöz →".
2. **Girişli antrenman katmanı** = Konsept B'nin dashboard'u aynen.

| Boyut | Değerlendirme |
|---|---|
| Ürün | "Türkiye'deki polis adaylarının ana sayfası" hedefinin **tek gerçek adayı** |
| UX | İki mod: okuyucu (hafif, hızlı) ↔ öğrenci (dashboard) |
| SEO | **Güçlü** — 30 kanun + 12 ders + 16 bölüm + hesaplayıcı + rehberler = yüzlerce indekslenebilir, niyet-eşleşmeli sayfa; rakiplerin çoğu forum/PDF çöplüğü |
| Gelir | En geniş funnel: Google → içerik → ücretsiz soru → kayıt → premium |
| Psikoloji | Güven (kaynaklı içerik) + alışkanlık (antrenman) birlikte |
| Bakım | **En yüksek** — içerik üretimi süreklilik ister (rehber/blog) |
| ✅ | SEO + retention + funnel aynı üründe; veri modelimiz bunu zaten besliyor |
| ❌ | İçerik disiplini şart; tek seferde değil fazlarla yapılmalı |

### 📌 Önerim: **C — ama B'nin çekirdeği üstüne fazlanmış**
A'yı reddediyorum (hedeflerinle çelişiyor). B tek başına büyüyemez. C'nin
riski "her şeyi birden yapmak" — çözümü fazlama:
- **Faz 1 (lansman):** B'nin dashboard'u (koç webde) + C'nin en değerli 4 public
  parçası: kanun sayfaları, müfredat sayfaları, günün sorusu, hesaplayıcı.
  Hepsi mevcut DB'den otomatik üretilir — **içerik yazarlığı gerektirmez.**
- **Faz 2:** çıkmış soru sayfaları, denemeler takvimi public, rehber/blog (MDX).
- **Faz 3:** topluluk/başarı hikayeleri (kullanıcı kitlesi oluşunca — boş oda
  problemi çözülünce).

---

## 4. Önerilen bilgi mimarisi (Konsept C, fazlı)

### Sayfa haritası
```
paemisyon.com/
├── (girişsiz) Ana sayfa: günün sorusu (çözülebilir!) + canlı deneme sayacı
│   + kanun kütüphanesi vitrini + değer önerisi     [SEO + funnel]
├── (girişli)  Ana sayfa = KOÇ DASHBOARD'u (/me/coach kartları, seri, hedef)
│
├── /kanunlar                       → 30 kanun kartı (soru sayılarıyla)
│   └── /kanun/2559-pvsk            → kanun özeti + örnek çıkmış soru +
│                                     "34 soruyu çöz" CTA        [SEO ⭐]
├── /paem  /misyon (+ gelecekte /pomem /pmyo — DB'ye satır eklemek yeter)
│   → sınav rehberi: format, %ağırlıklar (exam_sections'tan CANLI),
│     ders kartları, SSS                                        [SEO ⭐]
│   └── /paem/anayasa-hukuku        → ders sayfası: konu ağacı + soru sayısı
├── /cikmis-sorular                 → kaynak (sourceLabel) bazlı gruplar
│   └── /cikmis-sorular/2025-adalet-gys → o sınavın soruları (önizleme +
│                                     tam erişim kayıtla)       [SEO ⭐]
├── /hesaplayici/paem-puan          → interaktif; paylaşılabilir   [SEO ⭐]
├── /denemeler                      → mevcut (canlı sınav akışı) + takvim
├── /gunun-sorusu                   → dünkü/bugünkü, arşivli      [SEO+retention]
├── /rehber/*                       → MDX blog (Faz 2; CMS'siz, dosya bazlı)
├── /premium                        → değer sayfası (aşağıda)
└── /profil /istatistiklerim        → girişli
```

### Navigasyon
Girişsiz: `Kanunlar · Sınavlar(PAEM/Misyon) · Çıkmış Sorular · Denemeler · Giriş`
Girişli: `Bugün(koç) · Çalış · Denemeler · İstatistiklerim · [seri 🔥]`

### SEO teknik omurga
- Public sayfalar **SSG/ISR** (Next.js) — DB'den saatlik yenilenen statik HTML;
  hız + indekslenebilirlik. Girişli katman CSR.
- Şema markup: Quiz/Question (günün sorusu), FAQPage (sınav rehberleri),
  BreadcrumbList; sitemap otomatik (kanun/ders/kaynak sayfalarından).
- URL'ler Türkçe, niyet-eşleşmeli: `/kanun/2559-polis-vazife-ve-salahiyet-kanunu`.
- İç bağlantı örgüsü: kanun ↔ ders ↔ çıkmış soru ↔ deneme (Google'ın sevdiği konu otoritesi).

---

## 5. AI — merkezde ama dürüst fazlarla

Sözleşme hazır (Doc 19: kartlar sunucudan; Doc 15: AI yol haritası). Web'de:
1. **Şimdi (kural motoru, "AI hissi"):** koç kartları webde; eksik-konu analizi
   (mastery) → "Ceza Hukuku'nda zayıfsın, 10 soru" — zaten çalışıyor.
2. **Faz 2 (gerçek LLM):** yanlış cevap açıklaması kişiselleştirme ("neden B
   değil?"), haftalık AI çalışma planı (snapshot+mastery'den), AI deneme
   analizi ("en çok X tipi soruda kaybettin").
3. **Faz 3:** başarı tahmini (deneme netleri + hedef sıralama → olasılık) —
   veri birikince; erken dönemde tahmin YANILTIR, itibar yakar. **Burada seni
   durduruyorum: az veriyle "başarı tahmini" satmak güven intiharı olur;
   önce 3-6 ay deneme verisi birikmeli.**

## 6. Premium — vazgeçilmezlik tasarımı

İlke: **ücretsiz katman gerçekten faydalı** (Google'dan geleni tutar), premium
"daha fazla soru" değil "**kör uçuşa son**" satar:

| Ücretsiz (herkese değerli) | Premium (bunsuz çalışamam) |
|---|---|
| Günün sorusu + arşiv | Sınırsız soru + tüm çıkmış sorular |
| Kanun/müfredat sayfaları | **Kişisel zayıflık raporu** (mastery haritası) |
| Günde 15 soru | **AI koç: kişisel plan + tekrar önerileri** |
| Canlı denemeye katılım | Deneme **detay analizi** + tüm sıralama geçmişi |
| Seri/rozetler | Yanlış havuzundan akıllı tekrar (spaced repetition) |

Psikoloji: premium özellikler kullanıcının **kendi verisinden** üretilir →
rakibe gidince sıfırdan başlar (geçiş maliyeti = birikmiş mastery/istatistik).

## 7. "Ben olsam bu ürünü böyle yapardım" (10 yıllık ufuk)

Paemisyon'u bir uygulama değil, **Türkiye kolluk sınavları bilgi altyapısı**
olarak kurardım:
- **Yıl 1:** Yukarıdaki C-fazlı plan. Tek metrik: haftalık aktif dönen kullanıcı.
- **Yıl 2-3:** İçerik ağı etkisi — her kanun değişikliğinde ilgili sorular
  işaretlenir ("bu soru 2027 değişikliğinden etkilendi"), Google'ın ve
  adayların "güncellik" sorununu tekelleştirir. Android çıkar (Flutter hazır).
  Canlı denemeler haftalık ritüel olur (Türkiye geneli sıralama basın bülteni
  gibi paylaşılır — organik PR).
- **Yıl 4-5:** Platform diğer kolluk/GYS sınavlarına açılır (mimari hazır:
  sınav türü = veri satırı). Kurumsal ürün: dershanelere/POMEM hazırlık
  kurslarına sınıf yönetimi paneli (B2B gelir).
- **Yıl 5+:** Soru bankası + öğrenme verisi Türkiye'nin en büyük kolluk-sınavı
  veri kümesi olur; AI koç gerçek kişiselleştirilmiş müfredat üretir ("senin
  öğrenme hızınla sınava 84 gün var, planın bu"). "Polis sınavı" denince
  akla gelen TEK isim.

Kuzey yıldızı metriği: **"aday, sınav yolculuğunun kaç gününde bize dokundu?"**

---

## 8. Karar noktası
Konsept onayı sonrası ilk teslimat: seçilen konseptin ana sayfa + kanun sayfası
+ sınav rehberi sayfası wireframe'leri (kod öncesi onaya sunulur).

# Doc 25 — Bilgi Mimarisi (Information Architecture)

> Statü: TASLAK — onay bekliyor
> Girdi: Doc 24 (kullanıcı yolculuğu — bu dokümanın anayasası), Doc 21 (içerik
> mimarisi), Doc 23 (web vizyonu)
> Kapsam: Ekran envanteri, akışlar, navigasyon, platform haritası.
> Kapsam DIŞI: wireframe, UI, kod, route, şema. Onaydan sonra sırayla gelecek.

---

## 0. Mimarinin üç temel kararı (her şey bunlardan türer)

Sayfaları listelemeden önce üç yapısal karar veriyorum. Bunlar kabul edilirse
ekran sayısı kendiliğinden düşer, kullanıcı kaybolmaz, ürün yıllarca büyüyebilir.

### Karar 1 — TEK SEANS OYNATICI: "her yol aynı odaya çıkar"

Mini quiz, bugün çalış, yanlış tekrarı, madde çalışması, akıllı tekrar, konu
sonu testi... bunlar **ayrı ekranlar değildir**. Hepsi tek bir **Seans
Oynatıcı**'nın farklı reçetelerle açılmış halidir:

```
Seans = { kaynak: koç | konu | madde | yanlışlar | favoriler | deneme,
          reçete: soru seti + süre kuralı + tekrar kuralı }
```

Kazanç:
- Kullanıcı **tek çalışma alışkanlığı** öğrenir; nereden girerse girsin aynı
  tanıdık oda (soru → cevap → açıklama → sonraki).
- Her seans aynı çıktıyı üretir: sonuç ekranı → koça veri → tekrar kuyruğu.
  Veri çarkı hiçbir kapıdan sızıntı vermez.
- 15 "quiz ekranı" yerine 1 oynatıcı + reçeteler: yıllarca bakımı kolay.

Deneme Oynatıcı bunun tek istisnasıdır (süre baskısı, bölüm geçişi, optik
form hissi) — o ayrı bir odadır, bilinçli olarak.

### Karar 2 — AĞAÇ GEZMEK İÇİN, DÖNGÜ ÇALIŞMAK İÇİN

Görev 4'teki akış (PAEM→Ders→Konu→Madde→Anlatım→Quiz→Soru→Yanlış→Tekrar→
Deneme→İstatistik→Ana Sayfa) **11 adımlık doğrusal bir koridor** — gerçek
kullanıcı böyle yürümez, yürütülürse 3. adımda kaybolur. Beni durdur demiştin;
durduruyorum:

- **Ağaç (Sınav→Ders→Konu→Madde)** yalnız iki iş yapar: *yön bulma* ve
  *kapsam görme* ("neredeyim, ne kadar kaldı").
- **Çalışmanın kendisi bir döngüdür:**

```
        ┌──────────────────────────────┐
        ▼                              │
   ÖĞREN (anlatım/madde) → DENE (seans) → YANIL → ANLA (açıklama/madde)
        ▲                                              │
        └───────────── TEKRAR (akıllı kuyruk) ◄────────┘
```

- Koç, kullanıcıyı ağaçta gezdirmez; **döngünün doğru noktasına ışınlar.**
  "CMK'da düşüş var" kartı → doğrudan CMK tekrar seansı (3 tık değil 1 tık).

IA kuralı: **ağaç derinliği kullanıcıya asla tam yol olarak yürütülmez.**
Her çalışma eylemi her yerden en fazla 2 dokunuş uzaktadır.

### Karar 3 — "AI KOÇ" BİR EKRAN DEĞİLDİR

Listende "AI Koç" bir sayfa olarak geçiyor. İtirazım var: koçu bir sekmeye
koyarsak "gidilen bir yer" olur ve gidilmez (Duolingo dersi ana akışa gömer,
ayrı "öğretmen sekmesi" yapmaz). Koç:

- **Bugün ekranının kendisidir** (hero + kartlar),
- **her sonuç ekranındaki yorumdur**,
- **her bildirimdeki sestir**,
- Premium'da **Plan** görünümü olarak somutlaşır (haftalık koç planı — bu BİR
  ekrandır ama adı "AI Koç" değil "Planım"dır).

Koç bir yer değil, platformun her yerindeki sestir.

---

## 1. Bölge modeli (zone architecture)

Platform 5 bölgeye ayrılır. Her bölge tek bir kullanıcı sorusuna cevap verir:

| Bölge | Kullanıcının sorusu | İçerik |
|---|---|---|
| **1. Bugün** | "Şimdi ne yapmalıyım?" | Koç ana ekranı, günlük hedef, seans başlatma |
| **2. Kütüphane** | "Neyi öğrenmem gerekiyor?" | Dersler→Konular, **Mevzuat/Madde Atlası**, anlatım, favoriler |
| **3. Denemeler** | "Hazır mıyım?" | Canlı denemeler, provalar, sonuç ve analiz, sıralama |
| **4. Performans** | "Nasıl gidiyorum?" | Mastery haritası, haftalık raporlar, rekorlar, yanlış analizi |
| **5. Ben** | "Kimim ve neyim var?" | Profil, rütbe, rozetler, premium, ayarlar, bildirimler |

Mevzuat, Kütüphane'nin tacıdır — ayrı bölge yapmadım çünkü kullanıcı zihninde
"çalışılacak içerik" tektir; ama web'de kendi giriş kapısı (SEO) ve mobilde
Kütüphane içinde birinci sınıf rafı vardır.

---

## 2. Ekran envanteri (Görev 1 + 2)

Statü: **Ç** = çekirdek (bu olmadan platform çalışmaz) · **D** = destek ·
**V2/V3** = ertelenebilir. Süre = tipik oturum payı.

### Bölge 0 — Kapı (girişsiz / web ağırlıklı)

| Ekran | Amacı | Neden gelir / nereden | Nereye gider | Süre | Çözdüğü problem | Statü |
|---|---|---|---|---|---|---|
| Landing (girişsiz ana sayfa) | Değeri 60 sn'de yaşatmak | Google, tavsiye linki | Günün sorusu → Kayıt | 1–3 dk | "Bu ne, bana ne faydası var?" | Ç (canlı) |
| Günün Sorusu | Kayıtsız ilk değer + günlük paylaşım kancası | Landing, WhatsApp linki, push | Kayıt / Bugün | 1–2 dk | Güven ("gerçek soru") | Ç (canlı) |
| Sınav Rehberi (PAEM / Misyon) | Sınavı ve müfredatı tanıtmak | Google, landing | Kayıt, Kanun sayfaları | 3–5 dk | "Neden sorumluyum?" | Ç (canlı) |
| Kanun sayfası (public) | SEO + mevzuat vitrini | Google ("2559 soruları") | Kayıt, ilgili kanunlar | 2–5 dk | Keşif trafiği | Ç (canlı) |
| Hesaplayıcı | Araç değeri, backlink mıknatısı | Google, rehber | Kayıt, rehber | 2 dk | "Netim ne eder?" | D (canlı) |
| Kayıt / Giriş / Şifre | Kimlik | Her CTA | Onboarding / Bugün | <1 dk | — | Ç (canlı) |
| Fiyatlandırma | Premium'u kayıtsıza da anlatmak | Landing, SSS | Kayıt | 1–2 dk | "Kaça, ne farkı var?" | D |
| SSS + İletişim + Yasal (KVKK, koşullar) | Güven ve zorunluluk | Footer | — | <1 dk | Kurumsal güven | D |

### Bölge 1 — Bugün (koç)

| Ekran | Amacı | Neden gelir / nereden | Nereye gider | Süre | Çözdüğü problem | Statü |
|---|---|---|---|---|---|---|
| Onboarding (3 soru: sınav, tarih, günlük süre) | Koçun ilk verisi | Kayıt sonrası, tek sefer | İlk Devriye | 1 dk | Soğuk başlangıç | Ç |
| İlk Devriye (10 soruluk seviye tespiti) | Teşhis + ilk başarı | Onboarding | Teşhis özeti → Bugün | 5–8 dk | "Nereden başlayacağım?" | Ç |
| **Bugün** (ana ekran) | Durum makinesinin sahnesi; günün tek doğru eylemini sunmak | Uygulama açılışı, her seans sonu | Seans, Deneme, her yer | 30 sn (karar anı) | Karar yorgunluğu | Ç |
| Seans Oynatıcı | TEK çalışma odası (Karar 1) | Bugün, konu, madde, yanlışlar, favoriler | Seans Sonucu | 5–25 dk | Çalışmanın kendisi | Ç |
| Seans Sonucu | Kapanış + koç yorumu + sonraki adım | Oynatıcı | Bugün / Tekrar / ilgili Madde | 1–2 dk | "Ne öğrendim, şimdi ne?" | Ç |
| Bugün Çalış — Odak seçici (sheet) | Hibrit kontrol (bkz. §5) | Bugün'deki hero'nun "ayarla" ucu | Seans | 15 sn | "Bugün sadece Anayasa" | Ç |
| Planım (premium) | Haftalık koç planının somut hali | Bugün kartı, Performans | Seans | 2–3 dk | "Bu hafta ne yapacağım?" | V2 |

### Bölge 2 — Kütüphane

| Ekran | Amacı | Neden gelir / nereden | Nereye gider | Süre | Çözdüğü problem | Statü |
|---|---|---|---|---|---|---|
| Kütüphane ana (Dersler) | Kapsam haritası: dersler + ilerleme yüzdeleri | Tab, koç kartı | Ders detay, Mevzuat | 30 sn | Yön bulma | Ç |
| Ders detay (öğrenme merkezi) | Dersin TEK yaşayan mekânı: konular, benim durumum, yanlışlarım, önerilen seans | Kütüphane, koç kartı, web SEO | Konu, Seans, Mevzuat | 1–3 dk | Dağınık ders deneyimi | Ç |
| Konu detay | Konunun durumu + eylemleri (anlatım/quiz/yanlışlar) | Ders, koç ışınlaması | Seans, Anlatım, Madde | 30–60 sn | Mikro yön bulma | Ç |
| Konu anlatımı | Öğretim içeriği (kanun konularında = Madde listesi; diğerlerinde metin/özet) | Konu, yanlış açıklaması | Mini quiz (seans) | 5–15 dk | "Önce öğrenmem lazım" | V2 (içerik işi) |
| **Mevzuat ana (Madde Atlası)** | Kanun rafı + ısı haritası girişi | Kütüphane, web SEO, koç | Kanun detay | 1–2 dk | "Hangi kanun önemli?" | Ç (v1'i canlı) |
| Kanun detay | Maddelerin ısı haritası + kanun ilerleme çubuğu + kanundan seans | Mevzuat, Google, soru kaynağı linki | Madde, Seans | 2–5 dk | "Bu kanunda ne çıkıyor?" | Ç |
| **Madde detay** | Resmî metin + AI sadeleştirme + o maddenin soruları + tekrar durumu | Kanun, yanlış açıklaması ("ilgili madde"), tekrar kartı | Seans (madde reçetesi), sonraki madde | 3–8 dk | Ezber yerine kavrayış | Ç (Atlas'ın kalbi) |
| Yanlışlarım | Tüm yanlışların tek kuyruğu (ders/kanun filtreli) | Tab içi, koç, sonuç ekranı | Seans (yanlış reçetesi), Madde | 1–2 dk | "Hatalarım kaybolmasın" | Ç |
| Akıllı Tekrar | Spaced-repetition kuyruğunun bugünkü hali | Koç kartı, Kütüphane | Seans (tekrar reçetesi) | 30 sn → seans | Unutma eğrisi | Ç (motor), tam sürüm V2/premium |
| Favoriler | Kullanıcının el koleksiyonu | Soru içi ⭐, Kütüphane | Seans (favori reçetesi) | 30 sn | "Bunu sonra çözeceğim" | D |
| Soru arama | Metin/madde ile soru bulma | Kütüphane | Soru/Madde | 1 dk | İğne-samanlık | V2 |

### Bölge 3 — Denemeler

| Ekran | Amacı | Neden gelir / nereden | Nereye gider | Süre | Çözdüğü problem | Statü |
|---|---|---|---|---|---|---|
| Denemeler ana | Canlı takvim + prova arşivi + geçmişim | Tab, koç kartı, push | Lobi, Sonuçlarım | 1 dk | "Ne zaman, hangi deneme?" | Ç (canlı) |
| Deneme lobisi | Katılım, kurallar, geri sayım | Denemeler, push | Deneme Oynatıcı | 1–2 dk | Tören hissi | Ç (canlı) |
| Deneme Oynatıcı | Gerçek sınav simülasyonu (süre, bölümler) | Lobi | Sonuç | 60–120 dk | Prova | Ç (canlı) |
| Deneme Sonucu + Analiz | Net + bölüm kırılımı + **kaybettiren konular/maddeler** + koç yorumu | Oynatıcı, Sonuçlarım | Tekrar seansı, Sıralama | 3–10 dk | Şok değil yol haritası | Ç (analiz derinliği V2) |
| Sıralama | Türkiye geneli gerçeklik testi | Sonuç | Bugün | 1–2 dk | "Neredeyim?" | Ç (canlı) |
| Denemelerim (arşiv) | Geçmiş sonuçlar, gelişim çizgisi | Denemeler, Performans | Sonuç detayı | 1–2 dk | İlerleme kanıtı | Ç (canlı) |

### Bölge 4 — Performans

| Ekran | Amacı | Neden gelir / nereden | Nereye gider | Süre | Çözdüğü problem | Statü |
|---|---|---|---|---|---|---|
| Performans ana | Tek bakışta durum: mastery özeti, seri, haftalık değişim | Tab, koç kartı | Konu haritası, Raporlar | 1–2 dk | "Nasıl gidiyorum?" | Ç |
| Konu haritası (mastery) | Ders/konu/madde bazlı güç-zaaf haritası | Performans, Ders detay | Konu → Seans | 2–5 dk | Zaafın görünürlüğü | Ç |
| Haftalık Rapor | Haftalık fotoğraf + (premium) doğal dilli koç raporu | Push/e-posta, Performans | Önerilen seanslar | 2–3 dk | Haftalık ritüel | Ç (doğal dil V2) |
| Rekorlar | En iyi net, en uzun seri, kişisel zirveler | Performans, rozet anları | — | <1 dk | Kimlik/gurur | D |

### Bölge 5 — Ben

| Ekran | Amacı | Neden gelir / nereden | Nereye gider | Süre | Çözdüğü problem | Statü |
|---|---|---|---|---|---|---|
| Profil | Kimlik kartı: rütbe, seri, rozet vitrini | Tab | Rütbe, Rozetler, Ayarlar | 30 sn | Aidiyet | Ç |
| Rütbe | Terfi yolu: neredeyim, sonraki rütbeye ne kaldı | Profil, terfi bildirimi | Bugün (eylem) | 1 dk | Uzun vadeli ilerleme | D (V1.5) |
| Rozetler | Dönüm noktası koleksiyonu | Profil, kazanım anı | — | 1 dk | Anı biriktirme | D (canlı altyapı) |
| Premium | Değer anlatımı + satın alma + abonelik yönetimi | Limit anı, koç teklifi, Profil | Ödeme | 1–2 dk | Gelir | Ç |
| Ayarlar | Bildirim saatleri, **vardiya düzeni**, günlük hedef, hesap | Profil | — | 1–2 dk | Kontrol hissi | Ç (vardiya V2) |
| Bildirim merkezi | Kaçırılan koç mesajları/duyurular | Zil ikonu | İlgili ekran | <1 dk | "Ne kaçırdım?" | D |
| Soru Öner / Geri bildirim | Topluluk katkısı + hata bildirimi | Profil, soru içi "hata bildir" | — | 1–2 dk | Banka kalitesi + aidiyet | D (canlı) |

**Toplam: ~38 ekran; bunun 22'si çekirdek.** Tek Seans Oynatıcı kararı olmasaydı
bu envanter 50+ olurdu.

---

## 3. Kullanıcı akışları (Görev 3)

Gösterim: `[ekran]` → eylem. Tümü döngüye (Karar 2) döner.

**A. İlk gün:**
`Landing` → günün sorusunu çöz → `Kayıt` → `Onboarding(3 soru)` →
`İlk Devriye` → teşhis özeti → `Bugün` (koç: "yarın buradan başlıyoruz") → çıkış.
*Tasarım hedefi: kayıttan teşhise <10 dk, tek koridor, çıkış noktasız.*

**B. Günlük dönüş (çekirdek döngü — ürünün kalp atışı):**
`Push(kişisel saat)` → `Bugün` → **[Bugün Çalış]** → `Seans Oynatıcı(koç reçetesi)`
→ `Seans Sonucu` (koç yorumu + "4 yanlışından yarına tekrar kurdum") → `Bugün`
(hedef doldu ✓) → çıkış. *2 dokunuş, 10–20 dk.*

**C. Yanlış → kavrayış döngüsü (Madde Atlası devrede):**
`Seans` → yanlış cevap → açıklama + **"ilgili madde: PVSK m.16"** →
`Madde detay` (metin + sadeleştirme) → "bu maddeden 4 soru daha" →
`Seans(madde reçetesi)` → `Sonuç` → tekrar kuyruğuna madde eklendi.

**D. Seri riski akşamı:**
`Push("serin 3 saatte bozuluyor")` → `Bugün(streak_risk hero)` →
`Seans(5 soruluk mini)` → `Sonuç("seri kurtuldu 🔥47")` → çıkış. *3 dakika.*

**E. Deneme günü:**
`Push(sabah: bugün deneme var)` → `Bugün(exam_day hero)` → hafif ısınma seansı →
… → `Deneme lobisi` → `Deneme Oynatıcı` → `Sonuç+Analiz` → "en çok kaybettiren
3 konudan kapatma seansı" → `Sıralama` → `Bugün`.

**F. Dönüş (comeback):**
`Push(7 gün sonra, yumuşak)` → `Bugün(comeback hero)` → `Seans(3 dk, güçlü
konudan)` → `Sonuç("hoş geldin" + Geri Döndü rozeti)` → hedef otomatik
küçültülmüş → `Bugün`.

**G. Manuel niyet ("bugün sadece Anayasa"):**
`Bugün` → hero'nun **Odak** ucu → `Odak seçici(ders/konu/kanun seç)` →
`Seans(koç reçetesi, Anayasa'ya kısıtlı)` → `Sonuç` → odak yarın sıfırlanır
(kalıcı değil — bkz. §5).

**H. Premium anı (limit):**
`Seans` 15. soru → akış kesilmeden kibar duvar: "Koç seni durdurmak istemiyor —
bugün 12 doğru yakaladın" → `Premium` → satın alma → kaldığı sorudan devam.
*Kritik: duvar seansın ORTASINA değil sonuna; flow cezalandırılmaz.*

**I. Web derin çalışma:**
`E-posta haftalık rapor` → `Performans(web)` → konu haritasında CMK kırmızı →
`Ders detay(CMK)` → `Kanun detay(CMK ısı haritası)` → `Madde detay` okuma →
mini seans → mobil push: "yarınki tekrarın hazır". *Web'de derinleş, mobilde sürdür.*

---

## 4. PAEM ve Misyon yolculukları (Görev 4 + 5)

### PAEM (önerdiğin akışın düzeltilmiş hali)

Önerdiğin 11 adımlı koridor yerine (Karar 2 gerekçesiyle) **3 kapı + 1 döngü**:

- **Kapı 1 — Koç (varsayılan, %70):** `Bugün Çalış` zaten PAEM müfredat
  ağırlıklarıyla karışım yapar. Kullanıcı ağacı hiç görmeden doğru konuları çalışır.
- **Kapı 2 — Kütüphane (niyetli çalışma, %25):** `Dersler` → `Anayasa` →
  ilerleme + konular → `Temel Haklar` → [Anlatım varsa oku] → `Mini quiz` →
  döngüye girer (yanıl→anla→tekrar). İstatistik ayrı durak DEĞİL; ders
  detayında zaten yaşıyor.
- **Kapı 3 — Performans (zaaf kapatma, %5):** `Konu haritası` kırmızı hücre →
  tek dokunuş → kapatma seansı.

### Misyon + Polisi İlgilendiren Mevzuat (en güçlü alan)

Misyon kullanıcısının farkı: müfredatın kalbi mevzuat (%20 ağırlık) ve Protokol/
Silah gibi ezber dersleri. Yolculuğun merkezi **Madde Atlası**:

```
Mevzuat ana (raf + ısı özeti)
   → Kanun detay:  ● madde ısı haritası ("PVSK'da soruların %52'si 5 maddeden")
                   ● kanun ilerleme çubuğu (fetih haritası: m.1 ✓ m.2 ✓ m.16 ✗…)
   → Madde detay:  resmî metin → AI "polis diliyle" + saha senaryosu
                   → bu maddeden çıkmış sorular (seans) → yanlış → tekrar kuyruğu
   → Kanun bitirme: "6136'yı fethettin" rozeti + kanun mini denemesi
```

**Türkiye'de örneği olmayan fikirler (mevzuat için):**

1. **Madde Isı Haritası** — hangi madde kaç kez, hangi sınavda soruldu. Veri
   bizde var (soru↔madde etiketi kurulunca); kimsede yok.
2. **Fetih Haritası** — kanunu madde madde "temizleme" ilerlemesi. Ezber dersinin
   RPG haritasına dönüşmesi; Misyon'un ezber yükünü oyunlaştırır.
3. **Senaryo Modu (AI, V2)** — AI saha senaryosu anlatır ("şüpheli üst araması
   sırasında…"), kullanıcı hangi kanun/madde uygulanacağını seçer. Bilgiyi
   *uygulamaya* çevirir; sınavın olay örgüsü sorularının antrenmanı.
4. **Madde Kartları** — spaced repetition'ın madde hassasiyetli hali: "6136 m.13'ü
   3 kez yanlışladın → madde kartı + 4 soru, 5 dk."
5. **Mevzuat Değişiklik Nöbeti (V3)** — kanun değişince o maddeye bağlı sorular
   bayraklanır, çalışmış kullanıcıya "çalıştığın madde değişti" bildirimi gider.
   Güvenin zirvesi: "bu platform mevzuatı benden iyi takip ediyor."

### İki sınav tek yapı (yapısal karar)

PAEM ve Misyon **ayrı site bölümleri DEĞİLDİR**. Sınav, kullanıcının
**bağlamıdır** (onboarding'de seçilir, ayarlardan değişir): Kütüphane, koç
karışımı, denemeler ve ağırlıklar o bağlama göre filtrelenir. İkisine birden
hazırlanan kullanıcı bağlam anahtarıyla geçiş yapar. Aksi (iki paralel ağaç)
her ekranı ikiye kopyalar — bakım ve zihin yükü ikiye katlanır. Public web'de
`/paem` ve `/misyon` rehber sayfaları elbette ayrıdır (SEO kapıları).

---

## 5. "Bugün Çalış" × manuel çalışma: Odak modeli (Görev 6)

Doc 24 §9'daki hibrit kararın UX'ini netleştiriyorum. İlke:

> **Kullanıcı NEREYE bakılacağını seçebilir; NEYE bakılacağını koç seçer.**
> ("Konuyu sen seç, soruları ben seçeyim.")

Mekanizma — **Odak**:
- `Bugün` hero'su tek büyük eylem: **[Bugün Çalış]**. Hemen altında sessiz bir
  uç: "Odak: Koç seçiyor ▾".
- Dokununca Odak seçici (yarım ekran sheet): **Koç seçsin (varsayılan)** ·
  Ders seç · Konu seç · Kanun/Madde seç · Sadece yanlışlarım.
- Odak seçilince koç KAYBOLMAZ; karışımı o kapsama uygular: "Bugün sadece
  Anayasa" → Anayasa içinde yine yanlıklarından + zayıf konularından + yeni
  sorulardan akıllı reçete kurar.
- **Odak geçicidir:** o günün seansları için yaşar, ertesi sabah "Koç seçiyor"a
  döner. Kalıcı mod anahtarı YOK — kalıcı manuel mod, koçun veri çarkını ve
  ürünün özünü söndürür.
- Koç, odağı veri olarak da kullanır: kullanıcı 3 gün üst üste Anayasa odağı
  seçtiyse koç sorar: "Anayasa'ya mı yoğunlaşıyoruz? Planı ona göre kurayım mı?"
  (kontrol hissi + öğrenen sistem algısı aynı anda).

Kütüphane'den girilen her seans zaten doğal "odaklı seans"tır — aynı motor,
farklı kapı. Ayrı bir "manuel mod" inşa edilmez.

---

## 6. Web ↔ Mobil iş bölümü (Görev 7)

Aynı beyin (`/me/coach`, tek ilerleme), iki oda (Doc 24 §10). Tablo:

| İş | Mobil 📱 | Web 🖥 | Not |
|---|---|---|---|
| Günlük seans / Bugün Çalış | ✅ birincil | var | Alışkanlık cebe kurulur |
| Bildirim + seri koruma | ✅ tek | — | Push yalnız mobil; web'e e-posta |
| Günün sorusu | ✅ | ✅ | Web'de paylaşım/SEO, mobilde ritüel |
| Hızlı tekrar (3–5 dk) | ✅ birincil | var | Nöbet arası senaryosu |
| Kanun/madde OKUMA | özet | ✅ birincil | Uzun metin = büyük ekran |
| Madde Atlası ısı haritası | özet kart | ✅ birincil | Görsel yoğun |
| Uzun deneme (60–120 dk) | mümkün | ✅ birincil | Süre paneli, optik his |
| Deneme analizi (derin) | özet | ✅ birincil | Kırılım tabloları |
| Performans haritaları / raporlar | özet kart | ✅ birincil | Analiz = masa başı |
| Konu anlatımı (V2) | okunur | ✅ birincil | — |
| Onboarding + İlk Devriye | ✅ | ✅ | Nereden geldiyse orada |
| Premium satın alma | ✅ (IAP) | ✅ (web ödeme) | Web ödeme komisyon avantajı |
| Keşif / SEO / kayıt | — | ✅ tek kapı | — |
| Profil, rütbe, rozet | ✅ | ✅ | Eş |

El sıkışma kuralı: her platform, diğerinin güçlü olduğu işi **yasaklamaz**,
sadece yönlendirir ("bu analizi web'de büyük ekranda incele" / "yarınki
tekrarını telefonuna kurdum").

---

## 7. Navigasyon (Görev 8)

### Mobil — Bottom tab (5 sekme) + tek hiyerarşik stack

```
[ Bugün ]  [ Kütüphane ]  [ Denemeler ]  [ Performans ]  [ Ben ]
```

- **Bugün her zaman ilk sekme ve açılış ekranı.** Uygulama hangi durumda
  kapatılırsa kapatılsın, açılış Bugün'dür (koç sahneyi kurar).
- Seans/Deneme Oynatıcı **tam ekran modal**dır: tab bar gizlenir (çalışırken
  kaçış dikkat dağıtır); çıkış = sonuç ekranından.
- Derinlik kuralı: tab → liste → detay → oynatıcı; **hiçbir yol 3 seviyeden
  derin değil.** Madde detayı gibi derin içerik, koç kartından tek dokunuşla
  da açılır (ağaç yürütülmez, ışınlanılır).
- Breadcrumb mobilde YOK; başlıkta bağlam etiketi yeter ("PVSK · m.16").

### Web — Üst nav (bölgeler) + sol ağaç (Kütüphane/Mevzuat içinde) + breadcrumb

- Üst nav = aynı 5 bölge (+ girişsize: Rehberler, Kanunlar, Fiyat).
- Kütüphane ve Mevzuat sayfalarında **sol sidebar ağacı** (Ders→Konu /
  Kanun→Madde): web'in derin okuma senaryosunda ağaç görünür kalmalı.
- **Breadcrumb yalnız web'de ve yalnız 3+ seviyede**: `Kütüphane › Polis
  Mevzuatı › PVSK › m.16`. SEO için de yapısal veri üretir.
- Aynı URL iki derinlik (Doc 24): girişsiz ziyaretçi vitrini, girişli kullanıcı
  kişisel katmanı görür. Ayrı "app" ve "site" YOK.

### Kaybolmaya karşı üç emniyet

1. Her seans sonucu **Bugün'e dönen tek birincil buton** taşır (eve dönüş çapası).
2. Koç kartları her zaman derin sayfaya *tam bağlamla* götürür ve geri dönüş
   Bugün'edir (stack'te çöp birikmez).
3. Global "devam eden seans" göstergesi: yarım kalan seans varsa Bugün'de
   "kaldığın yerden devam" kartı (kayıp iş = kayıp güven).

---

## 8. Platform haritası (Görev 9)

```
PAEMİSYON
│
├── (Kapı — girişsiz web)
│   ├── Landing (günün sorusu gömülü)
│   ├── Günün Sorusu
│   ├── Rehberler: /paem · /misyon
│   ├── Kanunlar (public) → Kanun sayfası
│   ├── Hesaplayıcı
│   ├── Fiyatlandırma · SSS · İletişim · Yasal
│   └── Kayıt / Giriş → Onboarding → İlk Devriye
│
├── 1 · BUGÜN  (koç — açılış ekranı)
│   ├── Durum sahnesi (normal / seri riski / deneme günü / dönüş / sınav modu…)
│   ├── [Bugün Çalış] ─ Odak seçici (koç · ders · konu · kanun · yanlışlarım)
│   ├── → SEANS OYNATICI (tek oda; tüm reçeteler) → Seans Sonucu
│   └── Planım (premium, V2)
│
├── 2 · KÜTÜPHANE
│   ├── Dersler → Ders detay (öğrenme merkezi)
│   │             └── Konu detay → [Anlatım V2] → seans
│   ├── MEVZUAT (Madde Atlası)
│   │   ├── Kanun rafı + ısı özeti
│   │   ├── Kanun detay (ısı haritası · fetih çubuğu · kanun denemesi)
│   │   └── Madde detay (metin · AI sadeleştirme · madde soruları · kartlar)
│   ├── Yanlışlarım → seans
│   ├── Akıllı Tekrar → seans
│   ├── Favoriler → seans
│   └── Soru arama (V2)
│
├── 3 · DENEMELER
│   ├── Takvim (canlı) + Prova arşivi (premium)
│   ├── Lobi → DENEME OYNATICI → Sonuç + Analiz → kapatma seansı
│   ├── Sıralama
│   └── Denemelerim (gelişim çizgisi)
│
├── 4 · PERFORMANS
│   ├── Genel bakış (mastery özeti · seri · haftalık değişim)
│   ├── Konu haritası (ders/konu/madde) → kapatma seansı
│   ├── Haftalık raporlar (premium: doğal dilli)
│   └── Rekorlar
│
└── 5 · BEN
    ├── Profil (rütbe · seri · rozet vitrini)
    ├── Rütbe (terfi yolu)
    ├── Rozetler
    ├── Premium (değer · satın alma · yönetim)
    ├── Ayarlar (bildirim saatleri · vardiya V2 · hedef · hesap)
    ├── Bildirim merkezi
    └── Soru Öner / Geri bildirim
```

Çapraz bağlar (haritada görünmeyen ama IA'nın damarları):
- Her **yanlış** → ilgili **Madde/Konu** → **Tekrar kuyruğu** (döngü, §0).
- Her **koç kartı** → herhangi bir derin noktaya tek dokunuş.
- Her **sonuç** → Bugün'e tek dokunuş.

---

## 9. Bu mimarinin savunması (neden yıllarca yaşar)

1. **Ekran değil sistem büyür:** yeni özellik = yeni seans reçetesi veya yeni
   koç kartı; nadiren yeni ekran. (Senaryo Modu bile bir reçete + bir kart.)
2. **Tek beyin:** koç kuralları sunucuda; mobil, web ve yarın çıkacak herhangi
   bir yüzey aynı davranışı gösterir.
3. **İki sınav, N sınav:** sınav = bağlam olduğu için yarın "Bekçilik" ya da
   "Kurum içi sınav" eklemek ağaca bir dal eklemektir, siteyi çatallamak değil.
4. **SEO ve ürün aynı gövde:** public sayfa = girişli sayfanın vitrin derinliği.
   İçerik bir kez üretilir, iki kitleye hizmet eder.
5. **Kayıpsız huni:** Google → kanun sayfası → günün sorusu → kayıt → İlk
   Devriye → Bugün. Her halka bir sonrakine doğal akar; hiçbir yerde "şimdi
   ne yapacağım?" boşluğu yok.

---

## 10. Onay sonrası sıra

1. **Wireframe seti** — önce çekirdek 8 ekran: Bugün (4 durum varyantı),
   Seans Oynatıcı, Seans Sonucu, Odak seçici, Ders detay, Kanun detay,
   Madde detay, Deneme sonucu.
2. UX yazımı (koç kartı metin dili — ton rehberi).
3. UI / tasarım sistemi.
4. Component sistemi → kodlama (mevcut Faz planlarıyla hizalanır).

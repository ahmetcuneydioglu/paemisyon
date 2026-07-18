# Doc 27 — paemisyon.com Web UX Mimarisi

> Statü: ONAYLANDI (18 Tem 2026) — şerhlerle: (1) girişsiz üst nav + girişli sol
> sidebar onaylı; (2) koç rayı YALNIZ L2'de, L3 odakta tamamen gizli; (3) 12
> temel ekran yeterli, ikincil ekranlar (Onboarding/Premium/Ayarlar) tasarım
> sisteminden türetilecek; (4) faz sırası revize: W1 Design System + App Shell +
> Bugün + Session Player · W2 Law Atlas + Article Detail + Library · W3 Exam +
> Performance · W4 Landing + SEO + Polish. Component-first, wireframe yalnız
> yerleşim referansı, nihai UI production kalitesinde.
> **W1 durumu: TAMAMLANDI (18 Tem 2026)** — token→Tailwind köprüsü (globals.css
> `tk-*`), route grupları (site)/(app)/(auth), sidebar kabuğu, /bugun (koç hero +
> destek kartları + günün özeti), Odak popover (koç/ders/konu), /seans (L3
> oynatıcı: klavye 1-4/⏎/Esc, reçete şeffaflığı, seans haritası, limit duvarı,
> sonuç + konu kırılımı + rozet). E2E doğrulandı (kayıt→Bugün→seans→sonuç→Bugün).
> **W2 durumu: TAMAMLANDI (18 Tem 2026)** — L4 üç pano (ThreePane), "aynı URL
> iki derinlik" canlı: /kanunlar + /kanun/[slug](/madde/[no]) girişsizde SEO
> vitrini, girişlide çalışma alanı ((law) route grubu, oturuma göre kabuk);
> LawWorkspace (madde ağacı + ısı sıralaması + fetih ızgarası + inspector),
> ArticleWorkspace (künye + kaynak dağılımı + madde reçeteli seans);
> /kutuphane (ders kartları + sınav bağlam anahtarı + Mevzuat kapısı) ve
> /kutuphane/ders/[id] (öğrenme merkezi: konu tablosu + tek tık seans);
> koç rayı (CoachRail, yalnız L2) ilk kez Kütüphane'de. API eklentisi: public
> law yanıtlarına topicId. NOT: soru bankasında madde etiketi henüz ~7 soruda —
> ısı/fetih boş durumları tasarlandı; backfill ayrı iş (görev çipi açıldı).
> **W3 durumu: TAMAMLANDI (18 Tem 2026)** — yeni Deneme Oynatıcı (ExamPlayer,
> L3: tek soru + optik form paneli + bayrak + sakin süre + klavye ←/→ 1-5 F;
> eski ExamRunner'ın sunucu disiplini korunarak — anlık kayıt, otomatik teslim,
> cevap sızdırmama); Deneme Sonucu yeni tasarım (NET kartı + koç "kaybın %X'i"
> + kayıp-net tablosu, her satırda /seans'a kapatma butonu + cevap incelemesi);
> /denemeler girişli derinlik (ExamCenter: canlı/sıradaki hero + takvim +
> geçmiş + net gelişim çubuğu) — (law) grubu (dual)'a genellendi, denemeler de
> içine alındı; /performans (metrikler + net trendi + zayıf konular) ve
> /performans/konu-haritasi (genişleyebilir ders→konu mastery tablosu, filtreler,
> tek tık kapatma); sidebar'a Performans eklendi. Miras ExamRunner/ResultTiles
> silindi; ReviewList (cevap incelemesi) W4 cilasına kadar miras stilde.
> NOT: Oynatıcının canlı akışı prod'da aktif deneme olmadığından tarayıcıda
> uçtan uca koşulamadı (engel ekranları doğrulandı) — ilk canlı denemede veya
> kontrollü bir test denemesiyle koşulmalı.
> **W4 durumu: TAMAMLANDI (18 Tem 2026)** — Landing token dilinde yeniden
> (gradient hero + çözülebilir günün sorusu + Quiz JSON-LD + rakamla kanıt
> blokları + kanun vitrini + rehber kartları + kayıt/premium kapanışı); public
> kabuk yenilendi: tek katlı sticky SiteHeader (girişliye "Uygulamaya dön",
> mobil menü) + 4 kolonlu SiteFooter (iç bağlantı örgüsü; eski MobileMenu
> silindi); /premium sayfası (Doc 24 §11 tablosu, girişliye DB'den plan
> fiyatları, dürüst iOS satın alma CTA'sı — web ödeme yolda notu); SEO:
> sitemap'e premium + madde sayfaları (etiket backfill'i dolunca kendiliğinden
> genişler), tüm girişli sayfalara noindex; lint sıfır hata (miras countdown/
> exam-table dahil temizlendi). Kalan bilinçli miras: deneme cevap incelemesi
> (ReviewList) + hesaplayıcı/rehber/profil sayfa gövdeleri — yeni kabuk altında
> çalışıyorlar, tam re-skin sonraki iterasyona.
> **Wireframe kapanışı (18 Tem 2026, A listesi):** ⌘K komut paleti (kanun/ders/
> sayfa/eylem araması, sidebar tetiği, L3'te kapalı) · Bugün sağ kolonuna canlı/
> sıradaki deneme geri sayımı + rütbe ilerleme kartı (CoachBrief.rank) · Odak'a
> "Kanun seç…" · koç rayı gizle/hatırla (RailToggle) · seans not alanı + "hata
> bildir" ucu · deneme oynatıcıda boş-soru-başına süre önerisi · deneme analizinde
> "geçen denemeden ±X net" kıyası · landing SSS bloğu. KALAN eksikler API/veri
> bekliyor — B (API eki gerek): ders detay sekmeli çıkmış sorular + trend
> kolonları, kanun mini denemesi, deneme süre şeridi, aktivite ısısı (12 hafta)
> + haftalık rapor, favoriler reçetesi; C (veri/içerik): madde etiketi
> backfill'i, kanun metni içerik hattı, deneme bölüm yapısı.
> **B dilimi 1-2-3 TAMAM (18 Tem 2026):** (1) Devam eden seans çapası —
> quiz_sessions.question_order kolonu (migration), GET /quiz/active-session +
> /quiz/sessions/:id/resume; web: Bugün'de "⏸ devam" kartı + koç rayında pil +
> oynatıcıda kaldığı sorudan açılma (cevaplar ✓/✗ ekilir, anahtar sızmaz).
> (2) Yanlış tekrarı reçetesi — quiz mode 'review' (free: son 7 gün, premium:
> süresiz; en eski önce; doğru çözülen kuyruktan düşer); web: Odak'ta "Sadece
> yanlışlarım", /kutuphane/yanlislar kuyruk sayfası + Kütüphane kapısı, koç
> /review kartları artık gerçek hedefe gider. (3) Nöbet çizelgesi — GET
> /progress/activity (14 gün); Bugün'de son 7 gün şeridi.
> Kapsam: SADECE paemisyon.com web platformu. Mobil uygulamaya dokunulmaz;
> mobil UX, mobil navigasyon ve mobil wireframe bu dokümanın konusu DEĞİLDİR.
> Girdi: Doc 23 (Konsept C), Doc 24 (yolculuk), Doc 25 (IA), Doc 26 (tasarım dili).
> Çıktı: Web layout sistemi + sayfa sayfa UX kararları + wireframe seti
> (`docs/wireframes/web-platform-wireframes.html`).
> Kod YOK — onaydan sonra component/route fazına geçilir.

---

## 0. Konum düzeltmesi: web artık "ikinci oda" değil, BİNA

Doc 24 §10 web'i "çalışma odası" olarak konumlamıştı; bu doğruydu ama eksikti.
Kapsam değişikliğiyle birlikte netleştiriyorum:

**paemisyon.com, mobil uygulamanın web sürümü değildir.** Web;

- **öğrenme merkezi** (ders + konu anlatımı),
- **mevzuat merkezi** (Madde Atlası'nın tam hali),
- **deneme merkezi** (uzun, süreli, optik-form hissli provalar),
- **performans analiz platformu** (haritalar, tablolar, trendler),
- **uzun süreli çalışma platformudur** (1–3 saatlik oturumlar).

Web kullanıcısı masa başındadır: büyük ekran, klavye, saatlerce odak. Bu yüzden
web tasarımının üç ilkesi mobilin TERSİDİR:

| İlke | Mobil (dokunma yok — referans değil) | Web (bu doküman) |
|---|---|---|
| Bilgi yoğunluğu | Az ve öz | **Yüksek** — tablolar, çok kolon, filtreler |
| Navigasyon | Az seçenek, tek stack | **Zengin** — sidebar + ağaç + breadcrumb + ⌘K |
| Oturum | 3–20 dk | **20 dk – 3 saat** — kalıcı paneller, oturum hafızası |

Değişmeyen tek şey **beyin**: koç kuralları sunucuda (`/me/coach`), ilerleme tek.
Web aynı veriyi daha derin gösterir; asla farklı bir mantık uydurmaz.

> **Doc 25 §7 revizyonu (bilinçli):** IA dokümanı web için "üst nav" demişti.
> Web artık birincil derin-çalışma ürünü olduğu için girişli katman **sol
> sidebar'lı uygulama kabuğuna** geçiyor. Üst nav yalnız girişsiz (public)
> katmanda yaşar. Bu revizyon onaylanırsa Doc 25 §7'ye şerh düşülür.

---

## 1. Dört layout şablonu (bütün site bu dörtten türer)

Her sayfa şu dört şablondan birine oturur. Sayfa başına özel layout icat
edilmez — şablon dışına çıkmak isteyen her ekran bu dokümana geri döner.

### L1 — KAPI (public / girişsiz)

```
┌──────────────────────────────────────────────────────┐
│ Logo   Kanunlar  Sınavlar  Çıkmış Sorular  Denemeler │  ← üst nav (sticky)
│                                    [Giriş] [Kayıt]   │
├──────────────────────────────────────────────────────┤
│                 içerik (max 1120px, ortalı)          │
│                 SEO vitrini + dönüşüm CTA'ları        │
├──────────────────────────────────────────────────────┤
│ footer: yasal, SSS, iletişim, sosyal                  │
└──────────────────────────────────────────────────────┘
```

Kullanım: Landing, /paem, /misyon rehberleri, public kanun sayfaları,
hesaplayıcı, günün sorusu, fiyatlandırma, SSS/yasal.
Özellik: SSG/ISR, şema markup, hızlı; "aynı URL iki derinlik" kuralı gereği
girişli kullanıcı aynı URL'de L2/L4 kabuğunu görür.

### L2 — ÇALIŞMA ALANI (girişli uygulama kabuğu)

```
┌──────┬───────────────────────────────────┬──────────┐
│ SIDE │  üst şerit: breadcrumb · ⌘K ara   │  KOÇ     │
│ BAR  │  · seri 🔥 · profil               │  RAYI    │
│      ├───────────────────────────────────┤ (sağ     │
│ Bugün│                                   │  panel,  │
│ Kütüp│         ana içerik                │  daraltı-│
│ Dene │         (akışkan genişlik)        │  labilir)│
│ Perf │                                   │          │
│ Ben  │                                   │          │
└──────┴───────────────────────────────────┴──────────┘
```

- **Sol sidebar (240px, daraltınca 64px ikon rayı):** 5 bölge + bölge içi alt
  başlıklar (Kütüphane açıkken: Dersler, Mevzuat, Yanlışlarım, Tekrar, Favoriler).
  Alt uçta premium durumu + ayarlar.
- **Koç rayı (sağ, 320px):** koçun web'deki evi. Doc 25 Karar 3 ("koç bir ekran
  değildir") web'de şöyle somutlaşır: koç kartları Bugün'de sahnenin kendisidir,
  DİĞER tüm çalışma sayfalarında sağ rayda yaşar — kullanıcı Kütüphane'de
  gezerken bile "bugünkü hedefin 8/20" ve güncel koç kartı görünür kalır.
  Kapatılabilir; durumu oturumlar arası hatırlanır.
- Kullanım: Bugün, Kütüphane listeleri, Denemeler, Performans, Ben.

### L3 — ODAK (seans + deneme oynatıcı)

```
┌──────────────────────────────────────────────────────┐
│  ince şerit: çıkış ✕ · seans bağlamı · ilerleme · ⏱ │
├────────────────────────────────┬─────────────────────┤
│                                │  yardımcı panel      │
│      soru alanı (≤65ch)        │  (soru haritası /    │
│      şıklar (klavye 1-4/A-D)   │   not / madde bağı)  │
│                                │                      │
└────────────────────────────────┴─────────────────────┘
```

Sidebar ve koç rayı GİZLENİR (çalışırken kaçış yok — Doc 25 §7 mobildeki tam
ekran modal kuralının web karşılığı). Deneme modunda yardımcı panel optik forma
(soru haritası + bölüm sekmeleri + süre) dönüşür.

### L4 — OKUMA (kanun / madde / konu anlatımı) — "üç pano"

```
┌──────┬──────────────┬──────────────────┬─────────────┐
│ SIDE │  AĞAÇ        │   MAKALE         │  INSPECTOR  │
│ BAR  │  (kanun →    │   (resmî metin / │  (bu madde: │
│ (64px│   maddeler,  │    anlatım,      │   ısı, benim│
│ ikon)│   ısı+fetih  │    ≤65ch, büyük  │   durumum,  │
│      │   işaretli)  │    tipografi)    │   sorular,  │
│      │              │                  │   AI sadel.)│
└──────┴──────────────┴──────────────────┴─────────────┘
```

Web'in mobilde hiç olmayan deneyimi budur: **ağaçta gezinirken okumak,
okurken çalışmak.** Inspector'daki "bu maddeden 6 soru çöz" düğmesi L3'ü
madde reçetesiyle açar. Girişsiz ziyaretçi aynı L4'ü Inspector'sız (vitrin
derinliğiyle) görür.

---

## 2. Web'e özgü omurga sistemleri

Bunlar tek tek sayfalar değil, tüm sayfaların paylaştığı yeteneklerdir.

### 2.1 Komut paleti — ⌘K (web'in "koç ışınlaması")

Doc 25 Karar 2: "koç kullanıcıyı ağaçta gezdirmez, ışınlar." Web'de kullanıcı
kendini de ışınlayabilmeli: ⌘K → tek arama kutusu → kanun adı, madde no
("pvsk 16"), ders, konu, sayfa, eylem ("deneme başlat", "yanlışlarım").
Sonuç grupları: Eylemler · Maddeler · Konular · Sayfalar. İlk sürümde arama
mevcut içerik indeksinden; soru metni araması V2.

### 2.2 Klavye kısayolları (odak modu)

| Tuş | İş |
|---|---|
| `1–4` / `A–D` | şık seç |
| `Enter` | cevapla / sonraki soru |
| `F` | favorile |
| `M` | ilgili maddeyi aç (inspector) |
| `←/→` | (deneme) önceki/sonraki soru |
| `G` | (deneme) soru haritasına git |
| `Esc` | çıkış diyaloğu |
| `⌘K` | komut paleti (odak modunda kapalı — dikkat korunur) |

İlk seansta bir kez ince bir "klavye ile daha hızlı" ipucu gösterilir; sonra susar.

### 2.3 Koç rayı davranışı

- İçerik: aktif durum kartı (durum makinesinden) + günlük hedef halkası +
  seri + "devam eden seans" çapası (Doc 25 §7 emniyet 3).
- Bağlama duyarlı: CMK ders sayfasındayken koç rayı CMK'ya dair kartı öne alır
  ("CMK'da 3 haftadır düşüştesin — bu sayfadan kapatma seansı başlat").
- Kural: rayda en fazla 2 kart. Koç web'de de gevezeleşmez (Doc 26 dil kuralı 2).

### 2.4 Oturum hafızası (uzun çalışmanın UX'i)

Web oturumu saatler sürer; platform bunu hatırlar:
- Yarım kalan seans/deneme her sayfada üst şeritte ince "devam et" pili.
- L4'te son okunan madde, ağaçta işaretli; sayfaya dönünce scroll konumu korunur.
- Koç rayı + ağaç panellerinin açık/kapalı durumu kalıcı.

### 2.5 Breadcrumb + URL disiplini

Breadcrumb yalnız 3+ seviyede (Doc 25 kuralı): `Kütüphane › Mevzuat › PVSK › m.16`.
URL'ler Türkçe ve niyet-eşleşmeli (Doc 23): `/kanun/2559-pvsk/madde/16`.
Aynı URL iki derinlik: girişsiz vitrin, girişli kişisel katman. Ayrı "app."
alt alan adı YOK.

---

## 3. Sayfa sayfa web UX kararları

Sıra, kullanıcının huni yolculuğuna göre: keşif → kayıt → günlük → derin çalışma
→ ölçme → gelir.

### 3.1 Landing (L1) — "60 saniyede değer"

Tek hedef: Google'dan/tavsiyeden gelen adaya kayıttan ÖNCE değer yaşatmak (Doc 24 gün 0).

- **Hero = çözülebilir günün sorusu.** Pazarlama sloganı değil, gerçek ve
  kaynaklı çıkmış soru; şıkka tıklayınca anında doğru/yanlış + açıklama +
  kaynak etiketi. Cevabın hemen altında tek CTA: "Serini başlat — ilerlemen
  kaydedilsin."
- Altında üç kanıt bloğu (rakamla, sıfatla değil): **866+ kaynaklı çıkmış
  soru** · **Madde Isı Haritası** ("PVSK'nın soruların %52'si 5 maddeden") ·
  **Canlı deneme + Türkiye sıralaması** (bir sonraki denemenin geri sayımı canlı).
- Kanun kütüphanesi vitrini: en çok aranan 6 kanun kartı → public kanun sayfaları
  (SEO iç bağlantı örgüsü).
- Sınav yolları: PAEM / Misyon rehber kartları.
- Kapanış: fiyat özeti (ücretsiz katmanın gerçek değeri önde) + SSS'den 3 soru.

### 3.2 Bugün — girişli ana sayfa (L2) — "koçun sahnesi, webde komuta masası"

Mobilin "tek kart, tek eylem" sadeliği web'de İSRAF olur; ama Doc 25 Karar 3'ün
özü korunur: sahne yine koçundur, kullanıcı yine tek doğru eylemle karşılanır —
etrafı bilgiyle zenginleşir.

Yerleşim (12 kolon):
- **Sol geniş (8 kolon):** durum makinesi hero'su (normal/streak_risk/exam_mode…
  hangi durumsa onun kartı) + [Bugün Çalış] + sessiz "Odak: Koç seçiyor ▾" ucu.
  Odak seçici web'de sheet değil **popover**dır (aynı içerik: Koç seçsin · Ders ·
  Konu · Kanun/Madde · Yanlışlarım; geçicilik notu aynen).
  Altında destek kartları iki kolonlu grid (yanlış tekrarı, zayıf konu, deneme).
- **Sağ dar (4 kolon):** günün özeti — hedef halkası, seri + sigorta durumu,
  haftalık mini-fotoğraf (mastery değişim oku), bir sonraki canlı deneme geri
  sayımı, rütbe ilerlemesi. (Bugün sayfasında ayrıca koç rayı YOK — sahnenin
  kendisi koç; ray diğer sayfaların aracı.)
- En altta "bu hafta" şeridi: son 7 gün aktivite blokları (GitHub contribution
  hissi, meslek diliyle: "nöbet çizelgesi").

### 3.3 Kütüphane ana + Ders detay (L2 → L4)

- **Kütüphane ana:** ders kartları ızgarası; her kartta müfredat ağırlığı (%),
  konu sayısı, benim ilerlemem (MasteryBar), son çalışılan konu. Üstte görünüm
  anahtarı: "Dersler | Mevzuat". Sağda koç rayı.
- **Ders detay = öğrenme merkezi (Doc 24 §10):** üç sekmeli tek mekân:
  **Konular** (tablo: konu · soru sayısı · benim doğruluğum · son çalışma ·
  [çalış]) · **Benim durumum** (bu dersin mastery haritası + yanlışlarım) ·
  **Çıkmış sorular** (kaynak etiketli liste — girişsiz ziyaretçiye vitrin).
  Hero şeridinde dersin ağırlığı + koçun bu derse dair tek cümlesi.
  Konu satırındaki [çalış] doğrudan L3'ü konu reçetesiyle açar (2 tık kuralı).

### 3.4 Mevzuat: Kanun detay (L4) — web'in tacı

- **Ağaç panosu:** madde listesi; her satırda ısı göstergesi (kaç soru çıkmış)
  + fetih işareti (✓ çalışıldı / ✗ yanlışım var / ○ hiç görmedim).
- **Makale panosu (varsayılan görünüm):** kanun özeti + **Isı Haritası bloğu**
  ("74 maddenin 5'i soruların %52'sini üretiyor" — çubuk sıralaması, tıklanınca
  maddeye iner) + **Fetih Haritası ızgarası** (74 hücre; RPG haritası hissi) +
  "bu kanundan 15 soruluk seans" CTA.
- **Inspector:** kanun geneli benim durumum — doğruluk, çalışılan madde sayısı,
  kanun bitirme rozetine kalan, kanun mini denemesi.
- Girişsiz aynı sayfa: ağaç + makale var, fetih/benim-durumum yerine "kayıt ol,
  haritan burada birikecek" vitrini (SEO sayfası ile uygulama sayfası AYNI sayfa).

### 3.5 Madde detay (L4) — Madde Atlası'nın kalbi

- **Makale panosu:** resmî metin (büyük, ≤65ch okuma tipografisi) ⇄ "Polis
  diliyle" AI sadeleştirme sekmesi (ArticleCard'ın iki yüzü) + saha senaryosu.
- **Inspector:** bu maddenin künyesi — kaç kez, hangi sınavda soruldu (ısı) ·
  benim geçmişim (3 kez yanlışladım) · tekrar kuyruğu durumu · **[Bu maddeden
  6 soru çöz]** (L3, madde reçetesi) · ilgili maddeler.
- Alt uçta önceki/sonraki madde gezinmesi (okuma akışı kopmaz).
- Yanlış açıklamasından gelen kullanıcı ("ilgili madde: PVSK m.16" köprüsü)
  buraya iner; Inspector'da "seansına dön" çapası belirir — döngü (öğren→dene→
  yanıl→anla→tekrar) hiç kapı kaybetmez.

### 3.6 Seans Oynatıcı (L3) — tek oda, web konforu

Doc 25 Karar 1 aynen: tüm reçeteler tek oynatıcı. Web eklentileri:
- Soru alanı ortada (≤65ch), şıklar OptionRow; klavye birincil giriş.
- Üst şeritte reçete şeffaflığı tek satır: "Bugün: CMK ağırlıklı — 3 haftadır
  düşüş + Salı'nın 4 yanlışı" (Doc 24 §9 şeffaflık borcu).
- Cevap sonrası açıklama + kaynak etiketi + madde köprüsü; `M` ile madde
  Inspector'da AÇILIR (seanstan çıkmadan mevzuat bağı — webde sekme cehennemine
  gerek yok).
- Sağ yardımcı panel: seans ilerleme listesi + not alanı (oturum içi).

### 3.7 Seans Sonucu

Skor (display tipografi) + koç yorumu + "4 yanlışından yarına tekrar kurdum" +
tek birincil buton: **Bugün'e dön** (eve dönüş çapası). İkincil: yanlışları
şimdi tekrar et · ilgili maddeleri oku. Konu kırılımı mini tablosu webde hemen
burada (mobildeki gibi ayrı sayfaya itilmez).

### 3.8 Deneme merkezi: Takvim + Lobi + Oynatıcı + Analiz

- **Denemeler ana (L2):** canlı deneme takvimi (geri sayımlı hero) + prova
  arşivi (premium) + Denemelerim gelişim çizgisi (net grafiği).
- **Deneme Oynatıcı (L3, deneme varyantı):** webin birincil işi (Doc 25 §6).
  Sol: soru. Sağ: **optik form paneli** — bölüm sekmeleri, 1–120 soru haritası
  (boş/işaretli/emin değilim), kalan süre büyük ve sakin (son 10 dk `warning`).
  "Emin değilim" bayrağı (`G` haritaya, `←/→` gezinme). Tam sınav provası hissi.
- **Deneme Sonucu + Derin Analiz (L2):** webin analiz gücü burada patlar —
  net + sıralama + **bölüm kırılım tablosu** (SectionBreakdownTable) +
  **"kaybın %X'i 3 konudan" koç kartı** + kaybettiren konu/madde tablosu
  (her satırda [10 soruluk kapatma seansı]) + süre yönetimi şeridi (hangi
  bölümde yavaşladın). Sıralama ayrı sekme.

### 3.9 Performans (L2) — analiz platformu

İki seviye:
- **Genel bakış:** üst şerit metrik kartları (toplam soru · doğruluk trendi ·
  seri · haftalık değişim) + haftalık rapor kartı + net gelişim çizgisi
  (denemelerden) + son 12 hafta aktivite ısısı.
- **Konu haritası:** webin en güçlü tablosu — ders → konu → (kanun dersinde)
  madde kırılımlı **genişleyebilir mastery tablosu**; kolonlar: doğruluk %,
  soru sayısı, trend oku, son çalışma; her satırda [kapatma seansı]. Filtre:
  ders, eşik (<%40 kırmızılar), zaman aralığı. Kırmızı hücre → tek tık seans
  (Doc 25 kapı 3).
- Haftalık raporlar arşivi (premium: doğal dilli koç raporu) — e-posta
  raporundaki "web'de incele" bağının indiği yer (akış I).

### 3.10 Ben: Profil · Rütbe · Premium · Ayarlar (L2)

- **Profil:** kimlik kartı — rütbe nişanı, seri, rozet vitrini, rekorlar.
- **Premium:** "koçun tam beyni" değer sayfası (Doc 24 §11 çerçevesi aynen:
  tablo halinde ücretsiz/premium karşılaştırması, fiyat çapası). Web ödeme
  (komisyon avantajı) — ödeme sağlayıcı akışı ayrı iş.
- **Ayarlar:** hesap · bildirim tercihi (e-posta raporu!) · günlük hedef ·
  sınav bağlamı (PAEM⇄Misyon anahtarı — Doc 25 §4) · vardiya düzeni (V2) ·
  tema (açık/koyu).

### 3.11 Public rehberler: /paem · /misyon (L1)

Canlı veriden sınav rehberi: format, bölüm %ağırlıkları (exam_sections'tan),
ders kartları (soru sayılarıyla), SSS (FAQPage şeması), son çıkmış soru
örnekleri. Her blok kayda doğal geçiş verir ("Anayasa'dan 120 soru çöz →").

---

## 4. Responsive stratejisi (masaüstü-öncelikli, ama kırılmaz)

Web masaüstü için tasarlanır; küçük ekranda "mobil uygulama taklidi"ne DÖNÜŞMEZ,
zarifçe daralır:

| Kırılım | Davranış |
|---|---|
| ≥1440 | Tam şablonlar (L4 üç pano + koç rayı) |
| 1024–1439 | Koç rayı otomatik kapalı (açılabilir); L4'te inspector overlay olur |
| 768–1023 | Sidebar ikon rayına iner; L4 ağacı açılır-kapanır panele döner |
| <768 | Tek kolon; üst şeritte hamburger; odak modu aynen çalışır. Amaç: telefondan siteye gelen kullanıcı KIRIK sayfa görmesin; derin çalışma için yönlendirme mobil uygulamayadır, kopyası değil |

---

## 5. Faz planı (Doc 23 fazlarıyla hizalı)

| Faz | Kapsam |
|---|---|
| **W1 — Kabuk + Bugün** | L2 kabuğu (sidebar, üst şerit, koç rayı), Bugün sayfası, ⌘K v1, Seans Oynatıcı web (L3) + Sonuç |
| **W2 — Atlas + Kütüphane** | L4 üç pano, kanun/madde sayfalarının girişli derinliği (ısı+fetih+inspector), ders detay öğrenme merkezi |
| **W3 — Deneme + Performans** | Deneme oynatıcı optik paneli, derin analiz, performans konu haritası tablosu |
| **W4 — Kapı cilası** | Landing yenileme (çözülebilir hero), rehber sayfaları canlı veriyle, premium sayfası |

Mevcut canlı web sayfaları (kanun, deneme, hesaplayıcı, günün sorusu) yıkılmaz;
her faz mevcut sayfayı yeni kabuğa taşır.

---

## 6. Onay soruları

1. **Sidebar kabuğu** (Doc 25 §7 "üst nav" kararının revizyonu) — onay?
2. **Koç rayı** (sağ panel) konsepti — onay?
3. Wireframe setindeki 12 ekran (`web-platform-wireframes.html`) — ekran bazında
   itiraz/ekleme?
4. Faz sırası W1→W4 — öncelik değişikliği var mı?

Onay sonrası sıra: UX yazımı webe uyarlama → tasarım token'larının web
uygulaması (Doc 26 §3 zaten hazır) → component library web dalgası → kod.

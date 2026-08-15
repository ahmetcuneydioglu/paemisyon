# PAEMİSYON MEVZUAT MERKEZİ
## Product & Technical Design Report

*Hazırlanış: 15 Ağustos 2026 · Durum: onay bekliyor · Kod değişikliği yapılmadı*

---

## 0. Yönetici özeti — en önemli bulgu

**Mevzuat Merkezi sıfırdan kurulmayacak.** Keşif, Paemisyon'da "Madde Atlası" adıyla yarım kalmış bir mevzuat altyapısının zaten yaşadığını gösterdi:

| Katman | Mevcut durum |
|---|---|
| Veri | `law_articles` tablosu: 252 yayınlanmış madde (Anayasa 210 + PVSK 42), resmî metin + kaynak + doğrulama damgası |
| İçerik hattı | Test edilmiş PDF→madde parser'ı, admin panelde içe aktarma + yayınlama + denetim kaydı |
| API | `/public/laws` · `/laws/:slug` · `/laws/:slug/read` (tam metin) · `/laws/:slug/articles/:no` — hepsi canlı, ISR önbellekli |
| Web | `/kanunlar`, `/kanun/[slug]`, `/kanun/[slug]/oku`, `/kanun/[slug]/madde/[no]` sayfaları + LawWorkspace/ArticleWorkspace bileşenleri |
| Quiz köprüsü | Soru→madde (`relatedArticle` geri bildirimi, mobilde çalışıyor) ve madde→soru (`articleNo` ile seans) İKİ YÖNDE hazır |
| Mobil | **Hiçbir şey** — `/public/laws*` uçları mobilden hiç çağrılmıyor; arama, kanun listesi, okuma ekranı yok |

Bu yüzden projenin doğru tanımı: **"Madde Atlası'nı Mevzuat Merkezi'ne büyütmek"** — 3 ana iş:
1. **Veri modelini kanun-düzeyine çıkarmak** (bugün kanun = konu adı + regex; kalıcı kimlik yok),
2. **Gerçek arama kurmak** (bugün hiçbir tam-metin arama yok — ne mobilde ne webde ne API'de),
3. **Mobil okuma deneyimini sıfırdan yazmak** (backend hazır, istemci yok).

---

## 1. Product Vision

Kullanıcı mevzuata bakmak için Google'a/tarayıcıya/PDF'e gitmesin; Paemisyon içinde **ARA → BUL → OKU → KAYDET → ÖĞREN → SORU ÇÖZ** döngüsü kapansın.

Paemisyon'un farkı "kanun metnini göstermek" değil (bunu mevzuat.gov.tr yapıyor); **mevzuatı sınava bağlamak**: her maddenin yanında o maddeden kaç soru çıktığı, hangi sınavlarda çıktığı, senin o maddedeki hâkimiyetin ve tek dokunuşla o maddeden soru çözme imkânı. Bu bağ zaten kısmen kurulu (Atlas/fetih sistemi) — Mevzuat Merkezi bunu okuma deneyimiyle birleştirir.

**Güven ilkesi** (CLAUDE.md ile aynı ruh): resmî metin birebir korunur, AI üretimi yasak, her metinde kaynak + son doğrulama tarihi görünür, resmî kaynağa link her zaman var.

---

## 2. Mevcut Paemisyon ile entegrasyon

Yeniden kullanılacaklar (yeni yazılmayacak):

- **İçerik hattı:** `law-text-parser.ts` (Madde/Ek Madde/Geçici Madde regex'i, TR-locale, testli) + `pdf-law-text.ts` (sayfa no/üstbilgi temizliği) + admin import UI (dry-run → içe aktar → yayınla).
- **Quiz köprüsü:** `POST /quiz/sessions {topicId, articleNo}` madde-kapsamlı seans; cevap geri bildirimindeki `relatedArticle` (kaynak künyeli resmî metin).
- **Mobil tasarım sistemi:** AppTokens/Typography/Spacing/Motion, `ArticleCard`, `SourceTag`, `ExplanationBox`, EmptyState/ErrorState/LoadingSkeleton, `_cacheFor` önbellek deseni, bottom-sheet okuma yüzeyi.
- **Web:** `(site)` ISR sayfaları + middleware'in "aynı URL, girişliye app-kabuğu" deseni; command palette.
- **Bildirim:** `PushService.sendToUser/sendToAll` + route payload'ı (mevzuat güncelleme bildirimi P2'de buna oturur).
- **Deep link dili:** bildirim payload whitelist'i (`'leaderboard'` gibi) → `'mevzuat:pvsk:16'` benzeri anahtar eklenir.

Uyum kuralı: Mevzuat Merkezi ayrı bir "uygulama" gibi durmayacak — Kütüphane sekmesinin bir bölgesi, aynı token/tipografi, aynı kart dili.

---

## 3. Hedef kullanıcı senaryoları

1. **"CMK 90'a bakmam lazım"** (nokta atışı) — devriye/ders arasında telefonu açar, birkaç saniyede maddeyi okur. → Arama + doğrudan madde sonucu.
2. **"PVSK'yı baştan çalışacağım"** (uzun okuma) — 20-30 dk kesintisiz okuma, yerini kaybetmeden. → Okuyucu + kaldığın yerden devam.
3. **"Yanlış yaptım, neden?"** (öğrenme döngüsü) — quiz'de yanlış → ilgili madde → okur → "bu maddeden soru çöz". → Mevcut relatedArticle + yeni "Mevzuatta aç".
4. **"Zor kullanma maddeleri neydi?"** (kavramsal arama) — "zor kullanma" yazar, PVSK 16 + ilgili maddeler bağlamıyla listelenir. → Tam-metin arama + highlight.
5. **"Sınavdan önce işaretlediklerime bakayım"** — kaydettiği 12 maddeyi tek listede tekrar eder. → Madde favorisi.

---

## 4. Bilgi mimarisi

```
MEVZUAT MERKEZİ
├── Ana sayfa (arama + devam et + son okunanlar + kaydedilenler + kategoriler)
├── Kategori: Kanunlar / Yönetmelikler / CBK / Genelgeler (V1'de yalnız Kanunlar dolu)
├── Mevzuat detayı (kanun kimliği + içindekiler + okumaya başla)
│   └── Okuyucu (madde madde akış, bölüm başlıkları, içindekiler sheet'i)
│       └── Madde (başlık + resmî metin + kaynak künyesi + soru köprüsü + kaydet/paylaş)
└── Arama (kanun adı/no/kısaltma + madde no + tam metin)
```

Kanun ≠ Konu ayrımı netleşir: bugün "kanun" bir quiz konusudur (Topic). Yeni modelde **Legislation** birinci sınıf varlıktır ve Topic'e *bağlanır* (soru köprüsü için) ama ona muhtaç değildir — sorusu olmayan bir yönetmelik de sisteme girebilir.

---

## 5. Navigation

**Mobil:** Bottom tab'a YENİ SEKME EKLENMEZ (5 sekme dolu ve dengeli). Mevzuat'ın evi **Kütüphane** sekmesi:

- Kütüphane kökü iki bölgeye ayrılır: **"Konular & Sorular"** (mevcut hedef kartları) + **"⚖️ Mevzuat"** (yeni giriş kartı: arama kısayolu + kaldığın yerden devam özeti).
- Rotalar: `/mevzuat` (ana) · `/mevzuat/ara?q=` · `/mevzuat/:slug` (detay) · `/mevzuat/:slug/oku` (okuyucu, `?madde=90` çapası).
- Bugün ekranı: "Kaldığın yerden devam et — CMK · Madde 90" kartı (okuma yarım kaldıysa; mevcut _ActiveSessionCard deseninin okuma eşi) → P1.
- Erişim maliyeti: Mevzuat ana sayfası **2 dokunuş** (Kütüphane → Mevzuat), arama **3 dokunuş**.

**Web:** mevcut yapı korunur ve tamamlanır: `/kanunlar` → `/mevzuat` üst şemsiyesine evrilir (kanunlar bir kategori olur; eski URL'ler redirect). Middleware'deki `/oku` istisnası kaldırılır → girişli kullanıcı okuyucuyu app-kabuğunda (kaydet/devam özellikli) görür; anon aynı URL'de ISR sayfayı görür (SEO korunur).

---

## 6. Mevzuat ana sayfası (mobil)

```
┌────────────────────────────────┐
│ Mevzuat                        │
│ İhtiyacın olan hükme saniyeler │
│ içinde ulaş.                   │
│ ┌────────────────────────────┐ │
│ │ 🔎 Kanun, madde veya konu ara│ │  ← dokununca /mevzuat/ara (klavye açık)
│ └────────────────────────────┘ │
│                                │
│ ▸ KALDIĞIN YERDEN DEVAM ET     │  ← varsa tek kart: CMK · Madde 90 · %62
│                                │
│ ▸ KAYDEDİLENLER (3)        →   │  ← yatay çipler: PVSK 4/A · CMK 90 · CMK 91
│                                │
│ ▸ SON OKUNANLAR                │  ← 3 satır: kanun + madde + zaman
│                                │
│ ▸ SINAVLARDA ÖNE ÇIKANLAR      │  ← soru sayısına göre: PVSK · CMK · Anayasa…
│   (kanun kartı: ad, no, madde  │
│    sayısı, "N soru çıkmış")    │
│                                │
│ ▸ TÜM MEVZUAT                  │
│   Kanunlar (12) · Yönetmelikler│
│   (yakında) · CBK (yakında)    │
└────────────────────────────────┘
```

Boş durumlar: hiç okuma yoksa "devam" ve "son okunanlar" bölgeleri görünmez — sayfa arama + kategorilerle sade başlar. "Yakında" kategorileri V1'de gri, tıklanamaz (bilgi mimarisi baştan doğru görünür).

---

## 7. Search UX

Tek arama kutusu, iki katmanlı sonuç (tek istekle):

**Sorgu anlama (sunucuda, deterministik):**
- `^\d{3,4}$` → kanun numarası ("2559" → PVSK).
- `KISALTMA [madde no]` → "pvsk", "p.v.s.k." (noktalar atılır), "cmk 90", "tck 86/1" → alias tablosundan kanun + varsa madde no → **doğrudan madde sonucu en üstte**.
- `\d+/[A-Za-z]?\d*` tek başına ("4/A") → son okunan/bağlam kanunda madde; bağlam yoksa tüm kanunlarda o numaralı maddeler.
- Diğer her şey → tam-metin: madde başlığı + madde metni + kanun adı.

**Sonuç tasarımı:**
```
🔎 "zor kullanma"
─ MEVZUAT ─────────────────────────
⚖️ 2559 · Polis Vazife ve Salâhiyet Kanunu (PVSK)
─ MADDELER ────────────────────────
📄 PVSK · Madde 16 — Zor ve silah kullanma
   "…direnişi kırmak amacıyla ve kıracak
   ölçüde **zor kullanma**ya yetkilidir…"
📄 CMK · Madde 90 — Yakalama…
   "…**zor kullan**arak…"
```
- Eşleşen kelime **highlight** (sunucudan `ts_headline` parçası; istemci sadece işaretler).
- Sonuca dokunuş → **okuyucunun o maddesine** gider (kanun başına değil).
- Sonuç yoksa: "Bulunamadı — resmî kaynakta ara" linki + aranan terim analytics'e düşer (§35 → içerik önceliklendirme sinyali).

---

## 8. Reader UX (madde madde okuma)

- **Sürekli akış okuyucu** (tek maddelik sayfa DEĞİL): kanun tek dikey akış, her madde ayrı görsel blok — belirgin `MADDE 90` numarası + madde başlığı + gövde + ayraç. Bölüm/kısım başlıkları ("İKİNCİ BÖLÜM — Koruma Tedbirleri") akışta sabitlenmiş ara başlık.
- **İçindekiler:** sağ altta yüzen "☰ İçindekiler" düğmesi → bottom sheet (mevcut DraggableScrollableSheet deseni): bölüm > madde ağacı, dokunuş → o maddeye kaydır. Uzun kanunda sheet içinde madde no filtresi.
- Madde bloğu altında bağlam satırı: `📌 Kaydet · 🔗 Paylaş · 🎯 Bu maddeden 12 soru` (soru yoksa son öğe gizli).
- Üst bar minimal: kanun kısa adı + madde göstergesi ("Madde 90 / 335") + Aa (yazı boyutu) — kaydırınca bar gizlenir, **metin ekrana hâkim olur**.
- Tipografi: yeni `AppTypography.reading` stili — 17px / 1.6 satır aralığı / paragraf arası boşluk; madde numarası `heading` + brand rengi; tablet/geniş ekranda 680px maksimum satır genişliği. Dark mode token'lardan otomatik.
- Kaynak künyesi: okuyucunun en üstünde bir kez (kanun düzeyi) + her madde detayında (`SourceTag` + "GG.AA.YYYY itibarıyla doğrulandı" + Resmî Kaynak linki).

**Yazı boyutu (Aa):** 3 kademe (küçük/normal/büyük), yalnız okuyucu metnini ölçekler (`textScaler`), SharedPreferences `reading_text_scale` ile kalıcı. — *P1 (V1 dalga 2; ucuz ama V1 çekirdeğini geciktirmesin).*

---

## 9. Mobile tasarım — akış wireframe'i

```
BUGÜN                    KÜTÜPHANE                MEVZUAT ANA
┌──────────┐  tab  ┌──────────────┐  kart  ┌──────────────────┐
│ hero     │ ────▶ │ Hedefini Seç │ ────▶ │ 🔎 ara…          │
│ kartlar  │       │ [PAEM][MİSYON]│       │ Devam: CMK 90    │
│ …        │       │ ⚖️ MEVZUAT   │       │ Kaydedilenler    │
└──────────┘       │  "CMK, PVSK…"│       │ Sınavda öne çıkan│
                   └──────────────┘       └──────┬───────────┘
                                                 │ dokunuş
SEARCH                    RESULT                 ▼ LAW DETAIL
┌──────────────┐   yaz   ┌──────────────┐  ┌──────────────────┐
│ 🔎 cmk 90    │ ──────▶ │ 📄 CMK m.90  │  │ 5271 · CMK       │
│ (klavye açık)│         │  Yakalama ve │  │ Kanun · 353 madde│
│ son aramalar │         │  …highlight… │  │ ✓ 12.08.2026     │
└──────────────┘         └──────┬───────┘  │ [Okumaya başla]  │
                                │ dokunuş  │ [İçindekiler]    │
                                ▼          │ [🎯 187 soru çöz]│
READER (Madde 90'a odaklı açılır)          └──────────────────┘
┌────────────────────────────┐
│ CMK · Madde 90/335      Aa │ ← kaydırınca gizlenir
│ ────────────────────────── │
│ MADDE 90                   │
│ Yakalama ve yakalanan kişi │
│ hakkında yapılacak işlemler│
│                            │
│ (1) Aşağıda belirtilen…    │
│ (2) …                      │
│ 📌 Kaydet · 🔗 · 🎯 8 soru │
│ ────────────────────────── │
│ MADDE 91                   │
│ …                          │
│                    [☰]     │ ← içindekiler FAB
└────────────────────────────┘
```

**"CMK Madde 90" dokunuş simülasyonu:**

| Adım | Eylem | Dokunuş |
|---|---|---|
| 1 | Kütüphane sekmesi | 1 |
| 2 | ⚖️ Mevzuat kartı | 2 |
| 3 | Arama alanı (klavye açılır) | 3 |
| 4 | "cmk 90" yazar (yazma, dokunuş sayılmaz) | — |
| 5 | İlk sonuç: CMK · Madde 90 | 4 |
| | **Madde 90 ekranda, okunuyor** | **4 dokunuş + 5 karakter** |

Kısa yollar bunu daha da düşürür: CMK "Son okunanlar"daysa 3 dokunuş (Kütüphane → Mevzuat → CMK son kalınan yerde açılır, içindekilerden 90); madde kayıtlıysa 3 dokunuş (Kaydedilenler çipi). Push/paylaşım deep link'i ile 1 dokunuş.

---

## 10. Web tasarım

- **Anon (SEO):** mevcut ISR sayfaları korunur; `/oku` sayfası içindekiler + madde çapaları ile güçlenir ve **sitemap'e eklenir** (bugün eksik — en büyük SEO varlığı indekslenmiyor). Anon madde sayfası resmî metni göstermeye başlar (API zaten dönüyor, sayfa kullanmıyor — bariz kazanım).
- **Girişli:** `ThreePane` deseni (LawWorkspace'te hazır): sol **İçindekiler ağacı** · orta **okuyucu** · sağ **inspector** (kaydet, hâkimiyet, bu maddeden sorular, resmî kaynak). `/calisma/kanun/[slug]/oku` rotası eklenir, middleware istisnası kalkar.
- Command palette (⌘K) mevzuat aramasına bağlanır: aynı `/public/mevzuat/search` ucu — "cmk 90" paletten de maddeye götürür (§28 global search).

---

## 11. Database modeli

Mevcut `LawArticle` korunur ve genişletilir; kanun birinci sınıf varlık olur:

```
legislation                      ← YENİ (kanun/yönetmelik kimliği)
  id, slug UNIQUE (kalıcı!), type ENUM(kanun|cbk|yonetmelik|genelge|yonerge)
  number ("2559"), name, short_name ("PVSK"), aliases TEXT[] ("pvsk","p.v.s.k")
  official_source_url, effective_info, last_verified_at
  status(draft|published), sort_order, topic_id FK? → topics (quiz köprüsü, 1:1 opsiyonel)

legislation_sections             ← YENİ (Kısım/Bölüm hiyerarşisi)
  id, legislation_id FK, parent_id FK?, heading, sort_order

law_articles                     ← MEVCUT, genişler
  + legislation_id FK            (topic_id kalır — quiz uyumluluğu)
  + section_id FK?               (bölüm bağı)
  + title                        (madde başlığı: "Durdurma ve kimlik sorma")
  + sort_key INT                 (articleOrder() kalıcılaşır)
  + search tsvector GENERATED    (başlık+metin, GIN index — §12)

article_bookmarks                ← YENİ   user_id + law_article_id UNIQUE
reading_progress                 ← YENİ   user_id + legislation_id UNIQUE,
                                          article_no, updated_at  (devam et + son okunanlar)
```

- **Geçiş:** backfill script'i mevcut 2 kanun-konusundan `legislation` satırları üretir; `LAW_NAME_RE`/`slugify` türetmeleri kalıcı kolonlara taşınır (regex kalkar, URL'ler sabitlenir).
- **Versiyonlama (P2 hazırlığı, V1'de tablo YOK):** madde güncellemesi bugün denetim kaydına yazılıyor (audit log payload'ı eski/yeni metni tutuyor) — "Ne değişti?" (§24) için ham veri şimdiden birikiyor. P2'de `law_article_revisions` tablosu eklendiğinde audit'ten tohumlanabilir. Bu, V1'e maliyet yüklemeden geleceği açık tutar.
- Fıkra/bent ayrı satır YAPILMAZ (aşırı mühendislik); metin içinde `(1) (2)` yapısı tipografiyle vurgulanır.

## 12. Search mimarisi

- Supabase Postgres'te `CREATE EXTENSION unaccent, pg_trgm` (mevcut, açılmamış).
- `law_articles.search` = `to_tsvector('simple', unaccent(lower_tr(title || ' ' || text)))` generated column + GIN. ("turkish" FTS config Postgres'te yok; `simple` + unaccent + uygulama tarafında TR küçültme — İ/ı sorunu çözülür. Kelime kökü ihtiyacı doğarsa CMK denetim script'indeki 6-karakter gövdeleme yaklaşımı websearch sorgusuna uygulanır.)
- `legislation` araması: `name/short_name/number/aliases` üzerinde trigram (typo toleransı bedavaya gelir: "polis vazfe" → PVSK).
- Tek uç: `GET /public/mevzuat/search?q=` → `{legislation[], articles[{lawSlug, no, title, headline}], tookMs}`; `ts_headline` ile sunucu-tarafı highlight; 5 dk process-cache + HTTP s-maxage. Auth'suz (SEO + hız), rate limit mevcut throttle ile.
- Ölçek: binlerce madde GIN ile milisaniye düzeyi — mevcut 15-bağlantı pooler kısıtına ek yük getirmez.

## 13. Veri kaynağı ve güncellik stratejisi

- **Kaynak: mevzuat.gov.tr resmî PDF'leri, insan indirir** — mevcut hat budur ve doğrudur. Otomatik kazıma YOK (site ToS'u + kırılganlık + "yanlış mevzuat kabul edilemez" ilkesi; kazıma hatası sessizce yanlış metin yayınlar).
- Akış: PDF indir → admin panel dry-run → fark raporu → içe aktar → **yayınla = doğrulama damgası** (mevcut).
- **Güncellik disiplini (yeni):** admin dashboard'a "Doğrulama takvimi" kutusu — `last_verified_at` > 90 gün olan kanunlar listelenir; üç ayda bir 1-2 saatlik kontrol turu. Resmî Gazete takibi manuel (P2'de yarı-otomatik radar değerlendirilir, asla otomatik yayın yapılmaz).
- Kullanıcıya dürüstlük: her okuyucuda "…tarihi itibarıyla doğrulanmıştır + Resmî Kaynak" — bilgi zaten modelde var, görünürlüğü artıyor.

**V1 içerik hedefi (soru bankası + sınav müfredatı analizine göre, öncelik sırasıyla):**

| # | Mevzuat | Gerekçe |
|---|---|---|
| ✅ | T.C. Anayasası (210 md.) | yüklü |
| ✅ | 2559 PVSK (42 md.) | yüklü |
| 1 | 5271 CMK | bankada 187+ soru, PAEM ağırlıklı; denetim script'i metni zaten işledi |
| 2 | 5237 TCK | bankada yoğun soru |
| 3 | 7068 Disiplin Kanunu | kurum içi sınavların bel kemiği |
| 4 | 2911 Toplantı ve Gösteri | PAEM klasiği |
| 5 | 5442 İl İdaresi | PAEM/GYS |
| 6 | 5326 Kabahatler | PAEM |
| 7 | 6136 Ateşli Silahlar | Misyon+PAEM |
| 8 | 3201 Emniyet Teşkilat | teşkilat sınavları |
| 9 | 657 DMK | GYS içerikleri bankada mevcut |
| 10 | 6284 Ailenin Korunması | güncel görev mevzuatı |
| P1 | 2918 Trafik (hacimli), 4483, 5607, 7201 Tebligat | ikinci dalga |

## 14. Bookmark / Reading History

- **Madde favorisi:** `article_bookmarks` + `POST/DELETE /me/article-bookmarks/:id` + `GET /me/article-bookmarks`. Mobilde soru favorisi deseninin (optimistik toggle + geri alma) kopyası. Kaydedilenler: Mevzuat ana sayfasında çip şeridi + tam liste ekranı.
- **Okuma konumu:** `reading_progress` upsert — okuyucudan çıkarken + 30 sn'de bir görünür maddeyle güncellenir (istek sağanağı yok). "Kaldığın yerden devam" kartı + "Son okunanlar" (aynı tablodan `ORDER BY updated_at DESC LIMIT 5`). Sunucuda tutulur → web/mobil senkron.
- Paylaşma: `https://paemisyon.com/kanun/cmk/madde/90` — **web URL'i paylaşmak V1 çözümüdür** (sayfalar zaten canlı ve SEO'lu; alan kullanıcıysa app yönlendirmesi P2'de universal link ile gelir). Okuyucudaki 🔗 bu URL'i sistem paylaşım sayfasına verir.

## 15. Quiz entegrasyonu

Köprüler büyük ölçüde hazır; eksik olan görünürlük:

- **Mevzuat → Quiz:** kanun detayında "🎯 Bu kanundan N soru çöz" (mevcut `{topicId, practice}` seansı); okuyucuda madde altında "Bu maddeden N soru" (mevcut `{topicId, articleNo}`); bölüm sonlarında nazik "Bilgini test et" satırı (yalnız soru sayısı ≥5 ise — zorlama CTA yok).
- **Quiz → Mevzuat:** cevap geri bildirimindeki madde sheet'ine tek satır eklenir: **"📖 Kanunda oku →"** → okuyucu o maddeye konumlanmış açılır (bugün sheet metni gösteriyor ama bağlamdan kopuk; okuyucuya geçince önceki/sonraki maddeler ve içindekiler de gelir).
- Atlas ısı haritası korunur; okuyucudaki madde bloklarına hâkimiyet noktası (○◐●) eklemek P1 (görsel gürültü testinden geçerse).

## 16. Gelecekte AI entegrasyonu (P2+)

Altyapı hazır: `ai/` modülü (önbellek-önce, hak sistemi, Opus 4.8). Madde için "AI'ya Sor" aynı desenle gelir: `POST /ai/article-explain {articleId, mode: sade|sınav-odağı|soru-üret|karşılaştır}` + `AiArticleExplanation` önbellek tablosu. **Kurallar baştan net:** çıktı her zaman "AI Açıklaması" etiketli ayrı kartta, resmî metin bloğuna asla karışmaz, `ArticleCard`'ın hazır "🗣 Polis diliyle" ikinci yüzü tam bu iş için bekliyor (bugün backend'i olmayan kilit yüz). V1'e alınmaz — okuma çekirdeği oturmadan AI katmanı gürültü olur.

## 17. Admin / güncelleme sistemi

Mevcut panel yeter, üç küçük ek:
1. Legislation meta editörü (kısa ad, alias'lar, tip, resmî URL) — mevcut law-articles sayfasına üst form.
2. "Doğrulama takvimi" kutusu (90+ gün uyarısı, §13).
3. İçe aktarmada bölüm başlıklarının yakalanması (parser bugün kırpıyor → artık `legislation_sections`'a yazar).
CMS büyütülmez; versiyon yönetimi P2.

## 18. Güvenlik ve veri bütünlüğü

- Resmî metin / Paemisyon açıklaması / AI açıklaması / kişisel not: **veri modelinde ayrı tablolar, UI'da ayrı kartlar** — hiçbir birleştirme yok (bugünkü ilke sürer).
- Okuma uçları auth'suz (SEO + hız) ama **yazma uçları** (bookmark/progress) JwtAuthGuard'lı; madde metni yalnız `status=published` iken döner (mevcut).
- Yayınlama yalnız admin rolü + denetim kaydı (mevcut); import her zaman dry-run önizlemeli.
- Rate limit mevcut global throttle (300/dk) + arama ucuna özel limit.

## 19. V1 kapsamı (net sınır)

**V1'e GİRER:** Legislation/Section veri modeli + geçiş · FTS arama ucu + arama ekranları (mobil+palet) · Mobil: Mevzuat ana, kanun detay, okuyucu, içindekiler sheet'i · Madde bookmark + kaydedilenler · Reading progress (devam + son okunanlar) · Resmî kaynak künyeleri · Quiz köprüleri (2 yön, görünür) · Web: /oku içindekiler + sitemap + girişli okuyucu · Admin: legislation meta + bölüm yakalama · İçerik: +8 kanun yüklemesi.

**V1'e GİRMEZ:** highlight, kişisel not, offline indirme, AI, versiyon diff/"ne değişti", güncelleme bildirimi, universal link, yeni bottom tab. (Gerekçeleri §20'de.)

## 20. P0 / P1 / P2 / P3 Roadmap

| Öncelik | İş | Not |
|---|---|---|
| **P0** | Legislation+Section şeması, geçiş, kalıcı slug | her şeyin temeli; regex-kimlik borcu kapanır |
| **P0** | FTS (unaccent+pg_trgm+tsvector+GIN) + `/public/mevzuat/search` | ürünün bel kemiği |
| **P0** | Mobil: Mevzuat ana + arama + kanun detay + okuyucu + içindekiler | mobilde sıfırdan tek büyük parça |
| **P0** | Madde bookmark + reading progress (API+mobil) | döngünün "KAYDET" halkası |
| **P0** | Quiz köprüleri görünür (kanun/madde→soru, feedback→okuyucu) | mevcut uçlar, yalnız UI |
| **P0** | İçerik: CMK, TCK, 7068, 2911 yüklemesi | içeriksiz merkez boş kabuk |
| **P1** | Yazı boyutu Aa (kalıcı) · Bugün'de devam kartı · kalan 4-6 kanun · web girişli okuyucu ThreePane · command palette entegrasyonu · /oku sitemap · arama typo toleransı · okuyucuda hâkimiyet noktaları · madde sheet önbelleği | V1'i "iyi"den "premium"a taşıyan dalga |
| **P2** | Highlight (tek renk) · kişisel not · AI "sade anlat/sınav odağı" (ArticleCard ikinci yüzü) · offline paket (kanun başına JSON önbellek + "çevrimdışı kopya eski olabilir" bandı) · kanun takibi + güncelleme push'u · `law_article_revisions` + versiyon geçmişi · universal link (paylaşım → app) | ürün-pazar geri bildirimiyle sıralanır |
| **P3** | "Ne değişti?" diff görünümü · Resmî Gazete yarı-otomatik radar · yönetmelik/genelge/CBK içerik genişlemesi · madde-düzeyi analitik ısı haritaları · AI karşılaştırma ("90 ile 91 farkı") | uzun vade vizyon |

**Highlight/not V1 dışı gerekçesi:** okuma çekirdeği olmadan işaretleyecek metin yok; V1 verisi (en çok okunan/kaydedilen maddeler) bu özelliklerin doğru tasarımını besleyecek. **Offline V1 dışı gerekçesi:** yanlış/eski metin riski en pahalı hata sınıfı; önce güncellik disiplini otursun, sonra "indirme tarihi damgalı" offline paket gelsin.

---

## Kapanış — kritik prensibin karşılığı

"Resmî sitenin kopyası değil" hedefi bu tasarımda üç şeyle karşılanıyor: (1) **arama** resmî sitede olmayan biçimde kısaltma/madde-no/kavram anlıyor; (2) **okuyucu** madde-blok yapısı, içindekiler ve kaldığın-yer ile gerçek mobil okuma deneyimi sunuyor; (3) **sınav bağı** — her maddenin kaç soru çıkardığı, senin hâkimiyetin ve tek dokunuşla soru çözme — Paemisyon'dan başka hiçbir yerde yok. ARA → BUL → OKU → KAYDET → ÖĞREN → SORU ÇÖZ döngüsü V1'de uçtan uca kapanıyor.

# Doc 57 — Kalıcı düzen planı (konu anlatımı) · 7 Kas 2026 · ONAYLANDI (model kabul, A+C önce)

**Amaç:** inceleme paketini (pakete gömülü 3 ders) kalıcı, sürümlü, panelden yönetilen ve yayın kapılı bir
içerik türüne çevirmek. Doc 53 ünitelerinin (madde aralığına bağlı kart dizisi) ve Doc 56 kartlarının yanında
üçüncü içerik türü: **ders** — kaynak kitaptan özgün anlatım, maddeye zorla bağlanmaz, soru üretmez.

## 1. Bugünkü durum (dal `claude/doc57-konu-anlatimi`, main üstüne alındı)

- 3 ders markdown (`docs/57-konu-anlatimi/anayasa/01-giris/03–05`), kaynak: THEMIS Anayasa Hukuku 24. baskı
  s.22–23 (özgün anlatım), UK Parliament sözlüğü.
- Üretici `apps/app/scripts/build-lesson-content.py` → `src/features/lessons/content.ts` (pakete gömülü).
- Okuyucu `app/anlatim/[slug]` (içindekiler, kaynak paneli, "Okudum", tablo dar ekranda alt alta).
- Giriş: Çalış → ders → Konu oku → `uniteler/[topicId]` → "Konu anlatımı / Hızlı tekrar" seçimi.
- Doc 53/06: `quick-review` API (hasQuickReview/quickReview; Genel esaslar kısa pilotu), 10 test.
- DB/API/web/admin yok; prod yayını yok; cihaz testi yok.

## 2. Veri modeli (Prisma, tek migration)

| Model | Alanlar | Not |
|---|---|---|
| `LessonSection` (bölüm) | id, courseId, topicId?, slug @unique, title, subtitle?, sortOrder, isPremium, status, publishedAt | "Anayasa Türleri". Ders ağacına bağlı; konuya bağ isteğe bağlı. |
| `Lesson` (ders) | id, sectionId, slug @unique, title, goal, sortOrder, readingMinutes, status, sourceLabel, version, publishedAt, createdBy, deletedAt | Yayın kapısı burada. `sourceLabel`: "THEMIS Anayasa Hukuku 24. baskı s.22" — kullanıcıya GÖSTERİLMEZ (4 Eyl kuralı), yalnız panel. |
| `LessonVersion` | id, lessonId, versionNo, body Json (sections[]→blocks[]: text/table/callout), reviewNote?, createdAt | Her kayıt yeni sürüm; okuma konumu sürüme bağlı. |
| `LessonSource` | id, lessonId, kind (book/url/article), label, url?, page?, lawArticleId? | Kullanıcıya **kaynakça paneli**nde yalnız kamuya açık olanlar (URL, madde); kitap künyesi panelde kalır. |
| `LessonLink` | lessonId, kind (topic/legislation/unit), targetId | Konu odası, mevzuat detayı, ünite listesi girişleri. |
| `LessonProgress` | userId, lessonId, versionNo, offset, readAt?, updatedAt | Sunucu (cihazlar arası). Okundu kullanıcı işaretler. |

Mevcut `user_unit_progress`/hâkimiyet dokunulmaz. Ders, hâkimiyete girmez (soru yok); ileride "ders okundu" koç
kuralı ayrı iş.

## 3. Doğrulama (betik + insan)

- `ders-dogrula.ts`: şema (her bölümde ≥1 blok, tablo satır genişlikleri eşit), her derste ≥1 kaynak,
  kaynak türü "article" verilmişse madde bankada var ve derste geçen sayılar o madde metninde (Doc 53 çekirdeği),
  yasak sözcükler ("AI", "model", kaynak kitap adı gövdede), kullanıcı metnine "inceleme notu" sızmamış.
- Teori/tarih iddiaları betikle doğrulanamaz → `LessonVersion.reviewNote` zorunlu, yayın yalnız admin.
- CLAUDE.md'ye istisna EKLENMEZ: ders metni model üretimi değil, editoryal özgün anlatım (insan yazdı/düzenledi).
  Model yalnız taslak yardımcısı olursa ayrı karar ve "AI taslak" etiketi gerekir — bu planda yok.

## 4. API

- Public: `GET /public/lessons/sections?courseId|topicId` (yayınlı bölümler + ders listesi, kilit),
  `GET /public/lessons/:slug` (yayınlı sürüm gövdesi + kamuya açık kaynaklar).
- Me: `GET/POST /me/lessons/progress`.
- Admin: `/admin/lessons` (bölüm/ders listesi, içe aktar markdown→sürüm, düzenle, doğrulama satırları,
  yayınla/yayından al, toplu yayın tek tek kapıdan).
- Betikler: `ders-ice-aktar.ts <md dizini>` (markdown → LessonVersion, in_review), `ders-dogrula.ts`.

## 5. Yüzeyler

- Expo: `uniteler/[topicId]` "Konu anlatımı" sekmesi sunucudan; `anlatim/[slug]` API'den okur (gömülü içerik
  kalkar); konu odası ve mevzuat detayında giriş satırı (Doc 57 dalındaki gibi). Kaynakça paneli yalnız kamuya
  açık kaynaklar.
- Web: `/anlatim/<slug>` (dual rota, SEO: yayınlı dersler indekslenir; kaynak kitap adı sayfada yok).
- Admin: `/lessons`.

## 6. Aşamalar

| # | İş | Teslim |
|---|---|---|
| A | Migration + Prisma + doğrulayıcı + içe aktarma betiği; 3 dersi prod'a in_review | YAPILDI (7 Kas): `20261107100000_konu_anlatimi`, `modules/lessons/*` (5 test), `scripts/ders-ice-aktar.ts`, `ders-yayinla.ts`; yerelde 3 ders yayınlandı, uçlar doğrulandı. Prod yükleme deploy sonrası |
| B | Admin `/lessons` | YAPILDI (7 Kas): bölüm/ders listesi, markdown'dan içe aktarma (Doğrula → İncelemeye yaz), ders sayfası (gövde + sürüm seçici, künye, kaynaklar, inceleme kaydı, doğrulama satırları, Yayınla / bekleyen sürümü yayınla / Yayından al), bölümde Premium bayrağı ve yayından alma. Yerel panelde tur yapıldı. |
| C | Expo: API'den okuma, gömülü içerik kaldırma, giriş satırları; simülatör + telefon | YAPILDI (7 Kas): `features/lessons/queries.ts`, `uniteler/[topicId]` bölüm/ders listesi sunucudan, `anlatim/[slug]` sunucu gövdesi + sunucu ilerlemesi (offset/okudum), premium kilit ekranı; simülatörde doğrulandı (ilerleme DB'ye yazıldı). Telefon: deploy sonrası |
| D | Web `/anlatim` | YAPILDI (7 Kas): `(dual)/anlatim/[slug]` (misafir ISR 1 sa + SEO meta; girişli okuyucu: kaldığı yer, Okudum), konu odasında "Konu anlatımı" listesi, sitemap girdileri, yayın/yayından alma/premium değişikliğinde `revalidateWebPaths` (bölümün tüm dersleri, prev/next yüzünden). Kaynakçada yalnız kamuya açık kaynaklar (API zaten kitabı dönmez). Yerelde misafir sayfası, mobil/masaüstü, sitemap ve API kilidi doğrulandı; girişli okuyucu kullanıcı turunda. |
| E | Yayın (admin) + CLAUDE.md'ye "ders" içerik türü notu (istisna değil, tanım) | YAPILDI (7 Kas): 3 ders prod'da yayında (kullanıcı, `ders-yayinla.ts`); CLAUDE.md'ye "DERS içerik türü" tanımı eklendi. |

Sonraki içerik: THEMIS bölüm 2+ (anayasa yapımı, değişikliği…) aynı hat; her bölüm için kapsam dosyası +
editoryal inceleme + panel yayını.

## 7. Kararlar (7 Kas 2026)

1. Model kabul edildi. 2. Premium: bölüm bayrağı, varsayılan açık (panelden değişir). 3. Kaynakça: kitap künyesi gizli, URL ve madde açık. 4. Sıra: A+C → B (panel) → D (web) → E.

### Sorulan hâliyle

1. Model kabul mü (bölüm → ders → sürüm; ünite ağacından bağımsız, konuya isteğe bağlı bağ)?
2. Dersler premium mu, açık mı (bölüm bazında bayrak)?
3. Kaynakça panelinde kitap künyesi gösterilsin mi? (Önerim: hayır; URL ve madde evet.)
4. A–E sırası ve önce A+C (mobil) mi, yoksa A+B (panel) mi?

## 8. İçerik düzeni kararları (7 Kas 2026) ve ilk iki bölüm

Kullanıcı kararları: (a) 400–700 kelime/ders, 4–8 ders/bölüm; (b) blok türleri altıyla sınırlı — metin, karşılaştırma
tablosu, `tanim`, `uyari` (tek ton; "hoca notu" gibi ikinci ses yok), `ornek`, `madde` (resmî metne bağ, madde yeniden
yazılmaz), `soru` (bankadaki gerçek soru; etiket gösterilmez, yalnız resmî PAEM sınav adı gösterilebilir — ilk sürümde
hiç etiket yok); (c) üretim hattı "AI taslak + insan düzenleme" (`aiDraft`, sourceLabel ön eki). Markdown yönergeleri
`:::tanim <terim>` … `:::`, `:::uyari`, `:::ornek`, `:::madde <kanun>:<no>`, `:::soru <id>`; parser/doğrulayıcı
`ders-markdown.ts` / `ders-dogrulayici.ts`, yayın gövdesi `enrichBody` ile zenginleşir (madde adı, soru gövdesi/şıklar/
doğru/açıklama). Kaynak kitabın bölümleri: 1 Giriş, 2 Türk Anayasa Tarihi, 3 1982 Anayasası, 4 Yasama, 5 Yürütme,
6 Yargı, 7 Anayasanın Değiştirilmesi, 8 Hükümet Sistemleri. Temel haklar (3/VI–VII) madde tabanlı olduğundan Doc 53
ünitelerine bırakılır.

İlk teslim: `anayasa/00-anayasa-hukukuna-giris` (3 ders, açık) ve `anayasa/02-turk-anayasa-tarihi` (7 ders, premium);
`anayasa-turleri` bölümü sortOrder 1'e alındı (prod'da panelden). Kurucu iktidar dersinde md 175 bağlı gerçek soru
(a4a866ce…) gömülü; teori/tarih dersleri için soru eşlemesi bankada arama ister (prod okuma izni yok — kullanıcı).


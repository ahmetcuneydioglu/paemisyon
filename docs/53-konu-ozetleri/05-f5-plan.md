# Doc 53 / 05 — F5 planı: ünite bazlı hâkimiyet ve koç reçetesi

Tarih: 26 Ekim 2026. Durum: **plan, onay bekliyor.** Kod değişikliği yapılmadı.

## 0. Karar önerisi: ünite ALT KONU değil, ETİKET olsun

Doc 53 karar 5 "üniteler ileride alt konu olur" diyordu. Veriye bakınca bu yolu önermiyorum; aynı
ürün sonuçlarını konu ağacına dokunmadan alan bir yol var.

**Bugünkü gerçek (26 Eki, canlı):**

| Veri | Değer |
|---|---|
| Üründe alt konusu olan konu | **0** (şemada `parentId` var; hiçbir ders kullanmıyor) |
| Anayasa konusuna bağlı soru | 929 (674'ü `articleNo` ile maddeli, 223'ü maddesiz) |
| Anayasa'ya bağlı seans | 448 |
| Anayasa konu ilerlemesi olan kullanıcı | 289 (`user_topic_progress`) |
| Haftalık hâkimiyet fotoğrafı | 1 450 satır |
| Haftalık plan kalemi | 24 |

Alt konu yolu şunları ister: 929 soruyu 12 alt konuya taşımak (223'ü elle), 289 kullanıcının konu
ilerlemesini ve 1 450 fotoğrafı bölmek ya da sıfırlamak, seans havuzu (`topicId` düz), koç hazırlık
bloğu, haftalık plan, katalog, oda, web ve mobil katalog ekranlarını "çocuklu konu" için yeniden
yazmak; `isPremium` ve `Legislation.topicId` (1:1) semantiğini bölmek. Üründe bugün tek bir alt konu
bile yokken bunu yalnız Anayasa için açmak, bütün sistemi en riskli yerinden değiştirmek demek.

**Etiket yolu:** ünite zaten madde aralığıdır; soru zaten `articleNo` taşır. Ünite üyeliği
hesaplanır: `question.topicId = unit.topicId` ve `articleNo` sayısal olarak `[articleFrom, articleTo]`
içinde. Kullanıcının ünite hâkimiyeti, konu hâkimiyetiyle aynı anda, aynı cevaplardan birikir.
Konu ağacı, seans, plan, katalog değişmez. Alt konu kapısı kapanmaz; ileride istenirse bu veriyle açılır.

Kazanımlar aynı: ünite bazlı hâkimiyet, zayıf ünite tespiti (aynı eşik), koçun "önce özetini oku, sonra
10 soru" reçetesi, konu odasında ünite satırında doğruluk, özet okuyucuda "bu üniteden hâkimiyetin".

## 1. Veri modeli

```
/// Kullanıcı × ünite hâkimiyeti — user_topic_progress'in ünite eşi; aynı cevaplardan aynı anda birikir.
model UserUnitProgress {
  userId         String   @db.Uuid
  unitId         String   @db.Uuid
  solvedCount    Int      @default(0)
  correctCount   Int      @default(0)
  mastery        Decimal  @default(0) @db.Decimal(4, 3)
  lastActivityAt DateTime @default(now())
  @@id([userId, unitId])  @@index([userId, lastActivityAt])  @@map("user_unit_progress")
}
```

Soru → ünite eşlemesi tablo değil, **sorgu**: ünite madde aralığı + sorunun `articleNo`'su. Sayısal olmayan
madde numaraları ("Ek 1", "Geçici 2") ünite dışı kalır (Anayasa'da bu üniteler zaten kapsam dışı).
İleride performans gerekirse `SummaryUnit` üzerinde `articleNosCache` (int[]) tutulur; şimdilik gerek yok.

## 2. Yazma yolu (tek kanca)

`ProgressService` seans sonlandırma işlemi bugün cevapları konuya göre gruplayıp `user_topic_progress`'e
tek toplu upsert atıyor. Aynı işlemin içine ikinci bir toplu upsert eklenir:

1. Seansın cevapları zaten elde (`questionId`, `isCorrect`, sorunun `topicId` ve `articleNo`).
2. Seanstaki konular için yayındaki üniteler çekilir (`summary_units` where `topicId in (...)`, published).
3. Cevap → ünite: `articleNo` sayısal ve aralıkta → `byUnit[unitId] += {solved, correct}`.
4. `INSERT INTO user_unit_progress ... ON CONFLICT DO UPDATE` — konu upsert'iyle birebir aynı biçim.

Ek sorgu maliyeti: seans başına 1 select. Yayında ünitesi olmayan konularda adım 2 boş döner, kanca sessiz.

**Geriye dönük doldurma** (`scripts/unite-ilerleme-doldur.ts`): bitmiş seansların cevaplarından
(`quiz_answers` × `questions.article_no`) tek geçişte `user_unit_progress` üretir. 448 Anayasa seansı
için saniyeler. Script idempotent (truncate + yeniden hesap), `connection_limit=1`, backend durdurulmadan
(yalnız okuma + tek tablo yazımı).

## 3. API

| Uç | Değişiklik |
|---|---|
| `GET /public/summaries/topic/:topicId` (girişli) | Ünite satırına `mastery: { solved, correct, accuracyPct, band }` — band aynı eşikle (`zayif-konu.ts`: ≥10 çözülmüş, <%60 zayıf). |
| `GET /public/summaries/:slug` (girişli) | Aynı `mastery` nesnesi; okuyucu başlığında "bu üniteden N soru, %X". |
| `GET /me/coach` | Hazırlık bloğundaki en zayıf konu Anayasa ise ve o konuda ünite varsa: `weakestUnit: { slug, title, accuracyPct, solved }`. Reçete sunucuda kurulur (koç kuralı istemcide yok): `recipe: { kind: "summary_then_questions", summarySlug, sessionHref }`. Kullanıcı üniteyi bitirmişse (`SummaryProgress.completedAt`) reçete doğrudan soruya gider. |
| `GET /me/topic-room/:id` | Değişmez; oda, ünite listesini zaten ayrı uçtan alıyor. |

Seçim kuralı (sunucu): konu zayıfsa → o konunun üniteleri arasında `zayifMi` olanlardan doğruluğu en
düşük; hiçbiri eşiği geçmiyorsa (az veri) → en az çözülmüş ünite "yeni" bandıyla. Konu zayıf değilse
ünite reçetesi çıkmaz.

## 4. Yüzeyler

- **Konu odası (web + Expo):** ünite satırında ilerleme çubuğunun yanına doğruluk rozeti (`%48 · zayıf`
  / `%81` / `yeni`); zayıf ünite varsa koç cümlesinin altına tek satır: "En zayıf ünite: Yasama II (%48).
  Önce özetini oku." → `/ozet/<slug>`.
- **Özet okuyucu:** başlıkta hâkimiyet satırı; köprü kartında "bu üniteden %X, 10 soruyla yükselt".
- **Bugün (koç kartı):** reçete varsa görev kartı "Yasama II özetini oku (12 dk) → 10 soru". Özet bitince
  kart aynı yerden soruya döner. Bu, Doc 25 §G'nin ("önce özetini oku, sonra 10 soru") ürünleşmesidir.
- **Admin:** ünite listesinde "bu üniteye düşen soru" sayısı (madde aralığından) — editöre kapsam sağlaması.

## 5. Maddesiz 223 soru (F5-B, isteğe bağlı, ayrı iş)

Anayasa'nın 223 sorusu `articleNo` taşımıyor; etiket modelinde bunlar hiçbir ünitede sayılmaz. Çözüm
editoryal: admin soru listesine "maddesiz" süzgeci ve hızlı `articleNo` girişi. Model yardımı mümkündür
(kökten madde önerisi), ama öneri insan onayıyla yazılır; bu bir meta veri işidir, soru içeriği değişmez.
F5'in kapsamı dışında; F5 674 maddeli soruyla tam çalışır.

## 6. Fazlar ve doğrulama

| Adım | İş | Doğrulama |
|---|---|---|
| F5-1 | Şema + migration (`user_unit_progress`), kanca (`ProgressService`), doldurma betiği | Birim: cevap→ünite eşlemesi (aralık, sayısal olmayan madde, ünitesiz konu). Yerel DB: pilot seans → satır doğru birikiyor. |
| F5-2 | API: ünite `mastery`, koç `weakestUnit` + reçete | Birim: seçim kuralı (zayıf, az veri, bitmiş özet). Canlı: kendi hesabınla konu listesi. |
| F5-3 | Web: oda rozeti + zayıf ünite satırı, okuyucu hâkimiyet satırı, Bugün reçete kartı | Tarayıcı, girişli. |
| F5-4 | Expo: aynı üç yüzey | Simülatör. |
| F5-5 | Doldurma betiği canlıda, 24 saat sonra koç kartında reçete gözlemi | Canlı. |

Deploy tek kalem: F5-1 ve F5-2 birlikte (şema + API), F5-3 ayrı, F5-4 TestFlight.

## 7. Açık sorular (onayla birlikte)

1. **Etiket modeli onayı** (karar 5'in revizyonu). Hayır dersen alt konu planını ayrıca yazarım; o plan
   veri göçü ve 7 modülde değişiklik içerir.
2. Koç reçetesi günde en çok bir kez mi çıksın (Doc 24 §7.6 frekans disiplini)? Önerim: evet, ve kullanıcı
   özeti bitirince o ünite için tekrar çıkmaz.
3. Ünite doğruluğu Premium kilitli ünitede gösterilsin mi? Önerim: evet, gösterilir; kilitli olan özetin
   kendisidir, kullanıcının kendi doğruluğu değil.

---

## F5-1 durum (26 Eki 2026) — yazıldı, yerel E2E geçti, deploy bekliyor

| Parça | Dosya | Doğrulama |
|---|---|---|
| Şema + migration | `UserUnitProgress`, `20261027200000_unite_hakimiyeti` | Yerel Postgres'te zincir geçti |
| Saf eşleme | `src/modules/summaries/unite-eslesme.ts` (+ spec, 6 test) | "84/2" → 84, "Ek 1"/"Geçici 2"/"4/A" ünitesiz, konu+aralık, sınırlar dâhil |
| Kanca | `ProgressService.recordSessionProgress` | Konu upsert'inin yanına ünite upsert'i (aynı işlem, aynı biçim). Yerel: 4 cevap → solved 4 / correct 2 / mastery 0,5; ikinci tur → 5 / 3 / 0,6 |
| Doldurma | `scripts/unite-ilerleme-doldur.ts [--dry]` | Canlı prova: yayında ünite yokken "yapılacak iş yok" (doğru). Yayın sonrası çalıştırılır |

Sıra: deploy (şema + kanca) → panelden ünite yayını → `unite-ilerleme-doldur.ts` → F5-2 (API: mastery, koç reçetesi).
Onaylanan üç soru: etiket modeli · reçete günde en çok bir kez ve özet bitince o ünite için tekrar yok ·
kilitli ünitede kullanıcının kendi doğruluğu görünür.

## F5-2 durum (26 Eki 2026) — yazıldı, yerel E2E geçti, deploy bekliyor

| Parça | Dosya | Doğrulama |
|---|---|---|
| Saf reçete | `src/modules/summaries/unite-recete.ts` (+ spec 7 test) | Band konu eşiğiyle aynı; zayıf ünitelerden en düşük doğruluk; az veride en az çözülmüş; özet bitmişse `questions`; deterministik |
| Ünite hâkimiyeti dışarı | `SummariesService.listForTopic/getUnit` → `mastery {solved, band, accuracyPct}` | Yerel: 12/4 → `%33 weak`; misafirde null; kilitli ünitede de döner (karar) |
| Koç | `SummariesService.recipeForTopic` → `CoachContext.weakestUnit`, `CoachBrief.unitRecipe`; `weak-topic.rule.ts` ünite reçetesine döner | Yerel `/me/coach`: zayıf Anayasa → kart "T.C. Anayasası: en zayıf yerin Yasama I (%33)" · "Özeti aç" → `/ozet/anayasa-yasama-1`; özet bitince kart "Özetini okudun; şimdi bu maddelerden 10 soru" · "Çöz" |
| Seans parametreleri | `meta.recipe.session {topicId, articleNos, count}` | İstemci URL'yi kurar (web `/seans?articleNos=`, mobil params) |

Günde en çok bir kez: seçim deterministik (aynı veri → aynı ünite); kart gün içinde sabit kalır, istemci tekrar
üretmez. API 545 test. Sıra: F5-3 web (`/ozet/<slug>` koç rotası eşlemesi `routes.ts`, oda rozeti, okuyucu
hâkimiyet satırı, Bugün kartı reçete meta'sı), F5-4 Expo.

## F5-3 durum (26 Eki 2026) — web yazıldı; testler temiz, tarayıcı doğrulaması giriş bekliyor

| Parça | Dosya | Not |
|---|---|---|
| Koç rotası | `lib/routes.ts` `webRoute(route, type, meta)` | `/quiz` + `meta.topicId` → `/seans?topicId&count&source=home_weak_topic&scope`; `meta.recipe.session.articleNos` varsa eklenir; `/ozet/<slug>` olduğu gibi geçer. 3 test |
| Kart meta | `ui/coach-card.tsx`, `shell/coach-rail.tsx`, `bugun/page.tsx` | Kart `meta`'yı rota eşleyiciye geçirir; "Özeti aç" `/ozet/<slug>`, "Çöz" ünite maddeleriyle seans |
| Konu odası | `ozet/unit-list-section.tsx` | Satırda hâkimiyet rozeti (`%33 · zayıf` / `%81 · güçlü` / `yeni` / `az veri`), listenin üstünde "En zayıf ünite: … Önce özetini oku / Özetini okudun; sorularla pekiştir" |
| Okuyucu | `ozet/unit-reader.tsx` | İlerleme çubuğunun altında "Bu üniteden N soru çözdün: %X · zayıf"; köprü kartında "Şu an %X; 10 soruyla yükselt" |
| Tipler | `lib/ozet.ts`, `lib/public-api.ts` | `UnitMastery`, `UnitRecipe`, `weakestUnit`, `masteryLabel`; brief `cards[].meta`, `unitRecipe` |

Web 12 test dosyası geçti (ozet 8, routes +3), tsc ve eslint temiz. Tarayıcı: önizleme oturumu düştüğü için üç
yüzey (oda, okuyucu, Bugün kartı) kullanıcı girişinden sonra görülecek.

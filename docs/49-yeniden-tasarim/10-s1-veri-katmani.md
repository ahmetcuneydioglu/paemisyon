# Doc 49 / 10 — S1: Veri katmanı 2.0 (spec onaylandı 16 Eki 2026)

Tarih: 16 Ekim 2026. Dal `claude/s1-veri-katmani`. Plan: `00-plan.md` §3 S1.
Amaç: F8'in dört özelliğinin (haftalık plan, aralıklı tekrar, deneme serisi, mevzuat↔soru)
ve talimat §6/§9/§12'nin ihtiyaç duyduğu tabloları ve uçları **istemciyi bozmadan** eklemek.
Hepsi EKLEMELİ: mevcut kolon silinmez, mevcut uçların yanıt şekli değişmez; Flutter 1.x ve
Expo 2.0 etkilenmez. Kapanış: migration'lar prod'da, spec'ler yeşil, backfill raporu yazılı.

## 1. Modeller

### 1.1 Aralıklı tekrar — `QuestionReview` (`question_reviews`)

| Kolon | Tip | Not |
|---|---|---|
| user_id, question_id | uuid, PK bileşik | FK users (cascade), questions |
| ease | decimal(3,2) default 2.50 | SM-2 kolaylık; alt sınır 1.30 |
| interval_days | int default 0 | son aralık |
| reps | int default 0 | ardışık doğru |
| lapses | int default 0 | toplam yanlış |
| due_at | timestamptz | **indeks (user_id, due_at)** |
| last_reviewed_at | timestamptz | |
| last_result | bool | |

Algoritma (SM-2 sadeleştirilmiş, Doc 24 §9 "unutma eğrisi"):
- Doğru: reps+1; aralık `reps=1→1 g, 2→3 g, sonra önceki×ease` (üst sınır 60 g; sınava ≤30 gün
  kala üst sınır sınava kalan gün). ease += 0.10 (hız <ortalama ise +0.15), tavan 3.0.
- Yanlış: reps=0, lapses+1, aralık 1 g (ikinci lapse'te 0 g = aynı gün tekrar), ease −0.20,
  taban 1.30.
- Güncelleme anı: her `QuizAnswer` upsert'inde (practice/review/daily/exam/deneme hepsi — bilgi
  bilgidir; deneme modunda geri bildirim gösterilmese de kayıt tutulur). Boş cevap → kayıt yok.
- `WrongAnswer` KORUNUR (koç sayacı ve ücretsiz 7 gün penceresi değişmez). Ek kural:
  `QuestionReview.reps >= 2` olan soru `WrongAnswer.resolvedAt` alır (mevcut "doğru çözünce
  çözüldü" kuralını daraltmaz, genişletir).
- Ücretsiz plan: `due` havuzu da son 7 günle sınırlı (yanlis-havuzu.ts ile aynı süzgeç);
  premium süresiz. "Süresiz tekrar hafızası" vaadi böylece gerçek olur.

### 1.2 Mevzuat ↔ soru — `QuestionArticle` (`question_articles`) ve `LawArticleVersion`

- `question_articles`: question_id + law_article_id (PK bileşik), `relation` enum
  `primary|related`, `source` enum `legacy_article_no|editor|script`, created_at. İndeks
  (law_article_id). Backfill: `Question.articleNo` + `Topic→Legislation→LawArticle(articleNo)`
  eşleşmesi `primary/legacy_article_no` olarak yazılır; eşleşmeyen numaralar (ör. "21, 151",
  "45-49") rapora düşer, elle/`madde-oner` ile bağlanır. `Question.articleNo` kolonu kalır
  (atlas onu okuyor); yeni uçlar N:N'i okur.
- `law_article_versions`: id, law_article_id, version_no, text, source_name, source_url,
  effective_from (date), effective_to (date?), verified_at, created_at; unique
  (law_article_id, version_no). Backfill: her yayımlı maddenin bugünkü metni version 1.
  `LawArticle.text` kolonu kalır ve her zaman güncel sürümü yansıtır (mevcut okuyucu/atlas
  değişmez). Admin'de "metin değişti" → yeni sürüm + bağlı soruların yeniden inceleme kuyruğu
  (S2'nin işi; S1 yalnız tabloyu ve `lastReviewedAt` alanını hazırlar).

### 1.3 Soru notu, kişisel liste, kalıcı bayrak

- `question_notes`: user_id + question_id PK, text (≤2000), updated_at.
- `user_lists`: id, user_id, name (≤60), sort_order, created_at; `user_list_items`: list_id +
  question_id PK, added_at; indeks (list_id, added_at). Ücretsiz: 3 liste, liste başına 50
  soru (plan sabiti `plans.free`); premium sınırsız.
- `quiz_answers.flagged` bool default false — denemedeki "emin değilim" bayrağı sunucuda
  kalıcı (cihaz değişince kaybolmasın); sonuç ekranında "bayrakladığın sorular".

### 1.4 Günlük süre

- `users.daily_minutes` int? — onboarding'in 15/30/60 seçimi artık kaybolmaz (`dailyGoal`
  soru hedefi KALIR; ikisi ayrı anlam).
- `daily_usage.study_seconds` int default 0 — `QuizAnswer.timeSpentMs` toplamı + okuyucu
  ilerleme kayıtları arası süre (istemci `POST /me/reading-progress`'e `seconds` ekleyebilir,
  isteğe bağlı). Koç ileride "bugün 12 dk çalıştın / hedef 30" diyebilir.

### 1.5 Soru kalitesi

- `question_versions.last_reviewed_at` timestamptz? (`review_note` 16 Eki'de eklenmişti).
  Betikler (tazeleme turları) ve panel onayı bu alanı yazar; S2'de "6 aydır incelenmemiş"
  filtresi.

### 1.6 Haftalık plan (şema şimdi, servis F8)

- `study_plans`: id, user_id, exam_date, weekly_minutes, created_at, revised_at, status
  `active|archived`; `study_plan_items`: id, plan_id, week_start (date), topic_id, target_questions,
  target_minutes, done_questions, done_minutes, status `pending|done|skipped`; indeks
  (plan_id, week_start). Plan üretim algoritması F8'in kendi belgesinde; S1 yalnız tabloları
  ve `GET /me/plan` (boş/404) iskeletini koyar ki istemci sözleşmesi erken netleşsin.

## 2. Uçlar (hepsi girişli; zarf ve hata biçimi aynı)

| Uç | İş |
|---|---|
| `GET /review/due` | `{ count, dueToday, nextDueAt, sample: [{questionId, stem, topicName, dueAt}] }` (ücretsiz pencere uygulanır) |
| `POST /quiz/sessions` `{mode:'review', pool:'due'}` | due havuzundan tur (mevcut `review` = çözülmemiş yanlışlar; `pool` yoksa eski davranış) |
| `GET/PUT/DELETE /me/questions/:id/note` | soru notu |
| `GET/POST/PATCH/DELETE /me/lists`, `POST/DELETE /me/lists/:id/items/:questionId` | listeler; `POST /quiz/sessions {mode:'practice', listId}` listeden tur (bookmarks gibi kapsamsız) |
| `POST /quiz/sessions/:id/answers` body `+flagged?: boolean` | bayrak kalıcı; `GET /exams/attempts/:id` review satırına `flagged` eklenir |
| `GET /public/mevzuat/:slug/:no/questions` | maddeye bağlı yayımlı soru sayısı ve önizlemeler (anahtar yok); girişliyse "çözdün/yanlış" durumu |
| `GET /me/plan` | 404/boş iskelet (F8'de dolar) |
| `PATCH /me` `+dailyMinutes` | onboarding da yazar |

Koç brief'ine eklemeli alan: `readiness.dueCount` (istemci göstermeye hazır olunca).

## 3. Göç ve güvenlik

- Tek migration dosyası değil, **5 migration** (1.1, 1.2, 1.3, 1.4+1.5, 1.6) — her biri geri
  alınabilir ve bağımsız deploy edilebilir.
- Supabase pooler: migration'lar deploy sırasında Railway'in `prisma migrate deploy` adımıyla
  koşar (mevcut düzen); backfill betikleri `apps/api/scripts/` altında `connection_limit=1`
  ile, backend durdurulmadan (yalnız INSERT, kısa işlemler, 500'lük partiler).
- Backfill'ler: `s1-review-backfill.ts` (son 90 günün `QuizAnswer` kayıtlarından ilk
  `QuestionReview` satırları — isteğe bağlı, soğuk başlangıç yerine), `s1-question-article-
  backfill.ts` (rapor + yazım), `s1-article-version-backfill.ts`. Her biri `--dry-run` ile önce
  rapor üretir; sonuçlar bu belgeye işlenir.
- Testler: SRS algoritması saf fonksiyon + spec (sınır değerler, sınav yakını tavan, ücretsiz
  pencere); due havuzu süzgeci `yanlis-havuzu` ile aynı yardımcıyı kullanır (tek tanım kuralı,
  Doc 48 A3); uç spec'leri mevcut kalıpla.

## 4. Kapsam dışı (bilerek)

- SRS'yi istemcide göstermek (Kütüphane › Akıllı Tekrar ekranı, Bugün'de "süresi gelen"):
  F8-2. S1 yalnız veri ve uçlar.
- Deneme serisi tabloları (`ExamSeries`): F8-3 kendi belgesinde (ürün kararı gerekiyor:
  dönem adı, takvim).
- Madde sürümü değişince soruların otomatik yeniden incelemesi: S2.

## 5. Sıra ve süre

S1-A SRS (3 gün) → S1-B mevzuat↔soru (3 gün, backfill raporu) → S1-C not/liste/bayrak
(2 gün) → S1-D süre + lastReviewedAt (1 gün) → S1-E plan iskeleti (1 gün). Her parça ayrı
commit ve deploy; parça sonunda prod'da spec ve backfill raporu.

## 6. İlerleme

- **S1-A SRS (16 Eki 2026):** `question_reviews` tablosu (migration 20261016180000),
  `quiz/srs.ts` saf fonksiyon + 8 spec; `submitAnswer` boş olmayan her cevapta upsert (en iyi
  çaba, kritik yolu beklemez); reps ≥ 2 → açık WrongAnswer çözüldü; `POST /quiz/sessions
  {mode:'review', pool:'due'}`; `GET /review/due` `{count, dueToday, nextDueAt, sample[]}`.
  Süzgeç tek yerde (`yanlis-havuzu.ts: tekrarKaydiFiltresi`). Backfill yok: hafıza canlıda
  ilk cevaplarla dolar (soğuk başlangıç kabul edildi; 90 günlük backfill isteğe bağlı).
- **S1-B mevzuat↔soru (17 Eki 2026):** `question_articles` + `law_article_versions`
  (migration 20261017090000; enum `QuestionArticleRelation primary|related`,
  `QuestionArticleSource legacy_article_no|editor|script`). Spec'ten tek sapma:
  `effective_from` NULL olabilir — backfill'de yürürlük tarihi bilinmiyor, uydurulmaz.
  Etiket ayrıştırma saf fonksiyon `common/madde-no.ts` (+7 spec): liste "43, 141" →
  43 primary, 141 related; "219/1" → fıkra eki düşer, madde 219 ("4/A" harfli ek
  maddenin kendisidir, dokunulmaz); "45-49" aralık bağlanmaz. Uç
  `GET /public/mevzuat/:slug/:no/questions` (OptionalJwt; `{count, primaryCount,
  items[{questionId, relation, stem≤200, topicName, me?}]}`; anahtar/kaynak etiketi
  yok; madde yalnız yayımlı metinler arasından, soru yalnız yayımlı + iptal edilmemiş;
  +4 spec). **Kuru çalışma raporu (prod, 17 Eki, migration öncesi):**

  | Ölçü | Değer |
  |---|---|
  | `articleNo` etiketli soru | 3879 (3878 yayımlı, 1 sürümsüz) |
  | Bağlanacak soru / bağ | 3855 / 3876 (3855 primary + 21 related) |
  | Tek madde / liste / fıkra eki düşen | 3841 / 14 / 1 |
  | Rapora düşen | 24 — 23 "konuda madde yok", 1 aralık ("45-49", TCK) |
  | Sürüm 1 yazılacak yayımlı madde | 4892 (66 mevzuat, boş metin 0) |

  "Konuda madde yok" 23 soru: Atatürk İlkeleri (3), Genel Kültür (2), İnsan Hakları
  (2), Protokol Bilgisi (5), İdare Hukuku (5), 6458 Yabancılar (4), "Anayasa" adlı
  ikinci konu (1 — `T.C. Anayasası`'nın yanında metinsiz kopya; birleştirme adayı,
  S1 kapsamı dışı). Ayrıntı: `s1b-soru-madde-raporu.json` (betik her koşuda yeniler).
  **Yazım (prod, 17 Eki 2026 01:03 TSİ, main cd9f7f7 deploy + migration sonrası):**
  `question_articles` 3876 satır (3855 soru; 21 related), `law_article_versions` 4892
  satır — kuru raporla birebir; sürüm 1 metni `law_articles.text` ile farksız (0 fark).
  Canlı doğrulama: `GET /public/mevzuat/turk-ceza-kanunu/43/questions` → count 46,
  primaryCount 46, girişsizde `me` yok; bilinmeyen madde 404; health 200. Betikler
  `createMany skipDuplicates` ile idempotent, editör bağını ezmez.
- **S1-C not / liste / bayrak (17 Eki 2026):** `question_notes`, `user_lists`,
  `user_list_items`, `quiz_answers.flagged` (migration 20261017120000, eklemeli).
  Yeni modül `lists` (`@Controller('me')`): `GET/PUT/DELETE /me/questions/:id/note`
  (metin ≤2000), `GET /me/questions/:id/lists`, `GET/POST /me/lists`,
  `GET/PATCH/DELETE /me/lists/:id`, `POST/DELETE /me/lists/:id/items/:questionId`.
  Sınırlar sunucuda, `plan.constants` tek kaynak: ücretsiz 3 liste × 50 soru
  (`LIST_LIMIT_REACHED` / `LIST_ITEM_LIMIT_REACHED`, 403), premium sınırsız; liste
  yanıtı `limits {maxLists, maxItemsPerList}` taşır. Sahiplik her işlemde userId ile —
  başkasının listesi 404. Tur: `POST /quiz/sessions {mode:'practice', listId}` (favori
  reçetesiyle aynı dal; kapsamsız, premium konu süzgeci aynı). Bayrak:
  `POST /quiz/sessions/:id/answers {flagged?}` — yalnız açıkça gönderilince değişir
  (cevap güncellemesi bayrağı silmez); `GET /exams/attempts/:id` review satırına
  `flagged` eklendi. Spec: `lists.service.spec.ts` (4), ilgili 60 test yeşil. Backfill
  gerekmez (boş başlar). İstemci tarafı F8'in işi. **Canlı doğrulama (17 Eki,
  main f4bf00a, geçici hesapla):** liste aç/ekle/tekrar ekle (count sabit)/detay/
  PATCH/sil, not PUT/GET/DELETE, 4. listede 403 `LIST_LIMIT_REACHED`, `listId` turu 2
  soru açtı, `flagged:true` cevap sonrası bayraksız yeniden cevapta bayrak KORUNDU
  (DB: flagged=true, yeni şık), `listId+topicId` 400; hesap `DELETE /me` ile silindi.
- **S1-D günlük süre + inceleme damgası (17 Eki 2026):** `users.daily_minutes`,
  `daily_usage.study_seconds`, `question_versions.last_reviewed_at` (migration
  20261017150000). `PATCH /me` ve `POST /me/onboarding` `dailyMinutes` (5–600, PATCH'te
  null temizler); `GET /me` ve `GET /me/dashboard.today` `dailyMinutes` + `studySeconds`
  döner. Süre tek yardımcıdan yazılır (`common/calisma-suresi.ts`, atomik upsert, kota
  sayaçlarına dokunmaz, hata yutulur): quiz cevabı `timeSpentMs` (cevap başına ≤10 dk,
  yeniden cevapta da eklenir), `POST /me/reading-progress` isteğe bağlı `seconds`
  (kayıt başına ≤30 dk). `lastReviewedAt`: panel yayına alma (tekil + toplu) ve
  taslağa iade yazar; tazeleme betikleri ileride aynı alanı yazar. Backfill yok. Spec
  `calisma-suresi.spec.ts` (2); ilgili 165 test yeşil.

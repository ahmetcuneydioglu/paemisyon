# Doc 50 — Denemeler V2: deneme merkezi, serbest/haftalık/kişisel deneme ve admin sihirbazı

Tarih: 24 Ekim 2026. Durum: **onay bekliyor** (tasarım 24 Eki'de onaylandı; bu belge uygulama planı).
Tasarım kaynağı: Figma "Paemisyon 2.0 — Nöbet" › sayfa **Denemeler V2**
(<https://www.figma.com/design/1YZRWO3azniW8NU5CvV1BZ?node-id=33-2>), dört section:
Mobil (Dark) · Mobil (Light) · Web (Dark) · Admin (Light). Genel görünüm görselleri bu klasörde.
Referans sözleşme: jsps `docs/design/2026-09-26-denemeler-v2-serbest-sozlesme.md` (serbest/takvimli
modeli, resmî/tekrar çözüm rolü, süre dolumu = teslim, soru iptali).

## 0. Karar özeti (24 Eki 2026, kullanıcı)

| Karar | Sonuç |
|---|---|
| Ekran yapısı | Tek "Denemeler" sekmesi, dört grup: **Denemeler (serbest)** · **Haftalık deneme (takvimli)** · **Bana özel** (Doc 46) · **Çıkmış sınavlar** (Doc 36). Üstte "şu an" hero'su: devam eden çözüm > sıradaki haftalık > sakin boşluk |
| Serbest deneme | Tarih bağımsız; aday istediği zaman çözer. Kişi başına **tek resmî çözüm** sıralamaya girer; sonraki çözümler **tekrar çözüm** (pratik), başında uyarı verilir |
| Haftalık deneme | Admin belirler (öneri: Pazar 21:00). **Açılışta başlar, sınav bitene kadar herkes girebilir.** Pencere kapanınca sıralama donar, deneme pratik çözüme iner (admin anahtarı) |
| Anlık geri bildirim | Resmî çözümde adayın şıkka basınca doğru/yanlış görmesi **admin panelde denemeye özel anahtarla** belirlenir. Tekrar çözümde her zaman açık |
| Sıralama | **İsimle** gösterilir; kendi sıran sabit kartta. Eşitlikte: net ↓, az yanlış, kısa süre, erken teslim; dördü eşitse ortak sıra (2, 2, 4). En az 10 resmî çözümle açılır |
| Premium çizgisi | JSPS'teki gibi. Ücretsiz: net, sıra, D/Y/B, ders dağılımı, cevap incelemesi. Premium: Türkiye kıyası, soru bazlı Türkiye oranı ve süre, net gelişim grafiği, kişisel deneme (mevcut Doc 46 hakkı). Ayrıca her denemeye **"Premium'a özel" bayrağı** panelden |
| Puan | **Net** = doğru − yanlış/4 (Doc 18 karar 3, mevcut motor). Boş etkilemez |
| Ders dağılımı | PAEM resmî tablosu, 8 ders: Genel Kültür ve Analitik Düşünme 30 · Polis Meslek Mevzuatı 10 · Ceza Muhakemesi 10 · Ceza Hukuku 10 · Anayasa 10 · İdare 10 · İnkılap Tarihi 10 · İnsan Hakları 10. "Bölüm" kavramı yok, her yerde ders adı |
| Süre | 150 dk (PAEM resmî). Admin değiştirebilir |
| Mobil | **Expo** (`apps/app`); Flutter'a dokunulmaz |
| Sıra | Figma ✅ → bu plan → API + veri → web → admin → mobil (Expo) → kapanış |

## 1. Bugünkü durum ve neden değişiyor

- `Exam` yalnız **randevulu**: `startAt + durationMinutes` penceresi; bitince `archiveOpenAfterEnd`
  ile arşiv çözümü (`QuizSession.archiveExamId`). Arşiv 6 Eyl 2026'da varsayılan kapatıldı çünkü
  aynı deneme tekrar yayınlanınca sorular sızıyordu. Serbest biçim yok.
- `QuizSession.examId` tekil (`@@unique([userId, examId])`): "tek katılım" burada. Tekrar çözüm
  için ayrı `archiveExamId` yolu açılmış; sonuç ekranı iki yolu ayrı ayrı ele alıyor
  (`exams.service.getAttempt`, `quiz.service.startArchiveExam`).
- Süre dolumu `@Cron('*/2 * * * *') finalizeExpiredAttempts` ile sırayla kapatılıyor (pooler dar);
  cevapta `EXAM_GRACE_SECONDS = 30` ağ payı var.
- `liveAnswerReveal` Exam'de var ama tasarımda karşılığı belirsizdi; artık admin anahtarı olarak
  tanımlı (bkz. §2).
- Kişisel deneme (Doc 46) `quiz.startSession({ mode:'exam', personalExam:true })` ile çalışıyor,
  `personalExam` sütunu ve günlük hak var. Konu payı Doc "kişisel deneme konu payı" (23 Eyl) kuralı.
- Web'de iki paralel yol var: `(dual)/denemeler` (eski merkez + SEO) ve `(app)/sinav/*` (oynatıcı,
  arşiv, kişisel). Expo'da `(tabs)/denemeler` F4'te ilk sürümüyle duruyor (liste, sıralama, çıkmış).
- Admin: `admin/exams` CRUD + autofill + publish/unpublish/archive + inceleme var; sihirbaz yok,
  yayın modu yok.

## 2. Veri modeli

Migration tek dosya: `20261027_denemeler_v2`. Geriye uyumlu: mevcut satırlar `publishMode='takvimli'`,
`attemptRole='official'` olur; davranış değişmez.

### 2.1 `Exam` (exams)

| Alan | Tip | Not |
|---|---|---|
| `publishMode` | enum `ExamPublishMode { serbest, takvimli }` default `takvimli` | Yeni sihirbaz yazar. Serbest: `startAt` = yayın anı (görünürlük başlangıcı), `endAt` NULL |
| `endAt` | `DateTime?` | Takvimlide `startAt + durationMinutes` yerine **açıkça** yazılır (pencere kapanışı, admin değiştirebilir). Serbestte NULL = süresiz; dolu ise "yeni çözüme kapanış" (arşiv tarihi) |
| `difficulty` | enum `ExamDifficulty { kolay, orta, zor }?` | Aday kartı rozeti |
| `liveAnswerReveal` | mevcut | Anlamı netleşir: **resmî çözümde anlık geri bildirim**. Tekrar çözümde her zaman açık |
| `practiceAfterEnd` | `Boolean default true` | `archiveOpenAfterEnd`'in yerini alır: pencere kapanınca "Pratik olarak çöz". Serbest denemede anlamsız (zaten tekrar çözüm var) |
| `remindEnabled` | `Boolean default true` | Takvimli: 1 gün ve 1 saat önce push + e-posta |
| `questionPackBuiltAt` | `DateTime?` | §5 yük planı: soru paketi önceden üretildi mi |
| `archiveOpenAfterEnd` | **kaldırılır** | Veri taşıma: `practiceAfterEnd = archiveOpenAfterEnd` |

### 2.2 `QuizSession` (quiz_sessions)

| Alan | Değişiklik |
|---|---|
| `attemptRole` | enum `AttemptRole { official, practice }?` — yalnız `mode='deneme'` oturumlarında dolu |
| `examId` | Artık **hem resmî hem tekrar** çözüm için dolu. `@@unique([userId, examId])` **kalkar**; yerine kısmi tekil indeks `(user_id, exam_id) WHERE attempt_role='official' AND status<>'abandoned'` (raw SQL, Prisma `@@unique` kısmi indeksi desteklemez) |
| `archiveExamId` | **kaldırılır**. Taşıma: `archiveExamId` dolu satırlar → `examId = archiveExamId, attemptRole='practice'` |
| `closedReason` | enum `SessionClosedReason { submitted, timeout }?` — sonuç ekranı "süre doldu" rozeti |
| `deadlineAt` | `DateTime?` — mutlak son tarih (sunucu saati). Serbest: `startedAt + duration`; takvimli: `min(startedAt + duration, exam.endAt)`. `plannedDurationSeconds` türetilebilir hâle gelir, uyumluluk için kalır |

Rol atama (sunucu): resmî çözümü yoksa (iptal edilmemiş) yeni oturum `official`, varsa `practice`.
Yarış: kısmi tekil indeks ikinci resmî oturumu reddeder → mevcut oturuma düşülür (bugünkü `catch`).

### 2.3 Yeni tablolar

- **`exam_rankings`** (donmuş sıralama): `exam_id, user_id, rank, score, wrong_count, duration_seconds,
  submitted_at, computed_at`. Takvimlide pencere kapanınca bir kez hesaplanır; serbestte canlı sorgu
  (`official` + `completed`), katılım 1.000'i geçince materialize edilir ve her yeni resmî teslimde
  o kullanıcının satırı eklenir (tam yeniden hesaplama gece cron'u). Sıralama cevabı her iki yolda
  aynı şekli döner.
- **`exam_question_adjustments`** (soru iptali): `exam_id, question_id, action { credit_all, exclude }`,
  `reason, actor_id, created_at, reverted_at`. Puanlama tek fonksiyonda (`scoreSession`) bu tabloyu
  okur; iptal sonrası etkilenen `official` oturumlar yeniden puanlanır, sıralama yeniden hesaplanır,
  adaya "Netin 58,25'ten 60,75'e çıktı" şeridi (QuizSession'a `scoreUpdatedAt`, `previousScore`).
- **`exam_reminders`** (hatırlatma kuyruğu): `exam_id, user_id, kind { day_before, hour_before, result_ready }, sent_at`.
  "Hatırlat" düğmesi kayıt açar; cron gönderir. Tekrar göndermeyi `sent_at` engeller.

### 2.4 Sonuç şekli (tek üretim noktası)

`exams.service.getAttempt` → `AttemptResult`:

```json
{ "attemptId": "…", "examId": "…", "title": "Genel Deneme 7", "role": "official", "publishMode": "serbest",
  "personal": false, "closedReason": "submitted", "startedAt": "…", "submittedAt": "…", "durationSeconds": 6480,
  "score": 61.75, "correct": 72, "wrong": 18, "blank": 10, "total": 100,
  "rank": { "available": true, "rank": 245, "total": 1203, "percentile": 20 },
  "courses": [ { "courseId": "…", "name": "Genel Kültür ve Analitik Düşünme", "total": 30, "correct": 21, "wrong": 6, "blank": 3 } ],
  "turkey": { "locked": false, "mean": 48.2, "median": 50.0, "minSample": 10, "sample": 1203 },
  "weakTopics": [ { "topicId": "…", "name": "Ceza Muhakemesi Hukuku", "wrong": 6, "blank": 2, "total": 10 } ],
  "scoreUpdate": { "from": 58.25, "to": 60.75, "at": "…" } | null,
  "resultLocked": false }
```

- Takvimlide pencere kapanana kadar `resultLocked: true`; yalnız `submittedAt`, cevaplanan/boş ve süre döner
  (Figma M4-d).
- `turkey` ve inceleme satırlarındaki `turkeyRate`/`avgSeconds` Premium değilse `locked: true` ve değerler NULL.
  Kilit **sunucudan** gelir; istemci hak hesaplamaz.
- `courses` sırası resmî tablo sırasıdır (sabit). Ders eşlemesi `ExamSection → ExamSectionCourse`
  üstünden; bölümsüz soru "Diğer" satırına düşer ve panelde uyarı üretir.

## 3. API sözleşmesi

Mevcut `/exams/*` korunur, şekiller genişler; `/quiz/sessions` cevap/bitirme yolu **aynen** kullanılır
(tek oynatıcı ilkesi). Yeni ve değişen uçlar:

| Uç | Değişiklik |
|---|---|
| `GET /exams` | Yeni alanlar: `publishMode, difficulty, endAt, state`, `my: { official: {attemptId,status,score,rank,total}, active: {attemptId, role, deadlineAt, answered}, practiceCount, lastPractice }`, `canStartOfficial, canStartPractice, participantCount` (resmî çözüm sayısı). `state`: `new · in_progress · completed · upcoming · closed`. Sıra: devam eden > yeni > tamamlanan > yaklaşan > kapanan. Çıkmış sınavlar dışarıda kalmaya devam eder |
| `POST /exams/:id/start` | Gövde `{ role?: 'official' \| 'practice' }`. Kurallar ve hata kodları: `EXAM_NOT_STARTED` (takvimli, açılış gelmedi), `EXAM_CLOSED` (serbest arşiv tarihi geçti / takvimli pencere kapandı ve `practiceAfterEnd=false`), `PREMIUM_REQUIRED`, `EXAM_ALREADY_TAKEN` → artık **hata değil**: `role='practice'` ile yeni oturum; istemci kurallar ekranında uyarır. `OFFICIAL_IN_PROGRESS` (resmî bitmeden tekrar istenirse). Cevap: `{ sessionId, role, resumed, deadlineAt, serverNow, liveAnswerReveal, questions, givenAnswers }`. `liveAnswerReveal = exam.liveAnswerReveal \|\| role==='practice'` |
| `POST /quiz/sessions/:id/answers` | Anlık geri bildirim açıkken cevap **kilitlenir**: aynı soruya ikinci gönderim `accepted:false, locked:true` + kayıtlı geri bildirim (çevrimdışı kuyruk güvenli). Kapalıyken bugünkü davranış (değiştirilebilir). `deadlineAt + 10 sn` sonrası gelen cevap oturumu `timeout` ile teslim eder |
| `POST /quiz/sessions/:id/complete` | `closedReason='submitted'`; `official` ise sıralama güncellenir (serbest canlı / takvimli bekler) |
| `GET /exams/attempts/:attemptId` | §2.4 şekli |
| `GET /exams/attempts/:attemptId/review` | Yeni: soru listesi `[ { no, questionId, course, topic, status: ok\|wrong\|blank, flagged, mine, correct, turkeyRate?, seconds, avgSeconds? } ]` + `majorityMissed` sayısı. Süzgeçler istemcide |
| `GET /exams/:id/leaderboard` | `{ available, reason?: 'min_sample'\|'result_pending', frozenAt?, participantCount, top[], me }`; satır `{ rank, name, score, wrong, durationSeconds }`. İsim: `User.displayName` yoksa "Ad S." kısaltması |
| `GET /exams/history/mine` | Yeni: resmî/tekrar/kişisel çözümler gruplu + `trend` (son 6 resmî net; Premium değilse `locked`) |
| `POST /exams/:id/remind` · `DELETE` | Hatırlatma kaydı |
| `GET /me/dashboard` | `personalExam` hakkı aynen; ek `activeAttempt` (hero için) |
| Admin `POST/PATCH /admin/exams/:id` | `publishMode, difficulty, endAt, liveAnswerReveal, practiceAfterEnd, remindEnabled, isPremium` |
| Admin `POST /admin/exams/:id/autofill` | Hedefler **ders bazlı** (8 satır); son 4 haftada yayınlanmış denemede çıkan sorular dışlanır; en az kullanılmış yayınlı soru önce; sonuç `{ selected, missing: [{course, need}] }` |
| Admin `POST /admin/exams/:id/publish` | Ön kontrol: 100 soru, dağılım eşleşmesi, açık hata bildirimi olan sorular (uyarı), takvimlide `endAt > startAt`. Yayınla → soru paketi üretimi planlanır |
| Admin `POST /admin/exams/:id/adjustments` (+ `/preview`) | Soru iptali: etki özeti ("1.203 adayın neti +0,25 artar") → uygula → yeniden puanla → sıralama → bildirim |
| Admin `GET /admin/exams/:id/stats` | Başlayan/tamamlayan/devam eden, ortalama ve medyan net, süre, puan dağılımı, soru analizi (doğru oranı, şık dağılımı, "anahtar şüpheli" işareti: doğru oranı < %25 ve tek yanlış şık > %50) |

Eski `archiveExamId` yolu (`quiz.startSession({archiveExamId})`) bir sürüm uyumluluk için
`role='practice'` çağrısına yönlendirilir, sonra kaldırılır (mobil Flutter sürümü arşiv kullanıyor;
mağazadaki kullanıcı bitene kadar yönlendirme kalır).

## 4. Ekranlar ve rota haritası

### 4.1 Web (`apps/web`)

| Figma | Rota | Not |
|---|---|---|
| W1 Deneme merkezi | `/denemeler` (`(dual)` kalır: girişsiz SEO liste, girişli merkez) | `ExamCenter` yeniden yazılır: hero + 4 grup + koç rayı. `exam-table`, `exam-banner` eski bileşenleri kalkar |
| M2 Kurallar | `/denemeler/[examId]/baslamadan-once` | Tam sayfa (sheet değil); `role` sorgu parametresi |
| W2 Oynatıcı | `/sinav/[examId]` (mevcut) | `ExamPlayer` güncellenir: anlık geri bildirim modu, kilit, soru haritası sol sütun, klavye kısayolları (A–E, ←/→, F). `/sinav/arsiv/*` kalkar |
| W3 Sonuç + inceleme | `/sonuc/[attemptId]` (mevcut) + `/sonuc/[attemptId]/inceleme` | Dört varyant tek bileşen (`role`, `personal`, `resultLocked`) |
| M6 Sıralama | `/siralama/[examId]` (mevcut, public) | İsimli tablo, "senin sıran", eşit sıra |
| M7 Kişisel | `/sinav/kisisel` (mevcut) | Uzunluk + havuz çipleri, 8 dersli dağılım |
| M8 Geçmiş | `/profil/denemelerim` (mevcut) → `/denemeler/gecmis` | Grafik + 3 grup |
| 768 | aynı rotalar | Tek sütun, ray alta |

### 4.2 Mobil Expo (`apps/app`)

| Figma | Rota |
|---|---|
| M1 | `(tabs)/denemeler/index` |
| M2 | `denemeler/[examId]/kurallar` (stack, tam ekran) |
| M3 | `seans` (mevcut oynatıcı, `mode=deneme`; soru haritası ve bitir sheet'leri) |
| M4 | `deneme-sonuc/[attemptId]` (mevcut) |
| M5 | `deneme-sonuc/[attemptId]/inceleme` + `…/soru/[no]` |
| M6 | `(tabs)/denemeler/siralama/[examId]` (mevcut) |
| M7 | `denemeler/kisisel` |
| M8 | `(tabs)/performans/denemelerim` (mevcut) |

Kit'e eklenecek bileşenler (`apps/app/src/components/domain`): `ExamCard` (5 durum), `ExamHero`
(3 durum), `RuleCard`, `CourseDistribution`, `ExamTimer`, `ExamMap`, `ResultSummary`,
`RankRow`, `TrendChart`. Galeri (`app/galeri.tsx`) güncellenir. Web'de aynı adlarla
`apps/web/src/components/exam/*`.

### 4.3 Admin (`apps/admin`)

`/exams` liste (sütunlar Figma A0), `/exams/new` ve `/exams/[id]/duzenle` **4 adımlı sihirbaz**
(Kimlik · Ayarlar · Sorular · Önizleme ve yayın), `/exams/[id]/istatistik` (soru iptali burada).
Mevcut `/exams/[id]/inceleme` istatistik sayfasına taşınır.

## 5. Haftalık deneme yük planı (Pazar 21:00)

Ölçülen sınırlar (bellek "deneme sınavı yük limitleri", 3 Eyl 2026): Supavisor 15 bağlantı prod ile
ortak, `connection_limit=5`, okuma p95 388 ms / 50 eşzamanlı; asıl risk bitişteki finalize dalgası.

1. **Soru paketi önceden üretilir**: yayınla → `questionPackBuiltAt`; paket (sürüm sabit, cevapsız)
   Redis yoksa `exam_question_packs` tablosunda JSON; `start` DB'ye yalnız oturum satırı yazar.
2. **Cevaplar toplu yazılır**: istemci cevapları 5 sn / 5 cevap tamponuyla `POST …/answers/batch`
   gönderir (anlık geri bildirim kapalıyken). Açıkken tek tek, çünkü cevap kilitleniyor.
3. **Teslim kuyruğu**: `complete` yalnız oturumu `completed` yapar ve puanı yazar (hafif);
   ilerleme/streak/rozet güncellemesi (`completeSession`'ın ağır kısmı) `exam_finalize_jobs`
   kuyruğuna düşer, dakikalık cron 50'şer işler. Sonuç ekranı puanı hemen gösterir.
4. **Pencere kapanışı**: `endAt`'te cron açık oturumları `timeout` ile teslim eder (10 sn ağ payı),
   sonra `exam_rankings` tek sorguyla hesaplanır (`RANK() OVER (ORDER BY score DESC, wrong_count,
   duration_seconds, submitted_at)`), `result_ready` bildirimi gider.
5. **Prova**: `apps/api/scripts/yuk-testi-deneme.ts` güncellenir (serbest + takvimli, 200 sanal aday);
   ilk haftalık denemeden önce staging'de çalıştırılır, p95 ve hata oranı plana yazılır.
6. **Throttler**: kullanıcı başına 300/dk yeterli (100 soru × 1 cevap + tampon). `trust proxy=2` açık.

## 6. Aşamalar

| Aşama | Kapsam | Kapanış ölçütü |
|---|---|---|
| **F0 Veri + motor** (API) | §2 migration ve taşıma betiği (`apps/api/scripts/denemeler-v2-tasima.ts`, `connection_limit=1`); rol atama; `deadlineAt`; `scoreSession` tek fonksiyon (net, ders dökümü, iptal); süre dolumu = teslim; cevap kilidi; sıralama (canlı + donmuş); geçmiş; hatırlatma kuyruğu; yük planı 1–4 | Birim testleri: rol atama yarışı, 10 sn ağ payı, eşitlik sırası, iptal yeniden puanlama, pencere kapanışı. Mevcut e2e'ler (`exams`, `quiz`) yeşil. Flutter uyumluluk yönlendirmesi doğrulanır |
| **F1 Web** | W1, M2, W2, W3, M6, M7, M8 rotaları; eski arşiv yolu ve `exam-table` kaldırılır; 768 | Gerçek veriyle beta hesabında tam tur (başla → çöz → teslim → sonuç → inceleme → sıralama → tekrar çöz); Lighthouse erişilebilirlik ≥ 95; koyu/açık tema |
| **F2 Admin** | Liste, sihirbaz 4 adım, ders bazlı autofill, yayın ön kontrolü, istatistik + soru iptali | Panelden serbest ve haftalık deneme oluşturulup yayınlanır; iptal önizlemesi doğru etkiyi söyler |
| **F3 Mobil (Expo)** | M1–M8, kit bileşenleri, galeri; derin bağlantılar (`paemisyon://denemeler/<id>`, bildirimden sonuç) | Simülatörde iPhone 17 ve SE, koyu/açık, AX büyük yazı; Figma aynası güncel; TestFlight 2.0.x |
| **F4 İlk haftalık deneme** | Yük provası (§5-5), panelden gerçek haftalık deneme, Pazar 21:00 canlı izleme, Pazartesi rapor | Hata oranı < %0,5, p95 < 800 ms, finalize kuyruğu 10 dk içinde boşalır |
| **F5 Kapanış** | Belgeler (`01-f0-*.md` … deploy notları), CLAUDE.md'ye "deneme" ilkesi, eski alanların silinmesi (`archiveExamId`, `archiveOpenAfterEnd`) | Flutter kullanıcı payı < %5 olunca uyumluluk yolu kaldırılır |

Her aşama ayrı dal, `main`'e tek kalem deploy (bellek "deploy tek kalem"). F0 bitmeden F1 başlamaz;
F1 ve F2 paralel gidebilir (farklı uygulamalar); F3 F1'in bileşen sözleşmesini kullanır.
Tahmin: F0 1 hafta · F1 1,5 hafta · F2 1 hafta · F3 2 hafta · F4 1 Pazar.

## 7. Açık kararlar (onayla birlikte)

1. **Kişisel denemede 25/50 soru payı**: resmî oranla ölçekleme (25'te GK 8, diğerleri 2–3; toplam
   25'e olasılıklı yuvarlama, 23 Eyl kuralı). Öneri: evet.
2. **Serbest denemede arşiv tarihi**: admin isteğe bağlı "yeni çözüme kapanış" girebilir; varsayılan
   süresiz. Öneri: alan var, varsayılan boş.
3. **Sıralamada isim biçimi**: tam ad mı, "Ahmet C." mi? Figma "Ahmet C." çizdi. Öneri: ad + soyadın
   ilk harfi; kullanıcı Ben › Gizlilik'ten "sıralamada rumuz" seçebilir (ileride).
4. **Haftalık deneme bitince pratik çözüm**: Pazar denemesinin soruları Pazartesi herkese açılır;
   bu, denemeyi ileride yeniden kullanmayı engeller. Öneri: kabul; haftalık deneme tek kullanımlık,
   soru havuzu bunu kaldırır (7.000+ yayınlı soru, haftada 100).
5. **Türkiye kıyası eşiği**: 10 resmî çözüm (jsps). Öneri: aynı.
6. **Flutter sürümüne dokunulmayacak**: eski uygulama `GET /exams` yeni alanları görmezden gelir,
   arşiv yolu yönlendirmeyle çalışır; haftalık deneme Flutter'da "randevulu" olarak görünür. Kabul mü?

## 8. Riskler

| Risk | Önlem |
|---|---|
| Serbest denemede soru sızıntısı (bitiren paylaşır, sonra giren sırayı şişirir) | Kabul edilen bedel; haftalık deneme "temiz ölçüm" olarak var. Hız anomalisi (100 soru < 15 dk, net > 90) sıralamada işaretlenir, panelde görünür |
| `@@unique(userId, examId)` kalkınca çift resmî oturum | Kısmi tekil indeks + yarışta mevcut oturuma düşme (bugünkü `catch` korunur) |
| Taşıma betiği arşiv oturumlarını yanlış role eşler | Önce sayım raporu (kaç `archiveExamId`, kaç `examId` oturum), prova yerelde, prod'da `connection_limit=1`, yedek JSON `docs/50-denemeler-v2/tasima-yedek-*.json` |
| Pazar 21:00 pooler tükenmesi | §5; ayrıca deneme saatinde script çalıştırılmaz (bellek "pooler dev limit") |
| Anlık geri bildirim açıkken cevap değiştirme | Sunucu kilidi (`locked`), istemci yalnız yansıtır |
| Ders eşlemesi eksik soru (bölümsüz) | Yayın ön kontrolü engeller; autofill yalnız eşlenmiş soru seçer |
| Kaynak etiketi sızıntısı | `AttemptResult` ve review şekli etiket taşımaz; yalnız admin uçları (CLAUDE.md kuralı) |

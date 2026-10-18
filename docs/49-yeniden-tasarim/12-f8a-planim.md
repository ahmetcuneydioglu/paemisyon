# Doc 49/12 — F8-A "Planım": geri sayımlı haftalık çalışma planı

Durum: **plan, onay bekliyor** (18 Eki 2026). Kaynaklar: `00-plan.md` F8 satırı (sıra: haftalık
plan → aralıklı tekrar → deneme serisi → mevzuat↔soru), `01-denetim.md` §4 satır 10 ("günlük süre
girdisi kullanılmıyor; haftalık plan yok; gün kaçırınca yeniden planlama yok"), `10-s1-veri-katmani.md`
§1.6 (`study_plans` / `study_plan_items` şeması ve `GET /me/plan` iskeleti canlıda), Doc 24 §11
(premium anı: "sana haftalık plan çıkarayım mı?"), Doc 24 §13 (üç soru), Doc 25 §3 (koç durum
makinesi: `exam_mode` son 30 gün, `taper` son 3 gün).

## 0. Amaç ve üç soru

Aday "bugün ne çalışayım" sorusunu her gün yeniden sormasın; sınava kalan haftalar, haftalık
ayırabildiği süre ve zayıf konuları tek bir takvime dönüşsün. Koç bugüne kadar **günü**
yönetiyordu (görev motoru); Planım **haftaları** yönetir ve günün görevine kaynak olur.

| Doc 24 §13 sorusu | Cevap |
|---|---|
| Net'ini artırıyor mu? | Süre, sınav ağırlığı ve zayıflığa göre dağıtılan konu hedefleri; sınava 30 gün kala yeni konu durur, tekrar/deneme ağırlık kazanır. |
| Her gün dönmesini sağlıyor mu? | Haftalık ilerleme halkası Bugün'de; eksik kalan hafta cezalandırılmadan sonraki haftalara yayılır (comeback diliyle). |
| Güvenini büyütüyor mu? | "Sınava kadar müfredatın %x'ini bitireceksin" cümlesi rakamla; plan koçun sözü, istemci kural bilmez (CLAUDE.md). |

## 1. Girdiler

- **Sınav tarihi:** `hedefSinavTarihi(kişisel, resmî)` (koçla aynı önceliklendirme). Tarih
  yoksa plan **12 haftalık yuvarlanan** ufukla kurulur ve ekranda "tarih girersen sınava göre
  ayarlarım" ucu durur.
- **Haftalık süre:** plan kurulurken kullanıcı seçer (1–14 saat/hafta, 30 dk adım); ön değer
  `User.dailyMinutes × 5` (onboarding'deki günlük dakika — S1-D), yoksa `dailyGoal`
  10/20/40 soru → 15/30/60 dk × 5. Böylece denetimde "kullanılmıyor" denen girdi işe koşulur.
- **Müfredat ve ağırlık:** hedef sınav türünün `ExamSection.weightPercent` → `ExamSectionCourse`
  → ders → yaprak konular (`Topic`, silinmemiş, yayımlı sorusu olan). Konu payı = ders payı ×
  (konunun yayımlı soru sayısı / dersin toplamı).
- **Kullanıcı durumu:** `UserTopicProgress` (çözülen, doğru, mastery), çözülmemiş yanlış sayısı,
  SRS `question_reviews` vadesi (varsa; S1-A canlıda).
- **Premium:** `isPremium` (bkz. §6 karar).

## 2. Üretim algoritması (saf fonksiyon, `plan.logic.ts`, birim testli)

1. **Ufuk:** `haftaBasi(bugün)`'den sınav haftasına kadar (üst sınır 26 hafta; tarih yoksa 12).
   Her hafta bir **evre** alır: `build` (sınava >30 gün), `exam_mode` (≤30 gün), `taper`
   (son 3 günü içeren hafta). Evre, haftanın son günüyle belirlenir.
2. **Haftalık bütçe:** `weeklyMinutes`. `exam_mode`'da %50'si tekrar+deneme kalemine ayrılır
   (`topicId` yerine `kind: 'review' | 'mock'`; şema için §4), `taper`'da bütçe yarıya iner ve
   yalnız tekrar kalır.
3. **Konu puanı:** `puan = bölümPayı × konuPayı × ihtiyaç`, `ihtiyaç = 1.6 − mastery`
   (hiç çözülmemiş konu `mastery=0` → 1.6; %90 ustalık → 0.7). Yanlış sayısı ≥5 olan konuya
   +%20. Puanlar normalize edilir; `build` evresinde toplam bütçe haftalara eşit, konular
   puan oranında dakika alır.
4. **Yerleştirme:** konular puan sırasıyla, **her hafta her bölümden en az bir konu** gelecek
   şekilde dönüşümlü dağıtılır (adayın haftası tek derse boğulmaz). Kalem alt sınırı 20 dk;
   altına düşen konular birleşik "karışık tekrar" kalemine girer. Bir konu, puanı büyükse
   iki haftada tekrar gelebilir (ilk geçiş + pekiştirme), üçüncü kez gelmez.
5. **Soru hedefi:** `targetQuestions = round5(targetMinutes / 1.0)` (ortalama cevap ~60 sn;
   `timeSpentMs` ortalaması kullanıcıda varsa onunla; 30–120 sn aralığına kırpılır).
6. **Çıktı:** `{ weeks: [{ weekStart, phase, items: [{topicId|kind, targetMinutes,
   targetQuestions}] }], coverage: { topics, pctOfSyllabus } }`. Deterministik: aynı girdi aynı
   plan (test edilebilirlik; rastgelelik yok).

## 3. İlerleme ve revizyon

- **Sayaçlar:** `QuizService.submitAnswer` (practice/daily/review/due modları) cevabın
  konusunu bulur; o haftanın eşleşen kalemine `doneQuestions += 1`, `doneMinutes +=
  min(timeSpent, 10 dk)`. Eşleşen kalem yoksa haftanın "serbest" sayaçlarına yazılır (plan
  özetinde "plan dışı 12 soru" dürüstçe görünür). Okuyucu ilerlemesi (`seconds`) kanun →
  konu eşlemesiyle `doneMinutes`'e. `exam_mode`'daki `review`/`mock` kalemleri sırasıyla
  SRS/yanlış turları ve deneme katılımıyla dolar.
- **Durum:** kalem `done` = soru VEYA dakika hedefinin ≥%100'ü; hafta geçince `pending`
  kalanlar `skipped` olur, **eksik dakika** sonraki haftaya %50 ile taşınır (tamamı
  taşınsaydı iki kaçırılan hafta üçüncüyü ezerdi).
- **Haftalık revizyon (cron, Pazartesi 03:00 TR, `connection_limit=1` kuralıyla ayrı
  işlem):** geçen haftayı kapatır, taze mastery ile **gelecek haftaları yeniden üretir**
  (geçmiş haftalar değişmez — kullanıcı tarihçesini görür). `revisedAt` güncellenir.
- **Anında revizyon:** sınav tarihi, haftalık süre veya hedef sınav türü değişince gelecek
  haftalar yeniden üretilir (`PATCH /me/plan`). 7+ gün hiç aktivite yoksa koçun `comeback`
  kartı planı da yumuşatır: bir sonraki haftanın bütçesi %60'a iner.

## 4. Veri ve uçlar

- **Şema eki (migration):** `study_plan_items.kind` enum `topic|review|mock` (varsayılan
  `topic`), `topic_id` NULL'a izin (review/mock için), `study_plans.exam_type_id`,
  `study_plans.horizon_weeks`; `study_plans.status` `active|archived` kalır. Geriye uyumlu,
  eklemeli (S1 kuralı).
- `GET /me/plan` (var) → zenginleşir: `plan.phase`, `plan.coverage`, `plan.thisWeek.summary
  { targetMinutes, doneMinutes, targetQuestions, doneQuestions, offPlanQuestions }`,
  `plan.weeks[]` (hafta özetleri), `plan.suggestions` (tarih yoksa "tarih gir").
- `POST /me/plan { weeklyMinutes, examDate? }` → aktif planı arşivler, yenisini üretir
  (idempotent değil; istemci onay sorar). `PATCH /me/plan { weeklyMinutes?, examDate? }`
  → gelecek haftaları yeniden üretir. `DELETE /me/plan` → arşivler.
- `POST /quiz/sessions { mode:'practice', topicId, planItemId }` → tur kalemden başlar;
  `planItemId` yalnız izleme amaçlı (sunucu konuyu kalemden doğrular).
- **Koç brief'i (eklemeli):** `plan: { exists, thisWeek: summary, nextItem: {topicName,
  remainingMinutes}, phase } | null`; yeni kart `plan_week` (hafta %x, "sıradaki: CMK 35 dk")
  ve plan yoksa `plan_offer` kartı (`slump_watch` ve `onboarding` sonrası; Doc 24 §11
  anı). Görev motoru (`computeTodayTask`) plan varsa önce bu haftanın en geride kalemini
  önerir (reçete değişmez, yalnız konu seçimi plandan gelir).
- Sunucu kuralı: istemciler evre/eşik bilmez; her metin ve yüzde brief'ten gelir.

## 5. İstemci

- **Expo (`apps/app`):** Bugün'e `PlanWeekCard` (halka + sıradaki kalem + "Planım" ucu);
  yeni rota `app/planim.tsx` (hafta şeridi `WeekDots`/`SegmentBar`, bu haftanın kalemleri
  `ListRow` + ilerleme, "başlat" → `seans`), `planim/kur.tsx` sheet (haftalık süre seçici
  `SegmentedControl`, tarih `Chip`, özet cümle "sınava kadar müfredatın %x'i"); Ayarlar'da
  "Planı yenile / kaldır". Onboarding sonunda "plan kurayım mı?" adımı (atlanabilir).
- **Web (`apps/web`):** `/bugun`'e aynı kart (kit: `Card`, `ProgressBar`, `ListRow`);
  `/planim` L2 sayfası (`PageIntro`, hafta tablosu `DataTable`, kalemler, kur/yenile
  `Dialog`). Kütüphane ana sayfasına "Planım" kapısı. Kaynak etiketi hiçbir yerde yok.
- Boş durumlar: plan yok (kur), tarih yok (yuvarlanan ufuk uyarısı), hafta bitti (özet +
  sonraki hafta), sınav geçti (plan arşivlenir, "yeni dönem" önerisi).

## 6. Açık kararlar (onayla birlikte)

1. **Premium sınırı.** Doc 24 §11 tablosu "zayıf konu planı"nı premiumda sayıyor. Öneri:
   plan kurma ve bu haftanın görünümü **herkese** (alışkanlık = her gün dönme); **gelecek
   haftalar, otomatik haftalık revizyon ve exam_mode tekrar/deneme kalemleri Premium**.
   Ücretsizde plan yalnız kurulduğu gün üretilir ve ileri haftalar bulanık/kilitli görünür.
2. **Haftanın başı Pazartesi (UTC gün)** — S1-E iskeletiyle aynı; vardiya düzeni (Doc 24 §13
   "vardiyaya duyarlı koç") bu belgede YOK, ayrı özellik.
3. **Deneme kalemi** canlı deneme takvimine bağlanmaz (F8-C deneme serisinde); şimdilik
   kişisel deneme sayılır.
4. **Cron yeri:** Railway'deki mevcut zamanlayıcı altyapısı (haftalık rapor cron'u gibi)
   kullanılır; yoksa `@nestjs/schedule`.

## 7. İş paketleri ve kapanış

| Paket | İş | Süre |
|---|---|---|
| P-A API | migration, `plan.logic.ts` (üretim/revizyon, 20+ birim testi), uçlar, `submitAnswer` + okuyucu kancaları, cron, koç kartları | 2 gün |
| P-B Expo | PlanWeekCard, `/planim`, kur sheet, onboarding adımı, Ayarlar | 1,5 gün |
| P-C Web | `/bugun` kartı, `/planim`, Kütüphane kapısı | 1 gün |
| P-D Doğrulama | geçici hesapla E2E (kur → tur → sayaç → hafta kapat → revizyon), beta hesabında gerçek plan, docs | 0,5 gün |

Kapanış ölçütü: beta hesabında (Lukas) gerçek tarihle plan kuruldu, bir tur plan kaleminden
başlayıp sayaç ilerledi, cron'la hafta kapanıp revizyon üretildi; Expo + web aynı brief'i
çiziyor; CLAUDE.md kuralları (kural sunucuda, kaynak etiketi yok, tokens/kit) ihlalsiz.
Dal: `claude/f8a-planim` (aynı worktree); push öncesi onay.

## 8. İlerleme

- **Onay (18 Eki 2026):** plan ve §6 önerileri (Premium sınırı dahil) olduğu gibi onaylandı.
  Dal `claude/f8a-planim`.
- **P-A API (18 Eki 2026, 9439d54):** migration `20261018120000_study_plan_kind_exam_type`
  (kalem türü `topic|review|mock`, `topic_id` NULL'a izin, `done_seconds` gerçek sayaç —
  `done_minutes` türetilmiş; `study_plans.exam_type_id`, `horizon_weeks`). `plan.logic.ts`
  saf: ufuk (tarih yoksa 12 hafta, tavan 26), evre haftanın son gününe göre, konu puanı =
  bölüm ağırlığı × bölüm içi soru payı × (1,6 − mastery) (+%20 ≥5 yanlış), 20 dk taban /
  90 dk tavan / konu en çok 2 hafta, bölüm dengeli yerleştirme, premium exam_mode %30 tekrar
  + %20 deneme, taper yarı bütçe; 12 birim testi. `PlanService`: `GET /me/plan` (haftalar
  `past|current|future`, ücretsizde gelecek haftalar kilitli ve kalemsiz, kapsam yüzdesi,
  plan dışı soru sayısı, sıradaki kalem = oransal en geride), `GET /me/plan/defaults`,
  `POST /me/plan` (önceki aktif plan arşivlenir; tarih `User.targetExamDate`'e de yazılır —
  tek kaynak), `PATCH /me/plan` (bu hafta dahil yeniden üretim, bu haftanın sayaçları
  devredilir), `DELETE /me/plan`. Kancalar: `submitAnswer` → mod'a göre kalem
  (practice/daily → konu, review → tekrar, exam/deneme → deneme) atomik SQL ile sayaç +
  `done` geçişi; okuyucu `POST /me/reading-progress` → kanunun konusu. Cron Pazartesi
  04:40 TR (uygulama haftası 04:00'te döner, mastery fotoğrafı 04:30): geçen hafta kapanır
  (`done`/`skipped`), premium planlar taşımayla yeniden üretilir, sınavı geçen plan
  arşivlenir. Koç: `CoachContext.plan` / `CoachBrief.plan` (kompakt özet), `plan_week`
  (öncelik 70, hedef dolunca 40, plan bitince yenileme daveti) ve `plan_offer` (plan yok +
  onboarding + ≥10 soru; tempo düşüşünde 55) kartları; `hedefSinavTarihi` döngüsüz
  `coach/hedef-sinav.ts`'e taşındı. API: 441 test yeşil, typecheck ve lint temiz.
  **E2E bekliyor:** yerel API (:3005) prod pooler'a bağlı; migration henüz uygulanmadı
  (`prisma migrate status`: 1 bekleyen). Betik hazır (`scratchpad/f8a-plan-e2e.mjs`:
  geçici hesap → onboarding → plan kur → kalemden tur → sayaç → okuma → koç → revizyon →
  arşiv → `DELETE /me`). Not: `todayTask`'ın plan kaleminden konu seçmesi P-A'da YAPILMADI
  (görev motoru spec'i geniş; P-B/P-C ile birlikte ele alınacak).
- **Migration prod'da + E2E (18 Eki 2026):** kullanıcı onayıyla `prisma migrate deploy`
  yerelden (`connection_limit=1`) koşuldu; 50/50 migration uygulandı. E2E (`:3005`, geçici
  hesap, PAEM, 300 dk/hafta, sınav +70 gün): plan 11 hafta (6 build, 4 exam_mode, 1 taper),
  bu hafta 5 kalem, ücretsizde gelecek haftalar kilitli; kalemden başlatılan practice turunda
  3 cevap (45 sn) → kalem `doneQuestions 3 / doneMinutes 2`; okuma 300 sn 201; koç brief'inde
  `plan` ve `plan_week` kartı; `PATCH 600` → bu hafta 590 dk hedef, 3 soru korundu;
  geçmiş tarih 400; arşiv → `{plan:null}`; `DELETE /me`. **Bulgu ve düzeltme:** ilk
  dağıtım kapsamı %32'de bırakıyordu (büyük konular tavana çarpıyor, artan bütçe boşa
  gidiyordu, küçük konular 20 dk tabanın altında düşüyordu) → **su doldurma** dağıtımı
  (`dakikaDagit`: tavanı aşan kırpılır ve artan yeniden dağıtılır, taban altı en düşük
  puandan düşer) + sığmayan parça en büyük boşluğa kırpılarak girer: gerçek müfredatta kapsam
  %50, hafta doluluğu %97–100; taşınan dakika sabit haftalık bütçenin içinden gelir.
  Haftalık revizyon cron'u stub Prisma ile 3 birim testiyle doğrulandı (kapanış, premium
  yeniden üretim + taşıma + `revisedAt`, sınavı geçen plan arşivi). Not: `nextItem`
  "oransal en geride" kuralıyla 3 cevaptan sonra başka konuya geçti — P-B/P-C'de
  "başlanmış ama bitmemiş kalem önce" tercihi değerlendirilecek.
- **P-B Expo (18 Eki 2026):** `features/plan/queries.ts` (tipler + `usePlan`, `usePlanDefaults`,
  `useCreatePlan/useRevisePlan/useArchivePlan`; mutasyonlar brief ve me'yi tazeler; evre/kalem
  başlığı/süre sözlükleri), `domain/PlanWeekCard` (Bugün: yüzde, evre rozeti, ilerleme, sıradaki
  kalem + Başla; plan yoksa sunucunun `plan_offer` kartı varsa davet), `app/planim.tsx` (başlık
  `useStackOptions`, bu hafta özeti + `StatTile` hafta/kapsam, hafta şeridi — geçmiş soluk /
  bu hafta vurgulu / kilitli haftalar kilit ikonlu —, seçili haftanın kalemleri ilerleme
  çubuğuyla, kilitli haftada Premium kapısı → `/paywall`, plan dışı soru notu, Plan kartı:
  süre/tarih/kapsam/yenileme, "Planı kaldır" onaylı; boş durum + kur; `?kur=1` sheet'i açar),
  `features/plan/plan-sheet.tsx` (kur/yenile: haftalık süre çipleri — mevcut/önerilen değer
  listede yoksa eklenir —, tarih GG.AA.YYYY ya da "belli değil", özet metinler), onboarding
  **4. adım** "Haftalık plan çıkarayım mı?" (varsayılan evet; `dailyMinutes` da gönderilir;
  plan kurulduktan sonra brief `refetchType: "all"` ile tazelenir — ilk açılışta kart eksik
  kalıyordu), Ayarlar › Hedef altında ve Kütüphane › Tekrar'da "Haftalık planım" girişi,
  kök Stack'te `planim`. API: `StartSessionDto.source` `plan` değerini kabul eder
  (`HomeSource`'a eklendi). Kalemden tur: konu → `seans` (`source: plan`, kalan soru 5–20),
  tekrar → `seans mode=review`, deneme → Denemeler sekmesi. **Göz testi (iPhone 17 sim,
  dev client + Metro :8082, yerel API :3005, geçici hesap):** onboarding 4 adım, Bugün plan
  kartı (açık/koyu), Planım (açık/koyu), yenile sheet'i (koyu), Kütüphane girişi; `source:
  plan` ile tur 201. Sim tuzakları: `text` eylemi panoya yazmıyor → `xcrun simctl pbcopy`
  + uzun basış "Yapıştır" (140 ms dokunuş); dev-launcher balonu "Atla"yı örter (sürüklenir);
  paste izni iletişim kutusu ilk seferde. Kalan: iPhone SE/16 Pro Max turu ve kullanıcının
  telefonunda beta turu (P-D), Ayarlar satırının ekran görüntüsü, `todayTask` plan kalemi
  tercihi (P-C ile).
- **P-C Web (18 Eki 2026):** `lib/public-api.ts` Plan tipleri (+ `CoachBrief.plan`),
  `lib/plan.ts` (evre/kalem/süre/tarih sözlükleri; kalemden tur bağlantısı: konu →
  `/seans?topicId&count=5–20&scope&n`, tekrar → `/seans?mode=review`, deneme → `/denemeler`),
  `components/plan/PlanWeekCard` (Bugün: hero'nun altında; plan yoksa sunucunun `plan_offer`
  kartı varsa davet → `/planim?kur=1`; `plan_week`/`plan_offer` koç kartları listeden
  süzülür, ikon haritasına `CalendarDays` eklendi), `components/plan/plan-dialog.tsx`
  (`PlanDialogButton` kur/yenile: süre çipleri + GG.AA.YYYY tarih + "belli değil";
  başarıda `autoOpen` ise `/planim`'e `replace`, değilse `refresh` — ikisi birden eski boş
  durumu gösteriyordu; `PlanArchiveButton` onaylı kaldırma), `(shell)/planim/page.tsx`
  (force-dynamic; boş durum + kur diyaloğu `?kur=1`'le açılır; başlıkta evre rozeti,
  yenile/kaldır; sınav tarihi yok / plan bitti uyarıları; "Bu hafta" kartı yüzde + çubuk +
  tür dökümü; hafta şeridi `?hafta=` bağlantılı — geçmiş soluk, kilitli kilit ikonlu —;
  seçili haftanın kalemleri `ListRow` (bu hafta ve bitmemişse tıklanır, sağda kalan/ilerleme);
  kilitli haftada Premium kapısı → `/premium`; sağ sütun `StatTile` hafta/kapsam + plan
  ayrıntıları). Navigasyon: Bugün altına "Haftalık plan" çocuk bağlantısı (`also: /planim`),
  Kütüphane'de ilk kapı "Haftalık planım" (`CalendarDays`; ızgara `lg:grid-cols-4`).
  **Doğrulama:** `tsc` 0, eslint 0, `tokens-check` 209 dosya/0 hata, vitest 80/80.
  **Göz testi (pane, :3012 → yerel API :3005, geçici hesap, koyu tema):** boş durum → kur
  (2 sa 30 dk) → Bugün kartı → Planım (masaüstü ve 375 px); yenile diyaloğu 5 sa → sayfa
  "5 sa / 300 soru" ile tazelendi; Kütüphane kapısı; mobilde yatay taşma vardı — kalem
  satırının sağ sütunu ve hafta şeridi (`min-w-0`) ile kapandı (`scrollWidth` = 375).
  Geçici hesap `DELETE /me` ile silindi (auth kaydı da gitti). Kalan: canlı doğrulama,
  `todayTask` plan kalemi tercihi ve `nextItem` "başlanmış önce" kuralı (P-D).
- **P-D Doğrulama (18 Eki 2026):** **Beta hesabı (Lukas, Chrome'da :3012 → yerel API :3005,
  prod DB):** `/planim?kur=1` varsayılanlarla kuruldu — 5 sa/hafta, hedef tarih 12.06.2027
  (hesaptaki gerçek tarih) → 26 hafta, kapsam %89 (59/66 konu), bu hafta 4 kalem, plan dışı
  30 soru. Genel Kültür kaleminden tur açıldı (`/seans?topicId…count=20`), 2 cevap → Planım
  "2 / 600 soru"; Bugün plan kartında "Sıradaki: Genel Kültür" (başlanmış önce). **Cron
  gerçek koşu** (`scripts/plan-revizyon-kos.ts`, connection_limit=1): kuru koşu 3 aktif plan
  gösterdi — ikisi SİLİNMİŞ geçici hesaplara aitti (hesap silme PII anonimleştirir, satırı
  silmez; plan aktif kalıyordu). Düzeltme: cron `user.status = deleted` planı arşivler,
  `deleteAccount` aktif planı arşivler (spec'ler güncellendi). Gerçek koşu: `{kapanan:0,
  yenilenen:0, arsivlenen:2}`. Ardından `--now=2026-10-19T02:00Z` (Pazartesi 05:00 TR)
  ile hafta kapanışı: `{kapanan:4}` — Planım'da 4 kalem "Geçti"; "Planı yenile" (PATCH)
  ile hafta yeniden üretildi, sayaçlar devredildi (2 soru korundu), "Son yenileme 18 Ekim".
  **Karar — sıradaki kalem:** başlanmış ama bitmemiş kalem önce gelir (ilerlemesi en yüksek
  olan); hiçbiri başlanmamışsa oransal en geride. Kalem sıralaması `id` ile kararlı hale
  getirildi (eşit hedefli kalemler her istekte yer değiştiriyordu). **Karar — Bugün
  görevi:** kullanıcı odak seçmediyse (koç) ve planın sıradaki kalemi KONU ise bugünün turu
  o konudan açılır ("Planında bu hafta: X. N dk kaldı."); seçilen odak plana baskındır;
  tekrar/deneme kalemleri Bugün'deki plan kartından başlar (4 yeni spec). API 449 test.
  **Simülatör turu (iPhone SE 3. nesil 375×667 ve iPhone 17 Pro Max 440×956 — 16 Pro Max
  kurulu değil; geçici hesap, dev client + Metro :8082 → :3005):** giriş, Kütüphane,
  `/planim?kur=1` sheet (SE'de sığıyor, buton sabit), plan kur, Planım (hafta şeridi,
  kalemler, Plan kartı, kaldır onayı), Bugün plan kartı (iki boyda), kaldır → boş durum.
  **Bulgu + düzeltme:** başka cihazda kurulan plan uygulamayı öne alınca görünmüyordu —
  React Native'de React Query'nin odak yöneticisi bağlı değildi; `lib/query.ts` AppState'i
  `focusManager`'a bağladı (staleTime 30 sn sonrası ön plana dönüşte tazeleme). Doğrulandı:
  Pro Max arka planda, SE'de plan kaldırıldı, Pro Max öne alınınca kart kalktı.
  **Bulgu (kapsam dışı, not):** SE'de giriş ekranı e-posta alanı uzun adreste satır
  kırıyor ve kutunun dışına taşıyor (`TextField`/login, F8-A dışı). Kalan: kullanıcının
  telefonunda beta turu, Figma aynası, `kosullar` §5 kararı. Geçici hesaplar `DELETE /me`
  ile silindi; Lukas'ın planı gerçek tarihle duruyor.
- **Deploy (18 Eki 2026, 20:19 TR):** `claude/f8a-planim` tek push'la `origin/main`'e
  (e24d87c → 5532efd, 8 commit: P-A–P-D + 8e8d1f2 docs). CI 5532efd yeşil. Railway API
  birkaç dakikada yeni rotaları servis etti (`/me/plan` 401, bilinmeyen rota 404 —
  yani rota var). Vercel `dpl_G3Ep1cVF…` READY (fra1, build 41 sn). Canlı: Lukas'ın
  hesabıyla `www.paemisyon.com/planim` gerçek planı çizdi (26 hafta, %89 kapsam, 2/600
  soru, "Son yenileme 18 Ekim"). Mobil tarafı (Expo) sonraki beta build'iyle gider.
- **Kalanlar turu (18 Eki 2026, akşam):** SE giriş alanı bulgusu kapandı — kök neden
  `TextField`'daki `type.body` `lineHeight` paragraf stili: iOS'ta alan odak dışına çıkınca
  uzun tek satır metin sarıp kutunun dışına taşıyordu; `multiline={false}` /
  `numberOfLines={1}` çare olmadı, `lineHeight: undefined` ile metin tek satırda üç noktayla
  kesiliyor (SE'de doğrulandı). Mobil beta build (EAS production, iOS) Claude tarafından
  BAŞLATILAMADI (otomatik mod sınıflandırıcısı production deploy'u reddetti) — komut
  kullanıcıya bırakıldı. Figma aynası: Figma MCP yetkisi yok, bekliyor.
- **Figma aynası + beta build (19 Eki 2026):** "Paemisyon 2.0 — Nöbet" dosyasına
  **F8-A — Planım** sayfası eklendi (Plugin API, kit'ten): Bugün / Plan kartı (F3 Bugün
  kopyası + `PlanWeekCard`: etiket + evre rozeti, yüzde, ilerleme, sıradaki kalem + Başla;
  görev kartı plan diliyle "Planında bu hafta: …"), Planım / Ana (başlık + evre rozeti, Bu
  hafta kartı + `stat`, Hafta/Kapsam `StatTile`, Planı yenile, hafta şeridi — geçmiş soluk,
  seçili `accentSoft`, kilitli haftalar kilit ikonlu —, kalem listesi sağda kalan/ilerleme ya
  da Tamam rozeti, Plan ayrıntıları, Planı kaldır), Planım / Kur sheet (scrim + `radius/sheet`
  sheet, süre çipleri, tarih alanı, Planı kur), Planım / Boş durum. Hepsi Nöbet değişkenlerine
  ve metin stillerine bağlı; açık tema koleksiyon modu. Düğüm kimlikleri scratchpad
  `figma-nobet-state.json` (`f8aScreens`). **Beta:** EAS iOS production build 2.0.0 (4)
  (58500d1) FINISHED; TestFlight gönderimi (`eas submit`) de otomatik modda reddedildi — komut
  kullanıcıda.

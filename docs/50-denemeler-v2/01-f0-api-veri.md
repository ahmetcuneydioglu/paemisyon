# Doc 50 / 01 — F0: Veri modeli ve deneme motoru (API)

Tarih: 24 Ekim 2026. Dal `claude/denemeler-v2-f0`. Plan: `00-plan.md` §2, §3, §5, §6 F0.
Durum: **kod hazır, deploy bekliyor** (migration canlıya `prisma migrate deploy` ile Railway
başlangıcında uygulanır; öncesinde §5'teki sayım betiği çalıştırılır).

## 1. Ne değişti

### Veri (`20261027090000_denemeler_v2`, eklemeli + veri taşıma)

| Nesne | Değişiklik |
|---|---|
| `exams` | `publish_mode` (serbest/takvimli, varsayılan takvimli), `end_at` (takvimlide açıkça; eski kayıtlara `start_at + süre` yazıldı), `difficulty`, `exam_type_id` (tek aktif sınav türü varsa otomatik bağlandı), `practice_after_end` (eski `archive_open_after_end`'in yerine, değeri taşındı), `remind_enabled`, `question_pack` + `question_pack_built_at` (yayında üretilen cevapsız paket), `rankings_computed_at` |
| `quiz_sessions` | `attempt_role` (official/practice), `closed_reason` (submitted/timeout), `deadline_at`, `previous_score` + `score_updated_at` (iptal izi). Tam tekil anahtar `(user_id, exam_id)` KALKTI; yerine kısmi tekil indeks `quiz_sessions_official_once` (yalnız resmî, terk edilmemiş çözüm). Mevcut canlı katılımlar `official`, tamamlananlar `submitted` |
| Deneme arşiv oturumları | `archive_exam_id` dolu ve çıkmış sınav OLMAYAN oturumlar → `exam_id` + `attempt_role='practice'`, `mode='deneme'`, puan yüzdeden **net**'e çevrildi. Çıkmış sınav (Doc 36) oturumları `archive_exam_id`'de KALDI |
| Yeni tablolar | `exam_rankings` (donmuş sıralama), `exam_question_adjustments` (soru iptali), `exam_reminders` (hatırlatma kuyruğu), `exam_finalize_jobs` (teslim sonrası ağır iş kuyruğu) |

**Plandan sapma:** `archiveExamId` kaldırılmadı. Çıkmış sınavlar (Doc 36) bu alanla çalışıyor
(`cikmis-sinav.service`, koç, admin); onların ürünü tekrarlanabilir çözümdür ve denemeyle
karışmaz. Denemelerde alan kullanılmaz; eski Flutter'ın gönderdiği `archiveExamId` istekleri
çıkmış sınav değilse `/exams/:id/start` (`role=practice`) yoluna yönlendirilir ve eski cevap
şekline çevrilir (`quiz.service.startArchiveExam`).

### Motor

- **Puanlama tek fonksiyon:** `exams/exam-scoring.logic.ts › scoreAttempt` — net = (doğru +
  herkese-doğru) − yanlış/4; `exclude` toplamı düşürür; değişmez
  `correct + wrong + blank + creditAll + excluded = total`. `quiz.completeSession` denemede bunu
  kullanır (`scoreDeneme`); soru iptali sonrası yeniden puanlama da aynı fonksiyondan.
- **Durum makinesi:** `exams/exam-state.logic.ts` — erişilebilirlik (upcoming/open/closed),
  aday durumu (new/in_progress/completed), `canStartOfficial/Practice`, `deadlineFor`
  (takvimli resmî çözüm pencere kapanışıyla sınırlı, en az 60 sn), `resultLocked`
  (takvimli resmî sonuç pencere kapanana kadar kilitli), liste sırası.
- **Süre:** mutlak `deadlineAt`; ağ payı **10 sn** (eskiden 30). Payı aşan cevap oturumu
  `timeout` ile TESLİM eder ve `403 EXAM_TIME_OVER { attemptId }` döner (eski istemci kodu
  aynı). Teslim anı son tarihtir. Dakikalık cron süresi dolan oturumları teslim eder.
- **Anlık geri bildirim:** resmî çözümde `exam.liveAnswerReveal` (admin anahtarı), tekrar
  çözümde her zaman. Açıkken **ilk cevap kilitlenir**: ikinci gönderim `accepted:false,
  locked:true, duplicate` + kayıtlı geri bildirim (çevrimdışı kuyruk güvenli).
- **Teslim kuyruğu (§5-3):** denemede `completeSession` yalnız puanı yazar ve
  `exam_finalize_jobs`'a satır atar; `ExamFinalizeJobService` dakikada 50 işi sırayla işler
  (ilerleme, seri, yanlış defteri, rozet). Sonuç ekranı puanı anında görür; rozet kutlaması
  denemede sonraki tura kalır.
- **Toplu cevap (§5-2):** `POST /quiz/sessions/:id/answers/batch` (≤25) — geri bildirim
  kapalı denemede istemci tamponlar.
- **Soru paketi (§5-1):** yayında `Exam.questionPack` üretilir; `start` DB'ye yalnız oturum
  satırı yazar.
- **Sıralama:** serbest canlı (`rankWithTies`: net ↓, az yanlış, kısa süre, erken teslim;
  tam eşitlik ortak sıra 2,2,4); takvimli pencere kapanınca `closeWindows` cron'u tek
  sorguyla `exam_rankings`'e dondurur ve katılanlara "sonucun açıklandı" push'u gönderir.
  Yalnız son 7 günde kapanan pencereler dondurulur (eski denemeler canlı sorgudan okunur,
  kimseye eski bildirim gitmez). En az 10 resmî çözümle açılır; isim "Ahmet C." biçiminde.
- **Hatırlatma:** `POST /exams/:id/remind {on}` → `day_before` + `hour_before` satırları;
  5 dakikalık cron push gönderir (e-posta F1'de).

## 2. API sözleşmesi (uygulanan)

| Uç | Şekil |
|---|---|
| `GET /exams` | Eski alanlar korunur (`state` upcoming/active/ended, `myAttempt`, `myArchiveAttempt`=en iyi tekrar). Yeni: `publishMode, difficulty, examTypeId, liveAnswerReveal, practiceAfterEnd, availability, myState, canStartOfficial, canStartPractice, my {official{attemptId,status,resultLocked,score,correct,wrong,blank,rank,total}, active{attemptId,role,deadlineAt,answered}, practiceCount, lastPractice}`. Sıra: devam eden > yeni > tamamlanan > yaklaşan > kapanan. `participantCount` = resmî tamamlanan |
| `POST /exams/:id/start` `{role?}` | `role` yoksa resmî istenir; resmî varsa `409 EXAM_ALREADY_TAKEN {attemptId, canStartPractice}` (eski istemci uyumu). `role=practice`: resmî bitmeden `409 OFFICIAL_IN_PROGRESS`, resmî yokken `409 OFFICIAL_FIRST`, kapanmış denemede `409 EXAM_CLOSED`. Cevap: eski alanlar + `role, resumed, publishMode, deadlineAt, serverNow, plannedDurationSeconds, remainingSeconds`; `liveAnswerReveal` etkili değer |
| `POST /quiz/sessions/:id/answers` | `{accepted, locked, duplicate?, recorded, isCorrect?, selectedOptionId?, correctOptionId?, explanation?…}` |
| `POST /quiz/sessions/:id/answers/batch` | `{answers:[…]}` → `{accepted, results[], timeOver}` |
| `GET /exams/attempts/:id` | Eski alanlar + `role, publishMode, personal, closedReason, resultLocked, resultAt, rank{available,rank,total,percentile,reason}, courses[] (ExamSection sırası, bölümsüz "Diğer"), turkey{locked,sample,mean,median,diff}, weakTopics, scoreUpdate`. Kilitliyken yalnız cevaplanan/boş/süre |
| `GET /exams/attempts/:id/review` | `{locked, majorityMissed, items[{no, course, topic, status, flagged, selectedOptionId, correctOptionId, seconds, turkeyRate, avgSeconds, missedMajority, adjustment}]}` — Türkiye alanları Premium |
| `GET /exams/:id/leaderboard` | `{available, reason: result_pending\|min_sample, endAt, frozenAt, participantCount, top[{rank,name,displayName,score,wrongCount,durationSeconds,isMe}], me{…,percentile}}` |
| `GET /exams/history/mine` | `{trend{locked,points,mean,best,delta}, denemeler[], haftalik[], kisisel[]}` |
| `GET/POST /exams/:id/remind` | `{reminding}` |
| Admin `POST/PATCH /admin/exams` | + `publishMode, endAt, difficulty, examTypeId, practiceAfterEnd, remindEnabled` (eski `archiveOpenAfterEnd` kabul edilir) |
| Admin `GET /admin/exams/:id/publish-check` | `{ok, blockers[], warnings[], questionCount, distribution[]}`; `publish` engel varsa `400 PUBLISH_BLOCKED` |
| Admin `POST /admin/exams/:id/autofill` | + `onlyMissing`; son 4 haftada yayınlanan denemede çıkan sorular dışlanır; `autofill.missing[]` |
| Admin `GET …/stats`, `GET/POST …/adjustments`, `POST …/adjustments/preview`, `POST …/adjustments/:id/revert` | İstatistik (özet, net dağılımı, soru analizi, anahtar şüpheli), soru iptali önizleme/uygula/geri al |

## 3. Doğrulama

- `jest`: 46 dosya / 475 test (yeni `exam-scoring.logic.spec.ts`: net, iptal, eşitlik sırası,
  durum makinesi, son tarih, ağ payı, sonuç kilidi — 18 test). `quiz.service.spec` ModuleRef
  stub'ıyla güncellendi.
- `tsc --noEmit` temiz (yalnız yerelde `@sentry/nestjs` paketi eksik — main'de de aynı, bu işten
  bağımsız). `eslint` + `prettier` temiz.
- `prisma validate` + `prisma generate` tamam.
- Canlı DB'ye YAZILMADI. Salt okunur sayım betiği (§5) 24 Eki 2026 03:20'de çalıştırıldı:

| Sayım | Değer |
|---|---|
| Deneme (çıkmış sınav hariç) | 4 (3 yayında) |
| Çıkmış sınav motor kaydı | 3 |
| Resmî katılım (exam_id dolu) | 33, yarım 0, çift kayıt 0 |
| Arşiv oturumu | 481: **39 deneme → tekrar çözüme taşınacak** (hepsi tamamlanmış), 442 çıkmış sınav (yerinde kalır) |
| Aktif sınav türü | 2 → `exam_type_id` otomatik atanmaz; panelden seçilir (sonuçta ders dağılımı o zamana kadar kullanıcının hedef sınavından okunur) |

Yedek: `tasima-yedek-2026-10-24.json` (taşınacak 39 oturumun tam satırları).

## 4. Eski istemci uyumu (Flutter mağaza sürümü)

- Liste: `state/myAttempt/myArchiveAttempt/archiveOpenAfterEnd` aynen; yeni alanlar görmezden gelinir.
- Başlatma: gövdesiz `start` resmî çözüm; tamamlanmışsa `EXAM_ALREADY_TAKEN` (eski kod).
- Arşiv: `quiz.startSession({archiveExamId})` deneme için tekrar çözüme yönlendirilir; çıkmış
  sınav için eski yol aynen.
- Cevap: `recorded:true` korunur, ek alanlar eklenir. Süre dolumu `403 EXAM_TIME_OVER` aynen.

## 5. Deploy adımları

1. `apps/api`: `DATABASE_URL="…&connection_limit=1" npx tsx scripts/denemeler-v2-oncesi-sayim.ts`
   → sayım + `docs/50-denemeler-v2/tasima-yedek-<tarih>.json` (dokunulacak oturumların yedeği).
2. Backend durdurma gerekmiyor (eklemeli migration; `UPDATE`'ler küçük). Yine de Pazar
   21:00 gibi deneme saatinde deploy edilmez.
3. Dalı `origin/main`'e push (deploy = push; bellek "deploy tek kalem": diğer oturumların
   bekleyen commit'leri önce taranır).
4. Canlıda: `GET /exams` yeni alanları döndürüyor mu; eski bir deneme için `GET
   /exams/:id/leaderboard` canlı sorgudan okunuyor mu; cron günlükleri ("Süresi dolan oturum
   teslim edildi", "Deneme teslim işi").

## 6. Dışarıda bırakılanlar (F1+)

- Hatırlatma e-postası (yalnız push).
- Serbest denemede 1.000+ katılımda sıralama materializasyonu (canlı sorgu yeterli; plan §2.3).
- Yük provası betiği güncellemesi (`yuk-testi-deneme.ts`) F4'te.

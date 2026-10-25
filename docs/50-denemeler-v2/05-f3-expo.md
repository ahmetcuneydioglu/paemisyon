# Doc 50 / 05 — F3: Expo deneme ekranları (M1–M8)

Tarih: 26 Ekim 2026. Dal `claude/denemeler-v2-f0`. Plan: `00-plan.md` §4.4, §6 F3. Figma Mobil
Dark/Light bölümleri (M1–M8). Sunucu: F0 canlıda; istemci yalnız sunucunun verdiği durumu çizer,
kural bilmez (koç kuralı gibi).

## 1. Ne değişti (`apps/app`)

| Figma | Rota | Dosya | Not |
|---|---|---|---|
| M1 Merkez | `(tabs)/denemeler` | `app/(tabs)/denemeler/index.tsx` | Hero üç halde: devam eden çözüm (kalan süre, "Devam et"), sıradaki haftalık (gün/saat sayacı, hatırlat anahtarı, pencere açıkken "Katıl"), sakin hero. Gruplar: Serbest · Haftalık (listOrder sunucudan) · Bana özel kartı · Çıkmış sınavlar · "Deneme geçmişin" satırı |
| Kart | — | `src/components/domain/exam.tsx › ExamCard` | `examCardModel` (`features/exams/queries.ts`) kart metnini/eylemini türetir: başla · devam et · sonucu gör · tekrar çöz · pencere kapandı · Premium. Haftalıkta tarih rozeti, katılımcı ve ortalama net |
| M2 Kurallar | `denemeler/[examId]/kurallar?role=` | `app/(tabs)/denemeler/[examId]/kurallar.tsx` | Tam ekran. Üstte belirgin uyarı kartları (`RuleCard`): tek resmî hak, süre durmaz, anlık geri bildirim açık/kapalı, pencere sonu. 8 dersli dağılım tablosu (`detail.distribution`), haftalıkta hatırlatma düğmesi, "Başla" → `/seans?exam=&role=` |
| M3 Oynatıcı | `seans?exam=&role=` | `app/seans.tsx` | `role` gövdeyle `POST /exams/:id/start`; teslim sınırı `deadlineAt` (pencere sonuyla kesişim). `liveAnswerReveal` true ise şıkka dokununca sunucu anahtarı geri döner: `FeedbackPanel` açılır, ilk cevap kilitlenir, ilerleme alt çubuktan. Kodlar: `EXAM_ALREADY_TAKEN{attemptId}` → doğrudan sonuç; `OFFICIAL_FIRST`, `OFFICIAL_IN_PROGRESS`, `EXAM_CLOSED` metinli hata |
| M4 Sonuç | `deneme-sonuc/[attemptId]` | `app/deneme-sonuc/[attemptId].tsx` | Dört varyant: resmî (sıra cümlesi + yüzdelik, Türkiye kıyası Premium), tekrar çözüm (sırasız notu), kişisel, haftalık **sonuç bekliyor** (kilit kartı + cevaplanan/boş/süre). Net = doğru − yanlış/4 (`fmtNet`), 8 dersli `CourseBreakdown`, çalışılacak konular → alıştırma, `scoreUpdate` şeridi ("netin güncellendi"), süre doldu notu |
| M5 İnceleme | aynı ekran, alt bölüm | — | `useAttemptReview`; süzgeç çipleri Tümü / Yanlış / Boş / İşaretli / Çoğunluk bildi (Premium); satır açılınca kök + şıklar (`QuestionOption` doğru/kaçırılan/yanlış), açıklama, Türkiye oranı ve süre (`locked` ise kilit metni), favori + hata bildir. **Kaynak etiketi okunmaz.** |
| M6 Sıralama | `(tabs)/denemeler/siralama/[examId]` | `siralama/[examId].tsx` | "Senin sıran" sabit panel (ad, net, yanlış, süre, ilk %), isimli tablo (`RankRow`), donma tarihi / "katılımla güncellenir", `reason` min_sample ve result_pending boş durumları |
| M7 Kişisel | `(tabs)/denemeler/kisisel` | `kisisel.tsx` | Uzunluk çipleri 25/50/100 (tavan `personalExam.maxQuestions`, üstü Premium kilidi), 8 dersli dağılım açıklaması, süre bilgisi, devam eden deneme varken engel, günlük hak metni. Havuz anahtarı sunucu desteğiyle sonra |
| M8 Geçmiş | `(tabs)/performans/denemelerim` | `denemelerim.tsx` | `useExamHistory`: `TrendChart` (react-native-svg; Premium kilidi), üç grup Denemeler · Haftalık · Bana özel; satırda net, sıra, rol, süre doldu |
| Kit | — | `src/components/domain/exam.tsx` | `ExamCard`, `RuleCard`, `CourseBreakdown`, `TrendChart`, `RankRow` — token'lı, `accessibilityLabel`'lı, 44pt hedef |

`src/features/exams/queries.ts` baştan yazıldı: Doc 50 tipleri (`ExamListItem.my{official,active,
practiceCount}`, `availability`, `myState`, `ExamStartResponse{role,deadlineAt,liveAnswerReveal}`,
`AttemptDetail{resultLocked,rank,turkey,courses,weakTopics,scoreUpdate}`, `AttemptReview`,
`ExamLeaderboard{reason,frozenAt,percentile}`, `ExamHistory`), kancalar (`useExam`,
`useExamHistory`, `useAttemptReview`, `useReminder/useSetReminder`), biçimleyiciler (`fmtNet`,
`fmtDuration`, `rankSentence`) ve saf `examCardModel`/`heroFor` (web `exam-ui.ts` ile aynı sözleşme).

## 2. Plandan / Figma'dan sapmalar

- M5 ayrı rota (`…/inceleme`, `…/soru/[no]`) yerine sonuç ekranının altında açılır-kapanır liste:
  tek ekranda süzgeç + ayrıntı, sayfa geçişi yok. Web'deki `review-table` ile aynı veri.
- M3'te soru haritası ve bitir onayı mevcut oynatıcının `ExamGrid` + `Alert` yapısıyla kaldı
  (Figma'daki sheet derisi F10'da zaten vardı).
- Derin bağlantılar (`paemisyon://denemeler/<id>`, bildirimden sonuç) bu turda eklenmedi; mevcut
  `app.config.ts` şeması değişmedi. Bildirim yönlendirmesi F4 (ilk haftalık prova) ile birlikte.
- Kişisel denemede "yanlışlarımdan" havuz anahtarı sunucuda yok; ekranda gösterilmiyor.

## 3. Doğrulama

- `npm run typecheck` ve `npm run lint` temiz (`apps/app`, `npm ci` ile kilit dosyası değişmeden).
  API: `jest src/modules/exams src/modules/quiz` 79/79; `nest build` yalnız yerelde eksik Sentry
  paketinden düşüyor (bilinen, main'de aynı).
- Simülatör iPhone 17, canlı API (api.paemisyon.com), beta hesabı: M1 → sonuç (M4) → inceleme
  satırı açılır (M5) → sıralama (M6) → Tekrar çöz → kurallar (M2) → oynatıcı (M3, anlık geri
  bildirim: yanlış/doğru şık + açıklama + madde) → çık → merkezde "Devam ediyor · tekrar çözüm"
  hero'su → kişisel (M7, devam eden deneme engeli) → Denemelerim (M8).

## 4. Simülatörde bulunup düzeltilenler

| Bulgu | Düzeltme |
|---|---|
| Simülatördeki dev client eskiydi: `RNShare` native modülü yok (F10-P sonrası) | `expo run:ios` ile yeniden derlendi (~8 dk; `ios/` gitignore'da) |
| Sıralama tablosunda başlık ile ilk satır arasında boşluk | `Card` varsayılan `gap`'i sıfırlandı (sonuç inceleme kartı da) |
| 19/21 için "ilk %95" anlamsız | yüzdelik yalnız ≤ %50 iken gösterilir (sonuç + sıralama) |
| "1 sa 28 dk" süre sütunda sarıyor | tabloda `fmtDurationCompact` ("88 dk"), sütun 64pt |
| Canlı geri bildirim panelinin altında boş ayraç | `FeedbackPanel` araç satırını `tools` boşken çizmez |
| Oynatıcıdan çıkış `GO_BACK` hatası (kurallar `replace` ile açıyor, geçmiş yok) | `leave()`: `canGoBack` değilse Denemeler sekmesine `replace` |
| Denemelerim'de sırası belli denemelerde "sıralama bekliyor" | **API** (`exams.service.ts › history`): sıra yalnız dondurulmuş tablodan geliyordu; artık dondurulmamış denemeler için lider tablosuyla aynı canlı hesap (en az 10 örnek kuralı ortak). Deploy ile canlıya çıkar |

Not: beta hesabında isimler kullanıcı adı olarak görünüyor (`rankingName` ad yoksa `displayName`'e düşer); web ile aynı.

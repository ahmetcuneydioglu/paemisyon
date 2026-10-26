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
| M3 Oynatıcı | `seans?exam=&role=` | `app/seans.tsx` + `domain/exam.tsx › ExamTopBar/ExamActionBar/ExamFeedbackBox/ExamMapSheet/ExamSubmitSheet` | Figma derisi birebir: üst çubuk (✕ · ad + "34 / 100" → soru haritası · ⏱ süre, son 5 dk uyarı tonu + şerit), 3 pt ilerleme, "SORU N" + ders rozeti, Inter kök, alt çubuk bayrak · Önceki · Sonraki (son soruda "Bitir"). `role` gövdeyle `POST /exams/:id/start`; teslim sınırı `deadlineAt`. `liveAnswerReveal` true ise şık dokunuşunda sunucu anahtarı: "✓ Doğru cevap C" kutusu + açıklama, ilk cevap kilitli. Soru haritası sayfası (sayım, süzgeç çipleri, 10 sütun) ve "Teslim edeyim mi?" sayfası (sayım + kalan süre + bilgi notu). Kodlar: `EXAM_ALREADY_TAKEN{attemptId}` → doğrudan sonuç; `OFFICIAL_FIRST`, `OFFICIAL_IN_PROGRESS`, `EXAM_CLOSED` metinli hata |
| M4 Sonuç | `deneme-sonuc/[attemptId]` | `app/deneme-sonuc/[attemptId]/index.tsx` + `ResultHero`, `WeakTopicCard` | Figma birebir: "DENEME SONUCU" etiketi, büyük net (display) + "net", alt satır (resmî: "N kişide M. · ilk %X"; tekrar: "sıralamaya girmedi" + bilgi notu; kişisel; çıkmış sınav). D/Y/B kutuları, meta satırı, 8 dersli `CourseBreakdown`, Türkiye kıyası (resmî, Premium), çalışılacak konu kartları, **"Cevapları incele"** + ikinci düğme (Sıralamayı gör / Deneme geçmişi / Yeni kişisel deneme). Haftalık **sonuç bekliyor**: kart + cevaplanan/boş/süre + "Denemelere dön". `scoreUpdate` ve süre doldu şeritleri |
| M5 İnceleme | `deneme-sonuc/[attemptId]/inceleme` → `…/soru/[no]` | `inceleme.tsx`, `soru/[no].tsx`, `ReviewRow` | Figma birebir, iki ayrı ekran (iç yığın `deneme-sonuc/_layout.tsx`). Liste: yatay süzgeç çipleri (Tümü / Yanlış / Boş / İşaretli / Çoğunluk bildi-Premium), "çoğunluğun bildiği N soru" kartı, soru kartları (durum simgesi · ders · konu · Türkiye % · 0:48). Ayrıntı: DERS etiketi + durum rozeti, kök, şıklar (doğru/kaçırılan/yanlış), Açıklama kartı, dayanak kartı (`legalReference`), Türkiye / Süren kutuları (kilit sunucudan), çoğunluk notu, "Bu soruyu bildir", "Sonraki soru". **Kaynak etiketi okunmaz.** |
| M6 Sıralama | `(tabs)/denemeler/siralama/[examId]` | `siralama/[examId].tsx` | Figma birebir: deneme adı + "N resmî çözüm · katılımla güncellenir / dondurma tarihi", "sen" paneli (yüzdelik yalnız ilk %50), isimli tablo (`RankRow`, süre s:dd), listede yoksan en altta kendi satırın, eşitlik notu en altta; az katılım / sonuç bekliyor boş durumları başlık altında |
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

- İlk sürümde M3 F10 seans derisini, M5 ise sonuç altında açılır listeyi kullanıyordu; kullanıcı
  26 Eki'de Figma'ya birebir uyum istedi (A seçeneği) → M3, M4, M5, M6 Figma'daki yapıya çekildi.
- Figma M3'te teslim girişi çizilmemişti; "Teslim et" soru haritası sayfasının altına ve son
  sorudaki "Sonraki" yerine "Bitir" olarak eklendi (eklenti, sapma değil).
- M5 ayrıntıda Figma'da olmayan "Sonraki soru" düğmesi var (100 soruda geri-ileri gezinme için).
- Alıştırma/yanlış turu oynatıcısı (F10 derisi) değişmedi; yeni deri yalnız deneme modunda.
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
| Oynatıcıda ders rozeti ve incelemede dayanak için veri yok | **API**: paket sorularına `course` (soru → konu → ders, tek sorgu), `getAttempt.review`'a `course/topic/legalReference` eklendi; deploy ile görünür |
| Denemelerim'de sırası belli denemelerde "sıralama bekliyor" | **API** (`exams.service.ts › history`): sıra yalnız dondurulmuş tablodan geliyordu; artık dondurulmamış denemeler için lider tablosuyla aynı canlı hesap (en az 10 örnek kuralı ortak). Deploy ile canlıya çıkar |

## 4b. Telefon turu sonrası eklemeler (26 Eki 2026, gece)

Kullanıcı Release derlemesini iPhone'da denedi (`xcodebuild -configuration Release` +
`devicectl install/launch`; Metro'suz). Geri bildirimleri ve karşılıkları:

| Geri bildirim | Yapılan |
|---|---|
| Oynatıcıda "bildir" en altta/yoktu; soru paylaşımı yok; 1–100 soru haritası düğmesi görünmüyor | Şıkların altına **Paylaş · Bildir** satırı; alt çubuğun soluna **soru haritası** düğmesi (`ExamActionBar.onGrid`) |
| Soruyu bildir klavyenin altında kalıyor, yapı gysrota'ya göre basit | `domain/report-sheet.tsx` — gys-mobil `ReportSheet` kalıbı: tam sayfa modal, "Sorun ne?" neden listesi (Doğru cevap hatalı · Mevzuat güncel değil · Soru belirsiz · Yazım hatası), isteğe bağlı açıklama, `KeyboardAvoidingView`. Mesaj sunucuya "Neden — açıklama" olarak gider; API değişmedi. Alıştırma, deneme ve sonuç ayrıntısı aynı sayfayı kullanır |
| Haftalık denemeye sayaç; kartta "Haftalık deneme" ile tarih iç içe; haftalık farklı renk; deneme başlayınca Bugün'de PAEM sayacı yerine canlı deneme | **Figma 58:1318** (onaylı, `figma-haftalik-sayac-light.png`). Token: `live` / `liveSoft` / `liveInk` (bordo; Figma değişkenleri + `design-tokens.json` + kontrast çiftleri, web `globals.css`). Expo: `WeeklyCountdown` (GÜN:SAAT:DK:SN, saniyede), `WeeklyExamCard` (HAFTALIK rozeti + "Pazar 1 Kas · 21:00" satırı, sağda mini sayaç, bordo zemin/çerçeve, beklemede Hatırlat · Kuralları gör; açıkken Katıl; bitmiş Sonucunu gör · Sıralama), `RemindButton`, hero bordo; Bugün'de pencere açıkken `LiveExamPanel` (CANLI · ad · kalan süre · 21:00–23:30 · Katıl/Devam et/Sonucunu gör · Kurallar · "PAEM'e N gün" satırı), kapanınca `CountdownHero` geri gelir |

Doğrulama: simülatörde hero sayacı akıyor (canlıda 1 Kas 21:00 haftalık deneme var), kartların üç
hâli gerçek veriyle; Bugün canlı paneli açık pencere olmadığı için simülatörde görülemedi — ilk
haftalık (F4) provasında doğrulanır.

## 5. Deploy (26 Eki 2026)

`b79c6d6` main'e push; Railway (api), Vercel (web/admin) ve GitHub CI (API, Web, Admin, Mobil, token) yeşil. Canlıda: `/exams/history/mine` sırası (19.), oynatıcıda ders rozeti ve M3–M6 ekranları simülatörde canlı API ile doğrulandı. TestFlight derlemesi ayrı karar.

Not: beta hesabında isimler kullanıcı adı olarak görünüyor (`rankingName` ad yoksa `displayName`'e düşer); web ile aynı.

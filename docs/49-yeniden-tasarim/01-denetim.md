# Doc 49 / 01 — Denetim raporu (Paemisyon 2.0 öncesi)

Tarih: 16 Ekim 2026. Kod tabanı: `origin/main` @ c3f53bc (çalışma dalı `doc46/kisisel-deneme-limiti`
37 commit geride; bulgular main'e göre doğrulandı). Hiçbir dosya değiştirilmedi. Yöntem: altı
paralel salt-okunur tarama (API/şema, Flutter mobil, web, admin, ürün belgeleri, altyapı +
kardeş repo gys-mobil), ardından iki tarama main'e göre düzeltildi.

Başlık yapısı kullanıcı talimatının (16 Eki) 2. bölümündeki rapor şablonudur.

## 1. Mevcut ürünün güçlü yönleri

- **Backend tek gerçek kaynak ve gerçekten öyle.** Koç kuralları (19 saf kural + `todayTask`
  motoru), mastery, seri, net hesabı, premium kararı, IAP makbuz doğrulaması, AI açıklama
  önbelleği hep sunucuda; üç istemci yalnız çiziyor (`coach.service.ts`, `quiz.service.ts`,
  `entitlement.util.ts`). 2.0'da istemci değiştirmek bu yüzden ucuz.
- **Doc 48 API işleri canlıda ve sağlam:** TR 04.00 uygulama günü tek tanımda
  (`common/gun.ts`), aktiflik cevap anında, yarım tur emek sayılıyor ve 7 günde kapanıyor,
  `readiness` ve zayıf konu eşiği tek tanımda, `PUT /me/focus`, resmî sınav tarihi
  `ExamType.examDate`, `Course.icon`, beta rolü, metrik panosu `GET /admin/metrics/home-v2`.
  43 migration, 25+9 spec.
- **Soru bankası güven mimarisi:** sürümlü sorular (`QuestionVersion` değişmez),
  `in_review` akışı, kaynak etiketi gizliliği tek karar noktasında
  (`SettingsService.showQuestionSource`), mevzuat türetimi ve AAY istisnaları kanıta bağlı,
  `LawArticle`/`Legislation` modelleri `lastVerifiedAt` ile.
- **Mevzuat merkezi** (Doc 29) tam: sürekli akış okuyucu, arama, yer imi, vurgu, not, okuma
  konumu; madde→soru atlası (`/catalog/topics/:id/atlas`).
- **Deneme motoru olgun:** küresel pencere, kullanıcı başına tek katılım, cevaplar anında
  sunucuya, 2 dakikalık cron ile süresi dolanlar kapanıyor, net ve sıralama sunucuda, PastExam
  arşiv motoru, kişisel deneme ve günlük hak.
- **Faturalama ve bildirim altyapısı canlı:** Apple JWS + x5c doğrulama, Google Publisher v3,
  RTDN, FCM push, ölü token temizliği, liderlik dürtmesi cron'u, e-posta kampanya modülü.
- **Mobilde korunacak davranışlar:** 401'de tek tazeleme + yeniden deneme interceptor'ı,
  çevrimdışı cevap kuyruğu ve üç tetikli boşaltma, duvar saatine göre deneme sayacı,
  ekrandan bağımsız mağaza işlem dinleyicisi.
- **Ürün anayasası yazılı ve büyük ölçüde geçerli:** Doc 24 (yolculuk), 25 (IA), 26 (ton),
  48/01 (D1–D4). 15 bağlayıcı kural §6'da derlendi.
- **Kardeş repoda hazır Expo altyapısı:** gys-mobil'de Supabase oturum deposu, Apple/Google
  native giriş, env doğrulama, tema sağlayıcı, bileşen kiti, hata raporu, `expo-iap`
  "sunucuda doğrula sonra bitir" akışı, zorunlu güncelleme kapısı birebir taşınabilir.

## 2. UI/UX sorunları

**Mobil (Flutter, main)**
- Tamamen Material 3, Cupertino sıfır; iOS'ta "Android gibi" his. Ekrana özel widget 126
  adet (`home_screen.dart` 1127 satır). Ham renk intro ve ana ekranda.
- Soru ekranında **işaretleme yok, not yok, önceki soruya dönüş yok** (`_NoBackPagePhysics`),
  çıkışta onay yok; favori durumu sunucudan tohumlanmıyor (daha önce favorilenen soru boş
  yıldız).
- Deneme bayrağı yalnız oturum içi, sunucuya yazılmıyor; uygulama öldürülürse kaybolur.
- Derin bağlantı yok (şema yok, associated domains yok); bildirimden yalnız 4 hedefe
  gidilebiliyor.
- Dynamic Type eğrisi, Lucide, tek vurgu yalnız yayınlanmamış v2 dalında.

**Web**
- İki tasarım dili bir arada: miras `head2/btn2/exam-table` ~15 dosyada, navy/grey 27
  dosyada, 418 keyfi Tailwind değeri; Open Sans + Rubik 700, icomoon 18 glif + emoji ikonlar.
- Koyu tema yalnız `.tk-scope` altında; public sayfalar hep açık, başlık koyulaşıyor.
- Hiç `error.tsx`/`not-found.tsx` yok; `/me/coach` hatası ham çöküş; çoğu hata boş listeye
  çevriliyor (`.catch(() => [])`).
- İki liderlik sistemi, kullanılmayan bileşenler, 1073 satırlık seans oynatıcı.
- Mobil alt bar etiketleri 10 px; "içeriğe atla" yok; `:focus-visible` yalnız tk-scope'ta.
- Kabuk kopuşu: girişli kullanıcı "Çıkmış Sorular"a basınca public kabuğa düşüyor.

**Admin**
- Tasarım sistemi yok (5 ilkel bileşen), web ile ortak token yok, 9 sayfada elle tablo ve
  sayfalama, 27 yerde `prompt/confirm/alert`, emoji menü ikonları, 11 `aria-` kullanımı.
- **Kaynak etiketi panelde ne görünüyor ne düzenlenebiliyor**; kuyrukta AI/türetilmiş soru
  gerçek sorudan ayırt edilemiyor ve "Tümünü Onayla" ile birlikte yayına gidiyor.
- Katalog düzenlemesi `window.prompt` ile; sınav türü CRUD yok; rol/beta atama arayüzü yok.

## 3. Teknik borç ve mimari riskler

| # | Bulgu | Etki | Konum |
|---|---|---|---|
| T1 | `createVersion` yeni sürüme `sourceLabel` ve `contentHash` taşımıyor | Yayındaki soru panelden düzenlenince kaynak etiketi **kayboluyor** (güven mimarisinin omurgası) | `admin-questions.service.ts:726+` |
| T2 | Yeni soru formu 4 şıkla açılıyor, sunucu 2–5 kabul ediyor | 8 Eyl beş şık kuralı panelde uygulanmıyor | `question-form.tsx:31`, QS:717 |
| T3 | Review sayfası `pageSize=50` gönderiyor, controller okumuyor | Kuyrukta sorular sayfalar arasında atlanıyor | `review/page.tsx:46`, C:315 |
| T4 | Durum filtresi `versions: { some }` | "Arşiv" filtresi yayındaki soruları da listeliyor | QS:86 |
| T5 | Ret notu yalnız audit `detail`'e yazılıyor, ekran göstermiyor | Editöre geri bildirim ulaşmıyor | QS:304 |
| T6 | Net formülü sabit `/4`; bankada 1.108 dört şıklı soru | Dört şıklı soruda yanlış net | `quiz.service.ts`, `score-calculator.tsx` |
| T7 | Monorepo yöneticisi yok, CI yok, typecheck script'i yok, Sentry/Crashlytics yok | Regresyon ancak canlıda görülüyor | kök |
| T8 | `packages/tokens` "tek kaynak" diyor ama üç hedefe elle eşleniyor; üretim betiği yok | Token kayması (web caption 600 vs token 500; display 800 vs Rubik 700) | `design-tokens.json:2` |
| T9 | Soru↔madde bağı `(topicId, articleNo)` metin anahtarı, FK yok, tek madde | Çift yönlü geçiş ve madde sürümleme kurulamıyor | schema:493 |
| T10 | Madde metni tek sürüm, yürürlük serbest metin; değişiklik tespiti yalnız CLI betiği, cron yok | Mevzuat eskimesi insan hatırlamasına bağlı | `mevzuat-degisiklik-tara.ts` |
| T11 | SRS yok (`WrongAnswer` yalnız sayaç), soru notu yok, kişisel liste yok, çalışma süresi toplamı yok | 2.0 özellikleri için veri yok | §5 |
| T12 | `CORS_ORIGINS` boşsa her origin açık; Helmet yok; Prisma hataları 500'e düşüyor | Üretim yapılandırma riski | `main.ts:63`, `all-exceptions.filter.ts` |
| T13 | Koç isteği başına 21 sorgu, önbellek yok; Supabase pooler 15 bağlantı | Yük altında `/me/coach` 500 (geçmişte yaşandı) | `coach.service.ts:125` |
| T14 | AI açıklama `claude-opus-4-8` sabit, bütçe/tavan yok | Maliyet kontrolsüz | `ai-explain.service.ts:17` |
| T15 | Betikler audit'e yazmıyor; 238 kök betik + 99 tek seferlik | Değişiklik izi eksik, bilgi betiklerde | `apps/api/scripts` |
| T16 | Kökte 26 MB SQL dökümü (PII) ve 374 MB eski proje; gitignore'da ama diskte | Sızıntı riski, `migrate-paem705-users.ts` bağımlı | kök |
| T17 | Web `middleware.ts` → Next 16 `proxy.ts` geçişi yapılmadı; sınav oturumu GET render'ında POST ile açılıyor | Prefetch yan etkisi | `sinav/[examId]/page.tsx:20` |
| T18 | Mobil format drift 115/132, Xcode 27 derleme sorunları, README eski, `.aab` repoda | Flutter bakımı pahalı (Expo kararını destekler) | memory |

## 4. Eksik kullanıcı akışları

Talimatın 5–13. bölümlerine karşı:

| Talimat bölümü | Var | Eksik |
|---|---|---|
| 5 Ana sayfa | todayTask, readiness, haftalık gün, resmî geri sayım, odak | Günlük **süre** hedefi ve tamamlanma; "süresi gelen tekrar kartları"; günlük mini deneme görevi |
| 6 Alıştırmalar | Konu/ders/zayıf/yanlış/favori reçeteleri, soru sayısı, rastgele karışım, açıklama + dayanak + AI | Zorluk ve çözülmemiş filtresi, alt konu filtresi, işaretleme, not, kişisel liste, önceki soruya dönüş, çözülen/çözülmeyen görünümü |
| 7 Denemeler | Tam/kişisel/konu denemesi, geri sayım, autosave, sonuç, net, konu kırılımı, önceki denemeyle fark | Mini deneme (sabit kısa format), **dönem/seri** kavramı, sunucuda kalıcı bayrak, cevapları gözden geçirme ekranı (web'de var, mobilde kısmi) |
| 8 Gelişim | Özet, konu haritası, aktivite, haftalık snapshot, liderlik | Zaman eğrisi (deneme netleri), "sık yapılan hatalar", "henüz yeterli veri yok" eşikleri (kısmen var), yorum cümleleri |
| 9 Yanlışlar defteri + tekrar | `WrongAnswer` (sayaç, son zaman, çözüldü), review turu | **Tekrar zamanlaması** (`dueAt`, aralık, geçmiş), tekrar listesini yönetme, temizleme |
| 10 Kişisel koç | Deterministik 19 kural + görev motoru, sınava kalan süreye göre mod | **Günlük süre girdisi kullanılmıyor**; haftalık plan yok; gün kaçırınca yeniden planlama yok (comeback var) |
| 11 AI açıklama | Yanlışta açıklama, önbellek, hak, kaynak etiketi istemde yok | "Diğer şıklar neden yanlış", "daha basit anlat", "benzer soru", madde köprüsü (okuyucu var, AI içinden değil); bütçe |
| 12 Mevzuat güncelliği | lastVerifiedAt, türetim istisnası, CLI tarama | Madde sürümü, soruda son inceleme tarihi, değişiklik→inceleme kuyruğu, panel akışı |
| 13 Oyunlaştırma | 4 rozet türü, rütbe, liderlik, haftalık 5 gün | Haftalık hedef kullanıcıya göre, rozetlerin tekrar/düzeltme davranışını ödüllendirmesi, kişisel rekorlar (web'de var), bildirim tercihleri tablosu |

Ayrıca: onboarding "günlük dakika" soruyor ama hiçbir yer kullanmıyor; `User.dailyGoal`
soru sayısı, süre değil.

## 5. Yeni özellikler için gerekli veri ve altyapı

| Özellik | Mevcut | Eklenecek |
|---|---|---|
| Haftalık plan (geri sayımlı) | `targetExamDate`/`examDate`, `weightPercent`, mastery, exam_mode/taper | `StudyPlan`, `StudyPlanItem` (hafta, konu, hedef soru ve dakika, durum); plan servisi; `GET/POST /me/plan`; `User.dailyMinutes` kullanımı |
| Gerçek aralıklı tekrar | `WrongAnswer`, review modu | `QuestionReview` (userId, questionId, ease, interval, reps, lapses, `dueAt`, lastReviewedAt; indeks `(userId, dueAt)`); cevap anında güncelleme; `GET /review/due`; `due` tur modu; `WrongAnswer` korunur |
| Dönemlik deneme serisi | `Exam` tekil, `PastExam.term` | `ExamSeries` (ad, dönem, sınav türü, sıra), `Exam.seriesId`; seri ilerleme ucu |
| Mevzuat ↔ soru | soru→madde metin anahtarı, atlas | `QuestionArticle` N:N (FK `lawArticleId`); `GET /public/mevzuat/:slug/:no/questions`; `LawArticleVersion` (yürürlük başlangıç/bitiş) |
| Soru notu, kişisel liste, işaretleme | `Bookmark` düz | `QuestionNote`, `UserList`+`UserListItem`, `QuizAnswer.flagged` (sunucuda kalıcı bayrak) |
| Günlük süre hedefi | `timeSpentMs`, `durationSeconds` | `DailyUsage.studySeconds` + okuma süresi; `User.dailyMinutes` |
| Oyunlaştırma | Badge 4 tür, haftalık sabit 5 | `User.weeklyGoalDays`, `WeeklyGoal` geçmişi, `BadgeKind` genişlemesi, bildirim tercihleri tablosu |
| Soru kalitesi | `status`, `reviewedBy`, `publishedAt` | `QuestionVersion.lastReviewedAt`, `reviewNote`; audit'e betik koşuları |
| Expo istemci | FCM ham token, `/me/push-token` | Expo'da `getDevicePushTokenAsync` ile ham token (API değişmez); derin bağlantı şeması + AASA; hata raporu ucu veya Sentry |

## 6. Önceliklendirilmiş geliştirme planı

Ayrıntı ve aşamalar `00-plan.md` v2'de. Özet sıra:

0. **Güven onarımı (hemen, 2.0'dan bağımsız):** T1 sourceLabel kaybı, T2 beş şık, T3 pageSize,
   T4 filtre, T5 ret notu; kuyrukta kaynak türü filtresi ve AI soruları için toplu onay
   engeli. Küçük API+admin değişiklikleri, mevcut panelde.
1. **Temel:** monorepo (pnpm workspace) + CI (lint, typecheck, test) + token v3 üretim
   betiği + hata raporlama (Sentry) + kök temizliği (T16).
2. **Expo uygulaması** F1–F6 (iskelet → tasarım sistemi → Bugün/Çalış → Denemeler/
   Kütüphane/Performans/Ben → altyapı → beta ve 2.0). Özellik eşitliği tablosu mobil raporuna
   göre; 2.0'da ek olarak işaretleme, not, önceki soruya dönüş, çıkış onayı, favori tohumlama.
3. **Veri katmanı 2.0** (API, paralel): SRS, QuestionArticle + LawArticleVersion, StudyPlan,
   ExamSeries, QuestionNote/UserList, studySeconds, weeklyGoalDays, lastReviewedAt.
4. **Admin 2.0:** ortak bileşen kiti (web token v3 ile), soru listesi filtreleri (zorluk,
   kaynak türü, madde, tarih), mevzuat sağlığı ekranı (tarama cron + değişen madde →
   yeniden inceleme kuyruğu), madde bağlama ekranı, toplu işlemler, kullanıcı detayı ve rol
   atama, içerik kalite metrikleri, betiklerin audit'e yazılması.
5. **Web yeni deri** (token v3, public sayfaların URL/render modu korunarak).
6. **Dört özellik** sırayla, her biri kendi doc'u ve gerçek veriyle E2E.

## 7. Kritik belirsizlikler ve varsayımlar

- **PAEM resmî süre ve puanlama** hiçbir belgede doğrulanmamış; sistem 75 sn/soru ve
  `doğru − yanlış/4` varsayıyor. Resmî kaynak bulunana kadar bunlar "ürün kuralı" olarak
  etiketlenir, "sınav kuralı" olarak sunulmaz.
- **Sonraki PAEM tarihi** `ExamType.examDate` alanında girili değil (14 Eki itibarıyla).
- **Ücretsiz günlük limit** belgelerde 15, kodda 30; DB değeri geçerli, belgeler güncellenmeli.
- **Sekme seti:** Doc 49 v1 "Mevzuat" sekmesi yazmıştı; Doc 25 ve 29'a aykırı. v2'de
  anayasal beş sekme (Bugün · Kütüphane · Denemeler · Performans · Ben) korunur, Mevzuat
  Kütüphane içinde kalır.
- **Doc 26 §4 `SourceTag` "hep görünür"** maddesi CLAUDE.md kaynak etiketi kuralıyla
  çelişiyor; CLAUDE.md geçerli, Doc 26 düzeltilecek.
- **Android IAP teklif seçimi** ve `Plan.storeProductId*` canlı değerleri panelde; seed'de
  null. Expo IAP'ye geçişte canlı plan satırları kaynak alınır.
- Talimatın "teknoloji yığınını gerekçesiz değiştirme" ve "gereksiz yeniden yazımdan kaçın"
  maddeleri ile Expo kararı arasındaki gerilim: Expo kararı 16 Eki'de gerekçeli ve onaylı
  (00-plan §0); API, şema ve admin yeniden yazılmaz, genişletilir.

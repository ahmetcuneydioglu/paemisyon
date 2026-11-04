# Doc 56 — Bilgi Kartları (flashcards): mimari analiz ve geliştirme planı

Tarih: 4 Kasım 2026. Durum: **ANALİZ ONAYLI (4 Kas, kararlar §11) — aşama 2 tasarımı Figma'da (`01-f2-tasarim.md`), inceleme bekliyor.** Kod yazılmadı, migration uygulanmadı,
mevcut ekran değiştirilmedi. Kaynak: kullanıcı talimatı (4 Kas) ve rakip uygulamanın üç ekran görüntüsü
(kart ön yüzü, "Biliyorum" ve "Geç" damgaları, alt sayaç şeridi 1/266 · 8 · 258).

Bu belge Doc 49/14'te **K4** olarak ertelenen işi açar: "Bilgi kartları — ayrı plan (dayanaklı,
önceden üretilmiş, insan onaylı)". Kodda bugün bilgi kartı yoktur; konu odası bunu açıkça not eder
(`apps/app/app/(tabs)/kutuphane/konu/[topicId].tsx:13`, `apps/web/src/app/(app)/(shell)/kutuphane/konu/[id]/page.tsx:22`).

---

## 0. Yönetici özeti

1. **Altyapının büyük kısmı hazır.** Aralıklı tekrar motoru sunucuda zaten var ve test edilmiş
   (`apps/api/src/modules/quiz/srs.ts`, SM-2 sadeleştirilmiş, saf fonksiyon). Konu özeti modülü,
   içerik + yayın + eskime + admin + AI üretim hattı için birebir şablondur. Token sistemi, bileşen
   kiti, paywall kapısı, bildirim motoru ve koç rotası eklemeli biçimde genişler.
2. **İki gerçek boşluk var:** (a) mobil uygulamada jest (swipe) ve kart çevirme için animasyon
   altyapısı yok (reanimated ve gesture-handler kurulu değil); (b) hiçbir platformda kart içeriği,
   kart favorisi ve kart ilerlemesi için veri modeli yok.
3. **En büyük karar içerik kaynağıdır.** Mevcut 48 ünitelik konu özeti (Anayasa, PVSK, 3201, 7068, CMK;
   1.259 kart, hepsi madde referanslı ve betikle doğrulanmış) bilgi kartı için en güvenilir
   hammaddedir. AI ile kart üretimi CLAUDE.md'ye **yeni bir istisna maddesi** gerektirir; Doc 24 ve
   Doc 15 "AI otomatik yayın yapmaz" der, bu çerçeve korunur.
4. **Önerilen mimari:** `Flashcard` konuya bağlı, isteğe bağlı üniteye etiketli, madde referansı
   zorunlu; `FlashcardReview` kullanıcı × kart SRS durumu (mevcut `srsGuncelle` ile); olay
   günlüğü `FlashcardReviewEvent` (geri al, istatistik, idempotency); `FlashcardBookmark`; hafif
   `FlashcardSession` (kaldığın yer ve oturum sonu ekranı). Deste ayrı bir tablo değil, **hesaplanan
   kapsamdır** (ders / konu / ünite), tıpkı Doc 53 F5'teki "ünite etikettir" kararı gibi.
5. **Yedi aşama**, her biri tek başına canlıya çıkabilir: analiz (bu belge) → tasarım → veri →
   temel kart deneyimi → akıllı öğrenme ve modlar → admin → entegrasyon ve test.

Kullanıcı kararı bekleyen maddeler §11'de toplandı.

---

## 1. Mevcut Paemisyon mimarisinin özeti

### 1.1 Katmanlar

| Katman | Teknoloji | Not |
|---|---|---|
| API | NestJS + Prisma, Supabase Postgres | Tüm iş mantığı burada. Global önek `api/v1`. `{data}` / `{error:{code,message}}` zarfı. |
| Mobil | **Expo SDK 58 / React Native 0.88 / expo-router** (`apps/app`) | Flutter (`apps/mobile`) bakımda; yeni ekran yazılmıyor (Doc 49 kararı). |
| Web | Next 16 + Tailwind 4 (`apps/web`) | Server Components ağırlıklı; `(site)` public, `(app)` girişli, `(dual)` ikisi. |
| Admin | Next + Tailwind 4 (`apps/admin`) | Rol: `admin` / `editor`. UI kiti çok ince (`components/ui.tsx`). |
| Token | `packages/tokens/design-tokens.json` (v4 "Nöbet defteri") | `build.mjs` → css / ts / dart; kontrast testi CI'da. |

### 1.2 Kimlik, yetki, RLS

- Supabase JWT (ES256, JWKS) `JwtAuthGuard` ile doğrulanır; `@CurrentUser()` → `{id, email, roles, isPremium}`.
- `RolesGuard` + `@Roles('admin','editor')`; hassas işlemlerde serviste ikinci kontrol
  (`admin-summaries.service.ts:489`).
- **RLS kullanılmıyor.** Doc 06: "Doğrudan DB erişimi kapalı; erişim yalnızca NestJS servis rolü üzerinden."
  Migration'larda hiç `POLICY` yok. Kullanıcı izolasyonu servislerde `userId` süzgeciyle sağlanır.
  Talimatın 11. bölümündeki RLS beklentisi bu projede **API katmanı guard'ları** anlamına gelir.
- Supabase MCP ile doğrudan tablo oluşturmak projenin kuralına aykırıdır: şema Prisma'da, migration
  `apps/api/prisma/migrations/YYYYMMDDHHMMSS_ad/migration.sql` olarak elle yazılır ve `prisma migrate
  deploy` ile çıkar (`connection_limit=1`, backend durdurularak).

### 1.3 İçerik ağacı (talimattaki "ders / konu / alt konu")

- `ExamType` → `ExamSection` (sınavda görünen ders, `weightPercent`) → `ExamSectionCourse` → `Course`.
- `Topic` kendine referanslı ağaçtır: `parentId` null ise konu, doluysa alt konu
  (`schema.prisma:382`). Üründe bugün alt konusu olan konu **yoktur** (Doc 53 F5 tespiti).
- Konu özeti üniteleri (`SummaryUnit`) **alt konu değil etikettir**: ünite üyeliği
  `topicId + articleNo` ile hesaplanır (`summaries/unite-eslesme.ts: unitCovers`).
- Mevzuat: `Legislation` ↔ `Topic` 1:1, `LawArticle` (resmî metin, AI ile üretilmez),
  `LawArticleVersion` (eskime kıyası).
- Soru ↔ madde bağı üç katmanlı: `Question.topicId`, eski `Question.articleNo`, yeni `QuestionArticle` N:N.

Talimattaki örnek ("Anayasa Hukuku → Anayasa Tarihi / Temel Haklar / Yasama / Yürütme / Yargı")
üründe **konu özeti üniteleri** olarak zaten vardır (Anayasa 12 ünite). Bilgi kartlarının alt konu
filtresi bu ünitelere oturur; yeni bir alt konu ağacı açmaya gerek yoktur.

### 1.4 Kullanıcı verisi (yeniden kullanılacaklar)

| İhtiyaç | Mevcut | Durum |
|---|---|---|
| Aralıklı tekrar | `QuestionReview` (ease, intervalDays, reps, lapses, dueAt) + `quiz/srs.ts` + `GET /review/due` | Sunucuda canlı; istemci SRS ekranı hiç yazılmadı (Doc 49/10 §4, "F8-2") |
| Favori | `Bookmark(userId, questionId)`, `ArticleBookmark(userId, articleId)` | Varlık başına ayrı tablo geleneği |
| İlerleme | `UserTopicProgress`, `UserUnitProgress` (mastery), `SummaryProgress` (lastBlockIndex) | Hâkimiyet yalnız soru cevabından beslenir |
| Günlük hedef | `User.dailyGoal` (soru, 20), `User.dailyMinutes`, `DailyUsage.studySeconds` | Kart hedefi için ayrı alan gerekir |
| Seri | `Streak` | Kart çalışması seriyi beslemeli (karar, §11) |
| Çevrimdışı | `apps/app/src/lib/offline-queue.ts` (cevap kuyruğu, `(sessionId,questionId)` tekil, son kazanır) | Kart olayları için ikinci kuyruk ya da genelleştirme |
| Bildirim | `NotificationsService.enqueue`; `daily_study_reminder` preset'i; `NotificationAudience` saatlik | Kart alanı eklenir |
| Koç | `GET /me/coach` homeV3: `nextStep`, `route` (2–6), `forYou` (≤4); `TodayTaskAction.type` | `open_flashcards` eklenir |

### 1.5 Çalış sekmesinin bugünkü düzeni (Doc 49/17, onaylı 1 Kas)

Her seviyede **aynı dört eylem**, kapsam daralır: Soru çöz · Konu oku · Yanlışlarım · Favorilerim.

- Çalış ana ekranı: "Kaldığın yer" şeridi + 2 sütun ders kartı ızgarası + iki hap.
- Ders odası: `RoomStatPanel` → `CoachLine` → **2×2 `ActionTile`** → Konular listesi (dokununca `TopicActionSheet`).
- Konu odası: Konu özetleri (`SummaryUnitRow`) → "Bu konuda" satırları → sabit `ActionBar`.
- Sayılar ve kilit sunucudan: `GET /me/study`, `/me/course-room/:id`, `/me/topic-room/:id`.

### 1.6 Tasarım sistemi

- Token v4 "Nöbet defteri": lacivert zemin (`bg` #121A26), tek altın vurgu (`accent` #E8B46C, açık temada
  yalnız dolgu/çizgi), `panel` tonları; Lora başlık, Inter gövde; köşe kart 10 / sheet 20 / panel 4;
  hareket 180 ms giriş / 140 ms çıkış, `prefers-reduced-motion`'da yalnız opaklık; gölge yok; ders rengi yok.
- Expo kiti (`src/components/ui`): Screen, AppText, Card (surface/alt/accent), Button (primary/secondary/ghost/destructive),
  IconButton, Badge, Chip, ProgressBar, SegmentBar, ListRow, StatTile, Sheet, ActionBar, ActionTile,
  EmptyState, Skeleton, Notice, CountBadge, BigNumber. Alan: `SummaryBlockCard`, `ArticlePeek`,
  `SummaryLockCard`, `FeedbackPanel`, `ToolRow`, `ShareQuestionCard`. Galeri `app/galeri.tsx` (`__DEV__`).
- Web kiti (`src/components/ui`): aynı adlar (Card, Button, Badge, ProgressBar, SegmentBar, Dialog [= Sheet],
  KeyHint, ActionTile, SegmentedControl, Chip, ListRow, StatTile, EmptyState, Skeleton, PremiumBadge).
  Odak sayfası çerçevesi `FocusFrame`. Animasyon kütüphanesi yok; CSS ve `--motion-*` token'ları.
- **Mobilde animasyon altyapısı boşluğu:** `react-native-reanimated`, `react-native-gesture-handler`,
  `react-native-worklets` kurulu değil (yalnız expo-router'ın isteğe bağlı peer'i). Kodda `useAnimatedStyle`,
  `withSpring`, `Gesture.Pan`, `PanResponder`, `FlipCard` hiç yok. `motion` token'ı tanımlı ama kullanılmıyor.
  Reduce-motion kontrolü yok. Haptics yalnız `selectionAsync`.

### 1.7 Test altyapısı

- API: jest + ts-jest, 66 spec, ~634 test; saf mantık `*.logic.ts` kalıbı; Prisma elle mock'lanır.
- Web: vitest, yalnız `src/lib/*.test.ts` (14 dosya); bileşen ve E2E testi yok.
- Expo: jest yok; tek `node:test` dosyası (`deep-links.test.mjs`). Doğrulama "göz testi protokolü" (SE + Pro Max, açık/koyu, AX3).
- Admin: test yok; CI yalnız typecheck + lint.

---

## 2. Bilgi Kartları modülünün projeye entegrasyonu

### 2.1 Ürün ilkeleriyle uyum (bağlayıcı)

| İlke | Kaynak | Bilgi kartlarına etkisi |
|---|---|---|
| Yeni özellik = yeni reçete / yeni koç kartı, nadiren yeni ekran; hiçbir yol 3 seviyeden derin değil; her çalışma eylemi en fazla 2 dokunuş uzakta | Doc 25 §0 K2, §7, §9.1 | Yeni sekme yok. Giriş: ders odası + konu eylem sayfası + Bugün rotası. Oynatıcı kök Stack'te tam ekran modal (seans gibi). |
| İstemci kural bilmez | Doc 24 §8, CLAUDE.md | Vade, kilit, sayılar, kuyruk sırası, "öğrenildi" eşiği sunucuda. |
| Dayanaklı, önceden üretilmiş, insan onaylı | Doc 49/14 K4 | Her kart ≥1 madde referansı; `in_review` doğar; yayın admin. |
| AI otomatik yayın yapmaz; madde metni AI ile üretilmez | Doc 15 §1, CLAUDE.md | Kart üretimi için yeni istisna maddesi yazılır (§6.4). |
| Kaynak etiketi son kullanıcıya gösterilmez | CLAUDE.md 4 Eyl | Kart arka yüzünde `sourceLabel` yok; "ilgili madde" rozeti var (madde kamuya açık). |
| Ücretsiz katman gerçek antrenman verir; duvar seansın sonuna | Doc 24 §11, Doc 25 akış H | Kilit kart kuyruğunun ortasına değil, kapsam seçimine ve deste sonuna. |
| Push ile premium teklifi yok, emoji yok | Doc 52 | Kart hatırlatması `study_reminder` kategorisinde. |
| Tek vurgu, gölge yok, ders rengi yok, ≥44 pt, kontrast çiftleri testte | Doc 49 §1, token README | Damga animasyonu yerine tonlu kenar/rozet geri bildirimi (§4.3). |

### 2.2 Navigasyon ve giriş noktaları

```
Çalış (kutuphane/index)
 ├─ [yeni] hap: "Kart tekrarı · N"            → /kartlar?mode=due            (yalnız N>0)
 └─ Ders odası (kutuphane/ders/[id])
     ├─ 2×2 ActionTile → [karar] 5. kutu ya da "Konu oku" sheet'inde bölüm
     │                                          → /kartlar?courseId=…
     └─ Konu satırı → TopicActionSheet
         └─ [yeni] satır "Bilgi kartları · 24 kart · 6 tekrar"
                                                → /kartlar?topicId=…
Konu odası (kutuphane/konu/[topicId])
 └─ [yeni] "Bu konuda" satırı + ünite satırında "N kart" künyesi
                                                → /kartlar?topicId=…&unitSlug=…
Bugün (index)
 └─ route / forYou / nextStep: "Kart tekrarı · 12 kart · 4 dk"  (TodayTaskAction.type = open_flashcards)
Bildirim derin bağlantı: flashcards (target) → /kartlar?mode=due
Web: /kutuphane/ders/[id], /kutuphane/konu/[id] aynı satırlar; oynatıcı /kartlar (app, FocusFrame, robots noindex)
```

Ders odası ızgarası için iki seçenek (§11 karar 2):

- **A. 2×3 ızgara, 5. kutu "Bilgi kartları"** (6. kutu boş kalır ya da "Testler" oraya alınır). Görünür, tek dokunuş.
  Doc 49/17'nin "aynı dört eylem" simetrisini bozar.
- **B. "Konu oku" sheet'ine üçüncü bölüm** ("Ünite özetleri · Mevzuat · Bilgi kartları"). Simetri korunur, kartlar
  "okuma" eyleminin bir türü olarak konumlanır, iki dokunuş. Önerilen: **B** ilk sürümde, kullanım verisi
  gelince A'ya terfi.

### 2.3 Oynatıcı yerleşimi

- Expo: `app/kartlar.tsx` kök Stack'te `presentation: "fullScreenModal", gestureEnabled: false`
  (seans ile aynı, `app/_layout.tsx:104-119`). Bitişte `app/kartlar-sonuc.tsx` değil, aynı ekranda
  "oturum sonu paneli" (seans/sonuç kalıbı: `router.replace`). Not: `ozet/[slug]` kök Stack'te kayıtlı değil
  ve başlık sorunu var; aynı hata tekrarlanmaz.
- Web: `src/app/(app)/kartlar/page.tsx`, kabuksuz, `FocusFrame` içinde (seans gibi). `middleware.ts`
  `protectedPrefixes`'e `/kartlar` eklenir.
- Kapsam parametreleri seans sözleşmesini izler: `courseId | topicId | unitSlug | mode | fromBookmarks`.

---

## 3. Yeniden kullanılabilecek mevcut bileşenler ve kod

### 3.1 Sunucu

| Parça | Dosya | Kullanım |
|---|---|---|
| SRS motoru | `quiz/srs.ts: srsGuncelle, hizliMi` | Kart tekrarında aynen; 3'lü nota eşleme §6 |
| Ünite eşlemesi | `summaries/unite-eslesme.ts: unitCovers, unitOfArticle, articleLabel` | Kartı üniteye, zayıf üniteyi karta bağlama |
| Eskime | `SummaryBlockArticle.articleVersionNo` + stale kuyruğu | `FlashcardArticle` aynı kalıp |
| Doğrulayıcı çekirdeği | `summaries/ozet-dogrulayici.ts: numberInTexts, trNumberPattern, safeEval` | Kart cevabındaki sayı/süre madde metninde geçiyor mu |
| İçe aktarma | `summaries/ozet-ice-aktar.ts: importUnit` deseni | `kart-ice-aktar.ts` |
| Yayın akışı + audit | `admin/summaries/admin-summaries.service.ts` | `publish/unpublish/delete` yalnız admin, `AuditService.log` |
| Kaynak türü | `admin/questions/kaynak-turu.ts: kaynakTuru, sentetikMi` | AI kartları toplu onaydan dışlama |
| Kilit kararı | `rooms.service.ts:180,290` (`topic.isPremium && !isPremiumUser`), `summaries.service.ts` kesik blok | Kart kapsamı kilidi |
| Premium hata kodu | `PREMIUM_REQUIRED` 403 | Kilitli kapsamla oturum başlatma |
| Seans köprüsü | `StartSessionDto {topicId, articleNos, questionCount, source}` | "Bu konudan soru çöz" (şema değişikliği yok; `source` listesine `flashcards`) |
| Koç | `coach/bugun-v3.logic.ts: sıradaki, rota, seninIcin` + spec | Yeni dallar |
| Bildirim | `notifications.service.ts: enqueue`, `automation.presets.ts`, `NotificationAudience` | `flashcards_due_reminder` preset'i |
| AI hattı | `scripts/ozet-girdi/uret/dogrula/yukle.ts` (Anthropic SDK, `claude-opus-5-5`, stream, prompt cache) | `kart-*` betikleri |
| Plan sabitleri | `common/plan.constants.ts` | Ücretsiz kart sınırları tek kaynak |

### 3.2 Expo

| Parça | Yeniden kullanım |
|---|---|
| `Screen`, `AppText` (roller: title/heading/body/label/stat), `Card`, `Badge`, `Chip`, `Button`, `IconButton`, `ProgressBar`, `SegmentBar`, `ActionBar`, `Sheet`+`useSheetAction`, `EmptyState`, `Skeleton`, `Notice`, `StatTile`, `ActionTile`, `ListRow` | Kart yüzeyleri, mod seçimi, oturum sonu, deste satırları |
| `SummaryBody` (markdown-lite) | Kart arka yüzü açıklaması |
| `ArticlePeek` + `ArticlePeekSheet` | "md 13/A" rozeti → madde metni |
| `SummaryLockCard` | Kilitli kapsam kartı |
| `ToolRow`, `ShareQuestionCard` kalıbı | Favori / Bildir satırı |
| `features/*/queries.ts` (TanStack Query, `*Keys`) | `features/flashcards/queries.ts` |
| `lib/offline-queue.ts` | Kart olay kuyruğu (genelleştirme) |
| `lib/deep-links.ts: routeToHref` + test | `/kartlar` eşlemesi |
| Seans `toggleBookmark` (elle optimistic) ve `useSetBookmark` (RQ optimistic) | Kart favorisi |
| `app/galeri.tsx` | Yeni "Bilgi kartları" bölümü (kit kuralı) |

### 3.3 Web

| Parça | Yeniden kullanım |
|---|---|
| `Card`, `Badge`, `Button`, `ProgressBar`, `SegmentBar`, `Dialog`, `KeyHint`, `SegmentedControl`, `Chip`, `ActionTile`, `EmptyState`, `Skeleton`, `PremiumBadge` | Tüm yüzeyler |
| `FocusFrame` | Oynatıcı çerçevesi (sticky şerit, çıkış, ilerleme, ≤65ch) |
| `SessionPlayer` klavye kalıbı (`window` keydown, INPUT'ta atla, `KeyHint`) | Kısayollar |
| `components/ozet/summary-body.tsx`, `article-peek.tsx` | Arka yüz ve madde rozeti |
| `apiClient` (istemci mutasyon), `api` (sunucu) | Olay gönderimi / sayfa verisi |
| `lib/home-actions.ts: homeActionHref` | `open_flashcards` çevirisi |
| `ToolRow`, `course-room-body.tsx` dialogları | Giriş satırları |

### 3.4 Admin

`summaries/page.tsx` (liste + JSON içe aktar), `summaries/[id]/page.tsx` (düzenleme, doğrulama satırları,
`canPublish` kapısı), `article-summaries/law/[slug]/page.tsx` (checkbox ile `publish-many`),
`questions/page.tsx` (filtre çubuğu + sayfalama), `questions/import/page.tsx` (CSV dry-run önizleme),
`components/ui.tsx: PageHeader, StatusBadge, Card, ErrorBox`, `notifications/ui.tsx: ConfirmDialog, StatCard, Chip, Toggle`,
`settings/page.tsx` (feature flag). Not: panelde toast, drawer, ortak tablo yok; `Stat` iki sayfada kopya.

---

## 4. Önerilen ekranlar ve kullanıcı akışları

### 4.1 Giriş alanı (ders odası / konu odası)

Yeni alan bileşeni **`FlashcardEntry`** (Expo `components/domain/flashcards.tsx`, web `components/kartlar/`):

- Üst satır: ikon (Lucide `Layers`), "Bilgi kartları", sağda `Badge` "6 tekrar" (tone warning) ya da "Yeni" (accent).
- Orta: `SegmentBar` değil, üç dilimli ince **durum çubuğu** (öğrenildi `success` / öğreniliyor `accent` / yeni `surfaceAlt`),
  altında tek künye: "24 kart · 10 öğrenildi · 6 tekrar bekliyor".
- Sağ: chevron. Dokununca mod seçimi sheet'i; tekrar bekleyen varsa birincil eylem doğrudan "Tekrara başla · 6".
- Boş deste: satır çizilmez (Çalış v2 kuralı: 0 sayı → sönük ya da yok). Kilitli: `PremiumBadge`, dokununca paywall.

### 4.2 Mod seçimi (`FlashcardModeSheet`)

Tek `Sheet`, en çok altı satır, her satır sunucudan gelen sayıyla; sayı 0 olan sönük:

| Mod | `mode` | Kuyruk kuralı (sunucu) |
|---|---|---|
| Tekrar zamanı gelenler | `due` | `dueAt <= now`, en eski vade önce |
| Yeni kartlar | `new` | hiç `FlashcardReview` kaydı yok, `sortOrder` |
| Zorlandıklarım | `hard` | `lapses >= 1` ya da son sonuç `again` |
| Favorilerim | `favorites` | `FlashcardBookmark` |
| Tüm kartlar | `all` | due → new → geri kalan |
| Karışık çalış | `mixed` | rastgele, kapsam içinden |

Birincil düğme sunucunun önerdiği mod (önce `due`, yoksa `new`). Oturum boyu varsayılan 20 kart; "Devam" ile ikinci porsiyon.

### 4.3 Kart ön yüzü ve arka yüzü (`FlashCard`)

Rakip uygulamadan alınan **işlev**: dokun → cevap; sağa kaydır → biliyorum; sola → tekrar; sağ üstte favori;
altta sayaç; arkada bir sonraki kart. Alınmayan: ekranı kaplayan kırmızı/yeşil damga, dönen kart, kırmızı kenar.

**Ön yüz**

- Üst satır: sol `Badge` kart türü ("Kavram", "Sayı", "Tuzak", "Boşluk"), sağ `IconButton` favori (`Bookmark` ikonu, 44 pt).
- Üst altı `label` rolünde "ANAYASA · YASAMA I" (ders · ünite), `inkSubtle`.
- Orta: soru metni Lora `title` (24/29); uzun metinde `heading`'e düşer (kompakt tip kuralı zaten var: `compactType`).
- Alt: "Cevabı görmek için dokun", `inkSoft`, `bodySm`.
- Kart `Card tone="surface"`, 1 px `line`, köşe `radius.card` (10), gölge yok; arkadaki kart %96 ölçek ve `surfaceAlt`
  tonunda (derinlik hissi tonla, gölgeyle değil).

**Arka yüz**

- Cevap Lora `heading`, `ink`; sayı kartlarında `BigNumber`.
- Açıklama `SummaryBody` (markdown-lite), en çok ~5 satır; fazlası "Devamı" ile genişler (kart içinde kaydırma yok, kart büyür; `LayoutAnimation`/layout transition).
- Madde rozetleri: `ArticlePeek` ("md 87", "Ek 7"), dokununca madde metni sheet'i. **Kaynak etiketi yok.**
- Alt: "Bu konudan soru çöz" ghost satırı (`ToolRow`), seans köprüsü.
- Puanlama çubuğu kartın **altında, kartın dışında** (`RatingBar`): "Tekrar" (secondary, `dangerSoft` zemin) · "Biliyorum" (primary).
  İsteğe bağlı üçüncü düğme "Kolay" (§11 karar 4). Hareket kullanmayanlar için her zaman görünür.

**Çevirme:** 3D flip (rotateY 0→180, 180 ms giriş eğrisi, `backfaceVisibility`). Reduce-motion'da crossfade (yalnız opaklık, token kuralı).

**Geri bildirim (damga yerine):**

- Kaydırırken kartın kenarı yöne göre `successSoft`/`dangerSoft` tonuna geçer ve kartın köşesinde küçük bir `Badge`
  ("Biliyorum" / "Tekrar") kaydırma mesafesiyle orantılı belirir; metin eşlik ettiği için renk tek başına anlam taşımaz.
- Eşik geçilince `Haptics.notificationAsync(Success | Warning)`; kart 140 ms çıkış eğrisiyle dışarı süzülür, arkadaki kart %96 → %100 ölçeğe yaylanır.
- Alt sayaç şeridinde ilgili rakam tik-tak artar (`tabular` rakam).
- "Geri al": kart çıkınca 5 sn görünen ince `Notice` satırı ("Tekrar işaretlendi · Geri al"); dokununca kart geri süzülür, sunucuda olay geri alınır.

### 4.4 Oynatıcı ekranı düzeni (mobil)

```
┌ Kapat ✕        ANAYASA · YASAMA I          ⋯ (seçenekler) ┐
│  ████████░░░░░░  12 / 20                                   │  ← ProgressBar + tur sayacı
│                                                            │
│   ┌──────────────────────────────────────────────┐         │
│   │ [KAVRAM]                              (☆)     │         │
│   │                                               │         │
│   │   TBMM üye tamsayısı kaç, seçim kaç yılda?    │         │
│   │                                               │         │
│   │        Cevabı görmek için dokun               │         │
│   └──────────────────────────────────────────────┘         │
│          (arkada ikinci kart, %96, surfaceAlt)              │
│                                                            │
│   [   Tekrar   ]   [      Biliyorum      ]                  │  ← RatingBar, ≥54 pt
│   ◦ 3 yeni · 7 öğreniliyor · 2 öğrenildi (bu tur)           │  ← label satırı
└────────────────────────────────────────────────────────────┘
```

Rakipteki "2/266 · 9 · 257" şeridi iki ayrı şeyi karıştırıyor (turdaki konum ve destedeki toplam). Burada tur sayacı
üstte (12/20), deste durumu oturum sonunda.

### 4.5 Oturum sonu paneli (`FlashcardResultPanel`)

- `BigNumber` ile "16 / 20 biliyorum", altında üç `StatTile`: Öğrenildi (+3), Tekrar kuyruğu (4), Sonraki tekrar ("yarın · 7 kart").
- Günlük hedef satırı: `ProgressBar` "Bugün 36 / 40 kart".
- Birincil: "Geldiğin yere dön" (Doc 49/18 ilkesi); ikincil: "Tekrarı sür · 4 kart", ghost: "Bu konudan 10 soru".

### 4.6 Tekrar edilmesi gerekenler

Ayrı ekran değil: `mode=due` kuyruğu + Çalış hapı + Bugün rotası + bildirim. Konu odasında "Bilgi kartları" satırının
rozeti "6 tekrar" bu listenin yüzüdür. (Doc 25: ekran değil reçete.)

### 4.7 Web farkları

- Kart ortada, en çok 640 px; ok tuşları ← Tekrar / → Biliyorum, Boşluk/Enter çevir, F favori, Z geri al, Esc çıkış; `KeyHint` ile ipucu.
- Fare: sürükleme yerine düğmeler ve kısayollar (sürükleme isteğe bağlı, ilk sürümde yok).
- Tablet: iki sütun (sol kart, sağ madde paneli `ArticlePeek` içeriği açık).
- Kart çevirme CSS `transform-style: preserve-3d`, `--motion-enter-ms`; reduced-motion'da token 0 ms olduğundan kendiliğinden anlık.

### 4.8 Günlük hedef ve istatistik yüzeyleri

- Ayar: Ben › Hedefler (mevcut `dailyGoal` ayarının yanına) "Günlük kart hedefi: 10 · 20 · 30 · Özel".
- Bugün: rota kalemi "Kart tekrarı · 12 kart · ~4 dk" (gerçek tamamlanma `FlashcardReviewEvent` sayımından).
- Performans sekmesi: "Bilgi kartları" bloğu (toplam / görülen / öğrenildi / tekrar / seri / konu bazlı doğruluk). Oyunlaştırma yok; rütbe ve rozet sistemi değişmez.

---

## 5. Veri modeli (Prisma; Supabase Postgres)

Tümü EKLEMELİ (Doc 49/10 kuralı): mevcut kolon ve yanıt şekli değişmez. Kimlik UUID, `@map` snake_case, yumuşak silme.

### 5.1 İçerik

```prisma
enum FlashcardKind { qa cloze numeric trap }     // soru-cevap, boşluk, sayı/süre, tuzak

model Flashcard {
  id              String          @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  topicId         String          @map("topic_id") @db.Uuid
  summaryUnitId   String?         @map("summary_unit_id") @db.Uuid   // etiket; alt konu filtresi
  legislationId   String?         @map("legislation_id") @db.Uuid
  kind            FlashcardKind   @default(qa)
  front           String                                              // soru / boşluklu cümle
  back            String                                              // cevap (kısa)
  explanation     String?                                             // markdown-lite
  difficulty      Int             @default(2)                         // 1-3
  status          ContentStatus   @default(in_review)
  sourceLabel     String          @map("source_label")                // yalnız admin
  generatedBy     String?         @map("generated_by")
  version         Int             @default(1)
  verificationStatus VerificationStatus @default(pending_review)      // mevzuat kontrolü (Doc 54 kalıbı)
  verifiedAt      DateTime?       @map("verified_at")
  staleSince      DateTime?       @map("stale_since")
  sortOrder       Int             @default(0) @map("sort_order")
  publishedAt     DateTime?       @map("published_at")
  publishedBy     String?         @map("published_by") @db.Uuid       // özetlerde eksikti; burada tutulur
  createdBy       String?         @map("created_by") @db.Uuid
  createdAt / updatedAt / deletedAt
  articles        FlashcardArticle[]
  @@index([topicId, status, sortOrder])
  @@index([summaryUnitId])
  @@index([staleSince])
  @@map("flashcards")
}

model FlashcardArticle {                 // SummaryBlockArticle kalıbı: eskime takibi
  flashcardId      String  @db.Uuid
  lawArticleId     String  @db.Uuid
  articleVersionNo Int
  relation         String  @default("primary")   // primary | related
  @@id([flashcardId, lawArticleId])
  @@index([lawArticleId])
}
```

Kart ↔ soru eşlemesi (talimat §10, ileri sürüm): `FlashcardQuestion(flashcardId, questionId, source)` N:N.
İlk sürümde tablo açılmaz; "Bu konudan soru çöz" `topicId + articleNos` ile çalışır (kartın `FlashcardArticle`
listesinden `articleNo` türetilir). Soru Merkezi (Doc 55) soruları yeni sürüm alabildiği için eşleme `questionId`
düzeyinde tutulur, `questionVersionId` düzeyinde değil.

**Deste neden tablo değil?** Talimattaki "ders geneli / alt konu bazında çalış" kapsam filtresidir; `topicId`
ve `summaryUnitId` bunu karşılar. Doc 53 F5 aynı sorunu "ünite etikettir" diye çözdü. Ayrı `flashcard_sets`
tablosu yalnız editoryal gruplama ve toplu yayın için gerekirdi; bunu `sourceLabel` + konu/ünite filtresi +
`publish-many` karşılıyor. İleride el ile derlenmiş "özel desteler" istenirse `UserList` benzeri bir tablo eklenir.

### 5.2 Kullanıcı durumu

```prisma
model FlashcardReview {                  // QuestionReview ikizi
  userId        String   @db.Uuid
  flashcardId   String   @db.Uuid
  ease          Decimal  @default(2.5) @db.Decimal(3,2)
  intervalDays  Int      @default(0)
  reps          Int      @default(0)
  lapses        Int      @default(0)
  dueAt         DateTime
  lastReviewedAt DateTime?
  lastRating    FlashcardRating?
  reviewCount   Int      @default(0)
  knownCount    Int      @default(0)
  againCount    Int      @default(0)
  @@id([userId, flashcardId])
  @@index([userId, dueAt])
  @@map("flashcard_reviews")
}

enum FlashcardRating { again known easy }

model FlashcardReviewEvent {             // geçmiş + geri al + idempotency
  id            BigInt   @id @default(autoincrement())
  userId        String   @db.Uuid
  flashcardId   String   @db.Uuid
  sessionId     String?  @db.Uuid
  clientEventId String   @db.Uuid        // istemci üretir; (userId, clientEventId) tekil → çift gönderim yok
  rating        FlashcardRating
  prevState     Json                    // geri al için önceki {ease,intervalDays,reps,lapses,dueAt,...}
  undoneAt      DateTime?
  timeSpentMs   Int?
  reviewedAt    DateTime @default(now())
  @@unique([userId, clientEventId])
  @@index([userId, reviewedAt])
  @@index([sessionId])
}

model FlashcardBookmark {                // ArticleBookmark kalıbı
  userId String @db.Uuid
  flashcardId String @db.Uuid
  createdAt DateTime @default(now())
  @@id([userId, flashcardId])
}

model FlashcardSession {                 // hafif: kaldığın yer + sonuç paneli + koç
  id          String  @id @db.Uuid
  userId      String  @db.Uuid
  mode        String                      // due|new|hard|favorites|all|mixed
  scope       Json                        // {courseId?, topicId?, unitSlug?}
  source      String                      // course_room|topic_room|study_hub|home_route|...
  queue       String[] @db.Uuid           // sunucunun kurduğu sıra
  cursor      Int     @default(0)
  startedAt / completedAt / lastActivityAt
  @@index([userId, lastActivityAt])
}
```

Kullanıcı tercihi: `User.flashcardDailyGoal Int @default(20)` (mevcut `dailyGoal` kalıbı; ayrı tercih tablosu projede yok).
Kitle: `NotificationAudience.flashcardsDueToday`, `flashcardsReviewedToday`.

**Öğrenme durumu (learning_state) saklanmaz, türetilir** (tek doğruluk kaynağı):
`new` = kayıt yok · `learning` = reps < 3 · `learned` = reps ≥ 3 ve intervalDays ≥ 7 · `due` = dueAt ≤ now (üstteki
durumlardan bağımsız bayrak) · `hard` = lapses ≥ 2 ya da lastRating = again. Eşikler `common/flashcard.constants.ts`'te,
istemciye yalnız sonuç gider.

### 5.3 Kısıtlar, indeksler, bütünlük

- FK'ler: `topicId → topics` (Restrict), `summaryUnitId → summary_units` (SetNull), kullanıcı tabloları `onDelete: Cascade`,
  `flashcardId → flashcards` (Restrict: yayından kalkan kartın ilerlemesi silinmez).
- Çift kayıt: `(userId, clientEventId)` tekil + `flashcard_reviews` upsert; aynı olay ikinci kez gelirse **aynı yanıt** döner (idempotent).
- Eşzamanlılık: olay yazımı ve durum upsert'i tek transaction; `prevState` olayda saklandığı için geri alma başka bir cihazdan gelen
  sonraki olayı ezmez (yalnız **son** olay geri alınabilir; aksi hâlde 409 `UNDO_NOT_LATEST`).
- Yayından kalkan / arşivlenen kart: `FlashcardReview` kalır, kuyruklar `status = published AND deletedAt IS NULL` süzer,
  sayımlar yalnız yayındakini sayar (özet `staleCount` kalıbı). İçerik düzeltmesi `version++`; kullanıcı durumu korunur
  (Doc 06 "silme yok, arşiv var").
- Madde metni tazelenince `FlashcardArticle.articleVersionNo` eskir → `staleSince` → admin kuyruğu; yayın `staleCount = 0` ister.
- RLS yok; izolasyon servislerde `where: {userId: actor.id}`; admin uçları `RolesGuard`.

### 5.4 Migration planı

Tek migration `20261110000000_bilgi_kartlari` (içerik + kullanıcı tabloları + `User.flashcard_daily_goal` +
`notification_audiences` iki kolon). Backfill yok (soğuk başlangıç). `connection_limit=1`, backend durdurulur, önce
`--dry-run`; `prisma migrate deploy`. Sonra `audience` yenileme işinin yeni kolonları doldurması.

---

## 6. Aralıklı tekrar algoritması önerisi

### 6.1 Mevcut motoru kullan

`srsGuncelle(onceki, isCorrect, {now, examDate, fast})` değişmez. Kart puanı → motor girdisi eşlemesi
yeni saf dosyada `flashcards/kart-srs.ts` (spec'li):

| Puan | Eşleme | Sonuç |
|---|---|---|
| Tekrar (`again`) | `isCorrect=false` | reps=0, lapses+1, 1 gün (2. lapse'te aynı gün), ease −0.20 |
| Biliyorum (`known`) | `isCorrect=true, fast=false` | 1 g → 3 g → ×ease (tavan 60 g; sınava ≤30 gün kala kalan gün), ease +0.10 |
| Kolay (`easy`, isteğe bağlı) | `isCorrect=true, fast=true` | aynı, ease +0.15 |

Böylece soru ve kart tekrarı **aynı dili** konuşur; sınava yakın aralık tavanı ve hedef sınav tarihi otomatik gelir.

### 6.2 Talimattaki beş kural nasıl karşılanıyor

- İlk öğrenilen kart kısa süre sonra yeniden: ilk "Biliyorum" → 1 gün; oturum içinde "Tekrar" denen kart **aynı oturumda
  kuyruğun sonuna** döner (oturum içi tekrar, sunucuda `queue`'ya yeniden ekleme).
- Biliyorum → aralık artar: ×ease.  Tekrar → erken gelir: 1 g / aynı gün.
- Birkaç başarılı hatırlama → öğrenildi: `reps ≥ 3 ∧ intervalDays ≥ 7` (tek doğru cevap yetmez).
- Uzun süredir çalışılmayan: `dueAt` geçince `due` kuyruğuna girer; "öğrenildi" rozeti `dueAt` geçince "tekrar zamanı"na döner.

### 6.3 Genişletilebilirlik

Motor saf ve bağımsız; ileride FSRS'e geçiş `kart-srs.ts` içinde tek noktadan yapılır, `FlashcardReview` alanları yeter
(ease/interval/reps/lapses FSRS'in stability/difficulty'sine dönüştürülebilir; olay günlüğü yeniden hesaplamaya izin verir).

### 6.4 Ücretsiz / premium (karar bekliyor, §11 karar 3)

Mevcut emsal: soru SRS havuzu ücretsizde son 7 gün, premium süresiz (Doc 24 §11, Doc 49/10). Kart için üç seçenek:

| Seçenek | Ücretsiz | Premium | Değerlendirme |
|---|---|---|---|
| **İçerik kapısı** (özetle aynı) | her dersin ilk 2 ünitesinin kartları, SRS hafızası tam | tüm kartlar | Doc 53 karar 8 ile tutarlı; "ücretsiz gerçek antrenman verir"; motor satılmaz, içerik satılır. **Önerilen.** |
| Hafıza kapısı | tüm kartlar, `due` havuzu son 7 gün | süresiz hafıza | Doc 24 §11 "tam SRS motoru premium" ilkesine birebir; ama kart ürününün çekirdeği SRS olduğundan ücretsiz deneyim topal kalır. |
| İkisi | ilk 2 ünite + 7 gün | hepsi | En kısıtlı; SEO/güven riski. |

Kilit sunucuda: kapsamdaki kartlar `locked` ise mod sayıları yalnız açık kartları sayar; kilitli üniteye girişte
`PremiumBadge` ve paywall; oturum isteği 403 `PREMIUM_REQUIRED`.

---

## 7. Web ve mobil teknik yaklaşım

### 7.1 Ortak sözleşme (API)

```
GET  /me/flashcards/overview?courseId|topicId|unitSlug     → {counts:{total,new,learning,learned,due,hard,favorites}, locked, dailyGoal:{target,done}, suggestedMode}
POST /me/flashcards/sessions  {scope, mode, limit, source}  → {sessionId, cards:[{id,kind,front,back,explanation,articles:[{no,label,slug}],bookmarked,state}], total}
POST /me/flashcards/sessions/:id/events {clientEventId, flashcardId, rating, timeSpentMs} → {state, next?, dailyGoal}
POST /me/flashcards/sessions/:id/events/:clientEventId/undo → {state}
POST /me/flashcards/sessions/:id/complete                   → {summary}
GET  /me/flashcards/sessions/resume                          → aktif oturum (kaldığın yer)
GET/POST/DELETE /me/flashcards/bookmarks[/:id]
PATCH /me/flashcards/preferences {dailyGoal}
GET  /me/flashcards/stats?courseId                           → performans bloğu
```

- Kart kuyruğu tek seferde gelir (20 kart, ~10 KB): "sonraki kartı önceden hazırlama" için ağ beklenmez; olaylar arka planda
  gider, UI beklemez (seans `submitting` kilidi + sunucu idempotency).
- Cevap ön yüzle birlikte gelir (kart sınav değil; sızma riski yok). Çevirme ağ istemez.
- `GET /me/study`, `/me/course-room/:id`, `/me/topic-room/:id` yanıtlarına **eklemeli** alanlar: `flashcards {count, due, learned, locked}`.
- Koç: `TodayTaskAction.type += 'open_flashcards'`, `RouteItemKind += 'flashcards'`, `ForYouKind += 'flashcards_due'`,
  `BugunV3Input += {flashcardsDue, flashcardsReviewedToday, flashcardDailyGoal}`; `rota()` ve `seninIcin()` dalları, spec güncellemesi.
- Günlük hedef gerçek olaydan sayılır: `count(FlashcardReviewEvent where reviewedAt ∈ bugün ∧ undoneAt null)`.
- Seri: kart olayı `DailyUsage`'a `flashcardsReviewed` olarak yazılır; seri sigortası kuralı değişmez (karar 6).

### 7.2 Mobil (Expo)

- **Jest ve animasyon:** `react-native-reanimated 4` + `react-native-gesture-handler 3` + `react-native-worklets`
  (`npx expo install`), yeni dev build ve EAS build gerekir (app.config.ts dev-client). Alternatif: RN `Animated` +
  `PanResponder` (native driver; translate/rotate/opacity ile swipe ve flip yapılabilir, ek native build yok). Öneri:
  **reanimated**; jest ve flip'in 60/120 fps'de UI thread'de koşması ve `useReducedMotion` desteği için. Projede ilk
  örnek olacağından galeriye "Hareket" bölümü eklenir ve `motion` token'ı ilk kez tüketilir. Karar §11 madde 5.
- Bileşenler (`components/domain/flashcards.tsx`, hepsi varyantlı, galeride): `FlashCard` (front/back, kind, flipped, locked),
  `FlashcardDeck` (üstteki kart + arka kart + jest + geri al), `RatingBar` (2 ya da 3 düğme), `FlashcardEntry`,
  `FlashcardModeSheet`, `FlashcardResultPanel`, `FlashcardStateBar` (üç dilimli durum çubuğu, `ui/`'ye genelleştirilebilir).
- Haptics: `notificationAsync(Success)` biliyorum, `(Warning)` tekrar, `selectionAsync` çevirme; `AccessibilityInfo.isReduceMotionEnabled` → crossfade.
- Çevrimdışı: `offline-queue.ts` genelleştirilir (`kind: 'answer' | 'flashcard_event'`); `clientEventId` istemcide üretilir;
  bağlantı gelince sırayla gönderilir; `ApiError` olan düşer. Uygulama kapanınca `sessionId + cursor` SecureStore'da; açılışta `resume`.
- Erişilebilirlik: kart `accessibilityRole="button"`, label "Soru: … · cevabı görmek için çift dokun"; arka yüzde `accessibilityLiveRegion`;
  jest yerine her zaman düğmeler; dinamik yazı `maxFontSizeMultiplier` kuralı.
- Kök Stack kaydı, `deep-links.ts` + test, Bugün `run()` dalı, `TopicActionSheet` yeni satır (`onFlashcards` prop'u), `/me/study` hapı.

### 7.3 Web (Next)

- Route `/kartlar` `(app)` altında, `FocusFrame`, `robots: {index:false}`, middleware korumalı önek. Public vitrin ilk sürümde yok (SEO
  için özet sayfaları zaten var; kartlar kişisel SRS ürünü).
- Kart `"use client"` bileşeni; CSS 3D flip; klavye kısayolları `SessionPlayer` kalıbı; `apiClient` ile olay gönderimi; `aria-live` sayaç;
  `KeyHint` ipuçları; tablette iki sütun.
- Saf yardımcılar `lib/kartlar.ts` (+ vitest): durum türetme metni, klavye eşleme, süre tahmini.
- `course-room-body.tsx` ve konu sayfasına `ToolRow`; `home-actions.ts`'e `open_flashcards`.

### 7.4 Performans

- Kuyruk tek istek, görsel yok, metin kısa; FlatList gerekmiyor (en çok 2 kart render).
- Olaylar fire-and-forget + kuyruk; kart geçişi ağdan bağımsız.
- `useQuery` anahtarları: overview kapsam bazlı; oturum bitince `roomKeys.all`, `homeKeys.brief`, `flashcardKeys.overview` geçersiz kılınır (seans kalıbı).
- DB: `(userId, dueAt)` ve `(topicId, status, sortOrder)` indeksleri; overview tek sorguyla `GROUP BY` (durum türetmesi SQL'de CASE).

---

## 8. Admin paneli entegrasyonu

### 8.1 API (`modules/admin/flashcards/`, `admin.module.ts`'e kayıt)

| Uç | Rol |
|---|---|
| `GET /admin/flashcards?courseId&topicId&unitId&status&kind&search&page` | admin, editor |
| `GET /admin/flashcards/stale`, `/stats` (yayındaki kart sayıları ders/konu bazında) | admin, editor |
| `POST /admin/flashcards` (tek kart), `PATCH /:id`, `POST /:id/archive` | admin, editor |
| `POST /admin/flashcards/import?replace` (JSON; CSV ayrıştırıcı `import-parser` kalıbıyla, `dryRun=1` önizleme) | admin, editor |
| `POST /admin/flashcards/:id/publish`, `/unpublish`, `DELETE /:id`, `POST /publish-many` | **admin** |
| `POST /:id/verification {status}` (pending_review / verified / needs_refresh) | admin, editor |

DTO'lar **class-validator sınıfı** olarak (özet modülündeki `interface` kalıbı global `forbidNonWhitelisted` pipe'ından
yararlanmıyor; bu hata tekrarlanmaz). Her işlem `AuditService.log` (`flashcard.publish` vb.) ve entity üzerinde
`publishedBy`. Toplu yayın `sentetikMi(sourceLabel)` olanları atlar (soru kuyruğu kalıbı). Feature flag:
`SETTING_KEYS.flashcardsEnabled` (varsayılan kapalı), panel Ayarlar sayfası, kullanıcı uçlarında kapı, koç `flags`.

### 8.2 Panel sayfaları (`(panel)/flashcards`)

- **Liste:** `questions/page.tsx` filtre çubuğu (ders › konu › ünite, durum, tür, arama) + `summaries/page.tsx` istatistik kartları
  (yayında / incelemede / eskimiş) + checkbox toplu yayın (`article-summaries/law/[slug]` kalıbı). Satır: ön yüz kısaltması, tür rozeti,
  madde rozetleri, `StatusBadge`, kaynak etiketi ("yalnız panelde görünür"), premium (ünite üzerinden).
- **Detay / düzenleme:** ön yüz, arka yüz, açıklama, tür, zorluk, konu/ünite seçimi, madde referansları (kanun › madde arama; sağda
  "Referans maddeler" yapışkan paneli — `summaries/[id]` kalıbı), doğrulama raporu satırları (`✗` kırmızı), mevzuat kontrolü `select`,
  karar şeridi: `canPublish = isAdmin && status !== published && staleCount === 0 && validation.ok && verificationStatus !== needs_refresh`.
- **İçe aktar:** JSON (özet kalıbı, `replace`) ve CSV (`;` ayraçlı şablon indir, dry-run önizleme, satır hataları).
- **Ortak bileşen borcu:** `Stat` kopyası ve satır içi `notice` kalıbı yerine bu modülle birlikte `components/ui.tsx`'e `Stat`,
  `Toast` (basit), `FilterBar` eklenir ve iki özet sayfası da ona geçirilir (küçük, güvenli temizlik).

### 8.3 İçerik üretim hattı

1. **Özetten türetim (önerilen ilk kaynak):** 48 ünitedeki `rule`, `numbers`, `trap`, `compare` blokları doğal kart hammaddesidir
   (ör. `numbers` satırı → `numeric` kart; `trap` maddesi → `trap` kart; `rule` → `cloze`). Betik `kart-girdi.ts` üniteyi okur,
   `kart-uret.ts` modelden `{front, back, explanation, kind, articleRefs}` ister, `kart-dogrula.ts` çekirdeği
   (`flashcards/kart-dogrulayici.ts`, `numberInTexts` yeniden kullanımı) şunları denetler: `articleRefs` zorunlu ve gerçek madde;
   `back` ve `explanation`'daki her sayı/süre referans madde metninde geçer ya da `derivedNumbers` ile türetilir; `front` tek cevaplı
   (aynı ünitede aynı `back`'e giden ikinci kart kusur); kanunda olmayan yetki/şart yok (insan incelemesi). `kart-yukle.ts` `in_review`.
2. **El ile / CSV:** editör panelden; aynı doğrulayıcı.
3. **CLAUDE.md istisnası (gerekli):** "BİLGİ KARTI model tarafından üretilebilir; madde metninin ve özetin yerine geçmez; her kart ≥1 resmî
   maddeye referans verir; sayılar betikle gösterilir; 'AI bilgi kartı' ön ekli `sourceLabel`; `in_review`; yayın kararı insanındır;
   mevzuat kontrol durumu tutulur; madde tazelenince eskir." Bu madde kullanıcı onayıyla CLAUDE.md'ye işlenir (Doc 53/54 kalıbı).

---

## 9. Güvenlik ve performans riskleri

| Risk | Önlem |
|---|---|
| Çift değerlendirme (ağ tekrarı, çevrimdışı kuyruk iki kez gönderir) | `clientEventId` tekil; aynı olay aynı yanıt; istemcide `submitting` kilidi |
| Geri alma başka cihazdaki sonraki olayı ezer | yalnız son olay geri alınır, aksi 409; `prevState` olayda |
| Yetkisiz veri erişimi | tüm `me/*` uçları `JwtAuthGuard` + `userId` süzgeci; admin uçları `RolesGuard`; servislerde ikinci rol kontrolü |
| Editör yayın yapamaz | `publish/unpublish/delete/publish-many` yalnız admin (özet kalıbı) |
| Kilidi istemcide aşma | kapsam ve kart kilidi sunucuda; oturum isteği 403 |
| Yayından kalkan kart kullanıcı kuyruğunda | kuyruk `published` süzer; ilerleme korunur; sayımlar yayındakini sayar |
| Madde değişti, kart eskidi | `FlashcardArticle.articleVersionNo` → `staleSince` → admin kuyruğu; yayın engeli |
| Kaynak etiketi sızması | public DTO'da `sourceLabel` yok; test ile kilitlenir (özet `PublicBlock` kalıbı) |
| AI kartta uydurma sayı/yetki | betik doğrulaması + mevzuat kontrol durumu + insan incelemesi; olumsuz iddialar (tuzak) yalnız insan |
| Supabase pooler 15 bağlantı | migration penceresi, `connection_limit=1`, backend durdurma |
| N+1 ve ağır overview | tek `GROUP BY` sorgusu; indeksler; 30 sn RQ staleTime |
| Yeni native bağımlılık (reanimated) | dev build + EAS; Expo 58 ile uyumlu sürümler `expo install` ile; galeride ilk örnek; geri dönüş yolu `Animated` |
| Günlük hedef sahte tamamlanma | hedef yalnız geri alınmamış olaylardan sayılır; aynı kart günde en çok 1 kez hedefe sayılır |
| Bildirim yorgunluğu | `study_reminder` kategorisi, `low` öncelik, cooldown 48 s, günlük 1, sessiz saat; preset `paused` doğar |

---

## 10. Aşamalı geliştirme planı

Her aşama kendi PR'ı, kendi testleri ve kendi doğrulaması (web 1280/375 koyu/açık, iPhone SE + 17). Tahminler iş günü.

| Aşama | Kapsam | Çıktı | Tahmin |
|---|---|---|---|
| **1 Analiz** | Bu belge | Onay | — |
| **2 Tasarım** | Figma (PaemisyonNew): giriş satırı, mod sheet'i, kart ön/arka, jest geri bildirimi, geri al, oturum sonu, Bugün kalemi, admin liste/detay; koyu + açık; bileşen sayfası | Figma düğüm kimlikleri, bu belgede §4 güncellemesi, galeri bölümü listesi | 2 |
| **3 Veri** | Prisma modelleri, migration SQL, `kart-srs.ts` + spec, `kart-dogrulayici.ts` + spec, `FlashcardsService` (overview, session, event, undo, bookmark, stats) + spec, `/me/flashcards/*`, oda/hub yanıtlarına eklemeli alanlar, feature flag | API canlı (flag kapalı), 25+ spec | 3 |
| **4 Temel kart deneyimi** | Expo: reanimated kurulumu + dev build, `FlashCard`/`FlashcardDeck`/`RatingBar`/`FlashcardEntry`/`FlashcardModeSheet`/`FlashcardResultPanel`, `/kartlar` ekranı, favori, geri al, çevrimdışı kuyruk, derin bağlantı; Web: `/kartlar`, klavye, giriş satırları; galeri | İlk pilot deste (Anayasa Yasama I, el ile 24 kart) ile uçtan uca | 5 |
| **5 Akıllı öğrenme** | Modlar (due/new/hard/favorites/all/mixed), günlük hedef (ayar, Bugün rotası, bildirim preset'i, `NotificationAudience`), Performans bloğu, koç dalları + spec, seri entegrasyonu | Bugün'de "Kart tekrarı" kalemi, bildirim | 3 |
| **6 Admin** | API admin modülü (DTO sınıfları, audit, publish-many, stale, verification), panel liste/detay/içe aktar (JSON + CSV dry-run), ayarlar bayrağı, `Stat`/`Toast`/`FilterBar` ortaklaştırma | Editör akışı; ilk 48 üniteden türetilmiş kartlar `in_review` | 4 |
| **7 Entegrasyon ve test** | "Bu konudan soru çöz" köprüsü (`source: flashcards`), hâkimiyet/koç çapraz kontrol, üretim hattı betikleri (`kart-girdi/uret/dogrula/yukle`), CLAUDE.md istisnası, test senaryoları (§16'daki 14 madde), göz testi, deploy, flag açma (önce beta rolü) | Canlı | 3 |

Toplam ~20 iş günü. Aşama 3 ve 4 paralel yürüyebilir (sözleşme §7.1 sabitlenince).

### Test planı (talimat §16 ↔ nerede)

| Senaryo | Katman |
|---|---|
| Ön/arka doğru gösterim, uzun metin, boş liste | Galeri + göz testi; web vitest `lib/kartlar.test.ts` (metin kırpma) |
| Swipe algılama eşiği, jest/dokunma çakışması | Cihaz testi (SE, Pro Max); `Gesture.Pan` `activeOffsetX` ile dokunma ayrımı |
| Favori ekle/çıkar | API spec (bookmark upsert/delete), RQ optimistic geri alma |
| İlerleme kalıcılığı, cihazlar arası | API spec; iki cihaz elle |
| SRS doğruluğu | `kart-srs.spec.ts` (mevcut `srs.spec.ts` 8 vakası + puan eşlemesi); "tek doğru yetmez" vakası |
| Aynı işlemin tekrar gönderimi | API spec: aynı `clientEventId` iki kez → tek olay, aynı yanıt |
| Bağlantı kesilmesi | offline-queue node testi; cihazda uçak modu |
| Yetkisiz erişim, editör yayın yapamaz | API spec (guard/rol) |
| Yayından kaldırılan kart | API spec: kuyrukta yok, ilerleme duruyor, sayımda yok |
| Günlük hedef ve istatistik | `flashcards.logic.spec.ts` saf hesaplar |
| Kaynak etiketi sızmıyor | API spec: public DTO snapshot |

---

## 11. Kararlar

Kullanıcı kararı (4 Kas 2026):

| # | Karar | Sonuç |
|---|---|---|
| 1 | İçerik kaynağı | **AI türetimi.** Yapı AI ile kurulur; kartlar `in_review`'a düşer, yayın öncesi kullanıcı görüp onaylar. CLAUDE.md'ye istisna maddesi yazılır (§8.3 madde 3). |
| 2 | Ders odasında giriş | **B** — "Konu oku" sheet'inde "Bilgi kartları" bölümü. |
| 3 | Premium kapısı | **İçerik kapısı** — her dersin ilk 2 ünitesinin kartları ücretsiz, SRS hafızası herkese tam. |
| 4 | Puanlama | **2 düğme** — Tekrar · Biliyorum (jestle birebir). |
| 5–8 | Animasyon altyapısı, hedef/seri, web vitrin, kart türleri | Karar verilmedi; aşağıdaki önerilen değerler varsayılır, kullanıcı aksini söylerse değişir. |

Açık maddelerin özgün listesi:

1. **İçerik kaynağı sırası:** (a) önce mevcut 48 üniteden AI türetimi + insan onayı, (b) önce el ile pilot deste, (c) ikisi birden.
   Öneri: pilot el ile (aşama 4'te deneyim için), ardından türetim (aşama 6–7). AI türetimi CLAUDE.md istisnası gerektirir (§8.3).
2. **Ders odasında giriş:** A (2×3 ızgara, 5. kutu) / **B (Konu oku sheet'inde bölüm, önerilen)**.
3. **Premium kapısı:** **içerik kapısı (ilk 2 ünite, önerilen)** / hafıza kapısı (7 gün) / ikisi.
4. **Puanlama:** 2 düğme (Tekrar · Biliyorum, önerilen; jestle birebir) / 3 düğme (+ Kolay).
5. **Mobil animasyon altyapısı:** **reanimated + gesture-handler (önerilen; yeni dev build)** / RN Animated + PanResponder (native build yok).
6. **Seri ve günlük hedef:** kart çalışması mevcut günlük hedefe (soru) mı sayılır, ayrı kart hedefi mi (önerilen: ayrı hedef, seri ikisinden biriyle korunur).
7. **Web public vitrin:** ilk sürümde yok (önerilen) / `(dual)` deste sayfası + sitemap.
8. **Kart türleri ilk sürümde:** qa + numeric + trap (önerilen) / + cloze.

Aşama 2 (Figma) başlamadan önce 5–8 için itiraz yoksa önerilen değerlerle ilerlenir; aşama 3 öncesi migration ve CLAUDE.md istisnası kullanıcı onayıyla uygulanır.

---

## Ek A — İncelenen dosyalar (seçme)

- API: `prisma/schema.prisma` (Topic 382, LawArticle 426, SummaryUnit 602, SummaryBlock 645, SummaryBlockArticle 672, SummaryProgress 686,
  ArticleSummary 704, QuestionReview 1326, Bookmark 1302, WrongAnswer 1313, UserTopicProgress 1260, Notification 2012, NotificationAudience 2137);
  `modules/quiz/srs.ts`, `quiz.service.ts:1442,1529`, `quiz/dto/start-session.dto.ts`, `quiz/yanlis-havuzu.ts`; `modules/review/*`;
  `modules/summaries/*` (`unite-eslesme.ts`, `unite-recete.ts`, `ozet-dogrulayici.ts`, `ozet-ice-aktar.ts`); `modules/admin/summaries/*`,
  `admin/questions/kaynak-turu.ts`, `admin/audit.service.ts`; `modules/coach/bugun-v3.logic.ts`, `home-v2.types.ts`, `home-v3.types.ts`;
  `modules/rooms/*`; `modules/notifications/notifications.service.ts`, `automation.presets.ts`, `deep-links.ts`; `infra/settings/settings.service.ts`;
  `common/plan.constants.ts`, `common/zayif-konu.ts`; `scripts/ozet-*.ts`; `jest.config.js`.
- Expo: `package.json`, `app/_layout.tsx`, `app/(tabs)/kutuphane/*`, `app/ozet/[slug].tsx`, `app/seans.tsx`, `app/paywall.tsx`, `app/galeri.tsx`;
  `src/components/ui/*`, `src/components/domain/{summary,seans,question,room-sheets}.tsx`; `src/features/{rooms,summaries,review,home,quiz}/`;
  `src/lib/{api,query,offline-queue,deep-links}.ts`; `src/theme/*`.
- Web: `src/middleware.ts`, `src/app/(app)/(shell)/kutuphane/**`, `src/app/(dual)/ozet/[slug]/page.tsx`, `src/app/(app)/seans/page.tsx`,
  `src/components/{ui,ozet,rooms,session,shell}/*`, `src/lib/{api,api-client,public-api,ozet,home-actions}.ts`, `src/app/globals.css`, `sitemap.ts`.
- Admin: `src/app/(panel)/{layout,summaries,article-summaries,questions,review,settings}/**`, `src/components/{ui,notifications/ui}.tsx`, `src/lib/{api,types}.ts`.
- Docs: 06, 07, 09, 15, 16, 24, 25, 26, 49 (00, 01, 03, 05, 10, 13, 14, 16, 17, 18), 52, 53 (00, 01, 04, 05), 54, 55; `packages/tokens/*`; CLAUDE.md.

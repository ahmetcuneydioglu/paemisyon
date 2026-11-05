# Doc 56 / 03 — Aşama 4: temel kart deneyimi (Expo + web) ve pilot deste

Tarih: 5 Kasım 2026. Durum: **kod yazıldı, statik denetimler temiz; pilot deste (Yasama I, 28 kart)
doğrulandı ve canlıya `in_review` yazıldı. Bayrak hâlâ kapalı (`flashcards_enabled`), yayında kart yok;
son kullanıcı hiçbir şey görmez.** Expo tarafı yeni bir dev build ister (yerel modül eklendi); cihaz
testi bu build'den sonra.

## 1. Expo (uygulama)

| Parça | Dosya | Not |
|---|---|---|
| Yerel bağımlılıklar | `apps/app/package.json` | `react-native-reanimated ^4.7.1`, `react-native-gesture-handler ~3.3.0`, `react-native-worklets ^0.13.0` (SDK 58 `bundledNativeModules` sürümleri; `expo install` proxy yüzünden çalışmadı, sürümler elle alındı). `babel-preset-expo` worklets eklentisini kendisi ekler. **Yeni dev build gerekir.** |
| Kök | `app/_layout.tsx` | `GestureHandlerRootView` sarmalı; `kartlar` ekranı `fullScreenModal`, kaydırarak geri kapalı; açılışta ve ağ gelince `flushFlashcardQueue()`. |
| Sözleşme | `src/features/flashcards/queries.ts` | API tipleri birebir (`flashcards.service.ts`), `flashcardsApi` (overview, start, resume, event, undo, complete, bookmarks), `useFlashcardOverview`, mod/tür etiketleri, `countsNote`, `sessionLine`. |
| Çevrimdışı kuyruk | `src/lib/offline-flashcards.ts` | `paemisyon/offline-flashcard-events-v1.json`; `enqueue` / `drop` (geri al henüz gitmemiş olayı düşürür) / `flush` (sırayla, ağ kesilince durur). Olay kimliği istemcide üretilir; aynı puan iki kez gitse de sunucu birini sayar. |
| Bileşen kiti | `src/components/domain/flashcards.tsx` | `FlashcardKindBadge`, `FlashcardStateBar` (öğrenildi · öğreniliyor · yeni), `FlashcardEntry`, `FlashcardModeSheet`, `FlashCard` (rotateY çevirme, reduce-motion'da opaklık), `FlashcardDeck` (`Gesture.Pan`: `activeOffsetX ±14`, `failOffsetY ±28`; eşik `max(96, %32 genişlik)` ya da hız 900; düğme puanı `useAnimatedReaction` ile aynı yönde uçurur), `RatingBar` (Tekrar · Biliyorum, 54 pt), `UndoStrip`, `FlashcardResultPanel`. React Compiler kuralları: `useDerivedValue`/`useAnimatedReaction`, effect yok; iç bileşen yok. |
| Oynatıcı | `app/kartlar.tsx` | Params `courseId \| topicId \| unitSlug` (boş = tüm kartlar), `mode`, `resume=1`, `source`, `title`. Aşamalar loading → playing → finishing → done / error. Puan: UUID olay, haptic, oturum içi tekrar (en çok 2 görünüm, sunucuyla aynı), 5 sn geri al (kuyruktan düş ya da sunucu undo), bitişte kuyruk boşaltılır sonra `complete`. Premium kapısı paywall'a, menü (şimdilik bitir · turdan çık), madde penceresi, "Bu konudan soru çöz" → `/seans` `source: flashcards` + `articleNos`. |
| Giriş noktaları | `room-sheets.tsx`, `ders/[id].tsx`, `konu/[topicId].tsx`, `kutuphane/index.tsx`, `(tabs)/index.tsx`, `deep-links.ts` | Ders odası "Konu oku" üçüncü bölüm (karar B) ve konu eylem sayfası satırı; konu odası "Bu konuda" satırı; Kütüphane "Kart tekrarı · N" çipi (vade varsa); Bugün `open_flashcards` eylemi; derin bağlantı `/kartlar`, `flashcards:<topicId>`. Sunucu sayım vermezse satır çizilmez. |
| Galeri | `app/galeri.tsx` | "Bilgi kartları (Doc 56)" bölümü: kart ön/arka, puan çubuğu, geri al şeridi, sonuç paneli örnek veriyle. |

## 2. Web (Next 16)

| Parça | Dosya | Not |
|---|---|---|
| Saf yardımcılar | `src/lib/kartlar.ts` (+vitest) | Tipler, `FLASHCARD_MODE`/`KIND` etiketleri, `kartlarHref` (resume/nonce), `kartDonusHref`, `kartKisayolu`, `requeueAgain`, `sessionLine`, `countsNote`, `hasFlashcards`, `isLockedScope`. |
| Kit | `src/components/kartlar/flashcard-kit.tsx` | `FlashCard` (CSS 3B çevirme: `.kart-cevirici`, 2×giriş süresi; reduce-motion'da token 0 ms → anlık), `RatingBar` (klavye ipuçlu), `UndoStrip`, `KoseRozeti`, `FlashcardStateBar`, `FlashcardResultPanel` (seans `ResultPanel` dili). Arka yüzde `SummaryBody` + `ArticlePeek`; madde slug'ı yoksa düz rozet. |
| Giriş + mod | `flashcard-entry.tsx` | `FlashcardEntry` (kilitliyse Premium'a bağlantı) → `FlashcardModeDialog` (açılışta `/me/flashcards/overview`; öneri birincil düğme, kaldığın yer ikincil, modlar `ListRow`). |
| Oynatıcı | `flashcard-player.tsx`, `app/(app)/kartlar/page.tsx` | `FocusFrame` L3; klavye ← → Boşluk/Enter F Z Esc (odaktaki düğmede Boşluk/Enter'a karışmaz); puan uçuşu CSS geçişi + `transitionend` + 450 ms güvenlik; geri al yoldaki olayı bekler; gönderilemeyen puanlar bitişte yeniden denenir (idempotent); çıkış onayı; özet + "Tekrarı sür" (`n` nonce) + "Bu konudan 10 soru çöz". `noindex`; query değişince remount. |
| Entegrasyon | `course-room-body.tsx`, `kutuphane/konu/[id]/page.tsx`, `kutuphane/page.tsx`, `public-api.ts`, `home-actions.ts`, `middleware.ts`, `globals.css` | Konu oku üçüncü bölüm + konu diyaloğu satırı; konu odası satırı; Kütüphane "Kart tekrarı · N" hapı (dar ekranda sarar); tipler; `open_flashcards` → `/kartlar` (yalnız bilinen anahtarlar); `/kartlar` korumalı. |

Web farkı (Doc 56/00 §4.7): kaydırma yok; düğme + klavye. Jest yalnız mobilde.

## 3. API değişikliği (bu aşamada)

Kapsamsız `overview` / `sessions` artık geçerli: `scope {}` → "Tüm kartlar" (kullanıcının erişebildiği
yayındaki tüm kartlar; kilitliler yine sayılmaz). Kütüphane "Kart tekrarı · N" ve bildirim derin
bağlantısı bunu kullanır; `dueTotal` ile aynı kümeye bakar. Spec güncellendi (43 test geçiyor).

## 4. Pilot deste — Anayasa Yasama I (md 75–86)

- Dosya: `docs/56-bilgi-kartlari/pilot/anayasa-yasama-1.json` — 28 kart: 12 kavram (`qa`), 10 sayı
  (`numeric`), 6 tuzak (`trap`). Boşluk kartı yok (karar: `cloze` sonra).
- Kaynak: yayındaki Yasama I özeti (22 blok) + canlı `law_articles` md 75–86 (+ md 101, 106 iki
  "kendiliğinden sona erme" referansı). `sourceLabel` **"AI bilgi kartı — T.C. Anayasası md 75–86"**;
  `generatedBy` türetim notu. Kaynak etiketi yanıtlara girmez.
- Doğrulama: `apps/api/scripts/kart-dogrula-uzak.ts` (yeni; DB'siz — public API ya da `--metin`
  dosyası) ile 28/28 geçti, 0 kusur; rapor `pilot/anayasa-yasama-1.dogrulama.md`. Türetilen sayılar:
  30 (`600 * 5 / 100`, md 75+78), 301 (`floor(600 / 2) + 1`, md 75+84); karşı örnek 2 ("2 yıl kala"
  tuzağı). Tuzak kartlarındaki olumsuz iddialar ("YSK yüksek mahkeme değildir", "düşürmez") betikle
  doğrulanamaz; **insan incelemesi gerekir.**
- Yükleme: bu ortamda `DATABASE_URL` yok; `kart-yukle.ts` yerine aynı satırlar Supabase SQL ile
  yazıldı (tek CTE, atomik): 28 `flashcards` (`in_review`, `pending_review`), 35 `flashcard_articles`
  (ilk referans `primary`, madde sürümü 1). Üniteye bağlı (`summary_unit_id`), konu T.C. Anayasası.
- Yayın kararı kullanıcınındır (CLAUDE.md istisnası): admin paneli aşama 6'da; o güne kadar yayın
  yalnız SQL ile (`status='published'`, `published_at`). Kullanıcıya görünmesi için ayrıca bayrak
  ya da `admin`/`beta` rolü gerekir.

## 5. Doğrulama

| Katman | Sonuç |
|---|---|
| Web | `tsc` temiz, `eslint` 0, vitest 15 dosya / 131 test, `tokens:check` 0 hata, `next build` başarılı (`/kartlar` dinamik rota). |
| Expo | `tsc` temiz, `eslint` 0, `deep-links.test.mjs` 2/2. Jest/kaydırma cihazda **denenmedi** (dev build gerekir). |
| API | `flashcards` 4 spec / 43 test, `typecheck` temiz, lint temiz. |
| Pilot | Doğrulayıcı 28/28; canlı `in_review` yazımı doğrulandı (sayım sorgusu). |

Yapılamayan: gerçek veriyle uçtan uca (bayrak kapalı, yayında kart yok, bu oturumun ağı üretim API'sine
kapalı). Aşama 7'de beta rolüyle cihaz + web göz testi.

## 6. Sıradaki (aşama 5)

~~Yapıldı (5 Kas): `04-f5-akilli-ogrenme.md`.~~ Modlar zaten sunucuda; aşama 5 = günlük hedef ayarı (`PATCH preferences`, profil), Bugün rotası
`open_flashcards` kalemi ve "Senin için" `flashcards_due` (sunucu üretir), bildirim preset'i
(`NotificationsService.enqueue`, Doc 52), Performans bloğu, koç dalları + spec, seri entegrasyonu.
Expo tarafında dev build + cihaz testi (SE / Pro Max) ilk iş.

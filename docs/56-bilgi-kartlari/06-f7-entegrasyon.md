# Doc 56 / 06 — Aşama 7: entegrasyon ve test

Tarih: 5 Kasım 2026. Durum: **yerel uçtan uca turu yapıldı (web + admin + API); iki görsel kusur
düzeltildi; cihaz testi, üretim hattı betikleri ve bayrak açma bekliyor.** Önceki: [05-f6-admin.md](05-f6-admin.md).
Aşama 1–6 PR #19 ile main'de (5 Kas 02:24 UTC); bu belge o kodun lokal doğrulamasını anlatır.

## 1. Düzenek (yerel; prod'a dokunulmadı)

| Parça | Değer |
|---|---|
| Veritabanı | Docker `paem-ozet-pg` (:55432, `paem`): Yasama I ünitesi yayında, Anayasa md 75–86 + 101/106 mevcut. `prisma migrate deploy` ile `20261105000000_bilgi_kartlari` uygulandı. |
| Deste | `scripts/kart-yukle.ts docs/56-bilgi-kartlari/pilot/anayasa-yasama-1.json` → 28 kart `in_review`, 35 referans. |
| Sunucular | launch.json `api-e2e-local` :3007, `admin-e2e` :3011, `web-doc54` :3015 (hepsi yerel DB). |
| Kimlik | Gerçek Supabase girişi (web: neilonlukas hesabı, rol `user`; admin: canahmettt, rol `admin`). |

## 2. Senaryolar ve sonuçlar

| Senaryo | Katman | Sonuç |
|---|---|---|
| Admin liste: beş istatistik (Yayında 0 · İncelemede 28 · Eskimiş 0 · Kontrol bekleyen 28 · Toplam 28), filtreler, kaynak etiketi "yalnız panel" | Panel | ✓ |
| Kart ayrıntısı: doğrulama raporu (`✓ 3 → referans metninde`), md 86 resmî metni, "Yayına hazır" kapısı, AI uyarısı | Panel | ✓ |
| Panelden tek kart yayını → durum "Yayında", `audit_logs` `flashcard.publish` 1 satır | Panel + API | ✓ (kalan 27 kart yalnız yerel DB'de SQL ile yayına alındı; prod'da 28'i de incelemede) |
| **Kapı**: bayrak kapalı + rol `user` → `POST /me/flashcards/sessions` 404 `FLASHCARDS_DISABLED`, web "Bilgi kartları henüz açık değil" | API + web | ✓ |
| **Beta yolu**: aynı kullanıcıya `beta` rolü (yerel SQL) → oynatıcı açıldı. Not: `UserSyncService` rol önbelleği 60 s; rol verildikten sonra bir dakika 404 sürer. | API | ✓ |
| Oynatıcı: 20 kart "Tüm kartlar", çevirme (düğme + Boşluk), Biliyorum → `events` 201, "Biliyorum işaretlendi · Geri al" şeridi, 2/20 | Web | ✓ |
| Her sayfa yüklemesi tek oturum açar; yeni oturum öncekini kapatır (`completed_at`) — strict-mode çift effect yalnız hatalı istekte görüldü | API | ✓ |
| "Bu konudan soru çöz" → `/seans?topicId&count=10&source=flashcards&scope=…` → `POST /quiz/sessions` 201, 10 soru, md 76/83 Anayasa soruları, şık grubu çizildi | Web + API | ✓ (ünitesiz "Tüm kartlar" kapsamında madde daraltması yok; ünite kapsamında `articleNos` gider) |
| Bugün rotası: "Kart tekrarı · 1 kart · kuyruk temiz" adımı 3. sırada, tamamlandı işareti | Web | ✓ |
| Performans: "Bilgi kartları" bloğu — Öğrenildi 0/28, Tekrar 0 (kuyruk temiz), Bugün 1/20 (henüz ölçülmedi), ders satırı "Anayasa Hukuku 0/28 öğrenildi · Çalış" | Web | ✓ (tek "Biliyorum" öğrenildi saymaz — "tek doğru yetmez" kuralı) |
| Birim | API | `flashcards` + `admin/flashcards` 5 dosya / 56 test geçti; web `tokens:check` 0 hata; admin `tsc` + eslint temiz |

## 3. Bulunan ve düzeltilen kusurlar

1. **Web oynatıcı dar ekranda taşıyordu.** `.kart-cevirici` grid'inin tek sütunu `auto` olduğu için uzun
   soru metni kartı 702 px'e açıyordu (375 ve 718 px viewport'ta yatay kaydırma, metin kesik).
   Düzeltme `globals.css`: `grid-template-columns: minmax(0, 1fr)` + `.kart-yuz { min-width: 0 }`.
   375'te kart 343 px, `scrollWidth == innerWidth`. Aşama 4'te 1280 ve `next build` doğrulanmış,
   375 göz testi yapılmamıştı.
2. **Admin liste "Konu · ünite" sütunu** 1280 px'te bile kelime kelime kırılıyordu (tablo genişliği
   ön yüze gidiyor). Sütuna `min-w-[14rem] max-w-[18rem]` + `truncate` + `title` verildi.

İkisi de commit edilmedi (bu oturumun çalışma ağacında).

## 3b. Expo — simülatör turu (5 Kas, ikinci tur)

Düzenek: `expo run:ios --no-install` (CocoaPods Ruby 4 kodlama hatası → `pod install` atlandı, Pods zaten
güncel), iPhone 17 simülatörü; `.env.local` geçici olarak `http://192.168.1.170:3007/api/v1` (Mac LAN IP'si,
telefon da aynı Metro/API'ye bağlansın diye), Metro `--host lan` :8085 (launch.json `expo-metro`; 8081–8084
başka oturumların eski Metro'larıydı). Giriş: yerel admin hesabı (bayrak kapalı, rolle geçti).

| Senaryo | Sonuç |
|---|---|
| `paemisyon://kartlar?mode=all` derin bağlantısı → oynatıcı 1/20 | ✓ |
| Dokunarak çevirme (ön → cevap, md 75 çipi, "Bu konudan soru çöz") | ✓ |
| Sağa kaydırma → `known` olayı DB'de, 2/20 | ✓ olay yazıldı, **ama yeni kart görünmedi (kusur 3)** |
| "Tekrar" düğmesi → kart kuyruğa döner (3/21), "Tekrar işaretlendi · Geri al" şeridi | ✓ (düzeltmeden sonra) |
| Bugün rotası "Kart tekrarı · 1 kart · kuyruk temiz" tamamlandı işareti | ✓ |
| Metro uyarısı | `[Reanimated] Dependencies should only be used on the web` — `useDerivedValue`/`useAnimatedReaction` bağımlılık dizileri (flashcards.tsx); zararsız, temizlenebilir. |

3. **Kaydırma sonrası yeni kart ekran dışında kalıyordu.** `FlashcardDeck`'te uçan kartın `tx/ty` paylaşılan
   değeri sarmalayıcıda yaşıyor; `FlashCard` `key={card.id}` ile yenileniyor ama sarmalayıcı `translateX =
   1,25 × genişlik`'te kalıyordu → yalnız arkadaki sade kart (rozetli) görünüyordu. Web'de aynı kusur yok
   (ayrı CSS). Düzeltme: `useAnimatedReaction` ile kart kimliği değişince `tx/ty = 0` (UI iş parçacığı,
   effect yok). Simülatörde kaydırma ve düğme yollarıyla doğrulandı. Aşama 4'te jest cihazda denenmemişti.

Telefon: Debug dev client `xcodebuild` ile derlendi (takım 3U4QPG9Q82, `SENTRY_DISABLE_AUTO_UPLOAD=true`),
`devicectl` ile kuruldu ve Metro :8085'e açıldı; göz testi kullanıcıda.

## 3c. Telefon turu ve giriş noktası kararı (6 Kas)

Telefon (iPhone 16 Pro Max, dev client) prod API'ye bağlandı; gerçek Bugün ve Çalış doğrulandı. Kullanıcı
bulgusu: kartların girişi "Konu oku" sayfasının içinde, bulunması zor. **Karar: ders sayfasına beşinci
kutu** ("Bilgi kartları", tam genişlik, üçüncü satır). Kutu yalnız sunucu `tools.flashcards` verdiğinde
çizilir (bayrak açık + derste kart var); kilitliyse Lock ikonu + "Premium · N kart" → paywall. "Konu oku"
alt yazısından "N kart" çıkarıldı. Simülatörde yerel API ile doğrulandı (28 kart → mod seçimi sayfası).
Alternatif (Yanlışlarım + Favorilerim'i "Tekrar"da birleştirip 2×2 kalmak) önerildi, kullanıcı 5 kutuyu seçti.

## 3d. Toplu yayın kararı (6 Kas)

Kullanıcı prod panelde pilot kartı toplu yayınlamak isteyince "0 kart yayınlandı · 1 atlandı: AI kaynaklı kart
toplu onaydan geçmez" aldı. **Karar: AI kaynaklı kartlar da toplu yayınlanır.** Gerekçe: toplu yayın zaten
her kartı tek tek aynı kapıdan (betik doğrulaması temiz ∧ mevzuat kontrolü "yenilenmeli" değil ∧ eskimemiş)
geçiriyor; AI'yı ayrıca dışlamak kapıyı güçlendirmiyor, yalnız 28 tıklama ekliyordu. Değişiklik:
`publishMany` AI dalı kaldırıldı (spec güncellendi), panel çubuğu seçimdeki AI kart sayısını gösterip onay
soruyor, CLAUDE.md istisna metni ve 05-f6 güncellendi. İnsan incelemesi kaldırılmadı: kapı ve "tuzak/olumsuz
iddiayı insan okur" notu kart ayrıntısında duruyor.

## 3e. İlk giriş kaydırma ipucu (6 Kas)

Kullanıcı isteği: kartların sağa-sola kaydırılabildiğini ilk kez girene göstermek. Çözüm: `FlashcardDeck`
`teaser` prop'u — ilk kart 700 ms sonra eşiğin %45'i kadar sağa (yeşil kenar + "Biliyorum" rozeti), sonra sola
(kırmızı + "Tekrar"), sonra yaylanarak yerine döner; puan düşmez (eşiğin altında). Dokunuş salınımı keser
(`onBegin` → `cancelAnimation`), jest başlamadan biterse `onFinalize` kartı yerine getirir. Hareket azaltmada
oynamaz. Görüldü bayrağı cihazda `local.flashcards-swipe-hint-seen` (`src/lib/swipe-hint-seen.ts`, intro-seen
kalıbı); oynayınca ya da dokunulunca bir daha gösterilmez. Simülatörde doğrulandı: salınım kenar/rozet/arka
kartı tetikliyor, dokunuş çevirip yerine getiriyor. Görüldü bayrağının ikinci açılışı susturması cihazda ayrıca
denenmedi (bayrak sıfırlanamadı; kalıp intro-seen ile aynı).

## 3f. Kart hata bildirimi (6 Kas)

Kullanıcı isteği: kart üstünde, favorinin yanında "hata bildir". Soru bildirimi `question_reports`'a bağlı
olduğu için kartlar için ayrı kayıt kuruldu; Soru Merkezi iletim alanları yok (kart bizim üretimimiz).

| Katman | Değişiklik |
|---|---|
| DB | `flashcard_reports` (kart, kullanıcı, mesaj, durum, çözen, tarihler); migration `20261106000000_bilgi_karti_bildirimleri`. |
| API | `POST /me/flashcards/:id/report` (yayındaki kart; aynı kullanıcının açık bildirimi varsa `alreadyReported`). Admin: `GET /admin/flashcards/reports?status&page`, `POST /admin/flashcards/reports/:id/status` (`:id` yollarından önce). Kart ayrıntısında `openReportCount`, istatistikte `openReports`. Çözüm `flashcard_report.<status>` audit'i + `flashcard_report_resolved` olayı; preset aynı adla (`question_report` kategorisi, `paused` doğar, panelden açılır; derin bağlantı `flashcards`). |
| Panel | Hata Bildirimleri sayfası iki sekme: Sorular · Bilgi kartları (`?kind=flashcards`); kart satırı kart ayrıntısına bağlanır. Kart listesinde açık bildirim şeridi, kart ayrıntısında "🚩 N açık bildirim" rozeti. |
| Mobil | Kart başlığında bayrak (44 pt); `ReportSheet` `target` ile genelleşti (soru/kart nedenleri: cevap hatalı, mevzuat güncel değil, soru belirsiz, yazım hatası); kart kodu kimliğin ilk 8 hanesi. |
| Web | Aynı bayrak; oynatıcıda neden listesi + açıklama diyaloğu, tur yerinde kalır. |

Yerel E2E: web'den "Cevap hatalı" → 201, simülatörden "Mevzuat güncel değil" → 201; panel Kartlar sekmesi ikisini
listeledi, "Çözüldü" → `audit_logs` + `app_events` satırı; kart ayrıntısında rozet göründü. Testler: flashcards 48 +
admin 11. Prod'da migration deploy ile gider; preset `paused` doğar, bildirim göndermek için panelden açılmalı.

## 3g. İlerlemeyi sıfırla (6 Kas)

Kullanıcı isteği (örnek uygulamadaki "Bilgi Kartlarını Sıfırla" uyarısı): oynatıcının "…" menüsüne
**İlerlemeyi sıfırla** eklendi (mobil: sayfa + yerel onay uyarısı, "Sıfırla" kırmızı; web: menü + onay
diyaloğu). Sunucu `POST /me/flashcards/progress/reset` (gövde kapsam; boş = tüm kartlar): kapsamdaki
kartların `flashcard_reviews` satırları silinir (hepsi "yeni"ye döner), **favoriler ve puanlama geçmişi
(`events`, seri, günlük hedef) korunur**, açık oturumlar kapatılır. İstemci ardından aynı kapsamda "Tüm
kartlar" turunu baştan açar (sıfırlanmış kapsamda "vade" modu boş kalırdı). Yerel E2E: web ve simülatörde
onay → 201 → tur 1/20'den; DB'de review 0, favori ve olay sayısı aynı. Birim: `resetProgress` testi (22/22).

## 3h. Konu bazlı kapsam etiketi + ücretsiz günlük kart hakkı (6 Kas)

**Kararlar (kullanıcı):** (1) Kartların kullanıcıya görünen birimi **konu** (kanun); ünite üretim/doğrulama
etiketi olarak arka planda kalır, kart başlığından ünite adı kalktı (mobil + web; şema değişmedi, kart zaten
konuya bağlı). Ünitelerin premium işareti beklemede. (2) Premium kapısı **günlük kart hakkı**: ücretsiz aday
günde en çok N farklı kart puanlar, Premium sınırsız; N panelden değişir.

| Katman | Değişiklik |
|---|---|
| Ayar | `flashcards_free_daily_limit` (varsayılan 20; 0 = sınırsız). Panel › Ayarlar'da sayı alanı + Kaydet (0–1000). |
| API | `dailyLimit(user, done)` → `{limit, used, remaining}` (`limit` null = Premium ya da ayar 0); sayım = bugün puanlanan **farklı** kart (günlük hedefle aynı küme, `dailyDone`). `overview` yanıtına `dailyLimit` eklendi; `startSession` kalan hak 0 ise 403 `DAILY_LIMIT_REACHED`, değilse kuyruk kalan hakla kesilir. Aynı kartı tekrar puanlamak hak tüketmez. |
| İstemci | Mod seçimi sayfası: hak dolunca modlar gizlenir, "Bugünlük kart hakkın doldu · used/limit · Yarın yeniden N kart; Premium ile sınırsız" + Premium düğmesi; açıkken alt satırda "günlük hak N kart kaldı". Oynatıcı başlatma hatası `DAILY_LIMIT_REACHED` → "Bugünlük hak doldu" + Premium düğmesi (mobil + web). |

**Yakalanan kusur (düzeltildi):** son kart puanlanınca istemci `bitir` → `complete`'i puan isteğinden ÖNCE
yolluyordu; complete önce varınca son puan 409 `SESSION_COMPLETED` ile düşüyordu (web + mobil). Düzeltme:
puan isteği yola çıktıktan sonra bitir; `bitir` yoldaki istekleri (`Promise.allSettled`) bekler.

Yerel E2E: panelden hak 2 → web ücretsiz kullanıcı: oturum 1 kartla açıldı (1 kullanılmış), 2. farklı kart
puanlanınca yeni oturum 403 ve "Bugünlük hak doldu" ekranı; simülatörde (premium işareti yerel SQL ile
kaldırıldı) mod sayfası "hakkın doldu · 5 / 2". Testler: flashcards 51/51. Yerel ayar 20'ye geri alındı.

## 4. Yapılmayan / sıradaki

- **Cihaz testi (Expo):** simülatörde temel akış doğrulandı; gerçek cihazda jest hissi, SE boyutu ve uçak
  modu kuyruğu kullanıcı göz testine kaldı.
- **Üretim hattı:** `kart-girdi.ts` / `kart-uret.ts` yazılmadı; 47 ünite için türetim ayrı karar (maliyet + inceleme yükü).
- **İki cihaz arası ilerleme, yayından kaldırılan kartın kuyruktan düşmesi:** API spec'te var, canlı denenmedi.
- **Bayrak açma sırası:** prod'da pilot kartlar panelden (tek tek ya da toplu) yayınlanır → `beta` rolüyle canlı göz testi →
  `flashcards_enabled` panelden açılır. Bildirim preset'i `flashcards_due` `paused` doğar, panelden açılır.

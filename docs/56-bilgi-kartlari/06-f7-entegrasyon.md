# Doc 56 / 06 — Aşama 7: entegrasyon ve test

Tarih: 5–6 Kasım 2026. Durum: **yerel uçtan uca tur + telefon turu yapıldı; §3b–3h özellikleri canlıda; üretim
hattı kuruldu; 60 deste (Anayasa 12, TCK 17, CMK 15, polis mevzuatı 16) denetimli olarak prod'a `in_review` yüklendi (§3i–§3l); yayın ve bayrak açma insanda.** Önceki: [05-f6-admin.md](05-f6-admin.md).
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

## 3i. Üretim hattı: Anayasa 11 ünite + pilot düzeltmesi (6 Kas)

**Karar (kullanıcı):** üretime geçildi; parti = ünite (~28 kart). Sıra Anayasa, sonra polis mevzuatı. Eşzamanlı
**denetim oturumu** (iki bağımsız denetçi agent + hakem; raporlar `denetim/<unitSlug>.md`, ilk satır
`KARAR: GEÇTİ | DÜZELT (n kart)`) prod yüklemesinin kapısıdır.

| Adım | Araç |
|---|---|
| Girdi | `docs/53-konu-ozetleri/uniteler/girdi-<slug>.json` (madde metinleri + çıkmış sorular; Doc 53 hattından hazır) + ünite özeti `uniteler/<slug>.json` (rule/numbers/trap/compare blokları hammadde). |
| Üretim | **`scripts/kart-uret.ts <girdi> <ünite> <çıktı> [--hedef 28]`** — claude-opus-5-5, 64k çıktı, `fallbacks: 'default'`; deste başlığı betikçe (`sourceLabel` "AI bilgi kartı — <kanun> md <aralık>"); model yalnız kartları yazar. |
| Stil kapısı | Aynı betikte: açıklamada taktik/şık/çürütme kalıpları (`karıştır|…|geçmez|listede yok|sorulursa`), arka yüzde `şık|çeldirici|diye bir … yok|listede yok|maddelerinde değil`. Yakalanan kart modele tek tur yeniden yazdırılır (arka yüz kusuru = kartın tamamı, aynı maddeden); hâlâ kusurluysa açıklama düşer / kart "ELLE BAK" işaretlenir. `--onar <girdi> <deste>`: var olan desteyi yalnız kapıdan geçirir. |
| Betik doğrulama | `kart-dogrula-uzak.ts` (canlı madde metni). **Yeni kural:** `counterNumbers`'taki sayı mevzuatın HİÇBİR maddesinde geçmiyorsa kusur (uydurma öğe; spec eklendi). |
| Teslim | `uretim/<unitSlug>.json` (.tmp → mv, atomik) + `uretim/<unitSlug>.dogrulama.md`. Denetim raporu GEÇTİ → `kart-yukle.ts --replace` → prod `in_review`. |
| Yayındaki kart | **`scripts/kart-yayindaki-duzelt.ts <eski> <yeni> --kartlar 2,10,… [--kopya-sil]`** — yayındaki (çalışılmış) kartı ön yüz eşleşmesiyle yerinde günceller, ilerleme korunur; refs değişmişse reddeder. |

**İstemin denetimle olgunlaşması (aynı gün, sırayla):** (a) "Ancak" istisnasını doğru kayda bağla, şık dili yasak,
Evet/Hayır koşullu, tek soru, yetki kimdeyse o (pilot raporu) → (b) sayım kartı yasak ("maddede kaç unsur sayılır?"
metinde geçmeyen sayı üretir; genel esaslar 2 kusur) → (c) açıklama yalnız refs'teki maddenin içeriği, taktik ve
"X listede yok" çürütmesi yok, sayısız cevaplı kart `qa` (Kişi hakları I) → (d) stil kapısı (sosyal-ekonomik:
kural tek başına tutmadı) → (e) tuzak ön yüzü yalnız metindeki öğeyle; kapı arka yüze; karşı örnek sayı mevzuatta
geçmeli (Yürütme II: "teminat", "ilçe", "7 gün" uydurma tuzakları). Etkisi ölçüldü: DÜZELT sayısı 8–14 karttan
(Yasama II, Kişi hakları II v1, sosyal-ekonomik v1) 0–2'ye (Yargı I/II, Genel esaslar v2, Kişi hakları II v2) indi.

| Ünite | Kart | Denetim turu | Not |
|---|---|---|---|
| Yasama I (pilot, **yayında**) | 28 | DÜZELT 7 → GEÇTİ | #13 YSK yetkisi (K1); prod'daki yayındaki kartlar `kart-yayindaki-duzelt.ts --kopya-sil` ile yerinde güncellendi (ilerleme korundu; `--replace` ile yanlışlıkla yüklenen 28 in_review kopya silindi). |
| Yasama II | 28 | DÜZELT 8 → 1 → GEÇTİ | şık dili (istem öncesi) |
| Kişi hakları I | 28 | DÜZELT 6 → GEÇTİ | #12 md 20 kişisel veri (K1) |
| Siyasi haklar | 25 | DÜZELT 4 → GEÇTİ | #10 md 69 yabancı yardım → temelli kapatma (K1) |
| Yürütme I | 28 | DÜZELT 2 → GEÇTİ | md 116 ikinci dönem |
| Yürütme II | 28 | DÜZELT 5 → 2 → GEÇTİ | uydurma öğeli tuzaklar |
| Yargı I | 28 | DÜZELT 2 → GEÇTİ | |
| Yargı II | 28 | GEÇTİ (ilk tur) | insan notu: #7 "Adalet Bakanlığı Müsteşarı" metne sadık, kurum 2018'de kalktı |
| Genel esaslar (v2) | 28 | DÜZELT 2 → GEÇTİ | v1 sayım kartları yüzünden yeniden üretildi; #19 çift kalıp çıkarıldı |
| Temel haklar rejimi (v2) | 26 | DÜZELT 4 → GEÇTİ | v1 32k'da kesilmişti; #27 çift cevap çıkarıldı |
| Kişi hakları II (v2) | 28 | DÜZELT 2 → GEÇTİ | v1 13 kusur → yeniden üretim; v2 sınav dili 1 kart |
| Sosyal ve ekonomik haklar (v2) | 28 | DÜZELT 2 → GEÇTİ | v1 14 kusur (md 56 "düzenler", memur grev) → yeniden üretim; v2 sınav dili 0 |

Prod durumu (6 Kas akşam, sayımla doğrulandı): 11 Anayasa destesi (303 kart) `in_review`; pilot (28) yayında ve 7 düzeltme `kart-yayindaki-duzelt.ts --kopya-sil` ile yerinde işlendi (kullanıcı çalıştırdı, 28 kopya silindi). 12/12 deste denetimden GEÇTİ. Model
maliyeti ünite başına ~11–30k giriş / 21–30k çıkış token (Opus). Yayın öncesi insan notları: Yasama II #5
(bütçe kanunu geri gönderme yorumu), Yargı II #7 (müsteşar), Kişi hakları I #6/#19/#22/#26 "listede yok" kısaltması.

**Sırada:** polis mevzuatı (PVSK 5, 3201 6, 7068 5, CMK 15 ünite) aynı hatla; PVSK/3201'de "Ek 6", "4/A" madde
numaraları (istem bunu zaten taşıyor); `kart-dogrula-uzak` yalnız yayındaki maddeyi okur (yayında olmayan ünite
maddesi "madde yok" sayılır).

## 3j. TCK: 17 parti, ünitesiz kip (6 Kas akşam)

**Karar (kullanıcı):** polis mevzuatı en sona; sıra TCK → CMK. TCK'nın Doc 53 ünitesi yok; `kart-uret.ts`'e
**ünitesiz kip** eklendi (`<girdi> - <çıktı> --slug --baslik`; kaynak yalnız resmî madde metni + çıkmış sorular;
deste `unitSlug` taşımaz, kartlar doğrudan konuya bağlı). Girdi `ozet-girdi.ts` ile prod'dan (salt okunur)
`docs/56-bilgi-kartlari/girdi/tck-*.json`. Partiler kanunun kısım/bölüm yapısına ve soru ağırlığına göre
(Genel Hükümler md 1–75 = soruların %54'ü → 6 parti × 30; Özel Hükümler 11 parti × 20–30).

| Parti | md | Kart | Denetim |
|---|---|---|---|
| tck-temel-ilkeler-uygulama | 1–19 | 32 | GEÇTİ (ilk tur) |
| tck-ceza-sorumlulugu | 20–34 | 31 | GEÇTİ (ilk tur) |
| tck-tesebbus-istirak-ictima | 35–44 | 27 | GEÇTİ (ilk tur) |
| tck-cezalar | 45–52 | 30 | GEÇTİ (ilk tur) |
| tck-guvenlik-tedbirleri | 53–60 | 30 | GEÇTİ (ilk tur) |
| tck-cezanin-belirlenmesi-dusmesi | 61–75 | 31 | GEÇTİ (ilk tur) |
| tck-uluslararasi-hayata-karsi | 76–85 | 27 | GEÇTİ (ilk tur) |
| tck-vucut-iskence-cocuk | 86–101 | 28 | GEÇTİ (ilk tur) |
| tck-cinsel-hurriyet | 102–124 | 31 | GEÇTİ (ilk tur) |
| tck-seref-ozel-hayat | 125–140 | 28 | GEÇTİ (ilk tur) |
| tck-malvarligi | 141–169 | 28 | GEÇTİ (ilk tur) |
| tck-genel-tehlike-kamu-sagligi | 170–196 | 25 | GEÇTİ (ilk tur) |
| tck-kamu-guveni-baris-ahlak-aile | 197–234 | 24 | GEÇTİ (ilk tur) |
| tck-ekonomi-bilisim | 235–246 | 22 | GEÇTİ (ilk tur) |
| tck-kamu-idaresi | 247–266 | 28 | GEÇTİ (ilk tur) |
| tck-adliye-karsi | 267–298 | 28 | GEÇTİ (ilk tur) |
| tck-devlete-karsi-son | 299–345, Geçici 1 | 20 | GEÇTİ (ilk tur) |

Toplam **470 kart**, 17/17 denetimden geçti, prod `in_review`. Denetim bu turda K10 (ceza miktarı: alt/üst
sınır, temel/nitelikli hal, artırım-indirim bağı, şikâyet/re'sen) sınıfıyla çalıştı; hukuki ceza hatası hiçbir
partide çıkmadı, kusurlar kapsam/ifade düzeyinde kaldı (parti başına 1–6).

**Hat değişiklikleri (TCK'dan doğdu):** (1) `ozet-dogrulayici.trNumberPattern` **binler** (0–999 999; "bin günden
onbin güne") — adlî para cezası kartları doğrulanamıyordu, spec eklendi; (2) istem: **çapraz tuzak yasak** (tuzak
aynı maddedeki iki öğenin karıştırılması; başka maddedeki sayı/hal taşınıp çürütülmez); (3) stil kapısı
`(?<!fesat )karıştır` istisnası (suç adı yanlış alarm veriyordu). Denetim önerisiyle eklenen kartlar: md 123/A
ısrarlı takip, md 191 kullanmak için bulundurma, md 245/A yasak cihaz/program, md 282 aklama, md 285 gizliliğin
ihlali.

**Yayın öncesi insan notları (TCK):** md 31/4 (7593, Ağustos 2026) çok yeni hüküm; md 63 mahsup tutarı
(500 TL) güncelliği teyit edilmeli; kısım/bölüm başlıklarına dayanan kartlar (temel ilkeler #26/#27) betikle
doğrulanamıyor; md 83/2 a–b bentleri öğretide seçimlik okunur.

## 3k. CMK: 15 ünite, ünite özetli kip (6 Kas gece)

Doc 53'ün 15 CMK ünitesi (özet + girdi hazır) aynı hatla; parti = ünite, hedef 28. Denetim K11 sınıfıyla
(süreler ve başlangıcı, yetkili merci, zorunlu/takdirî, katalog eksik-fazla) çalıştı.

| Ünite | md | Kart | Denetim |
|---|---|---|---|
| cmk-kapsam-tanimlar-gorev | 1–11 | 28 | GEÇTİ (ilk tur) |
| cmk-yetki-hakimin-reddi | 12–33 | 28 | GEÇTİ (ilk tur) |
| cmk-kararlar-sureler-taniklik | 34–38, 38/A, 39–61 | 30 | GEÇTİ (ilk tur) |
| cmk-bilirkisi-muayene-kesif | 62–89 | 28 | GEÇTİ (ilk tur) |
| cmk-yakalama-gozalti | 90–99 | 29 | GEÇTİ (ilk tur) |
| cmk-tutuklama-adli-kontrol | 100–110, 110/A, 111–115 | 28 | GEÇTİ (ilk tur) |
| cmk-arama-elkoyma | 116–128, 128/A, 129–134 | 28 | GEÇTİ (ilk tur) |
| cmk-iletisim-denetimi-gizli-sorusturmaci | 135–140, 140/A, 141–144 | 27 | GEÇTİ (ilk tur) |
| cmk-ifade-sorgu-mudafi | 145–156 | 28 | GEÇTİ (ilk tur) |
| cmk-sorusturma-kamu-davasi | 157–174 | 28 | GEÇTİ (ilk tur) |
| cmk-durusma | 175–205 | 28 | GEÇTİ (ilk tur) |
| cmk-deliller-hukum | 206–232 | 31 | GEÇTİ (ilk tur) |
| cmk-magdur-katilma-ozel-usuller | 233–259 | 30 | GEÇTİ (ilk tur) |
| cmk-kanun-yollari | 260–294, 296–307 | 29 | GEÇTİ (ilk tur) |
| cmk-olaganustu-kanun-yollari-giderler | 308, 308/A, 309–333, Ek 1, Geçici 1, Geçici 2, Geçici 3, Geçici 4, Geçici 5, Geçici 6, Geçici 7, Geçici 8 | 27 | DÜZELT 3 → GEÇTİ (Geçici 2 kartı çıkarıldı) |

Toplam **427 kart**, 15/15 denetimden geçti, prod `in_review`. Hat olayları: ana döngüde dört ünite (deliller, mağdur, kanun yolları,
olağanüstü) Anthropic API zaman aşımıyla (ETIMEDOUT, her biri ~50 dk takıldı) düştü; `uret-cmk-tekrar.sh`
(dosyası olmayan üniteleri yeniden üretir) hepsini 23:15–23:32 arasında temiz çıkardı. **Hat değişiklikleri:**
isteme "tuzak ön yüzü olumlu kalıpta, '…edilemez mi?' yok" kuralı + kapıya ön yüz olumsuz soru deseni
(…maz/mez/değil/yok/yasak + mı/midir?; yakalanan kart tamamen yeniden yazılır). Denetim önerisiyle eklenen
kartlar: md 253/3 önödeme-uzlaştırma (7571), md 230/1-b, md 231/11 ve 231/14 (HAGB, 7589).

**Yayın öncesi insan notları (CMK):** md 138/2'deki "135/6" atfı kanunda eskimiş (katalog bugün 135/8); md 94/3
1000 TL nominal; md 128'de "Hazine Müsteşarlığı" madde metnindeki adıyla; md 80/3 ve 231 (7589, Temmuz 2026)
ile md 174/1-e (7593, Ağustos 2026) çok yeni hükümler.

## 3l. Polis mevzuatı: PVSK 5 + 3201 6 + 7068 5 ünite (7 Kas gece)

Kullanıcı onayıyla son tur; Doc 53 üniteleri (özet + girdi) aynı hatla, hedef 28, zaman aşımı için
iki geçişli döngü (bu turda hiç düşmedi). Denetim K12 (yetki sahibi, bekleme süreleri, fiil-ceza eşlemesi,
mülga/dolmuş ek ve geçici maddeler) sınıfıyla çalıştı. Bu turun ayırt edici bulgusu **eskime**: 1934 (PVSK)
ve 1937 (3201) tarihli kanunların metninde kalkmış kurumlar, eski TL tutarları, mülga kanunlara atıflar ve
süresi dolmuş geçici hükümler var; model bunları yürürlükteki düzen gibi kart yapıyordu. Sonuç: 16 destede
**24 kart çıkarıldı** (TCK/CMK'da toplam 3'tü).

| Ünite | md | Kart | Denetim |
|---|---|---|---|
| pvsk-gorev-emir-kimlik | 1, 2, 4, 4/A, 5 | 27 | GEÇTİ (ilk tur) |
| pvsk-onleme-aramasi-yakalama | 9, 13, 13/A, 15, 20, Ek 2, Ek 3 | 29 | GEÇTİ (ilk tur) |
| pvsk-teskilat-genel-hukumler | 22–28, Ek 5, Ek 7, Ek 10, Geçici 2 | 24 | GEÇTİ (ilk tur) |
| pvsk-umuma-acik-yerler | 6–8, 10–12, 14, 19, 21, Ek 1, Geçici 1 | 22 | GEÇTİ (ilk tur) |
| pvsk-zor-silah-adli-gorev | 16, 17, Ek 4, Ek 6, Ek 9 | 28 | GEÇTİ (ilk tur) |
| etk-teskilat-makamlar | 1–6, 8–12 | 26 | GEÇTİ (ilk tur) |
| etk-rutbeler-teskilat-yapisi | 13, 15, 16, 20–22, 26, 35–41 | 25 | GEÇTİ (ilk tur) |
| etk-terfi-atama-cikma | 47, 51–56, 59–67 | 22 | GEÇTİ (ilk tur) |
| etk-performans-madalya-son-hukumler | 81, 82, 85–88, 90, 91, 93–98 | 24 | GEÇTİ (ilk tur) |
| etk-ek-maddeler-1 | Ek 1, Ek 2, Ek 3, Ek 4, Ek 5, Ek 6, Ek 7, Ek 8, Ek 9, Ek 10, Ek 11, Ek 12, Ek 13, Ek 14, Ek 15, Ek 16, Ek 17, Ek 18 | 28 | GEÇTİ (ilk tur) |
| etk-ek-maddeler-2-gecici | Ek 21, Ek 24, Ek 25, Ek 26, Ek 27, Ek 29, Ek 30, Ek 31, Ek 32, Ek 33, Ek 34, Ek 35, Ek 36, Ek 37, Geçici 26 | 25 | GEÇTİ (ilk tur) |
| gkdk-amac-kapsam-tanimlar | 1–6 | 25 | GEÇTİ (ilk tur) |
| gkdk-disiplin-cezalari | 7, 9–12 | 28 | GEÇTİ (ilk tur) |
| gkdk-ceza-verilecek-fiiller | 8 | 27 | GEÇTİ (ilk tur) |
| gkdk-disiplin-amirleri-kurullari | 13–26 | 28 | GEÇTİ (ilk tur) |
| gkdk-sorusturma-usulu | 27–37, 39, Geçici 1, Geçici 2 | 26 | GEÇTİ (ilk tur) |

Toplam **414 kart**, 16/16 denetimden geçti, prod `in_review`. **İstem kuralları (bu turda eklendi):** AYM iptaliyle "(…)" boşluğu
kalan fıkradan kart yok (PVSK 4/A); mülga hükme atıf yapan bentten kart yok (Ek 3/B → md 17); kalkmış kurum
(İcra Vekilleri Heyeti, Başbakanlık, umumi müfettiş…), eski TL tutarı, kalkmış düzenleme (il daimi encümeni,
Seyrüsefer Talimatnamesi, Matbuat Kanunu), 765 sayılı TCK atfı, süresi dolmuş geçici hüküm → kart yok; farklı dönem
derece numaraları md 13 cetveline eşlenmez; aynı konuyu güncel madde (3201 md 55) düzenliyorsa eski maddeden
(47, 56, 65–67) kart yok; mülga kanun adı (743 Medeni) ön yüzde çerçeve olmaz; eski kurum adına güncel karşılık
yalnız kesin ad değişikliğinde, çekim eki parantezden önce ("Dahiliye Vekilindedir (İçişleri Bakanı)").
Kapıya "md X'teki … ise" karşılaştırma kalıbı eklendi.

**7068 kararı (kullanıcı, 7 Kas 2026):** ürün polis adaylarına yönelik; Jandarma ve Sahil Güvenlik'e özgü kart olmayacak.
Beş 7068 destesinden 16 kart çıkarıldı (JGK/SGK kurulları, rütbeleri, gemi/bot istisnası, 926/3466 personel kesintisi…),
11 kartta yan cümledeki JGK/SGK ibareleri düşürüldü (124 → 118 kart). Prod'a `scripts/kart-deste-esitle.ts` ile
uygulandı: destede olmayan kartı arşivler (yayındaki 1 kart dahil), metni değişeni yerinde günceller, kısmen
yayınlanmış ünitede `--replace`'in aksine çoğaltmaz (kuru çalıştırma varsayılan, `--uygula` ile yazar). İstem kuralı
(7. madde): çok teşkilatlı kanunlarda yalnız EGM personeline ilişkin kart. Kullanıcının panelden arşivlediği kartlar
(4 adet) desteyle eşitlemede dokunulmadan bırakılır.

**Yayın öncesi insan notları (polis mevzuatı):** PVSK Ek 7'nin CMK 250 atfı (mülga, seri muhakeme olarak yeniden
yazıldı) ve md 28 İcra Vekilleri Heyeti — bu hükümlerden kart yok ama üniteler panelde okunurken bilinmeli;
PVSK zor-silah #24'teki 1481 sayılı Kanunun yürürlüğü teyit edilmeli; md 6 idari para cezası tutarları nominal.

## 4. Yapılmayan / sıradaki

- **Cihaz testi (Expo):** simülatörde temel akış doğrulandı; gerçek cihazda jest hissi, SE boyutu ve uçak
  modu kuyruğu kullanıcı göz testine kaldı.
- **Üretim hattı:** Anayasa 12 + TCK 17 + CMK 15 + polis mevzuatı 16 = 60 deste bitti (§3i–§3l); Doc 53'teki bütün üniteler kartlandı.
- **İki cihaz arası ilerleme, yayından kaldırılan kartın kuyruktan düşmesi:** API spec'te var, canlı denenmedi.
- **Bayrak açma sırası:** prod'da pilot kartlar panelden (tek tek ya da toplu) yayınlanır → `beta` rolüyle canlı göz testi →
  `flashcards_enabled` panelden açılır. Bildirim preset'i `flashcards_due` `paused` doğar, panelden açılır.

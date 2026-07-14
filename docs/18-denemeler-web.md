# Doc 18 — "Denemeler" Web Uygulaması: Analiz ve Yeniden İnşa Planı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-14
> **Girdi:** Eski Harmedya sitesi (`paemisyoncom/`) tam kod analizi + `paemmisy_mvc.sql` şeması + mevcut platform (Doc 1-17).
> **Kapsam:** Son kullanıcıya açık, tarayıcıdan deneme sınavı çözülen web uygulaması. **Admin paneli DEĞİL.**
> **Kural:** Onay gelmeden kod/migration/route değişikliği YOK.

---

## 1. Mevcut Yeni Projenin Durumu

### 1.1 Teknoloji yığını
| Katman | Teknoloji | Durum |
|---|---|---|
| Backend | NestJS + TypeScript + Prisma + Supabase Postgres (Frankfurt) | Canlı, 9 modül |
| Kimlik | Supabase Auth (ES256/JWKS) — **tüm istemciler ortak** | Canlı |
| Mobil | Flutter (iOS; Android ileride) | Canlı |
| Admin panel | Next.js 16 App Router + TS + Tailwind v4 + TanStack Query (`apps/admin`, :3001) | Canlı |
| Web (son kullanıcı) | **YOK — bu görevde kurulacak** | — |

### 1.2 Denemeler için hâlihazırda kullanılabilir parçalar
- **Quiz motoru:** `QuizSession` zaten `exam` modunu destekliyor: sunucu-taraflı değerlendirme, `plannedDurationSeconds` (sunucu süre denetimi + tolerans), doğru cevap sızdırmama, cevap upsert (idempotent, parça parça kayıt), `complete` ile skor/istatistik.
- **Soru sürümleme = hazır snapshot:** `QuizAnswer.questionVersionId` çözülen sürümü sabitler; sürümler immutable. Eski sistemin "soru sonradan değişirse geçmiş bozulur" problemi mimaride çözülmüş durumda.
- **Ortak kullanıcı/istatistik:** UserStats, Streak, WrongAnswer, Bookmark, DailyUsage, liderlik (`/progress/leaderboard`), premium (`Entitlement` + guard).
- **Admin:** soru bankası (sürümlü + onay kuyruğu + toplu onay + toplu import), katalog ağacı, kullanıcılar, soru bildirimleri, audit log.

### 1.3 Eksik olanlar (bu görevin işi)
1. **Deneme (Exam) varlığı:** küratörlü sabit soru seti, zamanlama penceresi, yayın durumu — `ekip_sinav`'ın modern karşılığı yok. Mevcut "deneme sınavı" ders havuzundan rastgeledir; eski ürün ise **belirli saatte başlayan, herkese aynı, sıralamalı canlı deneme**dir. Bunlar farklı ürünler; ikisi de yaşayacak.
2. **Web istemcisi** (`apps/web`) — hiç yok.
3. Admin'de **Denemeler yönetimi** ekranı.
4. Deneme-bazlı sıralama ucu.

---

## 2. Eski Denemeler Modülünün Tam Envanteri

### 2.1 Dosyalar ve mimari
- MVC-vari: `app/Pages/default/*.php` (controller) + `app/Themes/default/*.php` (view) + `app/Jquery/default/*.php` (AJAX, `Jquery/index.php?page=X` üzerinden).
- Modül dosyaları: `sinavlar`, `sinav`, `sinav-sonuc`, `siralama`, `lider-tablosu`, `sorular`, `soru-oner` (+ AJAX: `sinav`, `sinav-anlik`, `sinavanlikkayit`, `sinav-sonuc`, `sinav-sonuc-anlik`, `anasayfasinavlar`, `soru-oner`).
- Ortak: `header.php`/`footer.php` (tüm popuplar + timer/otomatik bitirme JS'i footer'da), `app/Helper/*`, `custom.js`/`main.js` (AJAX form sistemi), `jquery.countdown`.
- ⚠️ Kök `index.php` + `.htaccess` bu kopyada YOK (routing davranışı kullanımdan çıkarıldı — §10 açık soru).

### 2.2 Route haritası (kimlik = sayısal id, permalink yok)
| URL | Ekran |
|---|---|
| `/` | Ana sayfa: bir sonraki denemeye geri sayım + son 5 deneme |
| `/sinavlar` | Deneme listesi (son 50) |
| `/sinav/{sinav_id}` | Sınav çözme (giriş zorunlu) |
| `/sinav-sonuc/{cevap_id}` | Sonuç + cevap inceleme (id = **katılım** id'si) |
| `/siralama/{sinav_id}` | Deneme sıralaması (ilk 3 podyum + tablo) |
| `/lider-tablosu` | Genel liderlik (tüm denemelerin ortalaması) |
| `/sorular/{sinav_id}` | Sınav sonrası soruları serbest görüntüleme (cevapsız; `sinav_sorularacik=1` ise; girişsiz erişilebilir) |
| `/soru-oner` | Kullanıcıdan soru önerisi (admin onayına düşer) |

### 2.3 Veritabanı (prefix `ekip_`)
- **`sinav`**: adı, `sinav_zaman` (unix başlangıç), `sinav_sure` (dk — **küresel pencere**), `sinav_kredi` (kredi bedeli), `sinav_anliksonuc` (cevaplarken anında doğru göster 0/1), `sinav_sorular` (**PHP-serialized soru id dizisi**), `sinav_sorularacik` (sonrası serbest görüntüleme 0/1).
- **`soru`**: kök, A-E, doğru (1-5), kategori, seviye, not (açıklama), durum (0=onay bekler — soru-öner buraya düşer).
- **`sorukategori`**: hiyerarşik + **`sk_katsayi`** (yüzde ağırlık → gpuan).
- **`cevap`**: kullanıcı+sınav başına 1 katılım — doğru/yanlış sayıları, `cevap_puan`, `cevap_gpuan` (katsayılı), `cevap_durum` (0=devam, 1=bitti). **Zaman damgası YOK.**
- **`cevaplar`**: cevaplanan soru başına 1 satır (soru, seçim 1-5, sonuç 0/1). Boş bırakılan sorunun satırı yok.
- **`uyeler`**: `uye_kredi` (sınav kredisi), md5 parola, çerezle kimlik.

### 2.4 İş akışı (kodda doğrulanmış)
1. **Liste:** 3 zaman durumu — *Başlamadı* (turuncu, pasif) → *Sınavı Başlat / Devam Ediyor* (yeşil) → bitti: *Sıralama* + *Sorular* + kullanıcı katıldıysa kendi sonucuna link.
2. **Başlatma:** giriş zorunlu; ilk girişte `cevap` satırı açılır ve **kredi düşülür** (`uye_kredi -= sinav_kredi`); kredi yetersizse "YETERSİZ KREDİ — mobil uygulamadan yükleyin". Bitirilmiş katılım → sonuca yönlendirme (**tekrar çözme yok**).
3. **Çözme:** tüm sorular tek sayfada, 2 sütun, 6'şarlı bloklar; şık işaretlenince **tüm form AJAX'la upsert edilir** (parça parça kayıt = yarıda kalırsa devam). `anliksonuc=1` ise cevaplanan sorunun doğrusu+açıklaması anında gösterilir.
4. **Süre:** pencere **küreseldir** (`zaman+süre` herkese aynı bitiş; geç giren az süre alır). Sayaç istemcide; her saniye poll eden uç, pencere kapanınca sunucuda finalize edip sonuca yönlendirir.
5. **Bitirme:** "Testi Bitir" → onay popup'ı → finalize (`cevap_durum=1`).
6. **Sonuç:** Puan/Doğru/Yanlış/Boş 4 kutu + tüm soruların renkli incelemesi (yanıt, doğru, açıklama).
7. **Puanlama (tutarsız!):** `puan = doğru − yanlış/4` hesaplanıp **çoğu yolda atılıyor**; saklanan `cevap_puan=doğru`, `cevap_gpuan=Σ(1+katsayı/100)`; sıralama gpuan'a göre sıralanıp puan gösteriyor; süresi geçmiş otomatik bitirme yolu ise NET saklıyor. Üç yol üç farklı sonuç.

### 2.5 Taşınmayacak zayıflıklar (yeni sistemde bilinçli yok)
Çerezde çıplak `uye_id` (tam taklit açığı) · AJAX uçlarında **kredisiz katılım açığı** · SQL injection yüzeyi · istemci güdümlü süre/bitirme · canlı modda cevap anahtarının pencere kapanmadan sızması · tutarsız puanlama · katılım zaman damgasının olmaması · 230 satırlık kopyala-yapıştır render bloğu.

---

## 3. Ekran Karşılaştırma Tablosu

| Eski route | İşlev | Korunacak tasarım | Yeni route | API | Mevcut parça | Yeni parça | Durum |
|---|---|---|---|---|---|---|---|
| `/` | Geri sayım + son denemeler | Sayaç + lacivert tablo | `/` (web app kökü) | `GET /exams` | — | Countdown, ExamTable | **Uyarlanacak** |
| `/sinavlar` | Deneme listesi | Lacivert başlıklı zebra tablo, 3-durumlu `btn2` butonlar | `/denemeler` | `GET /exams` | — | ExamTable, StateButton | **Korunacak** |
| `/sinav/{id}` | Sınav çözme | 2 sütun + orta çizgi, bar-şıklar (A-E rozetli), sabit alt bar + sarı sayaç pili + kırmızı "Testi Bitir" | `/sinav/[examId]` | `POST /exams/:id/start` + mevcut `answers`/`complete` | Backend quiz motoru | ExamRunner, Timer, OptionBar, FinishDialog | **Korunacak** |
| `/sinav-sonuc/{id}` | Sonuç + inceleme | Lacivert başlık + 4 renkli kutu (Puan/Doğru/Yanlış/Boş), renkli inceleme | `/sonuc/[attemptId]` | `GET /exams/attempts/:id` | — | ResultTiles, ReviewList | **Korunacak** |
| `/siralama/{id}` | Deneme sıralaması | İlk-3 podyum + tablo | `/siralama/[examId]` | `GET /exams/:id/leaderboard` | Liderlik deseni | Podium, RankTable | **Korunacak** |
| `/lider-tablosu` | Genel liderlik | Podyum + tablo | `/lider-tablosu` | mevcut `GET /progress/leaderboard` genişletilir | ✅ backend var | aynı bileşenler | **Uyarlanacak** |
| `/sorular/{id}` | Sonrası serbest görüntüleme | Aynı soru düzeni, şıklar pasif | `/denemeler/[examId]/sorular` | `GET /exams/:id/questions` | — | ReviewList (cevapsız mod) | **Korunacak** |
| `/soru-oner` | Soru önerisi | Form düzeni | `/soru-oner` | `POST /questions/suggest` (yeni) → onay kuyruğu | Admin onay kuyruğu ✅ | SuggestForm | **Uyarlanacak** |
| Kredi sistemi | Sınav başına kredi | — | — | — | Premium/Entitlement ✅ | — | **Kaldırılması önerilir** (→ §10 karar) |
| `/giris` + popup | md5+çerez auth | Popup görünümü | `/giris`, `/kayit` (sayfa) | Supabase Auth | ✅ ortak kimlik | AuthForm | **Uyarlanacak** (güvenlik) |
| — | Geçmiş denemelerim | (eskide YOKTU — eksik davranış) | `/profil/denemelerim` | `GET /me/exam-attempts` | QuizSession geçmişi | AttemptHistory | **Yeni** |

---

## 4. Tasarım Sadakat Planı

### 4.1 Birebir korunacaklar (tasarım kimliği)
- **Renkler:** lacivert `#052c5c` (nav) / `#173f71` (başlık/thead) / `#082243`; yeşil `#60b500`; kırmızı `#ce3d3d`; **sarı sayaç pili `#ffcb08`**; mavi (boş) `#5792ff`; zemin `#f7f7f7`; metin `#444`.
- **Tipografi:** Rubik (başlık/nav/buton, 500/700) + Open Sans (gövde) — `next/font/google` ile aynı aileler.
- **Butonlar:** köşesiz (radius 0), 3px kendi renginde kenarlık, **hover'da renk tersine döner**; tablo aksiyon butonları (`btn2`) turuncu/yeşil/kırmızı, hover'da 5px radius + gölge animasyonu.
- **Deneme listesi:** kart değil **tablo** — lacivert thead, zebra satırlar, sağa yaslı aksiyon hücresi, 3-durumlu butonlar.
- **Sınav ekranı:** iki sütun soru düzeni + ortada 2px dikey ayraç + `examShadow.png`; şıklar tam-genişlik bar (**A. B. C.** harf rozeti başta), seçili=koyu gri, doğru=yeşil, yanlış=kırmızı; **sabit alt bar**: ortada kırmızı "Testi Bitir", sarı sayaç pili (Rubik 26px), çevrimiçi sayısı.
- **Sonuç:** lacivert başlık bandı + 4'lü kutu şeridi (Puan lacivert · Doğru yeşil · Yanlış kırmızı · Boş sarı), altta renkli soru incelemesi. Sonuç sayfasında üst nav'ın gizlenmesi davranışı.
- **Başlıklar:** `head2` (tam genişlik lacivert bant) ve `head3` (ikonlu ortalanmış 24px) desenleri.
- **İkonlar:** Icomoon font dosyaları (`assets/icon/fonts/`) aynen taşınır — `icon-test`, `icon-timer` vb. birebir aynı glifler.
- **Görseller:** `examShadow.png`, logolar, favicon seti kopyalanır.

### 4.2 Responsive için uyarlanacaklar (görünüm bozulmadan)
- Bootstrap 4 grid → aynı container genişlikleri ve `col-md-6` kırılım davranışıyla modern CSS (Tailwind ile aynı ölçüler); eski 4 kırılım (1199/991/768/576) korunur.
- Mobilde soru sütunları alt alta + orta ayraç gizlenir (eskisi de böyleydi — aynı).
- **Eski kusur düzeltmesi (bildiriyorum, §10):** mobilde tablo satırları bloklaşırken sütun başlıkları kayboluyordu → hücrelere data-label eklenerek aynı görünümde başlık korunur.
- jQuery `.pop` modalları → aynı görünümde erişilebilir React dialog (focus trap, ESC).
- `jquery.countdown` → aynı `HH:MM:SS` sarı pil görünümlü React timer (sunucu saatiyle senkron).

### 4.3 Teknik nedenle değişecekler (görsel etki minimal)
- md5+çerez giriş popup'ı → Supabase Auth sayfası/dialog'u (aynı renk/buton diliyle).
- "YETERSİZ KREDİ" ekranı → kredi kalkarsa premium/paywall mesajına dönüşür (§10 kararına bağlı).
- İnline PHP renkleri → merkezi token'lar; SweetAlert/toastr → aynı hisste tek toast bileşeni.
- HelveticaNowDisplay font ailesi temada var ama CSS hiç kullanmıyor → taşınmaz (teyit edilecek).

### 4.4 Cihaz davranışı
Masaüstü birincil (eski deneyim birebir); tablet=masaüstü düzeni daralmış; mobil=eski media-query davranışları + yukarıdaki tablo düzeltmesi; retina için SVG/2x varlıklar.

---

## 5. Yeni Bilgi Mimarisi ve Route Planı

### 5.1 Uygulama konumu: **yeni `apps/web` (ayrı Next.js uygulaması)** — önerilen
Neden admin'e route olarak değil:
- Subdomain hedefi (`deneme.paemisyon.com`) → ayrı deployment/paket şart; ayrı app ile taşınma = yalnız DNS+env değişikliği.
- Admin dahili/korumalı; web SEO'lu, herkese açık, bambaşka tasarım dili. Karışma riski sıfırlanır.
- Monorepo zaten `apps/*` düzeninde — **yeni tooling gerekmez**, en düşük riskli yol. Yerel port: **:3002**.

### 5.2 Route ağacı (eski Türkçe URL geleneği korunur)
```
/                     → Denemeler ana sayfası (geri sayım + liste)     [public, SEO]
/denemeler            → tam liste                                       [public, SEO]
/sinav/[examId]       → sınav çözme                                     [giriş zorunlu, noindex]
/sonuc/[attemptId]    → sonuç + inceleme (yalnız sahibi)                [giriş zorunlu, noindex]
/siralama/[examId]    → deneme sıralaması                               [public, SEO]
/lider-tablosu        → genel liderlik                                  [public, SEO]
/denemeler/[examId]/sorular → sınav sonrası serbest görüntüleme         [public, noindex]
/soru-oner            → soru önerisi                                    [giriş zorunlu]
/profil/denemelerim   → geçmişim                                        [giriş zorunlu, noindex]
/giris  /kayit        → kimlik (Supabase)                               [public, noindex]
```
SEO: public sayfalarda SSR + metadata/OG/canonical; deneme listesi `ItemList` yapılandırılmış veri. Oturum/sonuç sayfaları `noindex` + yetki sunucuda.

### 5.3 Teknik yığın (mevcuda uyum)
Next.js (App Router) + TS + Tailwind v4 + TanStack Query (admin ile aynı aile). **Tek yeni bağımlılık: `@supabase/ssr`** (SSR'da güvenli cookie-oturum — admin'deki salt-client yaklaşım SEO'lu sayfalar için yetmez; gerekçeli). Zod zaten backend'te; web'de form doğrulaması için hafif kullanılır. State: TanStack Query + yerel state (ekstra kütüphane yok).

---

## 6. Veri Modeli (Prisma ekleri — migration ONAY SONRASI)

Çakışma yok; mevcut tablolar değişmiyor (QuizSession'a 1 opsiyonel kolon + 1 enum değeri eklenir).

```prisma
model Exam {                     // eski ekip_sinav'ın modern karşılığı
  id               String   @id @db.Uuid
  title            String
  description      String?
  startAt          DateTime               // pencere başlangıcı (küresel — eski davranış)
  durationMinutes  Int
  isPremium        Boolean  @default(false)  // eski kredi yerine (→ §10 karar)
  liveAnswerReveal Boolean  @default(false)  // eski anliksonuc (güvenlik notu §10)
  questionsOpenAfterEnd Boolean @default(true) // eski sorularacik
  status           ContentStatus @default(draft) // draft/published/archived (mevcut enum)
  sortOrder        Int      @default(0)
  createdBy        String?  @db.Uuid
  questions        ExamQuestion[]
  sessions         QuizSession[]
}

model ExamQuestion {             // sabit soru seti (eski serialized dizinin ilişkisel hali)
  examId            String @db.Uuid
  questionId        String @db.Uuid
  questionVersionId String @db.Uuid   // YAYIN ANINDA sabitlenir → tarihsel bütünlük
  sortOrder         Int
  @@id([examId, questionId])
}

// QuizSession'a ek:  examId String? + QuizMode enum'una `deneme`
// + kısmi unique index (userId, examId) WHERE examId IS NOT NULL  → tekrar çözme sunucuda engelli
```

**Neden `QuizSession` yeniden kullanılıyor (yeni attempt tablosu değil):** cevap kaydı/idempotency/skorlama/istatistik/iOS geçmişi **otomatik ortak** olur — webde çözülen deneme iOS profilinde görünür (platform sürekliliği şartın). Sıralama `QuizSession(examId, completed)` üzerinden hesaplanır; ayrı `rankings` tablosu V1'de gereksiz (katılımcı ölçeğinde sorgu ucuz, index'lenir).

**Eski kusurların çözümü:** zaman damgaları var (startedAt/completedAt) · boş/yanlış ayrımı net · sürüm sabitleme ile soru değişse de geçmiş bozulmaz · pencere sonu **sunucuda** denetlenir (mevcut `EXAM_TIME_OVER` mekanizması yeniden kullanılır) · finalize idempotent.

**Puanlama (standardizasyon, §10 onayına bağlı):** `net = doğru − yanlış/4` tek formül, her yerde aynı; sıralama net'e, eşitlikte süreye göre. Katsayı (gpuan) V1'de yok.

---

## 7. API Sözleşmesi (NestJS — tüm istemciler ortak)

| Uç | Amaç | Yetki | Girdi | Dönüş | Notlar |
|---|---|---|---|---|---|
| `GET /exams` | Liste + durum | Public (opsiyonel JWT → `myAttempt`) | `?page` | id, title, startAt, durationMinutes, questionCount, state(upcoming/active/ended), participantCount, avgScore, isPremium, myAttempt{id,status} | SSR'dan çağrılır; cevap anahtarı asla yok |
| `GET /exams/:id` | Detay | Public | — | üstteki + description | 404 draft için |
| `POST /exams/:id/start` | Başlat/devam et | JWT | — | session + sorular (exam-safe) + `endsAt` | Pencere kontrolü; premium kapısı; bitmişse 409 `EXAM_ALREADY_TAKEN`; devam eden varsa **aynı set + verilmiş cevaplar** döner (yenileme/cihaz değişimi güvenli). İdempotent |
| `POST /quiz/sessions/:id/answers` | Cevap kaydet | JWT | mevcut DTO | mevcut | **MEVCUT — değişmez.** deneme modunda geri bildirim dönmez (exam gibi); pencere aşımı `EXAM_TIME_OVER` |
| `POST /quiz/sessions/:id/complete` | Bitir | JWT | — | skor özeti | **MEVCUT** + deneme finalize kuralları; idempotent (ikinci çağrı aynı sonucu döner) |
| `GET /exams/attempts/:id` | Sonuç + inceleme | JWT (yalnız sahibi) | — | skor kutuları + soru-soru inceleme (doğru+açıklama) | **Yalnız pencere kapandıysa VEYA attempt bitmişse**; IDOR koruması |
| `GET /exams/:id/leaderboard` | Sıralama | Public | — | podyum + tablo + benim sıram | Pencere kapanmadan boş döner |
| `GET /exams/:id/questions` | Serbest görüntüleme | Public | — | sorular (cevap anahtarsız) | `questionsOpenAfterEnd && ended` şartı |
| `GET /me/exam-attempts` | Denemelerim | JWT | — | geçmiş listesi | — |
| `POST /questions/suggest` | Soru önerisi | JWT | Zod/class-validator DTO | `{queued:true}` | `in_review` + `suggestedBy`; rate limit; admin onay kuyruğuna düşer |
| **Admin:** `GET/POST/PATCH /admin/exams`, `POST /admin/exams/:id/publish`, `PATCH .../questions` (bağla/sırala), `GET .../results` | Deneme yönetimi | admin (editor: taslak) | — | — | Publish anında sürüm sabitlenir + ≥1 soru şartı; audit log |

Ortak kurallar: doğrulama sunucuda (class-validator), hata zarfı mevcut format, cevap anahtarı yalnız (a) attempt bitmiş VEYA (b) pencere kapanmış iken servis edilir; `liveAnswerReveal` yalnız pencere içinde tek-soru bazında (varsayılan kapalı).

---

## 8. Admin Paneli Entegrasyonu

**Yeterli olanlar (dokunulmaz):** soru bankası + sürümleme + onay kuyruğu + toplu import (deneme soruları buradan seçilir), kullanıcılar, audit, soru bildirimleri.

**Eklenecekler (mevcut görsel dil — Tailwind kart/tablo/rozet aynı):**
1. **Denemeler** (menüde Onay Kuyruğu'nun altına, 📝): liste (başlık, tarih/saat, süre, soru sayısı, durum rozeti, katılımcı) + oluştur/düzenle formu (başlık, açıklama, tarih-saat, süre dk, premium, canlı sonuç, sonrası-açık) + **soru seçici** (konu filtresi/arama → yayınlanmış sorulardan ekle-çıkar-sırala) + Yayınla/Yayından Kaldır (onay diyaloglu).
2. **Deneme sonuçları:** deneme detayında katılımcı listesi (puan/doğru/yanlış/boş/süre) + özet istatistik.

**Genişletilecek:** Dashboard'a "yaklaşan deneme" kartı (opsiyonel, Faz 6).

---

## 9. Uygulama Planı (onay sonrası; her faz commit + testli)

| Faz | Kapsam | Kabul kriteri |
|---|---|---|
| **1. İskelet + tasarım sistemi** | `apps/web` (Next :3002), font/renk token'ları, Icomoon+varlık taşıma, header/footer/nav kabuğu, route iskeleti, Supabase SSR auth | Tüm route'lar boş-durumla açılır; giriş/çıkış çalışır; görsel kabuk eski siteyle yan yana ayırt edilemez |
| **2. Veri modeli + Exam API** | Migration (Exam, ExamQuestion, QuizSession.examId), `GET /exams`, start/complete deneme kuralları | E2E: pencere durumları, tekrar-çözme 409, premium kapısı, sürüm sabitleme |
| **3. Liste + ana sayfa** | Tablo, 3-durumlu butonlar, geri sayım, SEO metadata | Eski ekranla birebir görünüm; state geçişleri canlı |
| **4. Sınav oturumu** | Çözme ekranı (2 sütun, bar şıklar, sarı sayaç, sabit alt bar), parça parça kayıt, devam/yenileme, otomatik bitirme, bitir onayı | Yenile/sekme kapat/ikinci cihaz senaryoları veri kaybetmez; süre sunucuda kesilir; E2E yeşil |
| **5. Sonuç + sıralama + geçmiş** | Sonuç kutuları, inceleme, deneme sıralaması, lider tablosu, denemelerim, sınav-sonrası sorular | Skorlar sunucu kaynaklı; IDOR testleri; sıralama pencere-sonrası açılır |
| **6. Admin entegrasyonu** | Denemeler CRUD + soru seçici + yayın + sonuç görünümü | Panelden uçtan uca deneme kurulup webde çözülür; audit kayıtlı |
| **7. Cila** | Responsive/erişilebilirlik/klavye, boş-hata-yükleme durumları, soru-öner, rate limit, widget/birim/E2E test seti | Lighthouse a11y ≥90; kritik akış testleri CI-koşulabilir |
| **8. Yayın hazırlığı** | `deneme.paemisyon.com` env ayrımı, CORS, güvenlik başlıkları, sitemap/robots, prod build | Ayrı deploy tek env değişikliğiyle; güvenlik kontrol listesi kapalı |

---

## 10. Riskler ve Açık Sorular (kararların gerekli)

1. **Kredi ekonomisi:** Eskisi kredi ile çalışıyordu (satın alma yalnız mobil uygulamadan). Platform artık freemium+premium. **Önerim:** kredi taşınmasın; deneme başına `isPremium` bayrağı (ücretsiz/premium). Onaylıyor musun?
2. **Puan formülü:** Eski kod 3 yolda 3 farklı puan üretiyor (çoğunlukla puan=doğru sayısı; net formül hesaplanıp atılıyor; katsayılı gpuan sıralamada). **Önerim:** tek standart — `net = doğru − yanlış/4`, sıralama net + eşitlikte süre; kategori katsayısı V1'de yok. Uygun mu, yoksa puan=doğru sayısı mı kalsın?
3. **Canlı cevap gösterimi (`anliksonuc`):** pencere kapanmadan cevap anahtarını sızdırıyor (kopya riski). **Önerim:** özellik dursun ama varsayılan KAPALI + admin uyarısı. Uygun mu?
4. **Eski deneme/sonuç verileri:** sorular taşınmadığından eski denemeler ve sonuçları da **taşınmasın**, temiz başlansın öneriyorum (kullanıcılar zaten paem705'ten geliyor; web üyeleri taşınmıyor kararına uyumlu). Onay?
5. **Zamanlama modeli:** eski davranış korunuyor (küresel pencere — canlı deneme hissi). İleride "her an başlat, kişisel süre" tipi denemeler istenirse model buna hazır (startAt=null varyantı) ama V1'de yok. Uygun mu?
6. Kök front-controller dosyası eski kopyada yok → URL davranışları kullanımdan çıkarıldı (davranışı etkilemiyor; sadece not).
7. `sinav_durum` (taslak) bayrağını eski ön yüz hiç kontrol etmiyordu → yeni sistemde `status=published` şartı her uçta zorunlu (bilinçli düzeltme).
8. Rate limiting platformda henüz yok → Faz 7'de `@nestjs/throttler` ile (yeni bağımlılık, gerekçeli).
9. Icomoon/`examShadow.png` üretim lisansı size ait varsayılıyor (eski siteniz) — aynen taşınacak.
10. Mobil tablo düzeltmesi (§4.2) dışında eski tasarımda bozuk öğe değiştirilmeyecek; başka bozukluk çıkarsa önce sana sorulacak.

# Doc 7 — API Tasarımı

> **Durum:** Onaya sunuldu · **Sürüm:** 0.1 · **Tarih:** 2026-07-11
> **Girdi:** Doc 3 (NestJS), Doc 6 (şema). Auth detayı Doc 8'de derinleşir.
> **Kapsam:** REST sözleşmesi — konvansiyonlar, güvenlik kuralları, endpoint kataloğu, kritik akışlar.

---

## 1. Neden REST (GraphQL değil)

| Kriter | REST | GraphQL |
|---|---|---|
| Solo geliştirici basitliği | ✓ | ağır |
| HTTP cache (katalog) | ✓ kolay | zor |
| OpenAPI otomatik sözleşme | ✓ | kısmi |
| Öngörülebilir güvenlik yüzeyi | ✓ | karmaşık |

**Karar: REST + OpenAPI.** Sözleşme NestJS'ten otomatik üretilir; Flutter ve admin tip-güvenli istemci üretebilir.

## 2. Konvansiyonlar

| Konu | Kural |
|---|---|
| Base URL | `https://api.paemisyon.com` |
| Versiyon | URL'de: `/api/v1/...` (kırıcı değişiklik → `/v2`) |
| Format | JSON (`Content-Type: application/json; charset=utf-8`) |
| Auth | `Authorization: Bearer <access_token>` |
| Dil | `Accept-Language: tr` (çok-dile hazır) |
| Metodlar | GET (oku), POST (oluştur/işlem), PATCH (kısmi güncelle), DELETE (arşivle) |
| Durum kodları | 200/201/204, 400 (doğrulama), 401 (kimlik), 403 (yetki/premium), 404, 409 (çakışma), 422, 429 (limit), 500 |
| İsimlendirme | kaynak çoğul, `kebab` yok → `snake` alanlar (`created_at`) |
| Zaman | ISO-8601 UTC |

### 2.1 Standart yanıt zarfı
Tekil kaynak:
```json
{ "data": { "id": "…", "name": "…" } }
```
Koleksiyon (cursor sayfalama):
```json
{ "data": [ … ], "meta": { "next_cursor": "…", "has_more": true } }
```
Hata (tüm hatalarda tutarlı):
```json
{ "error": { "code": "SUBSCRIPTION_REQUIRED", "message": "Bu içerik premium aboneliğe özeldir.", "details": null, "trace_id": "…" } }
```
> Hata `code`'ları istemci tarafından programatik işlenir; `message` kullanıcıya gösterilir (Türkçe, moral bozmayan).

### 2.2 Sayfalama & filtreleme
- **Cursor tabanlı** (`?cursor=…&limit=20`) — büyük listelerde tutarlı.
- Filtre: `?module_id=…&difficulty=medium`.

### 2.3 Cache
- Katalog (modül/ders/konu) nadir değişir → `ETag` + `Cache-Control`. İstemci `If-None-Match` ile 304 alır.

### 2.4 Idempotency (offline senkron güvenliği)
- Yazma işlemlerinde (özellikle cevap gönderimi) `Idempotency-Key: <uuid>` başlığı. Aynı anahtarla tekrar gelen istek çift işlenmez → offline kuyruğun çift göndermesi güvenli.

### 2.5 Hız sınırı
- Kimlik endpoint'lerinde sıkı rate limit (brute-force koruması); genel API'de makul limit → `429` + `Retry-After`.

---

## 3. Güvenlik Kuralları (sözleşme düzeyinde)

1. **Sınav modunda doğru cevap sızmaz.** `GET .../questions` sınav/practice başlarken **`is_correct` ve `explanation` alanlarını döndürmez**. Değerlendirme sunucuda; doğru cevap yalnızca cevap gönderildikten sonra (öğrenme modu) veya oturum bitince döner.
2. **Premium kararı sunucuda.** İstemci premium içeriğe erişmeye çalışırsa `403 SUBSCRIPTION_REQUIRED`. İstemci "premium'um" iddiasında bulunamaz.
3. **Freemium limiti sunucuda.** Günlük limit dolduğunda cevap gönderimi `403 DAILY_LIMIT_REACHED`.
4. **Yetkilendirme her istekte.** JWT guard + gerektiğinde `RolesGuard` (admin/editör) ve `SubscriptionGuard`.
5. **Hiçbir secret istemcide yok** — tüm hassas işlem (makbuz doğrulama, AI çağrısı) sunucuda.

---

## 4. Endpoint Kataloğu

### 4.1 Auth (`/api/v1/auth`) — detay Doc 8
| Metod | Yol | Açıklama |
|---|---|---|
| POST | `/register` | e-posta kayıt |
| POST | `/login` | e-posta giriş → access+refresh |
| POST | `/apple` | Apple ile Giriş (token doğrulama) |
| POST | `/google` | Google ile Giriş |
| POST | `/refresh` | access token yenileme |
| POST | `/logout` | refresh iptal |
| POST | `/password/forgot` | sıfırlama e-postası |
| POST | `/password/reset` | yeni parola |
| POST | `/migrate/claim` | göç: eski kullanıcı ilk giriş → zorunlu şifre belirleme |

### 4.2 Users (`/api/v1/me`)
| GET | `/me` | profil + entitlement özeti |
| PATCH | `/me` | profil güncelle |
| POST | `/me/devices` | push token kaydet |
| DELETE | `/me` | hesap silme (KVKK) |

### 4.3 Catalog (`/api/v1/catalog`) — cache'li, okuma
| GET | `/modules` | aktif modüller |
| GET | `/modules/:id/courses` | modülün dersleri |
| GET | `/courses/:id/topics` | dersin konuları (is_premium dahil) |
| GET | `/topics/:id` | konu detayı + soru sayısı |

### 4.4 Quiz (`/api/v1/quiz`) — çekirdek
| POST | `/sessions` | oturum başlat (mode, topic_id) → session + sorular (doğru cevapsız) |
| POST | `/sessions/:id/answers` | tek cevap gönder (idempotent) → sonuç (moda göre) |
| POST | `/sessions/:id/complete` | oturumu bitir → skor + özet |
| GET | `/sessions/:id` | oturum durumu (devam için) |

### 4.5 Progress (`/api/v1/progress`)
| GET | `/summary` | genel istatistik (user_stats) |
| GET | `/topics` | konu bazlı ilerleme/mastery |
| GET | `/streak` | streak durumu |
| GET | `/history` | geçmiş oturumlar (sayfalı) |

### 4.6 Review (`/api/v1/review`)
| GET | `/bookmarks` | favoriler |
| POST/DELETE | `/bookmarks/:questionId` | ekle/çıkar |
| GET | `/wrong-answers` | yanlışlarım |
| POST | `/sessions` | yanlışlar/favorilerden tekrar oturumu |

### 4.7 Subscription (`/api/v1/subscription`)
| GET | `/plans` | planlar (free/monthly/yearly) |
| GET | `/status` | entitlement (is_premium, valid_until) |
| POST | `/verify` | **makbuz doğrulama** (provider, receipt) → sunucu doğrular, entitlement günceller |
| POST | `/restore` | satın alımları geri yükle |

### 4.8 Daily & Engagement
| GET | `/api/v1/daily/question` | günün sorusu |
| GET | `/api/v1/notifications` | bildirim listesi |
| POST | `/api/v1/notifications/:id/read` | okundu |

### 4.9 AI (`/api/v1/ai`) — V1'de aktif
| GET | `/study-plan` | kişisel çalışma planı |
| POST | `/study-plan/regenerate` | yeniden üret |
| GET | `/recommendations` | önerilen konular |

### 4.10 Admin API (`/api/v1/admin`) — ayrı yetki
Content yönetimi (modül/ders/konu/soru CRUD + sürüm + yayın akışı), kullanıcı yönetimi, abonelik görünümü, istatistik, push gönderimi. `RolesGuard(admin|editor)` zorunlu. Next.js panel yalnızca bunları çağırır. (Panel tasarımı Doc 9.)

---

## 5. Kritik Akışlar (örnek istek/yanıt)

### 5.1 Oturum başlatma (doğru cevap sızmaz)
`POST /api/v1/quiz/sessions`
```json
{ "mode": "exam", "topic_id": "…", "question_count": 20 }
```
Yanıt `201`:
```json
{ "data": {
  "session_id": "…",
  "mode": "exam",
  "questions": [
    { "question_id": "…", "version_id": "…", "stem": "…",
      "media_url": null,
      "options": [ {"id":"…","label":"A","text":"…"}, … ] }
  ]
}}
```
> Dikkat: `is_correct`, `explanation` **yok**. Sınav modunda doğru cevap sunucuda kalır.

### 5.2 Cevap gönderme (idempotent, sunucu değerlendirir)
`POST /api/v1/quiz/sessions/:id/answers`
`Idempotency-Key: <uuid>`
```json
{ "question_id": "…", "version_id": "…", "selected_option_id": "…", "time_spent_ms": 8200 }
```
Yanıt — **practice modunda** (anlık öğrenme):
```json
{ "data": { "is_correct": false, "correct_option_id": "…", "explanation": "…", "legal_reference": "2559 s. PVSK md.4" } }
```
Yanıt — **exam modunda** (sona ertelenir):
```json
{ "data": { "recorded": true } }
```
Limit dolduysa: `403 { "error": { "code": "DAILY_LIMIT_REACHED", … } }`

### 5.3 Oturum bitirme
`POST /api/v1/quiz/sessions/:id/complete` → skor, doğru/yanlış/boş, süre, konu ilerleme güncellemesi (hepsi sunucuda hesaplanır).

### 5.4 Abonelik doğrulama
`POST /api/v1/subscription/verify`
```json
{ "provider": "apple", "receipt": "<base64>" }
```
→ Backend Apple Server API ile doğrular → `subscriptions` + `entitlements` günceller → yanıt `is_premium: true, valid_until`. İstemci bu yanıta göre UI kilidini açar ama **kaynak sunucudur**.

---

## 6. Sürümleme & Geriye Uyumluluk
- `/v1` sabit; kırıcı değişiklik `/v2` açar, `/v1` bir süre yaşar.
- Alan **eklemek** kırıcı değil; alan **kaldırmak/tip değiştirmek** kırıcıdır → yeni sürüm.
- İstemci minimum sürüm zorlaması: `GET /api/v1/app/config` → `min_supported_version` (eski istemciyi güncellemeye yönlendirme).

## 7. Gözlemlenebilirlik & Sözleşme
- Her yanıt `trace_id` taşır (log korelasyonu).
- OpenAPI şeması CI'da doğrulanır; kırıcı değişiklik testte yakalanır.
- Postman/Bruno koleksiyonu + otomatik üretilen Dart & TS istemcileri.

## 8. Vizyona hizmet (özet)
| İlke | API karşılığı |
|---|---|
| Backend tek gerçek kaynak | Değerlendirme/limit/premium hep sunucuda |
| Android'de sıfır değişiklik | İstemci-agnostik REST + versiyonlama |
| Güvenlik | Doğru cevap sızmaz, secret yok, guard'lar |
| Offline dayanıklılık | Idempotency-Key ile güvenli senkron |
| Premium UX | Cache + tutarlı hata + hızlı yanıt |

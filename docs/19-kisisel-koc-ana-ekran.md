# Doc 19 — Kişisel Koç Ana Ekranı ("Bugün benim için ne var?")

> Durum: TASLAK — onay bekliyor
> Bağımlılık: Doc 6 (öğrenme motoru), Doc 12 (mevcut Home), Doc 15 (AI entegrasyonu), Doc 18 (Denemeler)

## 1. Felsefe

Ana ekran bir dashboard DEĞİLDİR; kullanıcının kişisel eğitim merkezidir.
Kullanıcı uygulamayı açtığında istatistik değil, **yol gösterici öneriler** görür.
Ekran yaşayan bir ekrandır: her gün, kullanıcının gerçek verisine göre değişir.

Turnusol testi (her tasarım kararında): *"Bu ekran kullanıcının yarın tekrar
uygulamayı açmasını sağlar mı?"*

## 2. Mimari ilke: Koç sözleşmesi (AI-hazır)

**Kartlar sunucudan gelir; istemci hiçbir kural bilmez.**

- v1: deterministik **kural motoru** (saf fonksiyonlar, test edilebilir).
- v2+ (Doc 15): kural motorunun yerine/yanına **AI Eğitim Koçu** geçer.
- Sözleşme (`CoachCard`) değişmediği için istemciler (iOS/Android/web) hiç değişmez.

Bu, "bütün mimari AI'ya uygun kurulmalı" şartının karşılığıdır: AI bir ekran
özelliği değil, aynı sözleşmeyi dolduran daha akıllı bir üreticidir.

### 2.1 Veri modeli AI-hazır mı? (envanter)

| İhtiyaç (AI analizi) | Kaynak | Durum |
| --- | --- | --- |
| Çözülen sorular, D/Y, süre, saat | `quiz_answers` (answeredAt, timeSpentMs, isCorrect) | ✅ var — doğal olay günlüğü |
| Zayıf konular | `user_topic_progress.mastery` | ✅ var |
| Tekrar havuzu | `wrong_answers` (wrongCount, resolvedAt) | ✅ var |
| Çalışma alışkanlığı/seri | `streaks`, `daily_usage` | ✅ var |
| Deneme performansı | `quiz_sessions(mode=deneme)` | ✅ var |
| Konu bazlı **trend** ("bu hafta %12 arttı") | — | ➕ `topic_mastery_snapshots` (haftalık fotoğraf) |
| Kişisel hedef | — | ➕ `users.daily_goal` (varsayılan 20) |
| Rozetler | — | ➕ `badges` + `user_badges` |

Yeni tablolar yalnız ➕ satırları; olay günlüğü İCAT EDİLMEZ, `quiz_answers` zaten odur.

## 3. Backend: `GET /me/coach`

Tek istek; Home'un tüm içeriği. Mevcut `/me/dashboard` geriye uyum için kalır
(İlerlemem ve eski istemciler), Home artık `/me/coach` kullanır.

```jsonc
{
  "greeting": { "displayName": "Ahmet", "isPremium": false },
  "today": {                     // Bugün hero'su
    "goal": 20, "answered": 12,  // hedef halkası
    "streak": { "current": 7, "longest": 12, "atRisk": false }
  },
  "primaryAction": {             // ekrandaki TEK birincil CTA
    "type": "continue_exam", "label": "Denemeye devam et", "route": "/denemeler/abc"
  },
  "cards": [                     // öncelik sıralı, en fazla 4
    {
      "type": "exam_today", "priority": 90,
      "title": "Bugünkü canlı deneme 20.00'de",
      "body": "Genel Mevzuat Deneme 4 · 40 soru · 60 dk",
      "cta": { "label": "Hatırlat", "route": "/denemeler" },
      "meta": { "examId": "…", "startAt": "…" }
    },
    {
      "type": "quick_review", "priority": 70,
      "title": "Yanlışlarından 5 soruluk hızlı tekrar hazır",
      "cta": { "label": "Tekrara başla", "route": "/review" }
    }
  ],
  "gamification": {
    "nextBadge": { "key": "streak_7", "name": "7 Gün Seri", "progress": 5, "target": 7 },
    "records": { "bestNet": 18.25, "longestStreak": 12, "maxDailyQuestions": 45 },
    "weekly": { "activeDays": 4, "goalDays": 5 }
  }
}
```

### 3.1 Kural motoru (v1 kuralları — hepsi GERÇEK veriden)

`CoachContext` (tek `Promise.all` ile toplanır) → her kural saf fonksiyon:
`(ctx) => CoachCard | null`. Kartlar önceliğe göre sıralanır, ilk 4 döner.
`primaryAction` = en yüksek öncelikli kartın CTA'sı (yoksa "Çalışmaya başla").

| # | type | Tetik (veri) | Örnek metin | Öncelik |
| --- | --- | --- | --- | --- |
| 1 | `exam_live` | Aktif deneme var, katılmamış | "Canlı deneme şu an devam ediyor" | 100 |
| 2 | `exam_in_progress` | Yarım deneme oturumu | "Denemen yarım kaldı — devam et" | 95 |
| 3 | `exam_today` | Bugün başlayacak yayında deneme | "Bugünkü canlı deneme 20.00'de" | 90 |
| 4 | `streak_risk` | Dün aktifti, bugün 0 soru, saat ≥ 18 | "Bugün çalışmazsan 7 günlük serin bozulacak" | 85 |
| 5 | `goal_remaining` | 0 < kalan ≤ hedefin yarısı | "Hedefini tamamlamak için 8 soru kaldı" | 75 |
| 6 | `quick_review` | Çözülmemiş yanlış ≥ 5 | "Yanlışlarından 5 soruluk tekrar hazır" | 70 |
| 7 | `weak_topic` | En düşük mastery (çözülen ≥ 10, mastery < 0.5) | "Ceza Hukuku'nda zorlanıyorsun — 10 soruyla güçlendir" | 65 |
| 8 | `course_trend` | Snapshot: geçen haftaya göre ±%10 | "Bu hafta Genel Mevzuat başarın %12 arttı" | 60 |
| 9 | `daily_quiz` | Günün quizi oynanmamış | "Bugünkü quiz seni bekliyor" | 55 |
| 10 | `badge_near` | Sıradaki rozete ≤ %20 kaldı | "7 Gün Seri rozetine 2 gün kaldı" | 50 |
| 11 | `new_exam` | Son 48 saatte yayınlanan deneme | "Yeni deneme yayınlandı" | 45 |
| 12 | `comeback` | Son aktiviteden ≥ 3 gün | "Seni özledik — 5 soruluk ısınmayla dön" | 40 (tek başına) |
| 13 | `motivation` | Hiçbir kural tetiklenmediyse | "Harika gidiyorsun — serini koru" | 10 |

Kurallar `apps/api/src/modules/coach/rules/*.rule.ts` — her biri ayrı dosya,
her birinin unit testi var. Yeni kural eklemek = yeni dosya (open/closed).

### 3.2 Şema ekleri

```prisma
// users tablosuna:
dailyGoal Int @default(20) @map("daily_goal")   // kullanıcı ayarlayabilir

model Badge {                    // katalog (seed ile ~10 rozet)
  key        String @id          // streak_7, first_exam, solved_100…
  name       String
  description String
  threshold  Int                 // eşik (gün/soru/deneme sayısı)
  kind       BadgeKind           // streak | solved | exam | accuracy
  sortOrder  Int
}

model UserBadge {
  userId    String
  badgeKey  String
  earnedAt  DateTime @default(now())
  @@id([userId, badgeKey])
}

model TopicMasterySnapshot {     // haftalık fotoğraf → trend kartları + AI
  userId    String
  topicId   String
  weekStart DateTime @db.Date
  mastery   Decimal  @db.Decimal(4, 3)
  solved    Int
  @@id([userId, topicId, weekStart])
}
```

Rozet verme: `completeSession` sonunda + streak güncellemesinde kanca
(senkron, tek sorgu). Snapshot: haftalık cron (Pazartesi 03:00) — v1'de
basit bir korumalı endpoint + zamanlanmış görev.

## 4. Ana ekran (mobil) düzeni

Yukarıdan aşağı:

1. **Selam + seri chip'i** — "İyi akşamlar, Ahmet" + 🔥7 (dokununca seri detayı)
2. **Bugün hero'su** — hedef halkası (12/20), altında `primaryAction` (tek dolu buton)
3. **Koç kartları** — en fazla 4; ikon + başlık + kısa gövde + hafif CTA;
   kart tipine göre ikon/renk (deneme=mavi, tekrar=teal, risk=amber)
4. **Rozet rafı** — sıradaki rozet ilerleme çubuğuyla ("7 Gün Seri · 5/7")
5. **Kompakt istatistik şeridi** — Çözülen · Doğruluk · Oturum (detay → İlerlemem)
6. Hızlı erişim + Premium CTA (mevcut)

Görsel dil: Denemeler yeniden tasarımıyla aynı (Doc 18 uygulaması):
tek accent (blue400), rozet/etiketler ramp çiftleriyle, kademeli giriş
animasyonu, basınca 0.98 scale, halka dolum animasyonu.

## 5. Fazlar

| Faz | İş | Çıktı |
| --- | --- | --- |
| 1 | Şema + migration + seed (rozet kataloğu) | prisma migrate |
| 2 | CoachService + 13 kural + unit testler + `GET /me/coach` | API hazır |
| 3 | Rozet kancaları (completeSession/streak) + snapshot görevi | gamification canlı |
| 4 | Mobil Home yeniden yazımı (koç ekranı) | yeni ana ekran |
| 5 | Cihazda E2E doğrulama + rötuş | teslim |

Web: şimdilik yalnız Denemeler var; koç ekranı web'e paemisyon.com açılışında
taşınır (aynı `/me/coach` ucu — sıfır backend işi).

## 6. Bilinçli sınırlar (v1'de YOK)

- LLM tabanlı plan üretimi → Doc 15 (sözleşme hazır, üretici sonra değişir)
- Türkiye sıralaması değişim kartı ("124 kişi yükseldin") → sıralama snapshot'ı
  gerektirir; deneme sayısı artınca eklenecek
- Seviye/XP sistemi → rozetler oturduktan sonra (çocukçalaşma riski yönetilerek)
- Push bildirim → bildirim altyapısı ayrı iş (spam değil, günde en fazla 1)

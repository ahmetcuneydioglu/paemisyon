# Doc 49/18 — Testler: dersi baştan sona, 20'şer soruluk sabit setler

Durum: **ONAYLI (1 Kas 2026) — uygulanıyor**
Figma (PaemisyonNew `91lHqxSXl25Gz585TnXqfi`, koyu): `111:385` Soru çöz seçimi, `111:471` Testler
(premium), `111:635` Testler (ücretsiz); Test kartı bileşeni `110:405`.

## 1. Kullanıcı kararları (1 Kas 2026)

1. Test **ders** düzeyinde (Anayasa Hukuku: 1001 soru → 51 test).
2. Her test **20 soru**.
3. Ücretsiz planda yalnız **Test 1** açık; diğerleri Premium.
4. Akıllı tur (koç, 10 soru) kalır; "Soru çöz" ikisini sunar.

## 2. İlke: test kararlıdır

"Test 3'ü bitirdim" iki ay sonra da doğru olmalı. Bu yüzden:

- Bir soru **bir kez** bir teste atanır ve orada kalır (`course_test_questions.question_id` tekil).
- İlk atama konu sırasıyla yapılır (üst konu `sortOrder`, ardından alt konular; konu içinde
  `createdAt`, `id`) — testler konu konu ilerler, ekranda konu başlığıyla gruplanır.
- Sonradan yayına giren soru **son testi** 20'ye tamamlar, sonra yeni test açar; eski testler değişmez.
- Çekilen/silinen/iptal edilen soru servis edilirken düşer; test yeniden doldurulmaz (19 soruluk test olur).
- Atama günlük cron (05:10 TR) ve ilk dolum betiğiyle yapılır; ders başına danışma kilidi (advisory lock).

## 3. Veri

```
course_tests            (id, course_id, number, topic_id [başlık konusu], created_at) — (course_id, number) tekil
course_test_questions   (test_id, question_id [tekil], position)
quiz_sessions.course_test_id  (nullable) — testten açılan oturum
```

Kullanıcı ilerlemesi için tablo yok; oturumlardan türetilir:
- **tamamlandı**: testin tamamlanmış oturumu var (yüzde = en iyi skor)
- **devam ediyor**: testin yarım (`in_progress`) oturumu var (cevap/toplam)
- **kilitli**: `number > 1` ve kullanıcı premium değil (karar sunucuda)
- **kapsama**: kullanıcının o derste cevapladığı farklı soru sayısı / dersin yayındaki soru sayısı

## 4. API

- `GET /me/course-tests/:courseId` → `{ course, totalQuestions, seenQuestions, testCount,
  completedTests, next, premiumLocked, sections: [{ heading, from, to, tests: [{ id, number,
  questionCount, state, pct, answered, sessionId }] }] }`. Bölüm = aynı başlık konusuna sahip ardışık testler.
- `POST /quiz/sessions` yeni alan `courseTestId`: yalnız `practice`, başka kapsamla verilmez; soru
  sırası testin sırası (karıştırılmaz); ücretsizde Test 1 dışı `403 PREMIUM_REQUIRED`, Test 1'de
  premium konu soruları süzülür. "Tek aktif tur" kuralı geçerli.
- `GET /me/course-room/:id` → `tools.tests { count, completed, inProgressNumber }` (seçim sayfası alt yazısı).
- Yarım tur adı: "Test 3 · Anayasa Hukuku" (Bugün ve Çalış "Kaldığın yer").
- Kaynak: `course_test`.

## 5. Expo

- Ders odası "Soru çöz" kutusu → **seçim sayfası** (Akıllı tur / Testler).
- Yeni ekran `kutuphane/testler/[courseId]`: kapsama paneli, "Sıradaki" şeridi (`ResumeStrip` etiketli),
  ücretsizde premium şeridi, konu başlıklı 2 sütun `TestCard` ızgarası.
- Kart dokunuşu: devam → `resume`; tamamlandı/başlanmadı → yeni tur; kilitli → paywall.
- Web bu fazın dışında (kullanıcı önce telefonda görmek istedi).

## 6. Yayın sırası

1. Migration (yalnız ekleme: iki tablo + nullable kolon) — Railway deploy'u `migrate deploy` koşar.
2. İlk dolum betiği `scripts/ders-testleri-ata.ts` (`connection_limit=1`) — canlı DB'ye yazar, **kullanıcı onayıyla**.
3. API + Expo; telefonda Release kurulumu.

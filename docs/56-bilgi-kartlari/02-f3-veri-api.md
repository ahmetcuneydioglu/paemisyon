# Doc 56 / 02 — Aşama 3: veri modeli ve API

Tarih: 5 Kasım 2026. Durum: **kod yazıldı, testler geçti; migration DOSYASI hazır, veritabanına
UYGULANMADI (kullanıcı onayı bekler). Bayrak kapalı: `flashcards_enabled` (panel › Ayarlar).**

## 1. Ne yapıldı

| Parça | Dosya | Not |
|---|---|---|
| Prisma modelleri | `apps/api/prisma/schema.prisma` | `Flashcard`, `FlashcardArticle`, `FlashcardReview`, `FlashcardReviewEvent`, `FlashcardBookmark`, `FlashcardSession`; enum `FlashcardKind`, `FlashcardRating`; `User.flashcardDailyGoal` (vars. 20). Eklemeli; `prisma format` hizalaması dışında mevcut model değişmedi. |
| Migration | `prisma/migrations/20261105000000_bilgi_kartlari/migration.sql` | Elle yazıldı; `prisma migrate diff` çıktısıyla birebir (32 DDL ifadesi). Uygulama: backend durdurulur, `connection_limit=1`, `prisma migrate deploy`. Backfill yok. |
| SRS eşlemesi | `src/modules/flashcards/kart-srs.ts` (+spec) | `again`→yanlış, `known`→doğru, `easy`→doğru+hızlı; motor `quiz/srs.ts` aynen (sınava yakın tavan dahil). |
| Saf mantık | `flashcards.logic.ts` (+spec) | Öğrenme durumu türetme (`new` / `learning` / `learned`, `due`, `hard`), mod sayımları, önerilen mod, kuyruk kurma (6 mod), oturum içi tekrar, oturum özeti, günlük hedef sayımı. |
| Doğrulayıcı | `kart-dogrulayici.ts` (+spec) | `ozet-dogrulayici` sayı çekirdeğiyle: referans zorunlu ve gerçek madde; cevap+açıklamadaki her sayı madde metninde / formülle türetilmiş / karşı örnek; boşluk kartı işareti; uzunluk; aynı cevaba giden ikinci kart kusur. |
| İçe aktarma | `kart-ice-aktar.ts`, `scripts/kart-yukle.ts`, `scripts/kart-dogrula.ts` | Deste JSON → doğrula → `in_review`. `sourceLabel` "AI bilgi kartı" ya da "Editör" ön ekli. `--replace` yalnız yayımlanmamış ve çalışılmamış aynı kaynaklı kartları yeniler. |
| Servis + uçlar | `flashcards.service.ts` (+spec), `flashcards.controller.ts`, `dto/flashcards.dto.ts`, `flashcards.module.ts` | class-validator DTO'lar (global `forbidNonWhitelisted` ile uyumlu). |
| Bayrak | `infra/settings/settings.service.ts`, `admin.controller.ts`, admin `settings/page.tsx` | `flashcardsEnabled` varsayılan **kapalı**; kapalıyken yalnız `admin` ve `beta` görür (mobilAnasayfaV2 kalıbı). |
| Oda alanları | `rooms.service.ts`, `rooms.controller.ts` | `course-room.tools.flashcards`, konu satırı `flashcards`, `topic-room.flashcards`, `study.totals.flashcardsDue`. Bayrak kapalı ya da kart yoksa **null** (istemci satır çizmez). |
| Seans köprüsü | `quiz/dto/start-session.dto.ts` | `source: 'flashcards'` kabul edilir; "Bu konudan soru çöz" mevcut `{topicId, articleNos}` sözleşmesiyle çalışır. |

Testler: 4 yeni spec, 43 test; tüm API paketi 70 spec / 696 test geçti. `typecheck` (api, admin) ve değiştirilen dosyalarda lint temiz.

## 2. API sözleşmesi (`/api/v1/me/flashcards/*`, JWT)

| Uç | Gövde / sorgu | Yanıt |
|---|---|---|
| `GET overview?courseId\|topicId\|unitSlug` | kapsam (en az biri) | `{scope{courseId,topicId,unitSlug,label}, counts{total,new,learning,learned,due,hard,favorites,locked}, locked, suggestedMode, dailyGoal{target,done}, resume{sessionId,mode,remaining}\|null}` |
| `POST sessions` | `{scope, mode, limit?≤50, source?}` | `{sessionId, mode, scope, cards[], total, counts}`; 403 `PREMIUM_REQUIRED` (kapsamın tamamı kilitli), 404 `NO_CARDS` |
| `GET sessions/resume` | — | taze (24 s) yarım oturum: `{sessionId, mode, scope, cursor, total, cards[]}` ya da `null` |
| `POST sessions/:id/events` | `{clientEventId uuid, flashcardId, rating again\|known\|easy, timeSpentMs?}` | `{state, idempotent, requeued, remaining, dailyGoal}`; 409 `SESSION_COMPLETED` |
| `POST sessions/:id/events/:clientEventId/undo` | — | `{state, idempotent}`; 409 `UNDO_NOT_LATEST`, 409 `UNDO_EXPIRED` (10 dk) |
| `POST sessions/:id/complete` | — | `{sessionId, summary{reviewed,known,again,uniqueCards,knownPct}, due{count,nextAt}, dailyGoal}` |
| `GET bookmarks` · `POST/DELETE bookmarks/:flashcardId` | — | kart listesi · `{bookmarked}` |
| `PATCH preferences` | `{dailyGoal 5–200}` | `{dailyGoal{target,done}}` |

Kart nesnesi: `{id, kind, front, back, explanation, difficulty, topic{id,name}, unit{slug,title}|null,
articles[{no,title,legislationSlug}], bookmarked, state{state,due,hard,dueAt}}`. **`sourceLabel` yok**
(spec ile kilitli). Bayrak kapalıyken tüm uçlar 404 `FLASHCARDS_DISABLED`.

## 3. Kurallar (sunucuda)

- **Kilit (karar 3):** kartın ünitesinin, yoksa konusunun `isPremium` değeri; premium olmayan kullanıcıya
  kilitli kart ne kuyruğa girer ne sayılır (yalnız `counts.locked`).
- **Öğrenildi:** `reps ≥ 3 ∧ intervalDays ≥ 7`; **zor:** `lapses ≥ 2` ya da son puan `again`.
  Eşikler `flashcard.constants.ts`'te; istemciye yalnız sonuç gider.
- **Kuyruk:** due (en eski vade) · new (müfredat) · hard · favorites · all (vade → yeni → kalan) · mixed
  (oturum tohumlu rastgele). "Tekrar" denen kart kuyruğun sonuna döner, turda en çok 2 görünüm.
- **Idempotency:** `(userId, clientEventId)` tekil; ikinci istek durumu değiştirmez, aynı yanıtı verir.
  Tek transaction: olay + durum upsert + kuyruk/cursor.
- **Geri al:** yalnız kartın son olayı, 10 dk içinde; `prevState` geri yüklenir (ilk karşılaşmaysa satır
  silinir), kopya kuyruktan düşer, cursor geri.
- **Günlük hedef:** bugün (TR 04.00 sınırı) geri alınmamış olaylardan benzersiz kart sayısı.
- **Yeni oturum** açılınca eski yarım oturum kapatılır (tek "kaldığın yer").
- Yayından kalkan kart kuyruktan düşer, ilerleme satırı kalır (FK `Restrict`).

## 4. Deste JSON (üretim hattı ve içe aktarma)

```json
{
  "deck": { "topicId": "…", "legislationSlug": "t-c-anayasasi", "unitSlug": "anayasa-temel-haklar-rejimi",
            "sourceLabel": "AI bilgi kartı — T.C. Anayasası md 12–16", "generatedBy": "…" },
  "cards": [
    { "kind": "qa", "front": "…?", "back": "…", "explanation": "…", "difficulty": 2,
      "articleRefs": ["13", "15"], "derivedNumbers": [], "counterNumbers": [] }
  ]
}
```

`npx tsx scripts/kart-dogrula.ts deste.json --md` → `npx tsx scripts/kart-yukle.ts deste.json [--replace]`.

## 5. Sıradaki (aşama 4 öncesi onaylar)

1. **Migration uygulama**: deploy penceresinde `prisma migrate deploy` (kullanıcı onayı).
2. **CLAUDE.md istisnası** ("AI bilgi kartı" üretimi) — kullanıcı onayıyla işlenir (aşama 7 planında, üretim
   başlamadan önce).
3. Aşama 4: Expo (reanimated + gesture-handler kurulumu, `FlashCard`/`FlashcardDeck`/`RatingBar`…, `/kartlar`),
   web `/kartlar`, giriş satırları; pilot deste el ile (Yasama I, 24 kart) ya da ilk AI türetimi.

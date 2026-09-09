# Doc 39 — Polis Mevzuatı Soru Üretimi (5 kanun)

**Karar (9 Eyl 2026, kullanıcı):** CLAUDE.md'deki "AI soru üretimi yapılmaz"
kuralı bu beş kanun için, **ayırt edici kaynak etiketi** şartıyla gevşetildi.
Üretilen her soru `sourceLabel = "Mevzuat türetimi — <kanun> md <no>"` taşır;
böylece bankadaki gerçek çıkmış sorulardan admin panelde her zaman ayrılır.
Etiket son kullanıcıya gösterilmez (Anayasa: `SettingsService.showQuestionSource`).

## Kapsam

| Kanun | Madde | Bankada ilişkili mevcut soru |
|---|---|---|
| 3201 Emniyet Teşkilat | 160 | 482 |
| 7068 Genel Kolluk Disiplin | 41 | 11 |
| 5901 Türk Vatandaşlığı | 52 | 5 |
| 5682 Pasaport | 48 | 5 |
| 2911 Toplantı ve Gösteri | 45 | 12 |

Hukuki dayanak = `law_articles` içindeki **yayındaki resmî metin**
(`mevzuat/<no>.txt`). Model kendi hukuk bilgisinden hüküm uydurmaz.

## Hat

Her parti (~12 madde) şu adımlardan geçer:

1. **Üretici** (Opus) — madde metni + stil referansı + o kanunun bankadaki
   mevcut soru kökleri. Çıktı: `aday/<kanun>-p<N>.json`
2. **Mevzuat Denetçisi** (Opus) — her şıkkı madde metniyle tek tek doğrular.
3. **Kalite Denetçisi** (Opus) — sınav değeri, çeldirici gücü, ipucu, zorluk.
4. **Dil/Mantık Denetçisi** (Opus) — iki doğru şık, cevapsızlık, belirsizlik.
   (2–4 paralel çalışır, birbirinin kararını görmez.)
5. **Birleştirme** — üç denetçi de ONAY derse KABUL. Herhangi biri REVIZYON
   derse soru üreticiye geri döner (bir tur). İkinci turda hâlâ itiraz varsa
   **RED** — soru düşer. RED ve revizyon geçmişi `rapor/` altında kalır.
6. **Yazma** — `apps/api/scripts/doc39-bankaya-yaz.ts`, `status=in_review`.
   Yayına alma kararı kullanıcınındır.

## Kurallar

- Her soru **5 şıklı** (Anayasa, 8 Eyl 2026).
- `articleNo` kanonik biçimde ("16", "4/A", "Ek 24", "Geçici 2").
- `LegalReference.citation` her soruda dolu.
- Açıklama bankadaki biçimi izler: dayanağı söyler, tuzağı adlandırır,
  karıştırılan komşu hükmü açıklar. Kaynak etiketi açıklamaya KONULMAZ.
- Şüpheli soru üretilmez; sayı hiçbir zaman doğruluğun önüne geçmez.

## Durum

`rapor/durum.md` — parti parti ilerleme.

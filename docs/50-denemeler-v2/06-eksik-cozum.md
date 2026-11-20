# Doc 50 / 06 — Eksik çözüm eşiği

Tarih: 20 Kasım 2026. Dal `claude/deneme-eksik-cozum`. Kullanıcı kararı: denemeye girip birkaç soru
çözüp çıkanlar sıralamayı ve ortalamayı bozuyor; kayıt silinmez, **eksik çözüm** sayılır.

## Kural

- Eşik **cevap sayısına** bakar, puana değil: resmî çözümde işaretlenen şık sayısı
  `ceil(soru sayısı × minAnswerPercent / 100)` değerinin altındaysa çözüm eksiktir. Varsayılan
  **%20** (100 soruda 20 cevap); deneme ayarlarından değiştirilir (`Exam.minAnswerPercent`).
  Hiç cevap vermeyen her eşikte eksiktir (30 Eki 2026 kuralı aynı alana taşındı).
- Eksik çözüm **kayıtta kalır**, adayın sonuç ekranı ve cevap incelemesi açıktır; sıralamaya,
  katılımcı sayısına, ortalama/medyana, soru bazlı Türkiye oranına, genel deneme liderliğine ve
  adayın net gelişim çizgisine **girmez**. Geçmişte "eksik çözüm" etiketiyle görünür.
- **Resmî hak geri verilmez** (aday soruları gördü); serbest denemede "Tekrar çöz" açıktır.
- Karar sunucuda: `QuizSession.rankEligible`, teslim anında (`finishSession`) yazılır; süre dolumuyla
  kapanan oturumlar aynı kurala düşer. İstemci yalnız `incomplete` / `minAnswers` alanlarını çizer.

## Ne değişti

| Katman | Değişiklik |
|---|---|
| Şema | `exams.min_answer_percent` (20), `quiz_sessions.rank_eligible` (true); migration `20261120090000_deneme_eksik_cozum` geriye dönük işaretler ve kısmi indeks ekler |
| API | `ANSWERED_ATTEMPT = { rankEligible: true }` (liste katılımı, canlı nabız, sıralama); ham SQL'ler (`review` Türkiye oranı, genel liderlik, admin soru analizi) `rank_eligible` süzer; `getAttempt.incomplete/minAnswers`; `start.minAnswers`; liste `minAnswers` ve `my.official.incomplete`; geçmiş `incomplete`, trend eksikleri atlar |
| Admin | Ayarlar adımında "Sıralama eşiği (%)"; değişince o denemenin çözümleri tek SQL ile yeniden değerlendirilir (denetim kaydı `exam.min_answer_percent`); istatistikte "Eksik çözüm" kutusu, ortalama/medyan/soru analizi yalnız geçerli çözümlerden |
| Expo | Teslim sayfası eşiğin altında uyarır ("Sınava dön" birincil, "Yine de teslim et"); sonuçta "Eksik çözüm" notu; kartta ve geçmişte etiket; kurallarda "En az N soru cevapla" kartı |
| Web | Sonuç sayfasında eksik çözüm notu |

## Canlı veride etki (salt okunur sayım, 20 Kas 2026)

| Deneme | Resmî çözüm | Eksik (<%20) | Hiç cevapsız |
|---|---|---|---|
| Paem11-Deneme Sınavı1 (serbest) | 215 | 126 | 30 |
| Haftalık Deneme-1 | 17 | 13 | 2 |
| Paem 10 Deneme Sınavı-2 | 21 | 6 | 0 |
| Paem 10 Deneme Sınavı-1 | 11 | 4 | 0 |

Haftalık Deneme-1 geçerli çözüm sayısı 4'e düşer; sıralama en az 10 çözüm kuralı nedeniyle kapanır.

## Deploy sonrası

Donmuş (takvimli) sıralamalar bir kez yeniden hesaplanır:
`npx tsx scripts/haftalik-siralama-yenile.ts --exam "<başlık>" --confirm`.

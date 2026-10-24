# Doc 50 / 02 — F1: Web deneme merkezi ve akışları

Tarih: 24 Ekim 2026. Dal `claude/denemeler-v2-f0` (F0 üstüne). Plan: `00-plan.md` §4.1, §6 F1.
Durum: **kod hazır; girişli akışların canlı doğrulaması deploy sonrasına kaldı** (bkz. §4).

## 1. Ne değişti

| Figma | Rota | Dosya | Not |
|---|---|---|---|
| W1 Deneme merkezi | `/denemeler` (`(dual)`: girişsiz SEO listesi, girişli merkez) | `components/exam/exam-center.tsx`, `exam-hero.tsx`, `exam-card.tsx`, `remind-button.tsx`, `deadline-clock.tsx` | Hero (devam eden > sıradaki haftalık > sakin), dört grup (serbest · haftalık · bana özel · çıkmış), koç rayı sağda; 768'de tek sütun. Eski takvim/tablo/gelişim çizgisi kalktı |
| M2 Kurallar | `/denemeler/[examId]/baslamadan-once?role=practice` (yeni) | `app/(dual)/denemeler/[examId]/baslamadan-once/page.tsx` | Tam sayfa; uyarılar kart (sıralama, 150 dk, net), haftalıkta dördüncü kart; ders dağılımı `GET /exams/:id › distribution`; üç varyant + Premium kilidi |
| W2 Oynatıcı | `/sinav/[examId]?role=practice` | `app/(app)/sinav/[examId]/page.tsx`, `components/exam/exam-player.tsx` | Rol parametresi; **anlık geri bildirim** (sunucu `isCorrect` dönerse şıklar doğru/yanlış/kaçırılan, açıklama kutusu, soru kilitlenir; kilitli cevap dönerse seçim sunucudakine çekilir); yeni hata kodları (`OFFICIAL_FIRST`, `OFFICIAL_IN_PROGRESS`, `EXAM_CLOSED`) |
| W3 Sonuç + inceleme | `/sonuc/[attemptId]` | `app/(app)/(shell)/sonuc/[attemptId]/page.tsx`, `components/exam/course-breakdown.tsx`, `review-table.tsx` | Dört varyant: resmî (sıra + yüzdelik + Türkiye kıyası), tekrar (sıralamaya girmedi), kişisel (sıra yok), haftalık bekliyor (kilit kartı). 8 dersli dağılım (%60 altı amber). İnceleme: süzgeç çipleri (Tümü/Yanlış/Boş/İşaretli/Çoğunluk bildi), satır açılınca soru + açıklama + Türkiye/Süren karoları; kilit sunucudan |
| M6 Sıralama | `/siralama/[examId]` | `app/(site)/siralama/[examId]/page.tsx`, `components/rank-table.tsx` | "Senin sıran" panel kartı (yüzdelik), kısaltılmış ad (`name`), yanlış sütunu, eşitlik notu; `result_pending` / `min_sample` boş durumları; donma tarihi |
| M7 Kişisel | `/denemeler/kisisel` (yeni) → `/sinav/kisisel?count=` | `app/(dual)/denemeler/kisisel/page.tsx` | Uzunluk çipleri (Doc 46 hakkı), dağılım açıklaması, başka deneme sürerken engel. "Yanlışlarımdan" havuzu sunucu desteğiyle F3'te |
| M8 Geçmiş | `/profil/denemelerim` | `app/(app)/(shell)/profil/denemelerim/page.tsx`, `components/exam/trend-chart.tsx` | `GET /exams/history/mine`; net gelişimi SVG (Premium kilidi), üç grup |
| Public liste | `/denemeler` (girişsiz) | `components/exam-table.tsx` | Serbest satır: "Her zaman açık" / "Çöz" |

Saf mantık: `lib/exam-ui.ts` (`fmtNet`, `fmtDuration`, `rankSentence`, `examCardModel`, `heroFor`,
`groupExams`) + `lib/exam-ui.test.ts` (12 test). Kart modeli hiçbir kapı içermez; `canStart*`,
`availability`, `myState` sunucudan gelir.

API dokunuşu (F0 üstüne): `GET /exams/:id` cevabına `distribution[]` (sınav türü bölüm ağırlıkları ×
soru sayısı, en-büyük-kalan) eklendi — kurallar ekranı için.

## 2. Plandan sapmalar

- Geçmiş sayfası `/profil/denemelerim`'de kaldı (plan `/denemeler/gecmis` diyordu): mevcut bağlantılar
  (profil, ⌘K) bozulmasın. Merkezdeki "Deneme geçmişin" ve haftalık grubun "Geçmiş" bağlantısı oraya gider.
- `/sinav/arsiv/[examId]` **silinmedi**: çıkmış sınavın "sınav gibi çöz" yolu hâlâ bunu kullanıyor (Doc 36).
  Deneme merkezi artık ona bağlanmıyor; tekrar çözüm `role=practice` ile `/sinav/[examId]`.
- Toplu cevap ucu (`answers/batch`) web oynatıcısında kullanılmadı: web'de cevap başına kayıt ve anında
  "kaydedildi" durumu korunuyor; tamponlama F4 yük provasında ölçüme göre açılır.
- Kişisel deneme sayfasında ders dağılımı tablo değil cümle: seçim sunucuda (Doc 46) ve önizleme ucu yok.
  Süre bilgisi dürüst: soru başına 75 sn (100 soruda 125 dk), 150 dk değil.

## 3. Doğrulama

- `tsc --noEmit` temiz; `vitest` 9 dosya / 91 test (yeni `exam-ui.test.ts`); `eslint` 0 hata.
- `apps/web` bağımlılıkları yerelde eksikti (`lucide-react` yok); `npm install` yapıldı, `package-lock.json`
  değişikliği (yalnız `@emnapi` gürültüsü, bellek notu) geri alındı.
- Tarayıcı (yerel `web-webpack` :3002, API :3000 eski kod): girişsiz `/denemeler` 200, koyu tema, tablo
  ve kapanış çağrısı çiziliyor; açık temada zemin kâğıt rengi. 768 px'te sayfa içeriği taşmıyor; ölçülen yatay taşma (scrollWidth 1055) **site üst çubuğundan** (tema anahtarı + çağrı düğmesi, `md:flex`) geliyor — F7 W-F public kabuğunun mevcut sorunu, bu işin kapsamı dışında, ayrıca ele alınmalı. Turbopack `tokens.css` yolunu reddediyor (bellek
  "worktree admin önizleme"); `.claude/launch.json`'a `web-webpack` girişi eklendi (commit dışı).

## 4. Deploy sonrası doğrulama listesi (girişli akışlar — yerelde mümkün değil)

Yerel API hâlâ Doc 50 migration'sız canlı veritabanına bağlı; yeni alanlar (`attemptRole`,
`deadlineAt`…) sorgulanınca 500 verir. Bu yüzden girişli ekranlar F0 deploy'undan sonra, beta hesabıyla
canlıda doğrulanır:

1. `/denemeler` girişli: hero (devam eden / haftalık / sakin), dört grup, kartlarda net + sıra.
2. Serbest deneme: kurallar → `Sınava başla` → oynatıcı → teslim → `/sonuc` (sıra, dağılım, inceleme süzgeçleri) →
   kart "Tekrar çöz" → kurallar (uyarı) → `?role=practice` → sonuçta "sıralamaya girmedi".
3. Anlık geri bildirim açık denemede şık → doğru/yanlış + açıklama, ikinci tık kilitli.
4. Haftalık deneme: pencere öncesi hatırlat düğmesi; pencere içinde teslim → "sonuç bekliyor" kartı;
   kapanınca sıralama ve "Netin güncellendi" (iptal varsa).
5. Kişisel: `/denemeler/kisisel` → 100 soru → sonuç (sıra yok, "yeni kişisel deneme").
6. Geçmiş: üç grup, Premium hesapta grafik, ücretsizde kilit.
7. Sıralama: `/siralama/[id]` isimli tablo, "senin sıran", eşit sıra.
8. 768 px ve açık tema: her ekranda yatay taşma yok; `focusRing` klavye odağı.

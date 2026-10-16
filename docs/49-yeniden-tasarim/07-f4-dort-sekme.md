# Doc 49 / 07 — F4: Kütüphane · Denemeler · Performans · Ben

Tarih: 16 Ekim 2026. Dal `claude/f4-dort-sekme`. Plan: `00-plan.md` §3 F4.
Kapanış ölçütü: `01-denetim.md` mobil envanterine göre özellik eşitliği tablosu (bu belge §5)
dolu; beta hesabında gerçek veriyle simülatör turu; Figma aynası güncel.

## 1. Kaynaklar

- Bilgi mimarisi: Doc 25 §2 Bölge 2–5 (ekran envanteri), §7 (mobil: tab → liste → detay →
  oynatıcı; hiçbir yol 3 seviyeden derin değil; oynatıcı tam ekran, tab çubuğu gizli).
- Mevcut davranış: Flutter uygulaması (`apps/mobile/lib/features/{catalog,mevzuat,review,exams,
  progress,me,billing}`) ve web (`apps/web/src/app/(app)/(shell)/{kutuphane,performans,profil}`).
  Envanter 16 Eki 2026'da iki salt-okunur taramayla çıkarıldı; API sözleşmesi doğrudan
  controller/service kodundan okundu (sözleşme notu: §4).
- Tasarım dili: Nöbet (Doc 49 §1), kit v3 (`apps/app/src/components`), Figma
  "Paemisyon 2.0 — Nöbet" (`06` §Figma aynası).

## 2. Yapısal kararlar

1. **Sekme içi yığın.** Her sekme kendi `Stack`'ini taşır (`app/(tabs)/<sekme>/_layout.tsx`):
   liste → detay sekme çubuğunu korur (Flutter'daki shell dalları gibi). Oynatıcılar ve
   mevzuat okuyucu kök Stack'te tam ekran (`seans`, `sonuc`, `oku/[slug]`, `deneme-sonuc/[id]`).
2. **Tek oynatıcı (Doc 25 Karar 1).** Deneme koşucusu ayrı ekran değil; `seans.tsx`
   `mode=exam|deneme` ile süre, ileri/geri, optik form ve "Testi bitir" onayı kazanır. Canlı
   deneme, kişisel deneme, ders/konu denemesi ve arşiv denemesi aynı oynatıcıdan geçer; alıştırma
   davranışı (dokunuş = cevap + anında geri bildirim) değişmez.
3. **Kural sunucuda.** Premium kilidi, günlük limit, kişisel deneme hakkı, deneme penceresi
   istemcide hesaplanmaz; sunucunun hata kodu (`PREMIUM_REQUIRED`, `PERSONAL_EXAM_LIMIT`,
   `DAILY_LIMIT_REACHED`, `EXAM_*`) ekranda dürüst cümleye çevrilir. Paywall ekranı F5
   (IAP) ile gelir; F4'te kilitli eylemler "Premium gerekiyor" bildirimine düşer.
4. **Dürüst veri.** Ölçüm yoksa "henüz ölçülmedi"; sıfır uydurulmaz. Kaynak etiketi hiçbir
   yerde gösterilmez (deneme incelemesinde `source` alanı okunmaz).
5. **Önbellek süreleri** Flutter'dakiyle aynı: katalog 5 dk, konu/atlas 1 dk, mevzuat listesi
   2 dk, okuyucu metni 10 dk; `react-query` `staleTime`.

## 3. Kapsam ve sıra

| # | Parça | Ekranlar | Uçlar |
|---|---|---|---|
| K1 | Kütüphane ana | Dersler (tercih edilen modül), Mevzuat girişi (kaldığın yer + arama), Yanlışlarım/Favoriler satırları | catalog/modules, modules/:id/courses, me/reading-progress, review/* (sayılar) |
| K2 | Ders detay | özet (hakimiyet, çözülen, açık yanlış), konular (alt konular açılır), eylemler: tur, ders denemesi; kanun konusu → atlas | courses/:id/topics |
| K3 | Madde Atlası | madde çipleri (fethedildi/kısmi/boş), en çok çıkan maddeler → madde turu | topics/:id/atlas; quiz `articleNo` |
| K4 | Mevzuat | liste (tür çipleri), arama (350 ms, ≥2 harf, ⟪⟫ vurgusu), kanun detay (kimlik, içindekiler, bu kanundan soru), **okuyucu** (metin, bölüm başlıkları, madde kaydet, not, okuma ilerlemesi 20 sn, yazı boyu, paylaş, "N soru") | public/mevzuat*, me/article-*, me/reading-progress |
| K5 | Yanlışlarım · Favoriler | iki liste, tur başlat (review / fromBookmarks), favori kaldır | review/* |
| D1 | Denemeler ana | kişisel deneme kartı (25/50/100, hak), çıkmış sınavlar girişi, CANLI (geri sayım), SIRADAKİ, YAKLAŞAN, GEÇMİŞ (arşivde çöz / sonucum / sıralama) | exams, exams/attempts/mine, me/dashboard, public/cikmis-sinavlar |
| D2 | Oynatıcı deneme modu | süre (endsAt / remainingSeconds), sayfa sayfa, ileri/geri, bayrak (yerel), optik form sheet, bitir onayı, EXAM_TIME_OVER | exams/:id/start, quiz/sessions (archive/personal/course/topic exam), answers {recorded}, complete |
| D3 | Deneme sonucu | net + önceki denemeyle fark, D/Y/B, konu kırılımı (kaybettiren net), zamanlama şeridi, cevap incelemesi (favori, hata bildir), sıralama | exams/attempts/:id, review/bookmarks, questions/:id/report |
| D4 | Sıralama | deneme sıralaması (ilk 100 + ben), açılmadıysa süre notu | exams/:id/leaderboard |
| D5 | Çıkmış sınavlar | dönem listesi, dönem detayı (devam eden / sonucum / sınav gibi çöz), **çalışma modu** (yerel kayıt, yanlış bildirimi) | public/cikmis-sinavlar, cikmis-sinavlar/:slug, calisma-yanlisi |
| P1 | Performans ana | özet (seri, doğruluk, çözülen, oturum), 12 hafta ısı şeridi, deneme net eğrisi, en zayıf 3 | progress/summary, activity?days=84, exams/attempts/mine, progress/topics |
| P2 | Konu haritası | ders filtresi, "yalnız zayıf", satır → tur | progress/topics |
| P3 | Liderlik | bugün/hafta/ay/genel; podyum; benim sıram; puan farkı | progress/leaderboard |
| P4 | Denemelerim | geçmiş denemeler listesi → sonuç | exams/attempts/mine |
| B1 | Profil | kimlik, plan (premium/ücretsiz), rütbe (coach.gamification), ölçütler, sıradaki rozet, hızlı erişim | me, me/coach, me/dashboard |
| B2 | Ayarlar | ad, hedef sınav, sınav tarihi, günlük hedef, görünüm, şifre, çıkış, hesap silme ("SİL") | me PATCH/DELETE, catalog/modules, Supabase |
| B3 | Rozetler | kazanılan/kilitli ızgara, tarih | me/badges |
| B4 | Üyelik | plan ve bitiş; satın alma F5 | me (isPremium, validUntil) |

Sıra: K1→K5, D1→D5, P1→P4, B1→B3; her blok simülatörde doğrulanır, Figma aynası blok sonunda.

## 4. API sözleşmesi — F4'te kullanılan alanlar (16 Eki 2026, koddan)

- Zarf `{data}` / `{error:{code,message,details,trace_id}}`; `/exams` ve `/review/*`
  parametre almaz (50/100 kayıt). `progress/history.score` **string** gelir (Decimal).
- `POST /quiz/sessions`: `mode practice|exam|daily|review`; `exam` için `courseId|topicId`
  ya da `archiveExamId` / `personalExam`; `topicIds` yalnız practice; `fromBookmarks`
  kapsamsız practice. Deneme/exam modunda cevap yanıtı `{recorded:true}` (anahtar yok).
- `POST /exams/:id/start` → `{sessionId, endsAt, liveAnswerReveal, questions, givenAnswers}`;
  cevap/bitirme `/quiz/sessions/:sessionId/*`. Hatalar: `EXAM_NOT_STARTED{startAt}`,
  `EXAM_ALREADY_TAKEN{attemptId}`, `EXAM_ENDED`, `PREMIUM_REQUIRED`, `EXAM_EMPTY`.
- `GET /exams/attempts/:id` canlı pencere açıkken `409 EXAM_IN_PROGRESS{examId}`.
- `GET /me` alanları: `displayName, email, preferredModule{id,name}, dailyGoal, targetExamDate,
  memberSince, isPremium, validUntil`. `PATCH /me` yalnız `displayName, avatarUrl,
  preferredModuleId, dailyGoal(5..200), targetExamDate|null`.
- Mevzuat uçları girişsiz; `isPremium` bilgi amaçlı, kilit tur başlarken.

## 5. Özellik eşitliği tablosu (Flutter → Expo)

Blok kapandıkça doldurulur. Satır: özellik · Flutter · Expo · not.

## 6. Dışarıda bırakılanlar (gerekçeli)

- Okuyucuda **metin vurgulama** (highlight): RN'de seçim ofseti güvenilir değil; F5'te
  `TextInput` seçimiyle ya da web-view okuyucuyla yeniden değerlendirilir. Kaydet + not var.
- Paywall ve satın alma, push kaydı ve günlük hatırlatma, onboarding/tanıtım: F5.
- Çevrimdışı cevap kuyruğu: F5 (F3'te de ertelenmişti).

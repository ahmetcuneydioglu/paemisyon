# Doc 50 / 03 — F2: Admin deneme listesi, sihirbaz, istatistik ve soru iptali

Tarih: 24 Ekim 2026. Dal `claude/denemeler-v2-f0`. Plan: `00-plan.md` §4.3, §6 F2. Figma A0–A4.
Durum: **kod hazır; panel girişi gerektirdiği için tarayıcı doğrulaması deploy sonrasına kaldı.**

## 1. Ne değişti (`apps/admin`)

| Figma | Rota | Dosya | Not |
|---|---|---|---|
| A0 Liste | `/exams` | `app/(panel)/exams/page.tsx` | Süzgeç çipleri (Tümü/Serbest/Haftalık/Taslak/Arşiv); sütunlar ad+soru/süre/zorluk, mod, tarih, durum (Planlandı · Pencere açık · Pratik açık · Kapandı · Yayında), katılımcı (resmî), ortalama net, Premium, Anlık GB, İstatistik/Düzenle. Alt başlıkta sıradaki haftalık |
| A1 Kimlik | `/exams/new`, `/exams/[id]?adim=1` | `components/exam-form.tsx › ExamIdentityForm` | Ad, açıklama, zorluk (segment), sınav türü (tek aktif türde otomatik), yayın modu radyo kartları (serbest/haftalık), açılış (varsayılan **sonraki Pazar 21:00**), süre (**150 dk**), pencere kapanışı (açılış+süre otomatik; serbestte "yeni çözüme kapanış" opsiyonel). Yeni deneme taslak oluşturup 2. adıma geçer |
| A2 Ayarlar | `?adim=2` | `ExamSettingsForm` | Anahtarlar: Premium'a özel, **resmî çözümde anlık geri bildirim** (açıklamasıyla), bitince pratik, sorular herkese açık, hatırlatma + sonuç bildirimi |
| A3 Sorular | `?adim=3` | `[id]/page.tsx` | Ders dağılımı seçili/hedef (`publish-check › distribution`), "Otomatik tamamla" (`onlyMissing`) ve "Baştan doldur", eksik ders uyarısı, soru sayacı, mevcut soru seçici ve inceleme bağlantısı |
| A4 Önizleme ve yayın | `?adim=4` | `[id]/page.tsx` | Özet tablosu, yayın kontrolü (engeller kırmızı, uyarılar amber; engel varsa Yayınla kapalı), adayın göreceği kart, duyuru anahtarı, Yayınla / Taslak olarak bırak; yayındaysa yayından kaldır/arşivle |
| İstatistik | `/exams/[id]/istatistik` (yeni) | `[id]/istatistik/page.tsx` | 8 özet kartı (başlayan, tamamlayan, devam eden, süre doldu, tekrar, ortalama/medyan net, medyan süre), net dağılımı çubukları, etkin iptaller (geri al), soru analizi (doğru %, boş, süre, anahtar şüpheli, açık bildirim), "İncele" şık dağılımı, **soru iptali diyaloğu** (herkese doğru / hesaptan çıkar, etki cümlesi önizlemesi, gerekçe, bildirim anahtarı) |
| Stepper | — | `components/exam-wizard-stepper.tsx` | Dört adım, tamamlananlar tıklanabilir |

Eski `exam-form.tsx` (tek form, `archiveOpenAfterEnd`) kalktı; `lib/types.ts` yeni alanlar ve
`ExamPublishCheck`, `ExamAutofillReport`, `ExamStats`, `ExamAdjustment*` tipleriyle genişledi.
`/exams/[id]/inceleme` (yayın öncesi tam okuma) aynen duruyor; 3. adımdan bağlanır.

## 2. Plandan / Figma'dan sapmalar

- **Görsel dil:** Figma admin ekranları Nöbet açık temayla çizildi; panel ise mevcut Tailwind
  (slate/indigo) dilinde. Panelin kabuğunu yeniden derilemek F2 kapsamında değil (Doc 49 "admin
  yenilenir" ayrı iş); ekranlar Figma'nın **yapısını** birebir alır, rengini almaz.
- Deneme adı/zorluk/kapanış yayındaki denemede de düzenlenebilir (1. adım); soru seti sabit.
- "Sıralama CSV'si" ve istatistik "yeniden hesapla" düğmesi yok (jsps'te de ertelenmişti); "Yenile" var.

## 3. Doğrulama

- `tsc --noEmit` temiz (Sentry paketi yerelde eksik, main'de de aynı); `eslint` 0 hata (2 eski uyarı).
  Yeni React kuralları için: `Date.now` saf render dışına (`useState` tohum), soru seçici tohumlama
  effect yerine türetilmiş durum, `useSearchParams` Suspense içinde.
- `next build` çıktısı §4'te.
- Tarayıcı: panel Supabase girişi istiyor; oturum açmadan sayfalar `/login`'e yönlenir. Girişli
  doğrulama deploy sonrası: liste → yeni deneme (haftalık, Pazar 21:00) → ayarlar → sorular
  (otomatik tamamla, 8 ders 100/100) → önizleme (kontrol yeşil) → yayınla → istatistik → bir soruyu
  "herkese doğru" iptal et → adayın sonucunda "netin güncellendi" şeridi.

## 4. Derleme

`next build` (admin, yerelde `@sentry/nextjs` kurulduktan sonra) başarılı: 28 rota; `/exams` ve
`/exams/new` statik, `/exams/[id]`, `/exams/[id]/inceleme`, `/exams/[id]/istatistik` dinamik.
`useSearchParams` Suspense içinde olduğu için ön-işleme uyarısı yok. Kurulumun lockfile gürültüsü
geri alındı.

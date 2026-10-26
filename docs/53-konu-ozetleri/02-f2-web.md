# Doc 53 / 02 — F2: web özet okuyucu ve konu odası

Tarih: 26 Ekim 2026. Durum: **yazıldı, misafir akışı tarayıcıda doğrulandı; girişli akış doğrulaması ve deploy bekliyor.**
Figma açılmadı: ekranlar mevcut "Nöbet" web kitiyle (Card, Badge, ProgressBar, Dialog, PageIntro, ClosingCta) koddan kuruldu;
istenirse `html_to_figma` ile Figma'ya aktarılır.

## Yüzeyler

| Yüzey | Dosya | Davranış |
|---|---|---|
| `/ozet/[slug]` | `apps/web/src/app/(dual)/ozet/[slug]/page.tsx` | Aynı URL iki derinlik (Doc 27): misafire SEO sayfası (PageIntro, kartlar, Premium kapısı, kapanış CTA; ISR 1 saat, canonical, description ilk kavram kartından), girişliye okuyucu (ilerleme çubuğu, kaldığın yer, köprü) + koç rayı. Kaynak etiketi hiçbir sürümde yok. |
| Konu odası | `kutuphane/konu/[id]/page.tsx` + `components/ozet/unit-list-section.tsx` | Koç cümlesinin altında "Konu özetleri" bölümü: ünite satırı (ikon: bitti / kilitli / oku), md aralığı, dk, kart sayısı, ilerleme çubuğu. Ünite yoksa bölüm çizilmez. |
| Okuyucu | `components/ozet/unit-reader.tsx` | IntersectionObserver ile en ileri görünen kart; 2,5 sn sonra `POST /me/summaries/progress`; son kart görülünce `completed`. Kilitliyse açık kartlardan sonra kapı kartı (Premium / giriş). Sonda köprü: "Bu üniteden 10 soru" → `/seans?topicId&articleNos=…`. |
| Kart | `components/ozet/summary-block-card.tsx`, `summary-body.tsx` | Tür rozeti (kavram/kural/tuzak/sayılar/karşılaştırma/sınav der ki), madde rozetleri, gövde (kalın + liste), sayı tablosu, karşılaştırma tablosu (başlıklar kart başlığından "X ve Y"), istatistik satırları. |
| Madde rozeti | `components/ozet/article-peek.tsx` | "md 84" → Dialog: resmî metin (1400 karakter, kaynak + doğrulama tarihi + çıkmış soru sayısı) + madde sayfası bağlantısı. Önce madde atlası, olmazsa Mevzuat Merkezi okuma yanıtı (kanun soru kataloğunda olmasa da metin gelir). |
| Seans köprüsü | `seans/page.tsx`, `session-player.tsx`, API `StartSessionDto.articleNos` | `articleNos` virgülle; sunucu havuzu `articleNo IN (…)` ile daraltır (topicId ile birlikte, articleNo ile değil). |
| Sitemap | `app/sitemap.ts` + `GET /public/summaries` | Yayındaki üniteler `/ozet/<slug>` olarak, lastModified ile. |

## Doğrulama

- Web: `ozet.test.ts` 6 test (gövde ayrıştırma, köprü adresi, açıklama, ilerleme yüzdesi); tsc ve eslint temiz. API: tsc temiz.
- Tarayıcı (misafir, yerel API + Docker DB, worktree önizlemesi :3014): başlık/description doğru, 2 açık kart + "Kalan 20 kart Premium" kapısı,
  madde rozeti penceresi md 75 metnini kaynak ve tarihle gösterdi; koyu ve açık tema, 375 px genişlik temiz.
- Girişli akış (konu odası bölümü, ilerleme kaydı, köprü → seans) kullanıcı girişi gerektirir; :3014'te giriş sonrası doğrulanacak.

## Notlar

- `(dual)` grubu `getCurrentUser()` ile kabuğu seçer; girişli istek `api()` ile kullanıcıya özel yanıtı (kilit, ilerleme) alır, misafir `publicApi` ISR.
- `/giris?next=/ozet/<slug>` ile giriş sonrası aynı sayfaya dönülür.
- Önizleme için worktree `paemisyon-worktrees/doc53-web` (+ `web-doc53` launch girdisi, commit edilmez; iş bitince `git worktree remove`).

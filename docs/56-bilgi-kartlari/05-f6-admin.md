# Doc 56 / 05 — Aşama 6: admin paneli (Bilgi Kartları)

Tarih: 5 Kasım 2026. Durum: **kod yazıldı, testler geçti; bayrak kapalı, yayında kart yok.** Pilot deste
(28 kart, `in_review`) artık panelden incelenip tek tek yayınlanabilir. RBAC özet kalıbıyla aynı:
editör listeler, düzenler, oluşturur, içe aktarır, arşivler, mevzuat kontrolünü işaretler; admin
yayınlar, yayından alır, siler, toplu yayınlar. Her işlem `AuditService.log` ile iz bırakır.

## 1. API — `modules/admin/flashcards/*` (`/admin/flashcards`)

| Uç | Rol | Not |
|---|---|---|
| `GET /` `?courseId&topicId&unitId&status&kind&verification&stale&search&page&pageSize` | admin, editor | Sayfalı liste (`{items,total,page,pageSize}`); satırda tür, maddeler, konu/ünite, durum, eskime, kaynak etiketi, mevzuat kontrolü, `synthetic` (AI kaynaklı). |
| `GET /stats` | admin, editor | Yayında · incelemede · eskimiş · mevzuat kontrolü bekleyen (+ yenilenmeli) · toplam (+ arşiv). |
| `GET /stale` | admin, editor | Eskimiş kart kuyruğu (madde metni değişti). |
| `GET /:id` | admin, editor | Detay: alanlar, referans madde metinleri (kayıtlı sürüm ↔ güncel sürüm), canlı doğrulama raporu, yayın kapısı gerekçeleri, son 20 audit kaydı. |
| `POST /` | admin, editor | Tek kart (DTO sınıfı): konu + mevzuat slug + ünite etiketi + alanlar; `sourceLabel` "Editör" ön ekli; doğrulamayı geçmeyen kart yazılmaz; `in_review`. |
| `PATCH /:id` | admin, editor | Yeniden doğrular; referanslar güncel madde sürümüne bağlanır, `staleSince` kalkar, `needs_refresh` → `pending_review`; içerik değiştiyse `version` artar. |
| `POST /:id/archive` | admin, editor | Yayındaki kartı arşivlemek admin ister (kullanıcı kuyruğundan düşer). |
| `POST /:id/publish` · `/unpublish` · `DELETE /:id` · `POST /publish-many` | **admin** | Yayın kapısı: yayında değil ∧ eskimemiş ∧ mevzuat kontrolü "yenilenmeli" değil ∧ doğrulama temiz. Silme yumuşak ve yalnız yayında olmayan kart (ilerleme `Restrict`). Toplu yayın AI kaynaklı kartları ATLAR (CLAUDE.md Doc 56 istisnası; `kaynakTuru` "AI bilgi kartı" ön ekini `ai` sayar). |
| `POST /:id/verification {status}` | admin, editor | `pending_review` / `verified` (`verifiedAt` dolar) / `needs_refresh`. |
| `POST /import?dryRun=1` · `?replace=1` | admin, editor | Deste JSON (`{deck, cards}`): dry-run yalnız rapor; yazma `importDeck` (kusurlu deste yazılmaz, hata zarfında satır satır kusur). |

- **Eskime kancası:** `admin-law-articles.service.ts markSummariesStale` artık maddeye referanslı kartları da
  damgalar (`staleSince`, `verificationStatus = needs_refresh`). Eskimiş kart yayınlanamaz; düzenleyip kaydetmek damgayı kaldırır.
- DTO'lar class-validator sınıfı (global `forbidNonWhitelisted` ile uyumlu). `kart-ice-aktar.ts latestVersionNos` dışa açıldı.
- Spec: `admin-flashcards.service.spec.ts` (10 test: rol kapısı, eskime/kontrol/doğrulama engeli, yayın + audit, toplu yayında AI atlama, düzenlemede yeniden doğrulama ve sürüm/eskime, yeni kart etiketi, mevzuat kontrolü, dry-run yazmaz).

## 2. Panel — `apps/admin (panel)/flashcards`

| Sayfa | İçerik |
|---|---|
| `/flashcards` | Beş `Stat`, eskimiş kuyruğu şeridi, filtre çubuğu (ders › konu, durum, tür, mevzuat kontrolü, yalnız eskimiş, arama), tablo (checkbox, ön/arka yüz, tür, maddeler, konu · ünite, durum + eskimiş, kaynak etiketi "yalnız panel", mevzuat kontrolü, güncellendi), toplu işlem çubuğu (yalnız admin yayınlar · AI kaynaklı kartlar toplu onaydan geçmez — sunucu atlar, sonuç gerekçeyle görünür), sayfalama. |
| `/flashcards/[id]` | Breadcrumb, başlık + rozetler, Arşivle / Yayından al / Yayınla (sönükse gerekçe) / Sil; **karar şeridi** (kapı gerekçeleri, mevzuat kontrolü `select`); kart (görüntüle / düzenle → "Kaydet ve doğrula"); doğrulama raporu (✗ kırmızı, "betik anlamı doğrulamaz" notu); kaynak etiketi + üretim + audit geçmişi; sağda yapışkan **Referans maddeler** (resmî metin; sürüm değiştiyse "metin güncellendi v1 → v2"). |
| `/flashcards/new` | Konu (katalog ağacı), ünite etiketi (konunun üniteleri; mevzuat slug'ını üniteden alır, yoksa konunun mevzuatından, yoksa elle), kaynak notu ("Editör — <not>"), kart formu. |
| `/flashcards/import` | JSON yapıştır → "Doğrula (yazmaz)" → kart kart ✓/✗ satırları → "İçe aktar (incelemede)"; `replace` seçeneği. CSV içe aktarma bu sürümde yok (deste JSON betik çıktısıdır). |

- Ortak bileşenler: `components/flashcard-form.tsx` (`FlashcardForm`, `draftToBody`, `ValidationLines`,
  `KindBadge`, `VerifyBadge`); `components/ui.tsx` `Stat` — Konu Özetleri ve Madde Özetleri sayfalarındaki
  kopyalar kaldırıldı (plan §8.2 "ortak bileşen borcu"). Sol menüye "Bilgi Kartları" eklendi.
- Tipler `lib/types.ts` (`FlashcardListItem`, `FlashcardDetail`, `FlashcardStats`, içe aktarma/toplu yayın sonuçları).

## 3. Doğrulama

| Katman | Sonuç |
|---|---|
| API | admin flashcards spec 10/10 + kaynak-turu spec; `typecheck` ve lint temiz (tam paket sayıları commit mesajında). |
| Admin | `tsc` temiz, `eslint` 0, `next build` (sayfa dışa aktarım ve istemci sınırı denetimi). |
| Canlı | Pilot deste panelde görünür (incelemede); yayın kararı sizin. Sayfalar gerçek veriyle merge + deploy sonrası görülür. |

## 4. Kullanım (pilotu yayınlamak)

1. PR merge → Railway (API) ve Vercel (admin) deploy.
2. Panel › Bilgi Kartları › filtre "İncelemede" → kartı aç → referans maddeyle karşılaştır → mevzuat kontrolünü
   "Mevzuat doğrulandı" yap → **Yayınla** (AI kaynaklı olduğu için tek tek; toplu yayın atlar).
3. Kartlar yayınlanınca uygulama ve web'de Konu oku › Bilgi kartları satırı belirir (bayrak kapalıyken yalnız
   beta/admin). Bayrak: Panel › Ayarlar › Bilgi kartları.

## 5. Sıradaki (aşama 7)

Entegrasyon ve test: beta rolüyle cihaz (yeni dev build) ve web göz testi; "Bu konudan soru çöz" köprüsü ve
hâkimiyet/koç çapraz kontrol; üretim hattı betikleri (`kart-girdi.ts`, `kart-uret.ts` — AI türetimi, diğer
47 ünite); Doc 56 §16 test senaryoları; bayrak açma sırası (önce beta).

# Doc 53 / 03 — F3: Expo konu özeti okuyucu

Tarih: 26 Ekim 2026. Durum: **yazıldı, tsc/eslint temiz; simülatör doğrulaması bu dosyanın sonunda.**
Figma açılmadı: ekran web okuyucusuyla aynı yapıda, Expo "Nöbet" kitiyle (Card, Badge, ProgressBar, Sheet, ListRow,
ActionBar) koddan kuruldu.

## Yüzeyler

| Yüzey | Dosya | Davranış |
|---|---|---|
| Okuyucu | `app/ozet/[slug].tsx` (kök Stack, tam ekran) | FlatList kart akışı; `onViewableItemsChanged` ile en ileri görünen kart, 2,5 sn sonra `POST /me/summaries/progress`; sunucudaki "kaldığın yer" ile yerel görülenin büyüğü (effect'siz türetim); son kart görülünce "Bitti". Başlıkta md aralığı, dk, kart sayısı, Premium rozeti, ilerleme çubuğu. Kilitliyse açık kartlardan sonra `SummaryLockCard` → `/paywall`. Altta `ActionBar` "Bu üniteden 10 soru". |
| Konu odası | `(tabs)/kutuphane/konu/[topicId].tsx` | Koç cümlesinin altında "Konu özetleri" bölümü (`SummaryUnitRow`: bitti / kilitli / oku ikonu, md aralığı, dk, kart, ilerleme; Premium rozeti). Ünite yoksa bölüm yok. |
| Kart kiti | `src/components/domain/summary.tsx` | `SummaryBlockCard` (tür rozeti + madde rozetleri + gövde / sayı satırları / karşılaştırma blokları / istatistik satırları), `SummaryBody` (kalın + liste), `ArticlePeek` + `ArticlePeekSheet` (Mevzuat Merkezi okuma yanıtından madde metni, kaynak, tarih, çıkmış soru; "Madde sayfası" → `/oku/[slug]?madde=`), `SummaryLockCard`, `useArticlePeek`. Dar ekranda tablo yerine satır yığını: yatay kaydırma yok. |
| Sorgular | `src/features/summaries/queries.ts` | Tipler web `ozet.ts` ile birebir; `useTopicUnits`, `useUnit`, `useSaveUnitProgress`; `parseBody` aynı kural. |
| Seans köprüsü | `app/seans.tsx`, `features/quiz/api.ts` | `articleNos` parametresi (virgülle) → `StartSessionBody.articleNos`; `articleNo` varsa o öncelikli. |
| Derin bağlantı | `src/lib/deep-links.ts` | `/ozet/<slug>` (web ile aynı adres) → `/ozet/[slug]`. |

## Notlar

- Kurulu simülatör geliştirme derlemesi `react-native-share` (F10-P) eklenmeden önceydi; uygulama açılışta
  "RNShare could not be found" ile düşüyordu. Doğrulama için `expo run:ios --no-bundler` ile yeniden derlendi.
- Uygulama canlı API'ye bağlı; pilot canlıda `in_review` olduğu sürece konu odasında ünite görünmez, derin bağlantı
  "yayında değil" durumunu gösterir. Panelden yayın sonrası gerçek veriyle görünür.

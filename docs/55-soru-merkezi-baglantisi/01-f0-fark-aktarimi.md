# Doc 55 / F0 — PAEMİSYON fark aktarımı (merkez tarafı): kuru koşu

Tarih: 2 Kasım 2026. Durum: **gerçek koşu yerel merkeze yazıldı (2 Kas, aktarım kaydı c8d85e05); bağlar (`--links`) uygulanmadı.**
Betik: `~/Developer/soru-merkezi/scripts/import/paemisyon-fark.mjs` (yeni; `extract.mjs`'e `question_articles` tablosu eklendi). Ham rapor: [02-f0-kuru-kosu-raporu.md](02-f0-kuru-kosu-raporu.md).

## 1. Soru: 1 Ekim'den beri PAEMİSYON'da ne değişti?

Merkezdeki PAEMİSYON verisi 1 Ekim 22:12 anlık görüntüsüdür (9.135 satır → 7.746 köken). Canlıdan salt okunur sayım (2 Kasım):

| Değişiklik | Sayı |
|---|---|
| Yeni soru | 0 |
| Yeni sürüm | 4 (3 soru) |
| Yerinde şık düzeltmesi (sürüm açılmadan; zaman damgası yok) | 4 |
| Silinen soru | 2 |
| Yeni soru↔madde bağı (`question_articles`, kaynak `legacy_article_no`, 16 Ekim) | 3.876 (3.855 soru) |
| Yeni mevzuat kaydı (madde metni yok) | 7 |

Zaman damgası olmayan düzeltmeler yüzünden fark **tarihten değil içerikten** okunur: taze anlık görüntünün `content_hash`'i kökenin `legacy_content_hash`'iyle, açıklama ve bağlar temel görüntüyle (20261002-0111) karşılaştırılır.

## 2. Yöntem

1. `node scripts/import/extract.mjs paemisyon` → `.import-cache/20261102-0224` (REPEATABLE READ READ ONLY, tek kısa bağlantı).
2. `node scripts/import/paemisyon-fark.mjs --snapshot=20261102-0224` → sınıflandırma + savepoint içinde gerçek yazma yolu + geri alma; rapor `imports.stats`'a ve anlık görüntü klasörüne.
3. Yazma yolu `load.mjs` emsalini izler: servis rolü, `app.question_workflow_transition`, yeni sürüm `authoring_method = imported`, şıklar tek deyimde, `record_question_publication` aynı işlemde, köken satırının `legacy_version` / `legacy_content_hash` değeri güncellenir, sonunda `recompute_product_membership(…, 'resync')`.
4. Kuru koşuda `set constraints all immediate` ile ertelenmiş yayın kaydı kısıtı da denetlenir; merkezin türettiği `content_hash` dönüşümünkiyle karşılaştırılır (**0 uyuşmazlık**).

## 3. Sonuç (kuru koşu, 27 sn)

| Sınıf | Sayı | Ne olur |
|---|---|---|
| `surum` | 7 | Kök/şık değişti; merkez içeriği PAEMİSYON'un eski hâliydi → yeni sürüm (sürüm 2). 4'ü yerinde şık düzeltmesi (sik-guncelleme), 3'ü yeni PAEMİSYON sürümü |
| `geri-cek` | 2 | PAEMİSYON'da silindi (fa64bb54 çift cevap 6 Eki; 43fffcf3 5 Eki) → `archived` + `withdrawn_reason = archived` |
| `bag-yeni` | 22 | İçerik aynı; 1 Ekim'den sonra eklenen madde bağı (Doc 53 articleNos; 27 bağ, 26'sı TCK). 19'unda PAEMİSYON'un birincil maddesi merkezin zorunlu bağından farklı → **rol kararı insanın** |
| `bag-s2-kalan` | 304 | İçerik aynı; bağ temel görüntüde de vardı ama S2 almamıştı (JSPS esas alınan gruplar ya da o gün çözümlenemeyen atıf). 445 bağ: TCK 235, Anayasa 81, CMK 71, Kabahatler 20… |
| `yeni` | 0 | — |
| `inceleme-*` | 0 | — |
| `esit` (notlu) | 1 | 5302 md. 127/S çözümlenemedi (gürültü) |

Üretilecek olaylar (kuru koşu ön izlemesi): GYS 7 upsert + 2 withdraw; JSPS ve PAEMİSYON akışına yalnız katalog olayı.

Bağ sınıfları varsayılan koşuda **uygulanmaz** (`--links` ile açılır): sözleşme gereği yayımlı sürümün bağ kümesi değişmez, her bağ eklemesi yeni sürüm ve GYS'e upsert demektir (326 sürüm). Uygulanırsa merkezdeki canlı bağlar ve rolleri korunur, yeni bağlar `supporting` olarak eklenir; `required` yalnız hiç zorunlu bağ yoksa verilir.

## 4. Abonelik önerisi (karar 3: 81 konu + müfredat mevzuatı)

Kuru koşuda `product_subscriptions`'a yazılıp geri alındı: **81 konu + 67 mevzuat = 148 düğüm.** PAEMİSYON'un alacağı yayımlı soru: **9.477**.

| Yazım yöntemi | PAEMİSYON kökenli | Soru |
|---|---|---|
| imported | evet | 7.528 |
| imported (yalnız JSPS) | hayır | 1.339 |
| ai_generated (merkez üretimi) | hayır | 478 |
| human (merkez düzeltmesi) | evet | 69 |
| human (merkez yazımı) | hayır | 63 |

İki boşluk:
- **109 PAEMİSYON kökenli soru merkezde görünmüyor**: 105'i `provision_changed` (zorunlu bağlı madde değişince geri çekildi, §7.2), 4'ü `manual`. PAEMİSYON'da bugün yayımlılar; geçişte düşerler. Geçişten önce merkezde düzeltilmeleri ya da bilinçli bırakılmaları gerekir (liste `paemisyon-fark.mjs`'e eklenebilir).
- **27 PAEMİSYON kökenli görünür soru 81 konunun dışında** (merkez taksonomisinde resmî yazışma 10, CBK-1 4, halkla ilişkiler 4, etik 4, 5070 2, e-tebligat 2, 492 1). Öneri: 7 konuya abone olmak yerine 27 soruya `include` kuralı (müfredat dışı merkez üretimi sızmasın).

Merkez şu an `save_product_subscription` için insan hesabı + `products.manage` ister; aktarım `load.mjs` gibi servis rolüyle doğrudan yazar (düğüm doğrulaması tetikleyicide çalışır).

## 5. Gerçek koşu — YAPILDI (2 Kas 2026, kullanıcı onayı)

    cd ~/Developer/soru-merkezi
    node scripts/import/paemisyon-fark.mjs --snapshot=20261102-0224 --commit --subscribe
    # bağları da taşımak için: --links

Yazılanlar: 7 yeni sürüm (hepsi sürüm 2, yayın kaydı var, köken hash'i güncel), 2 geri çekme, 148 abonelik; GYS akışına 7 upsert + 2 withdraw. Betikte üyelik yeniden hesabı aboneliklerden önce koştuğu için PAEMİSYON olayları elle `recompute_product_membership(paemisyon, 'subscription_changed')` ile üretildi (betik düzeltildi): PAEMİSYON akışında **9.477 soru upsert + 71 mevzuat sürümü + 213 taksonomi + 2 etiket** olayı var — F1 adaptörünün ilk senkronda tüketeceği tam anlık görüntü budur. Senkron anahtarı ayrı: `node --env-file=.env.local scripts/set-product-sync-secret.mjs paemisyon` (anahtar bir kez ekrana gelir; PAEMİSYON'un yerel API ortamına `HUB_SYNC_SECRET` olarak girilir, F2).

## 6. Açık işler

- `soru-merkezi` deposunda betik ve `extract.mjs` değişikliği commit edilmedi (depo kuralı commit öncesi `db:reset` + tam test ister; `db:reset` yerel S2 verisini siler). Karar: betik-only commit mi, bekleme mi?
- `--links` kararı (326 sürüm) ve 19 rol çelişkisi.
- 109 görünmeyen + 27 konu dışı soru.
- F1'e girdi: eşleme kuralları (§3) kuru koşuda doğrulandı; `local_id` bütün PAEMİSYON kökenlerinde dolu (7.735 ana + 11 birleşik).

# Doc 44 — 2024 KPSS Hukuk alan sınavı

**Sonuç: 7 soru onay kuyruğunda.** 12 Eylül 2026.

## Kaynak

`KPSS 2024 Hukuk.pdf` — 2024 KPSS A Grubu Hukuk alan sınavının 40 sorusu.
Bir uygulamadan çekilmiş ekran görüntüleri; **metin katmanı yok**, her sayfada
bir soru ve altında basılı cevap anahtarı. Sayfaların ortasında ÖSYM filigranı.

## Neden 40 sorunun 7'si

| | Soru |
|---|--:|
| Sınavdaki toplam | 40 |
| Bankada zaten vardı | 9 |
| Müfredat dışı | 24 |
| **Alındı** | **7** |

**Bankada zaten olan 9 soru** (5, 6, 7, 8, 11, 12, 13, 14, 16) 25 Ağustos
2026'daki eski bir içe aktarımdan gelmiş; `2024 KPSS` ve
`2024 KPSS CEZA HUKUKU (ALAN)` etiketli, hepsi yayında. O içe aktarım
sistematik değildi — sınavın İdare + Ceza + CMK bölümünden seçmece dokuz soru
alınmış, gerisine bakılmamış.

**Müfredat dışı 24 soru** (17–40): Medeni, Borçlar, Ticaret, İcra-İflas.
Derslerimizde yok.

**Alınan 7 soru:** Anayasa 4 (q1–q4), İdari Yargılama Usulü 2 (q9, q10),
Ceza Muhakemesi 1 (q15).

Kapsam kararının tamamı `kapsam.json`'da.

## Hat

1. **Tarama.** PDF'in 40 sayfası macOS Vision ile Türkçe OCR'dan geçirildi ve
   çıkan 40 kök, bankadaki bütün sorularla kelime örtüşmesine göre
   karşılaştırıldı. Bu OCR yalnız *hangi sorunun bankada olduğunu* bulmak
   içindi; içe aktarılan metin OCR'dan değil, aşağıdaki transkripsiyon
   hattından geldi.
2. **Transkripsiyon.** Seçilen 7 sayfa 200 dpi'da ayrı ayrı render edildi,
   cevap anahtarı satırı kırpıldı. İki bağımsız ajan aynı görüntüleri okudu:
   **7/7 birebir aynı**, `okunamadi` 0.
3. **İnsan doğrulaması.** Mutabakat kanıt sayılmadı (Doc 37'de iki ajan aynı
   hatayı paylaşmıştı). İki riskli soru görüntüden elle kontrol edildi:
   - **q3** — kaynağın kendisi boşlukları `...` ile basmış; ajanlar uydurmamış.
   - **q10** — roma rakamları (I, II, III) ve beş şıkkın hepsi doğru. Her iki
     ajan da "II. öncülün sonundaki virgül filigranın altında" diye
     işaretlemiş; virgül gerçekten görünmüyor, liste ayıracı olduğu için
     anlamı etkilemiyor.
   - Yedi cevap anahtarı da görüntüden tek tek okundu, OCR'a bırakılmadı
     (`anahtar-7.json`).
4. **Mükerrer taraması.** Tam parmak izi eşleşmesi 0; üç yakın eş (q1, q9, q10)
   elle açıldı — aynı konuda ama farklı sorular, hiçbiri mükerrer değil.
5. **Kör çift denetim.** İki denetçi cevap anahtarını görmeden çözdü.
   **7/7 ONAY**, hepsinde yüksek güven, hakem gerekmedi.
6. **Açıklama.** Yedi soruya da 2026 hukukuna göre açıklama yazıldı.
7. **Bankaya yazım.** 7 soru `in_review`, `sourceLabel = "2024 KPSS Hukuk (ÖSYM)"`.

## Güncellik ekseni: temiz

2024 → 2026 aralığında **0 eskime, 0 güncellenecek**. Denetçiler
mevzuat.gov.tr'nin bugünkü konsolide metinlerini indirip madde madde okudular
(AY 16, 84, 87, 89, 93, 96, 175; İYUK 20/B, 27; CMK 100–104) ve AYM iptal
dipnotlarını kontrol ettiler. İYUK 27/4'te bir iptal var ama bu sorulardan
hiçbirine dokunmuyor.

Doc 40'ta 2022 sınavının iki sorusu AYM iptalleri yüzünden elenmişti; bu sınav
iki yıl daha yeni ve dayandığı hükümler değişmemiş.

En kırılgan soru **q15**'ti (CMK'da soruşturma evresi tutukluluk süresi).
Kasten öldürme ağır ceza işi, ama CMK 102/4'ün "bir yıl altı ay + altı ay"
istisnası yalnız TCK'nın İkinci Kitap Dördüncü Kısım Dördüncü–Yedinci
Bölümündeki suçlar, Terörle Mücadele Kanunu kapsamındaki suçlar ve toplu
suçlar için geçerli. Anahtar bununla tutarlı.

## Hatta yapılan değişiklik

`kpss-mukerrer-tara.ts` Doc 42'nin dosya düzenine sabitlenmişti
(`transkript/a.json` + `anahtar-22.json` + `siniflandirma.json`). İkinci bir
kopya çıkarmak yerine `--aday` kipi eklendi: `dogru`/`konuId`/`ders`/`konu`
alanları dolu bir `aday.json` ile gelen partilerde script yalnız tarar,
**dosyanın üstüne yazmaz** — yazsaydı transkriptçilerin `not` alanları
sessizce kaybolurdu.

## Kenara konan bulgu

**q15, bankadaki bir Themis sorusunun neredeyse aynısı.** Kaynak
`THEMIS 2025 CEZA MUHAKEMESİ HUKUKU SORU KİTABI`; orada suç zimmet ve süre
2 yıl, burada kasten öldürme ve süre 1 yıl 6 ay. Ayrı soru sayılır, mükerrer
değil — ama ikisi aynı denemeye düşerse aday tekrar hissi yaşar.

## Bir sonraki adım

Kalan 24 müfredat dışı soru alınmadı. Bu sınavdan alınacak başka soru yok.

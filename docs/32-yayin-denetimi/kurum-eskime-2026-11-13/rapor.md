# Kapanan / adı değişen kurum taraması — 13 Kas 2026

Kullanıcı kararı: sistemde eskimiş soru kalmasın. Kapsam: yayındaki 7.960 sorunun
(status `published`, silinmemiş) kökü, şıkları ve açıklaması.

Taranan ibareler: Maliye Bakanlığı, Başbakan(lık), Bakanlar Kurulu, Bayındırlık, Devlet
Personel Başkanlığı, Danıştay İkinci Dairesi, SHÇEK, ASPB, HSYK, Gümrük ve Ticaret,
Kalkınma Bakanlığı, DPT, KHK, müsteşar, Emekli Sandığı, SSK, Bağ-Kur ve diğer 2011–2021
teşkilat değişiklikleri. Sonuç: kök ya da şıkta 94 aday, yalnız açıklamada 33 aday.

Ölçüt `yayindaki-soru-duzeltme-ilkesi`dir. Arşiv kararı için iki bağımsız denetçinin
(web + birincil kaynak) ikisinin de ESKİME demesi gerekti.

## Arşivlenen (3) — `soru-arsivle.ts`, yedek `arsiv-yedek.json`

| sürüm | dayanak | gerekçe |
|---|---|---|
| d350d9f5 | 5395 md 31/5 | Doğru şık, çocuğun SHÇEK'e teslimini öğretiyor. SHÇEK 633 s. KHK (2011) ile kaldırıldı, görevleri bakanlığa (bugün ASHB) geçti. Bu görev devridir (DPB emsali). Ek kusur: 31/5'teki "veya" ile bağlı iki hâl, birlikte aranan şartlar gibi kurulmuş. |
| 1bf26d34 | 5395 md 37/1 | Doğru şık, denetimi gözetim esaslarına göre SHÇEK'e veriyor. Kurum kapandığı için görev devridir. |
| 533da6e9 | 4483 md 9/3 | Doğru şık "Danıştay İkinci Dairesi". 5183 s.K. (2004) 2575 md 43'ü mülga etti; bu işler md 42/k ile Birinci Daireye geçti. İkinci Daire bugün dava dairesi ve itirazlar fiilen 1. Dairede karara bağlanıyor. Şıkkı değiştirmek soruyu yeniden yazmak olur (BTK emsali). |

Üçü de Doc 39 türetimi; hiçbir denemede kullanılmamış.

## Düzeltilen — `sik-metni-guncelle.ts`, defter `../sik-guncelleme.jsonl`

Ad/unvan düzeltmeleri. Her birinde iki denetçi de AD/UNVAN dedi; doğru şık değişmedi.

- **12807186** (3713 md 21):
  - A şıkkı: ASPB → Aile ve Sosyal Hizmetler Bakanlığı.
  - Açıklama: ASPB ve Maliye ibarelerinin yanına bugünkü adları eklendi. *4 şıklı.*
- **445cb5be** (5901 md 45): C şıkkında ve açıklamada Maliye → Hazine ve Maliye Bakanlığı.
- **3005fdd6** (5607 md 17): A ve B şıklarında ve açıklamada HSYK → Hâkimler ve Savcılar Kurulu. *4 şıklı.*
- **8c23c033** (5395 md 27/28): kökteki I. öncülde ve açıklamada HSYK → HSK.
- **1929bf3e** (GK, Himaye-i Etfal): kökte ASPB → Aile ve Sosyal Hizmetler Bakanlığı. *4 şıklı.*
  - **Açık nokta:** "II. Abdülhamid döneminde kurulmuştur" iddiası denetçilerde 1-1 kaldı. Biri 1917/1921 kuruluşu esas alıp esasa kusur dedi. Diğeri 1908 Kırklareli şubesi gerekçesiyle savunulabilir buldu. Soru kalır, karar kullanıcıda.

Yalnız açıklama düzeltmeleri. Soru ve cevap doğruydu; açıklama kapanmış kurumu güncel gibi anlatıyordu.

- **ba8a57e2** (5395 md 25): HSYK → HSK, iki yerde.
- **638bda86** (657 md 105) ve **2d665a52** (657 Ek 8): DPB'nin 703 s. KHK ile kaldırıldığı notu eklendi.
- **77716823** (6284 md 22): "Bakanlık = ASPB" ifadesine bugünkü ad eklendi.
- **4483 md 9 açıklamaları** — 99b0e6e6, aaaf8bd6, 06a872ac, a35cfb5b, b51c4bab, 2c58c805, c68605ee: "DANIŞTAY İKİNCİ DAİRESİ" → "DANIŞTAY (kanun lafzında İkinci Daire; bu işleri 2004'ten beri 2575 md 42/k uyarınca Birinci Daire görür)". Bu soruların cevapları süre ya da "Danıştay" olduğu için değişmiyor.
- **SHÇEK açıklamaları** — 5f0d857a, 220fbdee, 21298119, 08d883df: kurumun 2011'de kaldırıldığı ve görevlerinin bugün ASHB'de olduğu notu eklendi.

## Ana oturumda düzeltilen

- 9a4633bc (657 md 47): bu taramada dokunulmadı; kök ve açıklama ana oturumda yeniden yazıldı.

## Bırakılan

**İlişkisel** (kurum yalnız kökte geçiyor, ölçülen kural yürürlükte):
- 7ca2f050 (5395 md 6): bildirim yükümlüleri soruluyor; kök SHÇEK'i bildirim adresi olarak anıyor.

**Açıklaması güncel adı zaten öğreten (meşru):**
- 3dd5965c (2575 md 9, şık lafzı HSYK).
- d48482e4 (CMK 331).
- 91892423 (2575 md 10).
- 3ca751b5 (657 md 178): "madde metninde" diye anıyor.
- 8d246b55, b31d236a: "bugünkü adıyla".
- 930b430f, 23ac2a31, 67926f60, 001fa82e: eski metni tarih notu olarak veriyor.

**Meşru** (tarih soruları, çeldirici şıklar, hâlâ yürürlükteki KHK'ler ya da hâlâ var olan kurumlar):
- c85c2ed5, 0cd030e4, e7b57fa8, d5419773, 7dd591b0, 784b333c, 643f97eb, 1d73982d, 4fb4bff2, df233497, 2108a87a, 84c853cf, 36612966, 12afb6b4, 92f1001e, 381fde39, 24da8160, 614f7303, 8804f060, ff3e4ba4, 4d559e0d, 750b675d, a69452f6, ddc12b92, fd20abc9, e3a65e3a, 55038a36, c730478d, d2b23415, 20069528, 2bc6b022, 0c892c24, fd62b166, 2a106811, 6da6d0ba, 373cf987, c645e2c1, 4d6583bb, 4a48bac8, f711f2a2, e84b8e00, a47c4153, de2bdf80, 4de95846, dd7be924, 4e3ef325, e5bb99d3, faff1109, d475ac48, 9ed652ac, f05a14bd, c3c2f7b1, 2d48e1f4, e8532411, 7c78c6a0, 51a5250b, 5bf0c740, 6d057367, dd5fedae, 9f0d7ea9, 54e17ac6, 5dc70891, 32caab8e, 602e978d, aca5bd4c, 5736d47e, e888f149, 118cdc4f, 26b821fa, 3912f952, cf253342, dd7f8398, 6f6f6047, cc6700ac, 5e1eed9e, b835c59a, 2267f938, b5e1330b, 730effdb, 82c266c0.
- Yönetmelik lafzı (dayanak metin neyse o): 7e91ec0d.
- Tarih ya da lafız notu taşıyan açıklamalar: bfc2f706, cd443bdf, 67752896, 926bffb5, e6b60d8b, e9a3fb2a, 37e909f8, 5b21f748, b083653f.

## Bildirilecekler

- **Dört şıklı (bu taramada görülen 19 soru; bkz. bes-sik-kurali):** bu turda dokunulmadı.
  - Düzeltilenler: 12807186, 3005fdd6, 1929bf3e, 638bda86, aaaf8bd6, 2c58c805, 77716823.
  - Bırakılanlar: 0cd030e4, 643f97eb, 2108a87a, 24da8160, ff3e4ba4, 4d559e0d, a69452f6, 4d6583bb, a47c4153, de2bdf80, 4e3ef325, 5cad0ef6.
- **Danıştay İkinci Dairesi:** konsolide 4483 md 9 hâlâ İkinci Daire diyor. Bu lafızla yeni türetim yapılırsa aynı eskime tekrarlanır.
- **SHÇEK:** 5395'ten türetilen başka sorularda da SHÇEK geçebilir (bu tarama kök, şık ve açıklamayı kapsadı). Türetim hattı için uyarı: konsolide 5395 hâlâ SHÇEK diyor.

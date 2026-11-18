# Doc 53 / 07 — Kapsam tamamlama turu (18 Kasım 2026)

Durum: **16 yeni ünite üretildi, denetlendi, betikten geçti; dalda (push yok). Yükleme ve yayın kullanıcıda.**

## Neden

92 ünite yayına alındıktan sonra canlıda yapılan kapsam taraması (yayındaki soru × ünite, konu bazında) iki
açık gösterdi:

1. **Ünitesi olmayan mevzuat.** Madde metni bankada olduğu hâlde ünitesi olmayan 11 mevzuat (≥8 yayındaki soru):
   6284, 6136, 3713, TBMM İçtüzüğü, 6284 Uyg. Yön., 6222, 7201, 2576, Adli Kolluk Yön., 1774, 2839.
   ≤6 sorulu ~15 mevzuat (5607, 298, 3071, 2820, 6698, 6458, 5726, 5253 …) bilinçli olarak dışarıda bırakıldı.
2. **Ünitesi olan kanunda ünite dışında kalan soru (96).** Ünite sonrası etiketlenen/yayınlanan sorular,
   üretimde listeye girmemiş maddelerde kalmıştı. Hiçbiri mevcut kartlarda anlatılmıyordu; madde listesine eklemek
   dürüst olmazdı. Yayındaki üniteye kart eklemek `--replace` ister (üniteyi incelemeye çeker, okuma ilerlemesini
   bozar); bunun yerine 5'ten fazla açığı olan kanunlara **ek ünite** yazıldı: 657 (26 soru), 2918 (14),
   5395 (11), 5326 (6), İYUK (5).

## Hat düzeltmeleri (bu turda)

- **`ozet-girdi.ts`** yalnız `question_articles` bağından soru topluyordu; küçük kanunlarda soruların çoğu yalnız
  `articleNo` etiketliydi (6136'da 31 sorunun 26'sı). Artık konu + madde etiketiyle eşleşen sorular da girdiye
  girer (ünite eşlemesi `unitOfArticle` ile aynı kural).
- **Madde bağı tamamlandı:** `s1-question-article-backfill.ts APPLY=1` (kullanıcı çalıştırdı) 196 bağ yazdı;
  "Sınav der ki" istatistiği ve mevzuat okuyucusundaki "bu maddeden çıkan sorular" `question_articles` okur.
  Yayındaki eski ünitelerin istatistik kartları (657, PVSK) eski sayıyla duruyor; yeniden doldurmak isteğe bağlı.
- **`ozet-uret.ts` istemi:** (a) "özet sözcüğünü kullanma" kuralı model maddenin kendi terimini ("tutanak özeti",
  "önergenin özeti") de düşürüyordu → kural kartın kendini anmasıyla sınırlandı; (b) TL tutarı yazmama kararı
  (karar 1) isteme işlendi; (c) kaldırılmış kurum / yürürlükten kalkmış atıf için "metnindeki hâliyle" notu kuralı.

## Üniteler

| Slug | Mevzuat | Sıra | Kart | Bağlı soru |
|---|---|---|---|---|
| `akk-koruyucu-ve-onleyici-tedbirler` | 6284 | 1 | 24 | 28 |
| `asbk-atesli-silahlar-bicaklar-ve-ruhsat` | 6136 | 1 | 24 | 31 |
| `tmk-teror-tanimi-suclar-ve-usul` | 3713 | 1 | 24 | 24 |
| `ictuzuk-baskanlik-divani-gorusme-ve-denetim` | TBMM İçtüzüğü (yalnız sorulu maddeler) | 1 | 24 | 19 |
| `akuy-tedbir-kararlarinin-uygulanmasi` | 6284 Uyg. Yön. (sorulu maddeler) | 1 | 24 | 16 |
| `ssok-sporda-siddet-onlemler-ve-yaptirimlar` | 6222 | 1 | 24 | 14 |
| `tebk-tebligat-usulleri` | 7201 (sorulu + md 21, 35) | 1 | 23 | 9 |
| `bimk-bolge-idare-mahkemeleri` | 2576 | 1 | 24 | 8 |
| `akoy-adli-kolluk-gorev-ve-iliskiler` | Adli Kolluk Yön. | 1 | 24 | 6 |
| `kbk-kimlik-bildirme-yukumlulugu` | 1774 | 1 | 24 | 6 |
| `mvsk-secim-cevreleri-ve-oy-hesabi` | 2839 (md 1–6, 33, 34, 34/A) | 1 | 24 | 7 |
| `dmk-sinavda-sorulan-diger-hukumler` | 657 ek ünite | 5 | 24 | 26 |
| `ktk-ek-maddeler` | 2918 ek ünite | 4 | 24 | 14 |
| `cockk-ek-hukumler-ve-izleme` | 5395 ek ünite | 3 | 24 | 11 |
| `kabk-ek-kabahatler` | 5326 ek ünite | 4 | 22 | 6 |
| `iyuk-ivedi-yargilama-usulu` | İYUK ek ünite | 4 | 21 | 5 |

Karar 8'e göre ilk 11 ünite açık (kanunun 1. ünitesi), 5 ek ünite premium (sıra ≥ 3).

## Denetim

Her ünite bağımsız bir anlam denetçisinden geçti (madde metnine karşı; ölçüt: ESAS / ZAYIF / BİÇİM / BANKA),
bulgular ayrı düzelticilerce işlendi ve betik doğrulaması yeniden koşuldu. ESAS bulgular (7) elle karşılaştırıldı:

- 3713 md 4/a: kapalı TCK listesi "TCK'da sayılan suçlar" diye genellenmişti → madde numaralarıyla kapalı liste.
- 6284 md 5/2: "(a)–(d)" aralığı (ç)'yi de kapsıyordu → bentler tek tek.
- 657 md 76: eşitlik ölçüsü kazanılmış hak aylık derecesi yazılmıştı → bulunduğu kadro derecesi.
- 2918 Ek 2: belge geri alma süresi (otuz gün) "düzenlenmemiş" denmişti.
- 5395 md 41/F: cezanın düşmesi tablosu karşılaştırma kartıyla çelişiyordu.
- 5326 md 42/A: "mülkî amir yetkili değildir" — vali mülkî amirdir.
- 4483 md 9 (önceki tur): kanun metni Danıştay İkinci Dairesi der, 2575 md 42/k Birinci Daireye vermiştir → not.

Tekrarlayan ZAYIF örüntüler: düşen şart/istisna, aşırı genelleme, eski kurum adının notsuz verilmesi, TL tutarı,
"en çok sorulan" gibi dayanaksız sıklık iddiası, soru kökü/şık kopyası.

## İnsan incelemesi için notlar

- Eskime notlarındaki güncel bilgi madde metninin dışından gelir (Hâkimler ve Savcılar Kurulu adı, Hazine ve
  Maliye Bakanlığı, Aile ve Sosyal Hizmetler Bakanlığı, Devlet Personel Başkanlığının kapatılması, Emekli Sandığı,
  KHK yetkisinin Anayasa'da olmaması, CMK md 250'nin kaldırılması, CMK md 135 katalog fıkrası). Betik doğrulamaz.
- Adli Kolluk Yön.: 2013 değişikliği (en üst dereceli kolluk amirinin mülki amire bildirimi) için Danıştay yürütmeyi
  durdurma şüphesi denetçiden geldi; mevzuat.gov.tr güncel metninde şerh yok, kartlara yazılmadı.
- Mevcut `dmk-*` ünitelerinde Devlet Personel Başkanlığı notsuz geçiyor (yeni ek ünitede not var).
- Okuma süresi: düzeltmeler kartları uzattı; `readingMinutes` yeni ünitelerde metin uzunluğundan yeniden hesaplandı
  (mevcut 108 ünitenin medyanı 1.337 karakter/dk). 6136 ünitesi 26 dk ile hedefin (10–15 dk) üstünde; ikiye
  bölünmesi (md 1–17 / Ek maddeler) ayrı iş olarak önerildi. Mevcut bazı yayındaki ünitelerin de süresi düşük
  yazılmış (ör. `tck-topluma-karsi-suclar` 30 bin karakter, 15 dk).

## Banka bulguları (düzeltilmedi; kullanıcıya bildirildi)

- Dört şıklı sorular: 6284 (9), 3713 (7), Tebligat (3), Kimlik Bildirme (2), Adli Kolluk (2), İYUK 20/A–B (2),
  657 md 61/A (1).
- 1774 md 17 öncüllü soru: I. öncül md 6/b ölçütünden ("md 2'de sayılanlar dışındaki iş yerleri") ayrılıyor.
- 2839 md 2 "hangisi yanlıştır" sorusu: ✓ şık "nüfusuna bakılmaksızın her il bir seçim çevresidir" md 4'teki
  "kural olarak" kaydını taşımıyor.
- 2576 md 6 sorusu: Gümrük idari para cezası ödeme emrinin vergi mahkemesinin görevine girmediği anahtarı madde
  metninden doğrudan çıkmıyor.

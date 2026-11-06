KARAR: GEÇTİ

> **Tur 2 (6 Kas 2026):** düzeltilmiş deste `uretim/anayasa-yasama-1.json` denetlendi.
> Pilot dosyasıyla farkı yalnız #2, 10, 12, 13, 15, 17 ve 26 numaralı kartlarda ve `generatedBy`
> notunda. Değişmeyen 21 kart tur 1'de temizdi. Değişen 7 kart madde metniyle yeniden karşılaştırıldı:
> - #13 artık md 79/1 ile uyumlu: genel yönetim ve denetim yargı organlarında, kesin karar YSK'da.
> - #10 "Ancak" istisnasını doğru kurala bağlıyor.
> - #12'de şık dili kalkmış; `counterNumbers` [2] de kaldırılmış, uygun.
> - #15 trap'ten qa'ya dönmüş, tek soruluk; "Yargıtay ve Danıştay Genel Kurulları kendi üyeleri arasından" ifadesi md 79 ile uyumlu.
> - #17 ve #26 yeniden ifade edilmiş: 84/1 istifa, 84/3 ısrar, 84/4 devamsızlık; 84/2 kapsam dışı. Doğru.
> - #2'deki yorum cümlesi madde içi bilgiyle değiştirilmiş.
>
> Mekanik kapı: GEÇTİ (28/0, 199 madde). Yeni kusur yok. Prod'daki in_review kayıtları bu dosyayla
> güncellenmeli. Yayın kararı insanındır.
>
> Aşağıda tur 1 raporu (DÜZELT, 7 kart) duruyor.

# Denetim — anayasa-yasama-1 (pilot, 28 kart, prod'da in_review)

Tarih: 6 Kas 2026. Deste: `docs/56-bilgi-kartlari/pilot/anayasa-yasama-1.json`.
Metin: yayındaki T.C. Anayasası (`/public/mevzuat/t-c-anayasasi/oku`, 6 Kas 2026 okuması).
Hat: Denetçi A (madde doğruluğu K1–K4, K9) + Denetçi B (tuzak/çift/belirsizlik K5–K8) bağımsız;
hakem (denetim oturumu) bulguları md metniyle yeniden kontrol etti. Mekanik kapı: GEÇTİ (28/0).

## Düzeltilecekler

| # | Sınıf | Hakem | Sorun | Düzeltme |
|---|---|---|---|---|
| 13 | K1 | **CONFIRMED** (yalnız A buldu) | Arka yüz "seçimlerin genel yönetim ve denetimi YSK'ya aittir" diyor; md 79/1: "Seçimler, yargı organlarının genel yönetim ve denetimi altında yapılır." Açıklama doğru hükmü yazdığı için kart kendi içinde de çelişiyor. | Arka yüz: "Yargı organlarına aittir. Seçimin düzen içinde yönetimi ile yolsuzluk, şikâyet ve itirazları kesin karara bağlamak YSK'nındır; YSK kararlarına karşı başka mercie başvurulamaz." |
| 10 | K1/K7 | CONFIRMED (A+B) | Açıklama "eşik yalnız '3 ay içinde' zorunluluğunu doğurur" diyerek %5 halinde de 30 ay beklenecekmiş izlenimi veriyor; md 78'deki "Ancak" 30 ay kaydının istisnasıdır. Ayrıca "gidilebilir" ifadesi madde metnindeki "gidilir"i yumuşatıyor. | Açıklama: "600 üyede %5 = 30 boşalma. Bu hal 30 ay kaydının istisnasıdır: 30 ay dolmasa da ara seçimin 3 ay içinde yapılmasına karar verilir. Genel seçime 1 yıl kala ara seçim yapılamaz." |
| 12 | K7/K8 | CONFIRMED (A+B) | Arka yüzdeki "Evet" koşulsuz okunuyor, oysa ara seçim her dönemde bir defa yapılır ve 30 ay kaydı vardır. Bilgi kartında şık olmadığı halde "'2 yıl' şıkkı tuzaktır" deniyor. | Arka yüz: "Evet; 1 yıl kala yasağına takılmaz. Dönemde bir defa ve 30 ay kuralları ayrıca aranır." |
| 15 | K3/K7 | CONFIRMED (A+B) | Ön yüzde iki soru birleşmiş. "YSK yüksek mahkeme değildir" iddiası md 79'dan çıkmıyor; yüksek mahkemelerin sayıldığı Yargı bölümüne dayanıyor. Açıklamanın son cümlesi (halkoylaması ve Cumhurbaşkanı seçimi) ön yüzle ilgisiz. | Ön yüzü "…hangi düzenleyici işlemle belirlenir?" → "Kanunla." olarak tek soruya indir. "Yüksek mahkeme değildir" iddiası kalacaksa ayrı tuzak kartı yap, refs: 79 + Yargı bölümü (md 146 vd.). |
| 26 | K7 | CONFIRMED (A+B) | İptal yolu yalnız md 84/1, 3 ve 4'e göre verilen düşme kararlarına açık; ön yüz her türlü düşme kararını kapsıyor gibi okunuyor. | Ön yüz: "…üyeliğin düşmesi (istifa, ısrar, devamsızlık) kararına karşı…" ya da arka yüze "(md 84/1, 3, 4 halleri)" ekle. |
| 17 | K7 | PLAUSIBLE (B) | "Hangi işlerle görevlendirilemez?" sorusuna md 82/1'deki yasaklar da doğru cevaptır; kart yalnız 82/2'yi cevap sayıyor (82/1 açıklamada geçiyor). | Ön yüz: "Milletvekili, yürütme organının hangi işlemlerine bağlı işlerle görevlendirilemez?" |
| 2 | K2 | PLAUSIBLE (A) | Açıklamadaki amaç cümlesi (sorumsuzluk ve dokunulmazlıkla bağ) md 80'de yok; doktrinel yorum ve md 83'e dayanıyor. | Yorum cümlesini çıkar ya da madde içi bilgiyle değiştir. |

## Temiz
1, 3, 4, 5, 6, 7, 8, 9, 11, 14, 16, 18–25, 27, 28.
Tuzak kartlarının olumsuz iddiaları metinle sınandı ve doğru bulundu: #5 (md 76 "affa uğramış
olsalar bile"), #21 (dokunulmazlığın kaldırılması md 84'te düşme sebebi sayılmıyor), #25
(md 101/4 ve 106/4'te "üyeliği sona erer"), #27 (md 85 yalnız 84/1, 3 ve 4'ü sayıyor).
K4: Mülga hüküm kullanılmamış. K9: `sourceLabel` uygun, ancak #25 md 101 ve md 106'ya atıf
yaptığı için etiketteki "md 75–86" aralığı bu iki maddeyi kapsamıyor (önemsiz).

## Hat dersi
#13'ü yalnız Denetçi A yakaladı. İki bağımsız denetçi düzeni korunuyor ve hakem her CONFIRMED
bulguyu metinle yeniden kontrol ediyor.

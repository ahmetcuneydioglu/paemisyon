KARAR: GEÇTİ

> **Tur 2 (6 Kas 2026):** Tur 1 sürümüyle dosya karşılaştırıldı. Değişenler: #3, 7, 8 (tür qa), 9, 12, 24 ve 27.
> Değişiklikler rapordaki önerilerle birebir; md 17, 19, 20, 24 ve 26 metniyle uyumlu. #12 artık "kanunda öngörülen
> haller" ayrımını doğru veriyor. Mekanik kapı: GEÇTİ (28/0). Engelleyici olmayan öneri açık kaldı: #6, 19,
> 22 ve 26 numaralı kartlarda "listede yok" cümleleri. Prod'a in_review olarak yüklenebilir.
>
> Aşağıda tur 1 raporu duruyor.

# Denetim — anayasa-kisi-haklari-1 (28 kart, md 17–26)

Tarih: 6 Kas 2026. Deste: `uretim/anayasa-kisi-haklari-1.json` (güncel istem). Mekanik kapı: GEÇTİ (28/0).
Hat: Denetçi A (madde doğruluğu) + Denetçi B (sınav okuru) bağımsız; hakem bulguları metinle yeniden kontrol etti.
Sayı, süre ve mercilerde çelişki yok: 24 saat, 48 saat, 4 gün, "Devletçe ödenir", "kanunla". Ölüm cezası ve
sıkıyönetim gibi mülga düzenler anlatılmıyor. Önceki destelerle çift kart yok.

## Düzeltilecekler

| # | Sınıf | Hakem | Sorun | Düzeltme |
|---|---|---|---|---|
| 12 | K1/K5 | **CONFIRMED** (A+B) | Arka yüz koşulsuz "Hayır" diyor. md 20 rızasız işlemeye "kanunda öngörülen hallerde" izin verir; kanun millî güvenliği böyle bir hal olarak öngörürse veri rızasız işlenebilir. Doğru olan şu: Anayasa millî güvenliği doğrudan bir sebep olarak saymaz. | Ön yüz: "Madde 20, kişisel verilerin rızasız işlenmesi için millî güvenliği doğrudan bir sebep olarak sayar mı?" Arka yüz: "Hayır. Kişisel veriler ancak kanunda öngörülen hallerde veya kişinin açık rızasıyla işlenebilir; rızasız işleme hallerini kanun belirler." |
| 7 | K7/K8 | CONFIRMED (B) | Ön yüzde iki sayısal soru birleşmiş. Metinde "bireysel suç" ifadesi geçmiyor. Açıklamadaki "Sıkıyönetim, seferberlik ya da ekonomik kriz Madde 19'da geçmez" cümlesi bir çeldiriciyi çürütüyor. | "bireysel" kelimesini çıkar. Ön yüz: "Yakalanan veya tutuklanan kişi en geç ne kadar sürede hâkim önüne çıkarılır; toplu suçlarda bu süre nedir?" ya da kartı ikiye böl. Son cümleyi sil. |
| 3 | K8/K7 | CONFIRMED (B) | Açıklamanın son cümlesi sınav taktiği veriyor ("birlikte sorulursa … hatırla"). Ön yüz dolambaçlı. | Ön yüz: "Madde 17'de yaşama hakkının istisnaları arasında 'zorunluluk hali' sayılır mı?" Son cümleyi sil. |
| 24 | K2/K8 | CONFIRMED (B) | Açıklamadaki "'…din kurallarının gözetilmesi' ifadesi bu yasakla çelişir" cümlesi metinden ileri gidiyor; md 24 "gözetme"yi değil "dayandırma amacıyla istismar"ı yasaklar. Ön yüzde "yararlanmak" yazıyor, metinde "istismar etmek". | Son cümleyi sil. Ön yüzde "yararlanmak" yerine "istismar etmek" yaz. |
| 27 | K1 (hafif)/K8 | CONFIRMED (B) | Sayımda "meslek sırları" geçiyor; metinde "kanunun öngördüğü meslek sırları" yazıyor. Son cümle bir çeldiriciyi çürütüyor. | "kanunun öngördüğü meslek sırları" diye düzelt. "'Din ve vicdan özgürlüğünü sağlamak'…" cümlesini sil. |
| 9 | K3 | CONFIRMED (B) | articleRefs'teki md 17 iddiayı taşımıyor (yalnız karşıtlık için anılıyor). Açıklamadaki "…sorulduğunda Madde 19'u düşün" ifadesi sınav taktiği. | articleRefs → ["19"]. Açıklamayı içerik cümlesine indir. |

## Öneri (engelleyici değil)
- #6, #19, #22, #26 numaralı kartların açıklamalarında "X maddede/listede yok" biçiminde çeldirici çürütmeleri var. Hepsi metne göre doğru, ama bunlar betiğin doğrulayamadığı olumsuz iddialar ve bilgi kartına gereksiz yük getiriyor. Kısaltılması önerilir. #6'nın son cümlesi bunun tipik örneği.
- #8 `numeric` türünde ama cevabı sayı değil ("derhal"); tür `qa` olmalı.
- #17 ile #15 benzer ama farklı maddeleri soruyor (md 22 ve md 21); çift kart sayılmadı.

## Temiz
1, 2, 4, 5, 8 (içerik), 10, 11, 13–23, 25, 26, 28. Tuzak kartlarının olumsuz iddiaları doğru: #3, #6, #19,
#24, #25 (md 25'te sınırlama yok: "her ne sebep ve amaçla olursa olsun"), #27.

## Hat notu
Güncel istem "şık" kelimesini temizlemiş, ama aynı örüntü başka bir kılıkta sürüyor: açıklama sonlarında
"X listede yok", "…sorulursa hatırla", "…düşün" cümleleri. kart-uret.ts istemine şu kuralın eklenmesi
önerilir: "Açıklama yalnız madde içeriğini anlatır; sınav taktiği vermez, maddede geçmeyen bir öğeyi
çürütmez."

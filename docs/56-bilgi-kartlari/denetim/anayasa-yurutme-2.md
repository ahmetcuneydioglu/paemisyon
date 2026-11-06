KARAR: GEÇTİ

> **Tur 3 (6 Kas 2026):** Dosya tur 2 sürümüyle karşılaştırıldı. Yalnız #12 (`kind: qa`) ve #27 değişmiş: arka
> yüz #28'in cevabını artık vermiyor, açıklama md 137'deki iki istisnayı tam veriyor. Mekanik kapı 28/0.
> Prod'a in_review olarak yüklenebilir.

> **Tur 2 (6 Kas 2026):** #5, 7 ve 23 doğru düzeltilmiş, mekanik kapı 28/0. Kalanlar:
> - **#27 [K1 hafif, CONFIRMED]:** Düzeltme yanlış alana uygulanmış. Arka yüzün son cümlesi ("Konusu suç teşkil eden emir bu kuralın dışındadır") hâlâ duruyor ve #28'in cevabını vermeye devam ediyor. Onun yerine açıklamadaki doğru bir cümle silinmiş. md 137: "Askerî hizmetlerin görülmesi ve acele hallerde kamu düzeni ve kamu güvenliğinin korunması için kanunla gösterilen istisnalar saklıdır."
>   Düzeltme: arka yüz "Hayır; bu durumda emir yerine getirilir ve emri yerine getiren sorumlu olmaz." Açıklama "Askerî hizmetlerin görülmesi ve acele hallerde kamu düzeni ve kamu güvenliğinin korunması için kanunla gösterilen istisnalar saklıdır."
> - **#12 [biçim]:** Ön ve arka yüz doğru, ama kart hâlâ `trap` türünde ve cevabı bir kavram ("Savunma hakkı"). `kind: "qa"` olmalı.
>
> Aşağıda tur 1 raporu duruyor.

# Denetim — anayasa-yurutme-2 (28 kart, md 123–137)

Tarih: 6 Kas 2026. Deste: `uretim/anayasa-yurutme-2.json`, ikinci sürüm. Denetim sürerken stil kapısı #5, 7 ve
12'nin arka yüzlerini yeniden yazdı; hakem bu üç kartın yeni hâlini ayrıca okudu. Mekanik kapı: GEÇTİ (28/0).
Hat: Denetçi A + Denetçi B bağımsız; hakem #5, 7, 12, 23 ve 27'yi md 125, 126, 129, 135 ve 137 ile yeniden
kontrol etti.

Mülga ya da eski düzen anlatılmıyor: CBK ile kamu tüzelkişiliği, rektörü ve YÖK üyelerini Cumhurbaşkanının
ataması güncel metne uygun. md 125'teki yürütmeyi durdurma şartları (#4) doğru verilmiş: iki şart birlikte
aranıyor. Önceki destelerle çift kart yok.

## Asıl sorun: ön yüz maddede olmayan bir öğe üzerine kurulmuş
#5 (teminat), #7 (ilçe) ve #12 (7 gün) numaralı tuzak kartları, maddede geçmeyen bir öğeyi ön yüze koyup
"Hayır" diyor. Stil kapısı yalnız arka yüzü yeniden yazdığı için ön yüzdeki sorun kalıyor. #5'te yeni arka yüz
artık soruyu (teminat) hiç cevaplamıyor. #12'de de `counterNumbers: [7]` hâlâ uydurma sayıyı taşıyor; 7 gün
Anayasa'da değil, 657 sayılı kanunda geçer.

## Düzeltilecekler

| # | Sınıf | Hakem | Sorun | Düzeltme |
|---|---|---|---|---|
| 5 | K5/K7 | CONFIRMED (A+B) | Ön yüz soruyu Anayasa ile sınırlamıyor. İYUK md 27'ye göre yürütmenin durdurulması kural olarak teminata bağlıdır; genel "Hayır" yanıltıcı. Yeni arka yüz teminatı hiç anmıyor. Açıklamadaki "…nedenleri gerekir" ifadesi sınırlama nedenlerinin birlikte gerektiği izlenimini veriyor. | Ön yüz: "Yürütmenin durdurulması kararı gerekçe gösterilmeden verilebilir mi?" Arka yüz: "Hayır. Karar gerekçe gösterilerek verilir." Açıklama: "Kanun; olağanüstü hallerde, seferberlik ve savaş halinde, ayrıca millî güvenlik, kamu düzeni ve genel sağlık nedenleriyle yürütmenin durdurulmasını sınırlayabilir." |
| 7 | K5/K7 | CONFIRMED (A+B) | Ön yüz "il ve ilçelere mi?" diye soruyor. İlçe, illerin "diğer kademeli bölümleri"nden biridir; kesin "Hayır" okura ilçenin anayasal dayanağı yokmuş izlenimi verir. | qa'ya çevir. Ön yüz: "Anayasaya göre Türkiye merkezî idare kuruluşu bakımından nasıl bölümlere ayrılır?" Arka yüz: "İllere; iller de diğer kademeli bölümlere ayrılır." |
| 12 | K8/K7 | CONFIRMED (B) | Kart, maddede olmayan "7 gün" sayısı üzerine kurulmuş (657 DMK'den); counterNumbers [7] hâlâ duruyor. | Ön yüz: "Anayasaya göre hangi güvence tanınmadıkça disiplin cezası verilemez?" Arka yüz: "Savunma hakkı." counterNumbers'ı kaldır. qa. |
| 23 | K1 (hafif) | CONFIRMED (B) | Açıklama "gecikmede sakınca bulunan halleri" sayılan sebeplerle eş tutuyor ("Bu haller … hallerdir"). md 135 iki şartı birlikte arar: sayılan sebeplerden biri bulunacak VE gecikmede sakınca olacak. | "Men yetkisi; millî güvenliğin, kamu düzeninin, suç işlenmesini veya suçun devamını önlemenin yahut yakalamanın gerektirdiği hallerde, gecikmede sakınca varsa tanınabilir." |
| 27 | K6 (hafif) | PLAUSIBLE (B) | Son cümle #28'in cevabını önceden veriyor. | Son cümleyi çıkar. |

## Öneri (engelleyici değil)
- #26: md 137'deki "Ancak üst emrinde ısrar eder ve yazıyla yenilerse emir yerine getirilir" istisnasını
  açıklamaya bir cümleyle eklemek (istisna #27'de ayrıca işleniyor).
- #16: açıklama ön yüzdeki sorudan farklı bir konuyu anlatıyor.

## Temiz
1–4, 6, 8–11, 13–22, 24–26, 28.

## Hat önerisi (kart-uret.ts)
- Stil kapısı arka yüzü yakaladığında yalnız arka yüzü değil **kartın tamamını** yeniden ürettirmeli; kalıbın
  kökü ön yüzde.
- İsteme şu kural eklenmeli: "Tuzak kartının ön yüzü yalnız Anayasa metninde geçen bir öğeyle (başka bir
  maddenin sayısı/mercii/şartı) kurulur; başka kanundan (İYUK, 657 DMK vb.) ya da hiçbir metinden gelmeyen
  öğe kullanılmaz."
- Betik denetimi: `counterNumbers`'taki her sayı Anayasa metninin herhangi bir maddesinde geçmeli. 7 gün bu
  kontrolde düşerdi.

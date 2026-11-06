KARAR: GEÇTİ

> **Tur 2 (7 Kas 2026):** Dosya tur 1 sürümüyle karşılaştırıldı; mekanik kapıdan 27/0 geçti. Eski #18 (AYM iptal kalıntısı)
> çıkarıldı; sonraki kartların numarası bir kaydı. Yalnız şunlar değişmiş:
> - #4: suç teşkil eden emir istisnası eklendi.
> - #9: arka yüzde yalnız "zorunlu süreden fazla olamaz" kaldı.
> - #14: ön yüz md 2'deki hâllere bağlandı.
> - #15: "kaçmakta olan".
> - #23 ve #26: tür qa oldu.
>
> Üretim istemine yeni kural eklendi: "(İptal ibare) (…)" boşluklu fıkradan kart yazılmaz. Prod'a in_review olarak
> yüklenebilir.
>
> Aşağıda tur 1 raporu duruyor.


# Denetim — pvsk-gorev-emir-kimlik (28 kart, PVSK md 1, 2, 4, 4/A, 5)

Tarih: 7 Kas 2026. Deste: `uretim/pvsk-gorev-emir-kimlik.json`. Mekanik kapı (`--metin pvsk-metin.json`): GEÇTİ
(28/0). Hat: Denetçi A (3) + Denetçi B (4); iki denetçi #9 ve #18'de birleşti. Hakem md 4/A metnini kendisi okudu.

**Doğru olanlar:**
- md 4/A: durdurma amaçları (a–ç), "makul sebep" ile "yeterli şüphe" ayrımı, kimlik sormadan önce belge gösterme,
  savcıya haber verme, talep üzerine belge verilmesi;
- md 2: aykırı emirde yazılı yenileme, suç teşkil eden emir, sözlü emir hâlleri;
- md 5: kayıt dışı kalan bilgi.

Tuzak kartları (#13, 17, 19, 26) metinle kesin destekleniyor. CMK desteleriyle çift kart yok; sınav dili yok.

## Düzeltilecekler

| # | Sınıf | Hakem | Sorun | Düzeltme |
|---|---|---|---|---|
| 18 | K4/K7 | CONFIRMED (A+B; hakem metni okudu) | md 4/A'da kolluk amirinin kararını tanımlayan ibare AYM'nin 4/5/2017 tarihli, E.2015/41, K.2017/98 sayılı kararıyla iptal edilmiş; metinde "(…)" kalmış. "Kolluk amirinin kararı 24 saatte hâkim onayına sunulur" cümlesinin konusu yok; kart işlemeyen bir yetkiyi öğretiyor, ön yüz de hangi kararın sunulacağını söylemiyor. | **Kartı çıkar.** |
| 9 | K4 | PLAUSIBLE (A+B) | Olumsuz iddia doğru, ama arka yüz 24 saati aynı iptal kalıntısına bağlıyor. | Arka yüz yalnız: "Hayır. Durdurma süresi, durdurma sebebine esas teşkil eden işlemin gerçekleştirilmesi için zorunlu olan süreden fazla olamaz." 24 saat cümlesini çıkar. |
| 4 | K7 | PLAUSIBLE (B) | "Amir yazılı yenilerse emir yerine getirilir" istisnasız; aynı fıkrada konusu suç teşkil eden emir hiçbir suretle yerine getirilmez. | Açıklamaya ekle: "…ancak konusu suç teşkil eden emir hiçbir suretle yerine getirilmez." |
| 15 | K1 (hafif) | PLAUSIBLE (A) | md 2/VI "kaçmakta olan" diyor; kart "kaçan" diyor ve tamamlanmış kaçışa genişletiyor. | Ön yüzde "elinden kaçmakta olan". |
| 14 | K7 (hafif) | PLAUSIBLE (B) | Ön yüz "kanunda sayılan hâller" diyor ama hangi hâller olduğunu söylemiyor; okur bunu md 2'deki aykırı emir kuralıyla karıştırabilir. | Ön yüz: "md 2'de sayılan hâllerde (ör. işlenmekte olan suça mani olmak) polis, yetkili amirin sözlü emrinin yazılı verilmesini isteyebilir mi?" |

## İnsan notu
- md 4/A'daki AYM iptali (E.2015/41, K.2017/98): iptal edilen ibare metinde "(…)" olarak duruyor. Kalan "kolluk amirinin kararı 24 saat" cümlesinin uygulamada nasıl okunduğu betikle doğrulanamaz. Bu fıkraya dayanan her yeni kart insan incelemesinden geçmeli.
- #5, Anayasa md 137 kartıyla (anayasa-yurutme-2 #27) aynı sonuca gidiyor. Kanunlar farklı olduğu için çift kart sayılmadı.

## Öneri (engelleyici değil)
- #24 ve #27 `numeric` türünde ama cevapları kanun adı; `qa` daha uygun.

## Temiz
1–3, 5–8, 10–13, 16, 17, 19–28.

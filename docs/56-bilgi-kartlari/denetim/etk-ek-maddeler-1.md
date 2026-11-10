KARAR: GEÇTİ

> **Tur 2 (7 Kas 2026):** Dosya tur 1 sürümüyle karşılaştırıldı; mekanik kapıdan 28/0 geçti. Yalnız iki kart değişmiş:
> - #11: ön yüzden 743 sayılı Kanun adı çıktı.
> - #22: "Üç yıla kadar"; 6 yıl cümlesi çıktı.
>
> Prod'a in_review olarak yüklenebilir.
>
> Aşağıda tur 1 raporu duruyor.


# Denetim — etk-ek-maddeler-1 (28 kart, 3201 Ek 1–18)

Tarih: 7 Kas 2026. Deste: `uretim/etk-ek-maddeler-1.json`. Kalkmış kurum ve güncel madde kurallarıyla üretilen ilk ek
madde destesi. Mekanik kapı (`--metin etk-metin.json`): GEÇTİ (28/0). Hat: Denetçi A (2) + Denetçi B (2); iki denetçi
aynı iki kartta birleşti.

**Yeni kurallar işe yaramış:**
- Mülga Ek 4–9 (KHK-682 / 7068), süresi dolmuş Ek 3 ve Ek 18'deki 1983 tarihi için kart yok.
- Ek 11'deki eski "tüzük" atfı kullanılmamış.
- #1'deki "Emniyet Umum Müdürü (Emniyet Genel Müdürü)" parantezi ad güncellemesi; metinde dayanağı var.
- Tuzaklar (#7, 8, 10, 17, 19, 23, 25) metinle destekleniyor.
- Çift kart yok.

## Düzeltilecekler

| # | Sınıf | Hakem | Sorun | Düzeltme |
|---|---|---|---|---|
| 22 | K2 | PLAUSIBLE (A+B) | Ek 15 hizmet süresini 3 yıl, uzatmayı "üç yıla kadar" diyor. "Birimde geçebilecek süre en fazla 6 yıla ulaşır" cümlesi metinde yok; açık formül de yok. Mekanik kapı 6'yı başka bir sayıdan kaçırdı. | Arka yüz: "Üç yıla kadar (idarenin gerekli görmesi veya personelin istemi üzerine)." 6 yıl cümlesini çıkar. |
| 11 | K4 | PLAUSIBLE (A+B) | Ön yüz Ek 11'deki 743 sayılı (1926) Türk Kanunu Medenisi adını güncel çerçeve gibi kullanıyor; bugün 4721 sayılı Türk Medeni Kanunu yürürlükte (metin dışı bilgi). Cevap metne uygun. | Ön yüzden kanun adını çıkar: "Emniyet Teşkilatı mensubunun bir vakfın kurucusu olabilmesi neye bağlıdır?" |

## Öneri (engelleyici değil)
- sourceLabel "Ek 1 … Ek 18" diyor, ama Ek 3–9 kartsız (çoğu mülga). Etiket ünite kapsamı olarak kalabilir.

## Temiz
1–10, 12–21, 23–28.

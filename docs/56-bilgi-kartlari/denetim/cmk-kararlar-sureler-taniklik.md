KARAR: GEÇTİ

> **Tur 2 (6 Kas 2026):** Dosya tur 1 sürümüyle karşılaştırıldı. Yalnız #6, 18, 24, 29 ve 30 değişmiş; hepsi
> önerilere ve md 38/A, 45, 51 ve 60 metnine uygun. #24 artık takdire bağlı (qa); #30 olumlu soru; #29'da
> "soruşturma evresinde" kaydı yalnız sulh ceza hâkimine bağlı. Prod'a in_review olarak yüklenebilir. Olumsuz soru
> kuralı isteme ve stil kapısına eklendi.
>
> Aşağıda tur 1 raporu duruyor.

# Denetim — cmk-kararlar-sureler-taniklik (30 kart, CMK md 34–61)

Tarih: 6 Kas 2026. Deste: `uretim/cmk-kararlar-sureler-taniklik.json`. Mekanik kapı (`--metin cmk-metin.json`):
GEÇTİ (30/0). Hat: Denetçi A (0 kusur) + Denetçi B (5); hakem birleştirdi.

**Süre ve merci hatası yok:**
- md 39: süre başlangıcı ve gün/hafta/ay hesabı; son gün tatile rastlarsa ertesi gün;
- md 38/A-9: UYAP'ta gün sonu;
- md 41: iki hafta, engelin kalkmasından;
- md 42/2: kabul kesin, ret itiraza açık;
- md 45/1-d: üçüncü derece kan, ikinci derece kayın hısımları;
- md 46/2: hekim istisnası;
- md 47/3: alt sınırı beş yıl ve üstü suçlar;
- md 50: yeminsiz dinlenenler;
- md 60: üç ay ve hükme kadar.

md 38/A (6352), 43/4 ve 47/4 (Cumhurbaşkanı) güncel. Çapraz tuzak yok. Önceki CMK desteleriyle çift kart yok; md 22
ile md 45 aynı dereceleri kullanıyor, ama normlar ve sorular farklı.

## Düzeltilecekler

| # | Sınıf | Hakem | Sorun | Düzeltme |
|---|---|---|---|---|
| 30 | K7 | CONFIRMED (B) | "Disiplin hapsi kararına itiraz edilemez mi? Hayır" iki türlü okunabiliyor. | Ön yüz: "Disiplin hapsi kararı kesin midir?" Arka yüz: "Hayır. Disiplin hapsi kararına itiraz edilebilir." |
| 24 | K7 | CONFIRMED (B) | Nişanlıya yemin verilmez mi sorusuna "Hayır" deniyor; doğru cevap evet ya da hayır değil, takdir (md 51). Yemin zorunluymuş gibi okunabiliyor. | Ön yüz: "Tanıklık eden şüpheli nişanlısına yemin verilip verilmeyeceğine kim karar verir?" Arka yüz: "Hâkim veya mahkeme takdir eder; tanık yemin etmekten çekinebilir ve bu ona bildirilir." |
| 18 | K7 | PLAUSIBLE (B) | "Kayın hısımları ikinci derece dahil" koşulsuz; md 45/1-c'ye göre kayın hısımlığından üstsoy ve altsoy derece sınırı olmadan çekinebilir (#17 bu istisnayı veriyor, #18 vermiyor). | Açıklamaya ekle: "Kayın hısımlığından üstsoy ve altsoy derece sınırı olmaksızın ayrıca sayılır (md 45/1-c)." |
| 6 | K2 (hafif) | PLAUSIBLE (B) | "Mühür yalnız … fiziki örnek çıkarılması gereken hâlde devreye girer" ifadesindeki "yalnız" maddede yok. | "yalnız" sözcüğünü çıkar: "Elektronik ortamdan fiziki örnek çıkarılması gerekirse örnek imzalanır ve mühürlenir." |
| 29 | K11 | PLAUSIBLE (B) | "Naip hâkim ve istinabe olunan mahkeme de…" ifadesi bu iki merciyi soruşturma evresine bağlıyor gibi; md 60/2'de "soruşturma evresinde" kaydı yalnız sulh ceza hâkimi için. | "Kanun ayrıca naip hâkim ile istinabe olunan mahkemeyi de yetkili kılar; 'soruşturma evresinde' kaydı yalnız sulh ceza hâkimi içindir." |

## Hat önerisi
Olumsuz soruya verilen "Hayır" belirsizliği TCK ve CMK'da tekrar ediyor. kart-uret.ts istemine şu kural eklenebilir:
"Tuzak kartının ön yüzü olumlu soru kalıbında kurulur ('…edilebilir mi?', '…kesin midir?'); 'edilemez mi?', 'verilmez
mi?' gibi olumsuz soru kullanılmaz." Stil kapısına da ön yüzde `(m[ıiuü]|m[ae]z) m[ıiuü]\?` deseni eklenebilir.

## Temiz
1–5, 7–17, 19–23, 25–28.

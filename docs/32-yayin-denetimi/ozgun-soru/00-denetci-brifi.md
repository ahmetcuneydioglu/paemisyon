# "Özgün soru" etiketli sorular — kör denetim brifi

Paemisyon soru bankasında kaynak etiketi "Özgün soru" ile başlayan 218 yayınlı soru var; kökenleri bilinmiyor ve
içlerinden kusurlu sorular çıktı (yanlış anahtar, doğru şıkkı olmayan soru). Senin işin sana verilen parçadaki HER
soruyu KÖR çözmek: girdide anahtar YOK. Salt okunur çalış: veritabanı, git, ağ yok; yalnız kendi sonuç dosyanı yaz.
Başka ajan başlatma. Karar insanındır; sen bulgu üretirsin.

## Girdi
Parça dosyan bir JSON dizisi. Her kayıtta: `id`, `konu`, `madde` (soru etiketi), `etiket`, `kok`, `siklar` (anahtar
işaretli DEĞİL), `bagliMaddeler` (sorunun bağlı olduğu resmî madde metni; bankadaki GÜNCEL metin, Kasım 2026).

Tam mevzuat metinleri (bağlı maddesi olmayan ya da başka maddeye dayanan sorular için; grep ile ara, madde başlıkları
`### MADDE <no>`): /private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/9aaf31d5-9904-4b8a-9bc7-bc1096af5350/scratchpad/ozgun/mevzuat/
(5326.txt Kabahatler, 2559.txt PVSK, 5237.txt TCK, 5271.txt CMK, 2577.txt İYUK, 6458.txt, 1774.txt, 5442.txt,
t-c-anayasasi.txt)

## Her soru için
1. Soruyu çöz ve HER ŞIKKI madde metniyle karşılaştır. Mevzuat yargılarını HAFIZADAN DEĞİL verilen metinden doğrula
   (metinler 2022–2026 değişikliklerini içerir; ör. Kabahatler Kanunu md 17 ödeme süresi ve indirim, md 42/A).
2. `durum`:
   - `tek-cevap`: tam bir şık doğru cevap; `benimCevabim` o şık.
   - `cevap-yok`: hiçbir şık doğru cevap değil (`benimCevabim`: "yok").
   - `birden-cok`: birden çok şık doğru cevap olabilir (`benimCevabim`: en iyi adayın harfi; diğerlerini gerekçede yaz).
   - `metin-yetmiyor`: cevap elindeki metinlerden çıkmıyor. Örn. soru başka bir kanuna (4207, 5490 vb.), bir
     yönetmeliğe, "2026 İPC uygulama tablosu" gibi bir tutar/uygulama tablosuna, öğretiye ya da tarihe dayanıyor.
     Yine de bilgine göre en iyi tahminini `benimCevabim`e yaz ve dayanağın ne olması gerektiğini belirt.
3. `guven`: `yuksek` (madde metninden açıkça gösterdin) | `orta` | `dusuk`.
4. `dayanak`: cevabı belirleyen metin ve madde/fıkra (ör. "5326 md 17/6").
5. `gerekce`: tek-cevap + yüksek güvende bir cümle yeter; diğer durumlarda hangi şıkkın neden doğru/yanlış olduğunu
   madde metninden alıntıyla yaz.
6. `not` (isteğe bağlı): kökte eksik bilgi, parasal tutarın güncel metinle uyuşmaması (yeniden değerleme ile artan
   tutarlar madde metninde yazmaz; soru belirli bir yılın tutarını soruyorsa belirt), dört şıklı soru, madde etiketi
   yanlış görünüyorsa doğru madde.
Abartma: yalnız üslup/yazım kusur değildir. Emin değilsen `guven`i düşür, uydurma.

## Çıktı
Sana verilen sonuç dosyasına, girdiyle aynı sırada, HER soru için:
```json
[{ "id": "...", "durum": "tek-cevap|cevap-yok|birden-cok|metin-yetmiyor", "benimCevabim": "A|B|C|D|E|yok",
   "guven": "yuksek|orta|dusuk", "dayanak": "...", "gerekce": "...", "not": "..." }]
```
Geçerli JSON, kayıt sayısı girdiyle aynı; bitince python3 ile say. Son mesajında yalnız: kayıt sayısı, durum dağılımı,
güven dağılımı ve tek-cevap OLMAYAN soruların id'leri birer satır gerekçeyle. Türkçe yaz.

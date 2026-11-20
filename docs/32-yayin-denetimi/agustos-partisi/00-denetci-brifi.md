# Ağustos partisi denetimi — denetçi brifi

Paemisyon soru bankasında 26–27 Ağustos 2026'da oluşturulmuş, kaynak etiketi olmayan 638 soruluk bir parti var
(Anayasa, Türk Ceza Kanunu, CMK). Bu partinin, birkaç gün sonra içe aktarılan kaynaklı soruların yeniden yazılmış
kopyası olduğundan şüpheleniyoruz ve içinden kusurlu sorular çıktı (yanlış anahtar, doğru şıkkı olmayan, iki cevaplı).
Senin işin sana verilen parçadaki HER soruyu iki açıdan değerlendirmek. Hiçbir şeyi değiştirmeyeceksin: veritabanına
bağlanma, dosya düzenleme (kendi sonuç dosyan dışında) yok. Karar insanındır; sen bulgu üretirsin.

## Girdi
Parça dosyan bir JSON dizisi. Her kayıtta:
- `id`, `konu`, `madde` (soru etiketi), `kok`, `siklar` (✓ işaretli olan bankadaki ANAHTAR), `aciklama`
- `bagliMaddeler`: sorunun bağlı olduğu resmî madde metni (bankadaki GÜNCEL metin, Kasım 2026)
- `olasiAsillar`: aynı konuda parti DIŞI en benzer en çok dört soru (kelime benzerliğiyle seçildi; ikiz olmayabilir)

Tam mevzuat metinleri (bağlı maddesi olmayan ya da başka maddeye dayanan sorular için, grep ile ara):
`/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/9aaf31d5-9904-4b8a-9bc7-bc1096af5350/scratchpad/agustos/mevzuat/`
(anayasa.txt, tck.txt, cmk.txt, 5275-infaz.txt, 5326-kabahatler.txt; madde başlıkları `### MADDE <no>`)

## 1. İkiz mi?
`olasiAsillar` içinde bu soruyla AYNI kuralı AYNI kurguyla ölçen ve doğru cevabı aynı olan bir soru var mı?
- `ayni`: kök ve şıklar hemen hemen aynı
- `yeniden-yazim`: aynı soru, kök/şıklar/adlar yeniden yazılmış (ör. "(A)" yerine "Ahmet"); aynı öncüller ya da aynı olay, aynı cevap
- `yok`: adaylar yalnız aynı konuyu işliyor; farklı öncül, farklı olay ya da farklı cevap. Emin değilsen `yok` yaz.

## 2. Soru doğru mu?
Soruyu ANAHTARA BAKMADAN kendin çöz, sonra anahtarla karşılaştır. Mevzuata dayanan her yargıyı HAFIZADAN DEĞİL verilen
madde metninden doğrula (metinler 2024–2026 değişikliklerini içerir; eski bilgin yanlış olabilir).
- `temiz`: tek doğru cevap var ve o anahtar.
- `kusurlu`: anahtar madde metnine aykırı; ya da doğru şık yok; ya da birden çok şık doğru; ya da kök şıklarla
  çelişiyor/eksik (çözmek için gereken bilgi kökte yok). Hangi şık(lar)ın neden doğru/yanlış olduğunu madde ve fıkra
  göstererek yaz.
- `eskimis`: soru eski metne göre doğruydu, güncel metne göre artık yanlış ya da iki cevaplı.
- `suphe`: cevap madde metninden çıkmıyor, öğretiye/içtihada dayanıyor ve tartışmalı; ya da karar veremedin. Nedenini yaz.
Yalnız üslup, yazım ya da açıklama zayıflığı kusur DEĞİLDİR (istersen `not` alanına yaz). Açıklamadaki esaslı hata
(yanlış madde, yanlış kural) `not` alanına yazılır, hüküm sorunun kendisine göredir.
Abartma: emin olmadığın kusuru `suphe` yaz; `kusurlu` dediğin her soruda gerekçen madde metniyle gösterilebilir olmalı.
Dört şıklı soru görürsen `not` alanına "dört şıklı" yaz.

## Çıktı
Sonucu şu dosyaya yaz (parça numaran neyse): 
`/private/tmp/claude-501/-Users-ahmetcnd-Developer-paemisyon/9aaf31d5-9904-4b8a-9bc7-bc1096af5350/scratchpad/agustos/sonuc/parca-NN.json`
Biçim — parçadaki HER soru için bir kayıt, girdiyle aynı sırada:
```json
[{ "id": "<soru id>", "ikiz": "ayni|yeniden-yazim|yok", "ikizId": "<asıl soru id ya da null>",
   "hukum": "temiz|kusurlu|eskimis|suphe", "benimCevabim": "A|B|C|D|E|yok|birden-cok",
   "gerekce": "<temiz için kısa dayanak (md/fıkra); diğerlerinde ayrıntılı, madde metninden alıntıyla>",
   "not": "<isteğe bağlı>" }]
```
Dosya geçerli JSON olmalı ve kayıt sayısı girdidekiyle aynı olmalı; bitirince `python3 -c` ile say ve doğrula.
Son mesajında yalnız şunu bildir: kayıt sayısı, hüküm dağılımı, ikiz dağılımı ve kusurlu/eskimiş soruların id'leri
(birer satır gerekçeyle). Türkçe yaz.

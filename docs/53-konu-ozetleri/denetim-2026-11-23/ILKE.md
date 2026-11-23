# Konu özeti ünitesi anlam denetimi (Paemisyon Doc 53)

Bağlam: Polis amirliği sınavına (PAEM) hazırlananlar için kanun maddelerinden üretilmiş "konu özeti" ünitesi. Ünite
bir kart dizisidir (`blocks`): rule / numbers / trap / compare türleri; her kart `refs` (ya da benzer alan) ile resmî
madde numarasına bağlanır. `exam_stats` ve `bridge` kartlarını betik doldurur, onları DENETLEME. Betik doğrulaması
(rakamların madde metninde geçmesi) zaten geçti; sen ANLAMI denetliyorsun.

Dayanak: girdi dosyasındaki `articles` (no, title, text) — mevzuat.gov.tr konsolide metni. Girdideki `questions`
bankadaki sorulardır; yalnız "ne soruluyor" bilgisidir.

## Ölçüt

- **ESAS**: kart madde metniyle çelişiyor ya da maddede olmayan yetki/süre/şart/istisna/makam/olgu yazıyor; eksik
  koşul yüzünden kural yanlış genelleşmiş; "verilebilir"/"verilir", "ve"/"veya" kipi değişmiş; iki maddenin ya da iki
  bendin hükmü karışmış; yazıyla yazılmış sayı ("bir kat", "üç ay") metinle uyuşmuyor; tuzak kartındaki olumsuz iddia
  metinden çıkarılamıyor (metnin saymaması yasak olduğunu göstermez); referans madde iddiayı taşımıyor.
- **ESKİME**: kart, metinde duran ama işlemeyen bir hükmü güncel bilgi gibi öğretiyor (kalkmış kurum: İnhisarlar
  İdaresi, Bakanlar Kurulu, TAPDK; Anayasa Mahkemesi iptali; dolmuş geçiş süresi). Bildiğin güncel durumu yaz.
- **TUTAR**: kartta TL tutarı var. Kullanıcı kararı (18 Kas 2026): nominal para cezası tutarları özete YAZILMAZ
  (yeniden değerlemeyle eskir); yaptırımın türü ve cezayı veren makam kalır. Her tutarı bildir.
- **ZAYIF**: belirsiz, kısmi listeyi tam gibi sunan, sınav değeri düşük (yürürlük/yürütme, yönetmelik çıkarma süresi)
  ya da aynı bilgiyi ikinci kez veren kart.
- **BİÇİM**: dil/üslup ("şık", "çeldirici", "metinde" göndermesi), kaynak cümlesinin aynen kopyalanması.
- **BANKA**: madde metninin kendisi bozuk görünüyor (yarım cümle, dipnot artığı, başlık kayması).

Her kartın HER iddiasını referans maddenin metniyle tek tek karşılaştır; bulguyu madde metninden alıntıyla kanıtla.
Madde metninde açıkça duran, sınav değeri yüksek ama kartı olmayan bilgiyi NOTLAR'a yaz.

## Çıktı (yalnız bu biçim, Türkçe)

```
ÜNİTE: <slug> · KART: <n>
| Kart # (blocks sırası, 1 tabanlı) | Sınıf | Sorun (maddeden alıntıyla) | Önerilen düzeltme (hazır metin ya da "çıkar") |
...
TEMİZ: <numaralar>
NOTLAR: ...
```

Dosyaları DEĞİŞTİRME; yalnız oku, raporu sana verilen yola yaz. Git komutu ve veritabanı betiği çalıştırma.
Son mesajında yalnız sınıf başına bulgu sayısını ve ESAS/ESKİME bulgularının birer cümlelik özetini ver.

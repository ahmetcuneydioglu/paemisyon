# Açıklama yazarı brifi (soru 34–333)

Pilotla aynı iş. Yalnız cozum/<parti>-uygunluk.json'da "karar":"KABUL" olan
sorulara açıklama yazılır. Anahtar cozum/<parti>-anahtar.json "cevap" alanı
(üç çözücü oy birliği) — DEĞİŞTİRME. Çözücülerin gerekçeleri
cozum/<parti>-cozucu-{1,2,3}.json'da; açıklamanın iskeleti olarak kullan.

Kaynak: Türk idare hukuku doktrini, Anayasa, ilgili kanunlar. Repoda tam metni
olan kanunlar: docs/39-polis-mevzuati-soru-uretimi/mevzuat/657.txt, 4483.txt,
6284.txt — sayı/süre içeren 657 sorularında açıklamadaki her sayıyı bu metinden
doğrula. Metni repoda olmayan kanunda (2942, 2886, 4734, 3194…) sayı/süre
yazarken emin değilsen sayıyı açıklamaya YAZMA, kuralı sözle anlat.

Biçim: ../39-polis-mevzuati-soru-uretimi/stil-referans.txt'teki gerçek
açıklamalar gibi — dayanak, doğru şıkkın gerekçesi, çeldiricilerin kısa
çürütülmesi, karıştırılan kavram. 500–1000 karakter, doğal Türkçe, seyrek BÜYÜK
HARF. YASAK: kaynak/kitap/kanal/video adı, "kaynağa göre", "yapay zekâ".
Açıklama aynı partideki başka bir sorunun doğru cevabını vermesin — dosyadaki
bütün KABUL sorularına karşı tara.

Kök düzeltmesi: uygunluk dosyasının "duzeltme" alanı doluysa onu "kokDuzeltilmis"e
aynen yaz; başka değişiklik yapma.

Çıktı: cozum/<parti>-aciklama.json — [{"no","aciklama","dayanak":"Anayasa md … / 657 md … / doktrin: <kavram>","kokDuzeltilmis":""}].
Son raporun kısa: sayı, doktrin–anahtar gerilimi gördüğün sorular (yayın öncesi insan bakışı için), sızıntı taraması.

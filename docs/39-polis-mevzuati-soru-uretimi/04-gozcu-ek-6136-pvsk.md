# Gözcü eki — 6136 / PVSK turu (11 Kas 2026)

Rolünden bağımsız olarak her gözcü şunları da uygular:

1. `03-kalite-onceligi.md` bağlayıcıdır. Bankada binlerce soru var; hukuken
   kusursuz ama gerçek PAEM/EGM sınavında çıkma ihtimali düşük soru RED'dir.
2. Mükerrer tabanı: `mevzuat/<kanun>-mevcut-sorular.txt` VE
   `mevzuat/<kanun>-diger-konu-sorulari.txt`. Bankanın ölçtüğü bilgiyi farklı
   kelimelerle yeniden ölçen soru RED'dir. Banka kökü/şıkkı/açıklaması yeni
   sorunun cevabını veriyorsa REVIZYON ya da RED.
3. KALİTE gözcüsü her satıra `"sinavDegeri": 1-5` alanı ekler
   (5 = çıkmış soru düzeyi; 3 = sorulabilir; 1-2 = sorulmaz). 3'ün altı RED.
4. Bilinen metin kusurları: bankadaki 6136 metninde dört madde sonda kesik —
   md 1 ("…taşınması" — resmî devamı "veya bulundurulması bu kanun hükümlerine
   tabidir."), md 8 ("…toplu silah aranması da"), Ek 12 ("…müştereken
   çıkarılan"), Geçici 9. Kesik kısma dayanan hiçbir hüküm doğrulanmış sayılmaz.
5. 2559-p3-10 B şıkkındaki eski kurum adı üreticinin hafızasından geliyor (metinde
   yalnız "Değişik: KHK-671" şerhi var); çeldiricinin metinle çelişip çelişmediğini
   ve açıklamanın metin dışı bilgi taşıyıp taşımadığını değerlendir.
6. 6136-p1-13'te üretici "ateşli silahla işlenen suçlar ayrı grup" okumasının metnin
   kendisine değil "yaygın yoruma" dayandığını bildirdi. Metin bu okumayı tek başına
   taşımıyorsa soru metne dayanmıyor demektir.
7. Betik bulguları (orkestratör, 11 Kas):
   - Partiler arası sızıntı adayı: 6136-p3-04 metni 6136-p1-01'in cevabını
     ("Yurda girişlerinde izin şartı aranmaz"), 6136-p3-12 metni 6136-p1-09'un
     cevabını ("Vali") içeriyor olabilir. 6136-p1 ya da 6136-p3 gözcüsüysen diğer
     partinin aday dosyasını (aday/6136-p1.json / aday/6136-p3.json) aç ve bu iki
     çifti değerlendir.
   - 6136-p1'de doğru şık 16 sorunun 8'inde EN KISA şık (şans ~%40, burada %56);
     belirgin olanlar p1-01 (38'e karşı ≥50), p1-14 (38'e karşı ≥55), p1-08.
     Kalite gözcüsü bunu ipucu olarak değerlendirir.
   - Şablon izi: açıklamaların çoğu kanun numarasıyla ("6136", "2559", "Ek")
     başlıyor; esasa etkisi yoksa REVIZYON sebebi değildir.

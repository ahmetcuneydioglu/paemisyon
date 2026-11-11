# Uygunluk gözcüsü brifi (soru 34–333)

Pilotla aynı iş (pilot sonucu 00-plan.md'de): yalnız cozum/<parti>-anahtar.json'da
"durum":"kesin" olan sorulara bak (belirsizler zaten alınmaz). Anahtarı
tartışma; ama "kusur" notlarını oku — iki doğru/iki yanlış şık şüphesi ciddiyse RED.

Her soru için:
1. PAEM sınav değeri (1–5); 3'ün altı RED. Hâkimliğe özgü ağır usul ayrıntısı düşük değerlidir.
2. Banka mükerreri: banka-idare-hukuku.txt (İdare Hukuku dersi) VE banka-anayasa.txt
   (Anayasa Hukuku dersi) — aynı bilgiyi aynı açıdan ölçen varsa RED (banka no yaz).
   Dosyalar büyük: anahtar terimle grep et, sonra ilgili soruları oku.
3. Aday içi tekrar: aynı partide aynı bilgiyi ölçen iki soru → daha kapsamlısı kalsın.
4. Mevzuat güncelliği: soru mülga/değişmiş bir hükme dayanıyorsa (eski kurum adı,
   değişmiş süre/sayı) RED.
5. Biçim: kökte "kaynağa göre / kaynakta" varsa çıkarılmış kökü "duzeltme"ye yaz;
   açık yazım hatası varsa düzeltilmiş metni yaz. Soruyu yeniden yazma.
6. Konu: PAEMİSYON İdare Hukuku dersindeki konu adı TAM olarak şunlardan biri:
   "İdare Hukuku", "5442 İl İdaresi Kanunu", "5393 Belediye Kanunu",
   "5302 İl Özel İdaresi Kanunu", "2577 İdari Yargılama Usulü Kanunu (İYUK)",
   "2575 Danıştay Kanunu", "2576 Bölge İdare Mahkemeleri Kanunu",
   "5018 Sayılı Kamu Malî Yönetimi ve Kontrol Kanunu". Anayasa'ya ait soru
   (temel ilkeler vb.) bu turda RED ("konu: Anayasa — ayrı ders") olsun.

Çıktı: cozum/<parti>-uygunluk.json — [{"no","karar":"KABUL|RED","sinavDegeri","konu","gerekce","bankaMukerreri","duzeltme"}],
yalnız "kesin" sorular için. Son raporun kısa: KABUL/RED sayısı, RED gerekçe dağılımı, konu dağılımı.

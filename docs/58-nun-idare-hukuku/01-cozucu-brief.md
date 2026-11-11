# Bağımsız çözücü brifi (soru 34–333, 12 Kas 2026)

Video 2–7 kanalın üyelerine kapalı; altyazı doğrulaması yapılamıyor. Kullanıcı
kararı: ÜÇ bağımsız çözücü, OY BİRLİĞİ. Bir sorunun anahtarı ancak üç çözücü de
aynı cevabı verir ve hiçbiri güveni "dusuk" işaretlemezse kurulur; aksi hâlde
soru alınmaz.

Kurallar:
- Başka çözücülerin dosyalarını (cozum/) ve altyazi/ klasörünü AÇMA.
- Türk idare hukuku doktrini (yerleşik ders kitaplarının çizgisi), Anayasa ve
  ilgili kanunlar (2577 İYUK, 2575, 2576, 657, 5442, 5393, 5302, 5018, 4734,
  2942, 2886, 1 sayılı CBK…) esas alınır. Soru hâkimlik sınavı düzeyindedir.
- Her soruda şıkları tek tek ele; olay örgülü sorularda unsurları hükme bağla.
- "guven": yuksek (tartışmasız) · orta (doktrinde baskın görüş açık ama karşı
  görüş var) · dusuk (emin değilim / iki şık savunulabilir / bilgi güncelliği
  şüpheli). Dürüst ol: düşük güven soruyu eler, yanlış anahtar bankayı bozar.
- "kusur": iki doğru şık, cevapsızlık, PDF metin bozukluğu, mülga/eskimiş
  hüküm (ör. kaldırılmış kurum, değişmiş süre) varsa yaz.
- Pilot gözlemi: bazı sorularda kökte "kaynağa göre / kaynakta" ibaresi var —
  bu, yayıncının kendi kaynağındaki görüşü işaret eder; baskın doktrini esas al,
  güveni buna göre ver.

Çıktı: cozum/<parti>-cozucu-<n>.json — [{"no":34,"cevap":"A","guven":"yuksek|orta|dusuk","gerekce":"tek cümle","kusur":""}],
partideki her soru için bir satır. Son raporun kısa: düşük/orta güvenli sorular, kusurlu sorular.

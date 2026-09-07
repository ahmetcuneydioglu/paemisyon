import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/features/exams/domain/cikmis_sinav_models.dart';

/// Model testleri gerçek uç çıktısıyla yazıldı
/// (GET /public/cikmis-sinavlar/paem-9-2025, 7 Eylül 2026).
void main() {
  const resmiJson = {
    'slug': 'paem-9-2025',
    'examId': '9427d88a-25e3-424b-a712-72d96cb722a6',
    'ad': '2025 PAEM 9. Dönem İlk Derece Amirlik Eğitimi Yazılı Sınavı',
    'kurum': 'Polis Akademisi Başkanlığı',
    'donem': 9,
    'tarih': '2025-04-19',
    'tur': 'resmi',
    'ozet': null,
    'soruSayisi': 100,
    'acikSoru': 10,
    'dersDagilimi': [
      {'ders': 'Genel Kültür ve Analitik Düşünme', 'adet': 30},
      {'ders': 'Polis Mevzuatı', 'adet': 10},
    ],
  };

  test('resmî dönem: alanlar ve türetilenler', () {
    final o = CikmisSinavOzet.fromJson(resmiJson);
    expect(o.tur, CikmisSinavTuru.resmi);
    expect(o.donem, 9);
    expect(o.tarih, DateTime.parse('2025-04-19'));
    expect(o.dersDagilimi.first.adet, 30);
    expect(o.kisaAd, 'PAEM 9 · 2025');
    expect(o.cozulebilir, isTrue);
  });

  test('analiz dönemi çözülebilir DEĞİL — motorda karşılığı yok', () {
    // "Konu analizi"ni çözülebilir göstermek, aday hatırlatmasından türetilmiş
    // dağılımı çıkmış sınav diye sunmak olurdu (Doc 36 §1).
    final o = CikmisSinavOzet.fromJson({
      ...resmiJson,
      'slug': 'paem-7-2022',
      'tur': 'analiz',
      'examId': null,
      'donem': 7,
      'tarih': '2022-05-14',
    });
    expect(o.tur, CikmisSinavTuru.analiz);
    expect(o.cozulebilir, isFalse);
  });

  test('resmî ama motora bağlanmamış dönem de çözülebilir değil', () {
    final o = CikmisSinavOzet.fromJson({...resmiJson, 'examId': null});
    expect(o.cozulebilir, isFalse);
  });

  test('donem null ise kısa ad sınavın adına düşer', () {
    final o = CikmisSinavOzet.fromJson({
      ...resmiJson,
      'donem': null,
      'tarih': null,
    });
    expect(o.kisaAd, resmiJson['ad']);
  });

  test('soru: doğru şık harfi ve dayanak', () {
    final s = CikmisSoru.fromJson(const {
      'sira': 9,
      'iptal': false,
      'ders': 'Polis Mevzuatı',
      'konu': '3201 Sayılı Emniyet Teşkilat Kanunu',
      'kok': 'Emniyet Teşkilat Kanunu\'na göre…',
      'gorselUrl': null,
      'siklar': [
        {'harf': 'A', 'metin': 'İçişleri Bakanı', 'dogru': true},
        {'harf': 'B', 'metin': 'Başsavcı', 'dogru': false},
      ],
      'aciklama': 'Doğru cevap A…',
      'dayanak': [
        {
          'baslik': '3201 sayılı Emniyet Teşkilat Kanunu md 1',
          'url': 'https://www.mevzuat.gov.tr/mevzuatmetin/1.3.3201.pdf',
        },
      ],
    });
    expect(s.dogruHarf, 'A');
    expect(s.dayanak.single.url, isNotNull);
  });

  test('doğru şık işaretlenmemişse dogruHarf null — çökmez', () {
    final s = CikmisSoru.fromJson(const {
      'sira': 1,
      'siklar': [
        {'harf': 'A', 'metin': 'x', 'dogru': false},
      ],
    });
    expect(s.dogruHarf, isNull);
    expect(s.ders, '');
  });

  test('detay: kapalı ve iptal sayıları okunur', () {
    final d = CikmisSinavDetay.fromJson({
      ...resmiJson,
      'sorular': const [
        {
          'sira': 1,
          'siklar': [
            {'harf': 'A', 'metin': 'x', 'dogru': true},
          ],
        },
      ],
      'kapaliSoru': 90,
      'iptalSayisi': 3,
    });
    expect(d.ozet.slug, 'paem-9-2025');
    expect(d.sorular, hasLength(1));
    expect(d.kapaliSoru, 90);
    expect(d.iptalSayisi, 3);
  });
}

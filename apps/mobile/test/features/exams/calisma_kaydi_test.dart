import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:paemisyon/features/exams/data/calisma_kaydi.dart';

/// Çalışma modu ilerlemesi cihazda saklanır (7 Eyl 2026 bildirimi): 5 soru
/// çözüp geri dönen aday sıfırdan başlıyordu.
void main() {
  setUp(() => SharedPreferences.setMockInitialValues({}));

  test('yazılan ilerleme geri okunur', () async {
    await CalismaKaydi.yaz('paem-9-2025', {9: 'A', 10: 'C'});
    expect(await CalismaKaydi.oku('paem-9-2025'), {9: 'A', 10: 'C'});
  });

  test('dönemler birbirine karışmaz', () async {
    await CalismaKaydi.yaz('paem-9-2025', {1: 'A'});
    await CalismaKaydi.yaz('paem-8-2024', {2: 'B'});
    expect(await CalismaKaydi.oku('paem-9-2025'), {1: 'A'});
    expect(await CalismaKaydi.oku('paem-8-2024'), {2: 'B'});
  });

  test('kaydı olmayan dönem boş döner', () async {
    expect(await CalismaKaydi.oku('paem-6'), isEmpty);
  });

  test('sıfırlama kaydı siler', () async {
    await CalismaKaydi.yaz('paem-9-2025', {1: 'A'});
    await CalismaKaydi.sil('paem-9-2025');
    expect(await CalismaKaydi.oku('paem-9-2025'), isEmpty);
  });

  test('boş harita yazmak kaydı siler — çöp bırakmaz', () async {
    await CalismaKaydi.yaz('paem-9-2025', {1: 'A'});
    await CalismaKaydi.yaz('paem-9-2025', {});
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getString(CalismaKaydi.anahtar('paem-9-2025')), isNull);
  });

  test('100 soruluk set eksiksiz saklanır', () async {
    final tam = {for (var i = 1; i <= 100; i++) i: 'ABCDE'[i % 5]};
    await CalismaKaydi.yaz('paem-9-2025', tam);
    expect(await CalismaKaydi.oku('paem-9-2025'), tam);
  });

  group('bozuk kayıt uygulamayı çökertmez', () {
    test('geçersiz JSON', () => expect(CalismaKaydi.coz('{bozuk'), isEmpty));
    test('dizi', () => expect(CalismaKaydi.coz('[1,2]'), isEmpty));
    test('boş metin', () => expect(CalismaKaydi.coz(''), isEmpty));
    test('null', () => expect(CalismaKaydi.coz(null), isEmpty));

    test('sayı olmayan anahtar atlanır, geçerliler kalır', () {
      expect(CalismaKaydi.coz('{"9":"A","abc":"B","10":"C"}'), {9: 'A', 10: 'C'});
    });

    test('metin olmayan değer atlanır', () {
      expect(CalismaKaydi.coz('{"9":"A","10":5}'), {9: 'A'});
    });
  });
}

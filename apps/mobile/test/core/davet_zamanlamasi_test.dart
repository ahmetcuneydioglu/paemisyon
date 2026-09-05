import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/core/notifications/davet_zamanlamasi.dart';

void main() {
  const gun = 24 * 60 * 60 * 1000;
  final simdi = DateTime.utc(2026, 9, 6, 12).millisecondsSinceEpoch;

  test('hiç sorulmadıysa gösterilir', () {
    expect(
      bildirimDavetiGosterilsinMi(sonSorulanMs: null, zatenAcik: false, simdiMs: simdi),
      isTrue,
    );
  });

  test('bildirimler zaten açıksa gösterilmez', () {
    expect(
      bildirimDavetiGosterilsinMi(sonSorulanMs: null, zatenAcik: true, simdiMs: simdi),
      isFalse,
    );
  });

  test('dün sorulduysa gösterilmez — reddedene ısrar yok', () {
    expect(
      bildirimDavetiGosterilsinMi(
          sonSorulanMs: simdi - gun, zatenAcik: false, simdiMs: simdi),
      isFalse,
    );
  });

  test('29 gün sonra hâlâ gösterilmez', () {
    expect(
      bildirimDavetiGosterilsinMi(
          sonSorulanMs: simdi - 29 * gun, zatenAcik: false, simdiMs: simdi),
      isFalse,
    );
  });

  test('30 gün dolunca yeniden gösterilir — kalıcı sessizlik yok', () {
    // Eski davranış "bir kez sor, bir daha asla" idi ve uygulamayı kurup
    // "Şimdi değil" diyen herkesi kalıcı olarak ulaşılamaz yapıyordu.
    expect(
      bildirimDavetiGosterilsinMi(
          sonSorulanMs: simdi - 30 * gun, zatenAcik: false, simdiMs: simdi),
      isTrue,
    );
  });

  test('cihaz saati geri alınmışsa (ileri tarihli kayıt) kilitlenmez', () {
    expect(
      bildirimDavetiGosterilsinMi(
          sonSorulanMs: simdi + 365 * gun, zatenAcik: false, simdiMs: simdi),
      isTrue,
    );
  });

  test('süre dolsa bile bildirimler açıksa sorulmaz', () {
    expect(
      bildirimDavetiGosterilsinMi(
          sonSorulanMs: simdi - 400 * gun, zatenAcik: true, simdiMs: simdi),
      isFalse,
    );
  });
}

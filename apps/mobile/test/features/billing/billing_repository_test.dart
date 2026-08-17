import 'dart:convert';
import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:paemisyon/core/error/failure.dart';
import 'package:paemisyon/features/billing/data/billing_repository.dart';

/// Sunucu cevabını taklit eden adapter (paket eklemeden).
class _FakeAdapter implements HttpClientAdapter {
  _FakeAdapter(this.statusCode, this.body);
  final int statusCode;
  final Map<String, dynamic> body;

  @override
  Future<ResponseBody> fetch(RequestOptions options, Stream<Uint8List>? _,
          Future<void>? __) async =>
      ResponseBody.fromString(
        jsonEncode(body),
        statusCode,
        headers: {
          Headers.contentTypeHeader: [Headers.jsonContentType],
        },
      );

  @override
  void close({bool force = false}) {}
}

BillingRepository _repo(int status, Map<String, dynamic> body) {
  final dio = Dio(BaseOptions(baseUrl: 'https://test.local'))
    ..httpClientAdapter = _FakeAdapter(status, body);
  return BillingRepository(dio);
}

void main() {
  group('verifyPurchase', () {
    test('başarılı cevapta premium kararı SUNUCUDAN okunur', () async {
      final r = await _repo(200, {
        'data': {
          'isPremium': true,
          'validUntil': '2027-08-17T10:00:00.000Z',
          'plan': 'yearly',
        }
      }).verifyPurchase(transactionJws: 'jws');

      expect(r.isPremium, isTrue);
      expect(r.plan, 'yearly');
      expect(r.validUntil?.year, 2027);
    });

    test('süresi dolmuş işlem: 200 ama premium AÇILMAZ', () async {
      // İstemci eskiden cevaba bakmadan "Premium etkin 🎉" diyordu.
      final r = await _repo(200, {
        'data': {'isPremium': false, 'validUntil': null, 'plan': 'yearly'}
      }).verifyPurchase(transactionJws: 'jws');

      expect(r.isPremium, isFalse);
    });

    test('400: KALICI hata — işlem kapatılabilir', () async {
      // Ürün hiçbir plana eşlenmiyor / imza geçersiz: bu işlem asla
      // doğrulanamaz; kuyrukta bırakılırsa her açılışta geri gelir.
      await expectLater(
        _repo(400, {
          'error': {'message': 'Ürün bir plana eşlenmedi: x'}
        }).verifyPurchase(transactionJws: 'jws'),
        throwsA(isA<PurchaseVerifyFailure>()
            .having((e) => e.permanent, 'permanent', isTrue)
            .having((e) => e.message, 'message', contains('plana eşlenmedi'))),
      );
    });

    test('401: GEÇİCİ hata — işlem kapatılmamalı (ödeme kaybolur)', () async {
      // Kullanıcı henüz giriş yapmamış olabilir; giriş sonrası doğrulanacak.
      await expectLater(
        _repo(401, {
          'error': {'message': 'Oturum gerekli'}
        }).verifyPurchase(transactionJws: 'jws'),
        throwsA(isA<PurchaseVerifyFailure>()
            .having((e) => e.permanent, 'permanent', isFalse)),
      );
    });

    test('500: GEÇİCİ hata — sunucu toparlayınca tekrar denenir', () async {
      await expectLater(
        _repo(500, {
          'error': {'message': 'Sunucu hatası'}
        }).verifyPurchase(transactionJws: 'jws'),
        throwsA(isA<PurchaseVerifyFailure>()
            .having((e) => e.permanent, 'permanent', isFalse)),
      );
    });
  });
}

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/billing_plan.dart';
import '../domain/verify_result.dart';

/// Billing API (Doc 7/15). Satın alma DOĞRULAMASI sunucuda: istemci imzalı işlemi
/// (StoreKit JWS) /billing/verify'a yollar, premium kararını backend verir.
class BillingRepository {
  final Dio _dio;
  const BillingRepository(this._dio);

  Future<List<BillingPlan>> getPlans() async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/billing/plans');
      final list = (r.data?['data'] as List<dynamic>? ?? const []);
      return list
          .map((e) => BillingPlan.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  /// İmzalı işlemi doğrular; premium kararını SUNUCU verir ve sonucu döner.
  ///
  /// Hata [PurchaseVerifyFailure] olarak fırlar ve `permanent` bayrağı taşır:
  /// çağıran bu bayrağa göre StoreKit işlemini kapatır (kalıcı) veya kuyrukta
  /// bırakıp tekrar dener (geçici). 401/403 GEÇİCİDİR — kullanıcı henüz giriş
  /// yapmamış olabilir; işlemi kapatmak ödemeyi kaybettirir.
  Future<VerifyResult> verifyPurchase({
    required String transactionJws,
    String platform = 'apple',
  }) async {
    try {
      final r = await _dio.post<Map<String, dynamic>>(
        '/billing/verify',
        data: {'platform': platform, 'transactionJws': transactionJws},
      );
      final data = r.data?['data'];
      return data is Map<String, dynamic>
          ? VerifyResult.fromJson(data)
          : const VerifyResult(isPremium: false);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const PurchaseVerifyFailure(
          'İnternet bağlantını kontrol et.',
          permanent: false,
        );
      }
      final code = e.response?.statusCode ?? 0;
      final msg = (e.response?.data is Map)
          ? ((e.response?.data as Map)['error']?['message'] as String?)
          : null;
      throw PurchaseVerifyFailure(
        msg ?? 'Satın alma doğrulanamadı.',
        permanent: code == 400 || code == 422,
      );
    }
  }

  Future<T> _guard<T>(Future<T> Function() run) async {
    try {
      return await run();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      final msg = (e.response?.data is Map)
          ? ((e.response?.data as Map)['error']?['message'] as String?)
          : null;
      throw ServerFailure(msg ?? 'Planlar alınamadı.');
    }
  }
}

final billingRepositoryProvider = Provider<BillingRepository>(
  (ref) => BillingRepository(ref.watch(dioProvider)),
);

final plansProvider = FutureProvider.autoDispose<List<BillingPlan>>(
  (ref) => ref.watch(billingRepositoryProvider).getPlans(),
);

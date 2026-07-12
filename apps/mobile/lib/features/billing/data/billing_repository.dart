import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/billing_plan.dart';

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

  /// İmzalı işlemi doğrular; başarılıysa backend entitlement'ı günceller.
  /// Dönen isPremium/validUntil ile arayan /me'yi tazeler.
  Future<void> verifyPurchase({
    required String transactionJws,
    String platform = 'apple',
  }) async {
    return _guard(() async {
      await _dio.post<Map<String, dynamic>>(
        '/billing/verify',
        data: {'platform': platform, 'transactionJws': transactionJws},
      );
    });
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
      throw ServerFailure(msg ?? 'Satın alma doğrulanamadı.');
    }
  }
}

final billingRepositoryProvider = Provider<BillingRepository>(
  (ref) => BillingRepository(ref.watch(dioProvider)),
);

final plansProvider = FutureProvider.autoDispose<List<BillingPlan>>(
  (ref) => ref.watch(billingRepositoryProvider).getPlans(),
);

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/health_status.dart';

/// Health verisini backend'den çeker (Doc 7 { data } zarfını açar).
class HealthRepository {
  final Dio _dio;
  const HealthRepository(this._dio);

  Future<HealthStatus> getHealth() async {
    try {
      final res = await _dio.get<Map<String, dynamic>>('/health');
      final data = res.data?['data'] as Map<String, dynamic>?;
      if (data == null) throw const ServerFailure();
      return HealthStatus.fromJson(data);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }
}

final healthRepositoryProvider = Provider<HealthRepository>(
  (ref) => HealthRepository(ref.watch(dioProvider)),
);

/// Ekranın izlediği sağlayıcı. Yükleme/hata/veri durumlarını AsyncValue verir.
final healthProvider = FutureProvider.autoDispose<HealthStatus>(
  (ref) => ref.watch(healthRepositoryProvider).getHealth(),
);

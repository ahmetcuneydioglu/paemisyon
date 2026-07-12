import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/dashboard_data.dart';
import '../domain/me_profile.dart';

/// Korumalı /me ucunu çağırır (Bearer token Dio interceptor'dan gelir — Doc 8).
class MeRepository {
  final Dio _dio;
  const MeRepository(this._dio);

  Future<MeProfile> getMe() async {
    return _guard(() async {
      final res = await _dio.get<Map<String, dynamic>>('/me');
      final data = res.data?['data'] as Map<String, dynamic>?;
      if (data == null) throw const ServerFailure();
      return MeProfile.fromJson(data);
    });
  }

  Future<DashboardData> getDashboard() async {
    return _guard(() async {
      final res = await _dio.get<Map<String, dynamic>>('/me/dashboard');
      final data = res.data?['data'] as Map<String, dynamic>?;
      if (data == null) throw const ServerFailure();
      return DashboardData.fromJson(data);
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
      throw const ServerFailure();
    }
  }
}

final meRepositoryProvider = Provider<MeRepository>(
  (ref) => MeRepository(ref.watch(dioProvider)),
);

final meProvider = FutureProvider.autoDispose<MeProfile>(
  (ref) => ref.watch(meRepositoryProvider).getMe(),
);

final dashboardProvider = FutureProvider.autoDispose<DashboardData>(
  (ref) => ref.watch(meRepositoryProvider).getDashboard(),
);

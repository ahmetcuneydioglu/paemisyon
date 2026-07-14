import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/coach_models.dart';

/// Kişisel Koç API'si (Doc 19) — Home'un tek isteği: GET /me/coach.
class CoachRepository {
  final Dio _dio;
  const CoachRepository(this._dio);

  Future<CoachBrief> brief() async {
    try {
      final r = await _dio.get<Map<String, dynamic>>('/me/coach');
      return CoachBrief.fromJson(r.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure('Koç ekranı yüklenemedi, tekrar dene.');
    }
  }
}

final coachRepositoryProvider = Provider<CoachRepository>(
  (ref) => CoachRepository(ref.watch(dioProvider)),
);

final coachBriefProvider = FutureProvider.autoDispose<CoachBrief>(
  (ref) => ref.watch(coachRepositoryProvider).brief(),
);

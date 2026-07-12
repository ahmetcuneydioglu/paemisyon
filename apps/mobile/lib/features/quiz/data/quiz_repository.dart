import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/quiz_models.dart';

/// Quiz API (Doc 7 §4.4). Bearer token Dio interceptor'dan. Değerlendirme sunucuda.
class QuizRepository {
  final Dio _dio;
  const QuizRepository(this._dio);

  Future<StartedSession> start(String mode, String topicId,
      {int count = 10}) async {
    return _guard(() async {
      final r = await _dio.post<Map<String, dynamic>>(
        '/quiz/sessions',
        data: {'mode': mode, 'topicId': topicId, 'questionCount': count},
      );
      return StartedSession.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  Future<AnswerFeedback> answer(
    String sessionId, {
    required String questionId,
    required String versionId,
    String? selectedOptionId,
    int? timeSpentMs,
  }) async {
    return _guard(() async {
      final r = await _dio.post<Map<String, dynamic>>(
        '/quiz/sessions/$sessionId/answers',
        data: {
          'questionId': questionId,
          'questionVersionId': versionId,
          if (selectedOptionId != null) 'selectedOptionId': selectedOptionId,
          if (timeSpentMs != null) 'timeSpentMs': timeSpentMs,
        },
      );
      return AnswerFeedback.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  Future<QuizResult> complete(String sessionId) async {
    return _guard(() async {
      final r = await _dio
          .post<Map<String, dynamic>>('/quiz/sessions/$sessionId/complete');
      return QuizResult.fromJson(r.data!['data'] as Map<String, dynamic>);
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
      // Backend'in verdiği anlamlı mesajı göster (örn. günlük limit).
      final msg = (e.response?.data is Map)
          ? ((e.response?.data as Map)['error']?['message'] as String?)
          : null;
      throw ServerFailure(msg ?? 'Bir şeyler ters gitti, tekrar dene.');
    }
  }
}

final quizRepositoryProvider = Provider<QuizRepository>(
  (ref) => QuizRepository(ref.watch(dioProvider)),
);

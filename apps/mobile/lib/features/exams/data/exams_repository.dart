import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/exam_models.dart';

/// Deneme (randevulu canlı sınav) API'si — ortak /exams (Doc 18).
/// Cevap kaydetme/bitirme MEVCUT QuizRepository'den (tek motor).
class ExamsRepository {
  final Dio _dio;
  const ExamsRepository(this._dio);

  Future<List<ExamListItem>> list() async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/exams');
      final data = (r.data?['data'] as List<dynamic>?) ?? const [];
      return data
          .map((e) => ExamListItem.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  /// Başlat/devam et. Hata kodları (EXAM_NOT_STARTED, EXAM_ALREADY_TAKEN,
  /// PREMIUM_REQUIRED, EXAM_ENDED) [ExamFlowFailure] olarak fırlatılır.
  Future<StartedExam> start(String examId) async {
    return _guard(() async {
      final r = await _dio.post<Map<String, dynamic>>('/exams/$examId/start');
      return StartedExam.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  Future<AttemptResult> attempt(String attemptId) async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/exams/attempts/$attemptId');
      return AttemptResult.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  Future<ExamLeaderboard> leaderboard(String examId) async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/exams/$examId/leaderboard');
      return ExamLeaderboard.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  Future<List<AttemptResult>> myAttempts() async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/exams/attempts/mine');
      final data = (r.data?['data'] as List<dynamic>?) ?? const [];
      // /mine özet döner (review yok); yeniden AttemptResult'a map için exam sarımı.
      return data.map((e) {
        final m = e as Map<String, dynamic>;
        return AttemptResult(
          attemptId: m['attemptId'] as String,
          examId: (m['exam'] as Map<String, dynamic>)['id'] as String,
          examTitle: (m['exam'] as Map<String, dynamic>)['title'] as String,
          totalQuestions: 0,
          correctCount: m['correctCount'] as int? ?? 0,
          wrongCount: m['wrongCount'] as int? ?? 0,
          blankCount: m['blankCount'] as int? ?? 0,
          score: (m['score'] as num?)?.toDouble(),
          durationSeconds: null,
          review: const [],
        );
      }).toList();
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
      final err = (e.response?.data is Map)
          ? (e.response?.data as Map)['error'] as Map?
          : null;
      final code = err?['code'] as String?;
      final msg = err?['message'] as String?;
      if (code != null &&
          {
            'EXAM_NOT_STARTED',
            'EXAM_ALREADY_TAKEN',
            'EXAM_ENDED',
            'EXAM_IN_PROGRESS',
            'PREMIUM_REQUIRED',
            'EXAM_EMPTY',
          }.contains(code)) {
        final details = err?['details'] as Map?;
        throw ExamFlowFailure(
          code,
          msg ?? 'Sınava girilemedi.',
          attemptId: details?['attemptId'] as String?,
        );
      }
      throw ServerFailure(msg ?? 'Bir şeyler ters gitti, tekrar dene.');
    }
  }
}

final examsRepositoryProvider = Provider<ExamsRepository>(
  (ref) => ExamsRepository(ref.watch(dioProvider)),
);

final examsListProvider = FutureProvider.autoDispose<List<ExamListItem>>(
  (ref) => ref.watch(examsRepositoryProvider).list(),
);

final examAttemptProvider =
    FutureProvider.autoDispose.family<AttemptResult, String>(
  (ref, attemptId) => ref.watch(examsRepositoryProvider).attempt(attemptId),
);

final examLeaderboardProvider =
    FutureProvider.autoDispose.family<ExamLeaderboard, String>(
  (ref, examId) => ref.watch(examsRepositoryProvider).leaderboard(examId),
);

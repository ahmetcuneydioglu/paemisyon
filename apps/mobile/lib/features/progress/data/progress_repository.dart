import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';

/// Günlük soru hacmi satırı (/progress/activity — Doc 28 P1-10).
class ActivityDay {
  final String date; // YYYY-MM-DD (UTC)
  final int questionsAnswered;
  const ActivityDay({required this.date, required this.questionsAnswered});
  factory ActivityDay.fromJson(Map<String, dynamic> j) => ActivityDay(
        date: j['date'] as String,
        questionsAnswered: j['questionsAnswered'] as int? ?? 0,
      );
}

// İlerleme modelleri (Doc 7 §4.5).
class ProgressSummary {
  final int totalSolved,
      totalCorrect,
      totalSessions,
      accuracy,
      currentStreak,
      longestStreak;
  const ProgressSummary({
    required this.totalSolved,
    required this.totalCorrect,
    required this.totalSessions,
    required this.accuracy,
    required this.currentStreak,
    required this.longestStreak,
  });
  factory ProgressSummary.fromJson(Map<String, dynamic> j) => ProgressSummary(
        totalSolved: j['totalSolved'] as int,
        totalCorrect: j['totalCorrect'] as int,
        totalSessions: j['totalSessions'] as int,
        accuracy: j['accuracy'] as int,
        currentStreak: j['currentStreak'] as int,
        longestStreak: j['longestStreak'] as int,
      );
}

class TopicProgressItem {
  final String topicId, topicName;

  /// Konu haritası ders bazında gruplanır (Doc 25 Performans bölgesi).
  final String courseName;
  final int solvedCount, correctCount, mastery;
  const TopicProgressItem({
    required this.topicId,
    required this.topicName,
    required this.courseName,
    required this.solvedCount,
    required this.correctCount,
    required this.mastery,
  });
  factory TopicProgressItem.fromJson(Map<String, dynamic> j) =>
      TopicProgressItem(
        topicId: j['topicId'] as String,
        topicName: j['topicName'] as String,
        courseName: j['courseName'] as String? ?? 'Diğer',
        solvedCount: j['solvedCount'] as int,
        correctCount: j['correctCount'] as int,
        mastery: j['mastery'] as int,
      );
}

class ProgressRepository {
  final Dio _dio;
  const ProgressRepository(this._dio);

  Future<ProgressSummary> getSummary() async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/progress/summary');
      return ProgressSummary.fromJson(r.data!['data'] as Map<String, dynamic>);
    });
  }

  Future<List<TopicProgressItem>> getTopics() async {
    return _guard(() async {
      final r = await _dio.get<Map<String, dynamic>>('/progress/topics');
      final list = (r.data!['data'] as List<dynamic>);
      return list
          .map((e) => TopicProgressItem.fromJson(e as Map<String, dynamic>))
          .toList();
    });
  }

  /// Günlük soru hacmi (Doc 28 P1-10): 14 = nöbet çizelgesi, 84 = 12 hafta ısı.
  Future<List<ActivityDay>> getActivity(int days) async {
    return _guard(() async {
      final r = await _dio
          .get<Map<String, dynamic>>('/progress/activity?days=$days');
      final list = (r.data!['data'] as List<dynamic>);
      return list
          .map((e) => ActivityDay.fromJson(e as Map<String, dynamic>))
          .toList();
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

final progressRepositoryProvider = Provider<ProgressRepository>(
  (ref) => ProgressRepository(ref.watch(dioProvider)),
);
final progressSummaryProvider = FutureProvider.autoDispose<ProgressSummary>(
  (ref) => ref.watch(progressRepositoryProvider).getSummary(),
);
final topicProgressProvider =
    FutureProvider.autoDispose<List<TopicProgressItem>>(
  (ref) => ref.watch(progressRepositoryProvider).getTopics(),
);

/// Aktivite (gün bazlı hacim) — 14: Bugün nöbet çizelgesi, 84: 12 hafta ısı.
final activityProvider =
    FutureProvider.autoDispose.family<List<ActivityDay>, int>(
  (ref, days) => ref.watch(progressRepositoryProvider).getActivity(days),
);

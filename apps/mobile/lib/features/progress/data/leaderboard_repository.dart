import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';

/// Liderlik satırı.
class LeaderboardRow {
  final int rank;
  final String displayName;
  final String? avatarUrl;
  final int points;
  final bool isMe;
  const LeaderboardRow({
    required this.rank,
    required this.displayName,
    this.avatarUrl,
    required this.points,
    required this.isMe,
  });

  factory LeaderboardRow.fromJson(Map<String, dynamic> j) => LeaderboardRow(
        rank: j['rank'] as int,
        displayName: j['displayName'] as String? ?? 'Kullanıcı',
        avatarUrl: j['avatarUrl'] as String?,
        points: j['points'] as int? ?? 0,
        isMe: j['isMe'] as bool? ?? false,
      );
}

/// "Sen" satırı — sunucu kovalamaca bilgisini de verir (bir üstteki kim,
/// aradaki fark kaç puan). rank == 0 → bu dönemde henüz puan yok.
class LeaderboardMe {
  final int rank;
  final int points;
  final int? pointsToNext;
  final String? nextName;
  const LeaderboardMe({
    required this.rank,
    required this.points,
    this.pointsToNext,
    this.nextName,
  });

  factory LeaderboardMe.fromJson(Map<String, dynamic> j) => LeaderboardMe(
        rank: j['rank'] as int? ?? 0,
        points: j['points'] as int? ?? 0,
        pointsToNext: j['pointsToNext'] as int?,
        nextName: j['nextName'] as String?,
      );
}

class LeaderboardData {
  final String period;
  final List<LeaderboardRow> top;
  final LeaderboardMe? me;
  const LeaderboardData({
    required this.period,
    required this.top,
    this.me,
  });

  int get myPoints => me?.points ?? 0;
  int? get myRank => me == null || me!.rank <= 0 ? null : me!.rank;

  factory LeaderboardData.fromJson(Map<String, dynamic> j) => LeaderboardData(
        period: j['period'] as String,
        top: (j['top'] as List<dynamic>)
            .map((e) => LeaderboardRow.fromJson(e as Map<String, dynamic>))
            .toList(),
        me: j['me'] != null
            ? LeaderboardMe.fromJson(j['me'] as Map<String, dynamic>)
            : null,
      );
}

/// Genel liderlik satırı (Doc 28 P2-13) — deneme ortalaması bazlı.
class GlobalLeaderboardRow {
  final int rank;
  final String displayName;
  final String? avatarUrl;
  final double avgScore;
  final int attempts;
  final bool isMe;
  const GlobalLeaderboardRow({
    required this.rank,
    required this.displayName,
    this.avatarUrl,
    required this.avgScore,
    required this.attempts,
    required this.isMe,
  });

  factory GlobalLeaderboardRow.fromJson(Map<String, dynamic> j) =>
      GlobalLeaderboardRow(
        rank: j['rank'] as int,
        displayName: j['displayName'] as String? ?? 'Kullanıcı',
        avatarUrl: j['avatarUrl'] as String?,
        avgScore: (j['avgScore'] as num?)?.toDouble() ?? 0,
        attempts: j['attempts'] as int? ?? 0,
        isMe: j['isMe'] as bool? ?? false,
      );
}

class GlobalLeaderboardData {
  final List<GlobalLeaderboardRow> top;
  final GlobalLeaderboardRow? me;
  final int participantCount;
  const GlobalLeaderboardData({
    required this.top,
    this.me,
    required this.participantCount,
  });

  factory GlobalLeaderboardData.fromJson(Map<String, dynamic> j) =>
      GlobalLeaderboardData(
        top: (j['top'] as List<dynamic>)
            .map((e) =>
                GlobalLeaderboardRow.fromJson(e as Map<String, dynamic>))
            .toList(),
        me: j['me'] != null
            ? GlobalLeaderboardRow.fromJson(j['me'] as Map<String, dynamic>)
            : null,
        participantCount: j['participantCount'] as int? ?? 0,
      );
}

class LeaderboardRepository {
  final Dio _dio;
  const LeaderboardRepository(this._dio);

  Future<LeaderboardData> get(String period) async {
    try {
      final r = await _dio
          .get<Map<String, dynamic>>('/progress/leaderboard?period=$period');
      return LeaderboardData.fromJson(r.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }

  /// Genel liderlik (Doc 28 P2-13): tamamlanan denemelerin puan ortalaması.
  Future<GlobalLeaderboardData> global() async {
    try {
      final r =
          await _dio.get<Map<String, dynamic>>('/exams/leaderboard/global');
      return GlobalLeaderboardData.fromJson(
          r.data!['data'] as Map<String, dynamic>);
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }
}

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>(
  (ref) => LeaderboardRepository(ref.watch(dioProvider)),
);

final leaderboardProvider =
    FutureProvider.autoDispose.family<LeaderboardData, String>(
  (ref, period) => ref.watch(leaderboardRepositoryProvider).get(period),
);

final globalLeaderboardProvider =
    FutureProvider.autoDispose<GlobalLeaderboardData>(
  (ref) => ref.watch(leaderboardRepositoryProvider).global(),
);

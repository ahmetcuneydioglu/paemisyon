import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';

/// Liderlik satırı.
class LeaderboardRow {
  final int rank;
  final String displayName;
  final int points;
  final bool isMe;
  const LeaderboardRow({
    required this.rank,
    required this.displayName,
    required this.points,
    required this.isMe,
  });

  factory LeaderboardRow.fromJson(Map<String, dynamic> j) => LeaderboardRow(
        rank: j['rank'] as int,
        displayName: j['displayName'] as String? ?? 'Kullanıcı',
        points: j['points'] as int? ?? 0,
        isMe: j['isMe'] as bool? ?? false,
      );
}

class LeaderboardData {
  final String period;
  final List<LeaderboardRow> top;
  final int myPoints;
  final int? myRank;
  const LeaderboardData({
    required this.period,
    required this.top,
    required this.myPoints,
    this.myRank,
  });

  factory LeaderboardData.fromJson(Map<String, dynamic> j) => LeaderboardData(
        period: j['period'] as String,
        top: (j['top'] as List<dynamic>)
            .map((e) => LeaderboardRow.fromJson(e as Map<String, dynamic>))
            .toList(),
        myPoints: (j['me'] as Map<String, dynamic>?)?['points'] as int? ?? 0,
        myRank: (j['me'] as Map<String, dynamic>?)?['rank'] as int?,
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
}

final leaderboardRepositoryProvider = Provider<LeaderboardRepository>(
  (ref) => LeaderboardRepository(ref.watch(dioProvider)),
);

final leaderboardProvider =
    FutureProvider.autoDispose.family<LeaderboardData, String>(
  (ref, period) => ref.watch(leaderboardRepositoryProvider).get(period),
);

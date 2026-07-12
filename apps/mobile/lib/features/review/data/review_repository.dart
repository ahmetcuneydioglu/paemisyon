import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';

// Tekrar modelleri (Doc 7 §4.6).
class ReviewItem {
  final String questionId;
  final String? stem;
  final String? topicName;
  final int? wrongCount;
  const ReviewItem(
      {required this.questionId, this.stem, this.topicName, this.wrongCount});
  factory ReviewItem.fromJson(Map<String, dynamic> j) => ReviewItem(
        questionId: j['questionId'] as String,
        stem: j['stem'] as String?,
        topicName: j['topicName'] as String?,
        wrongCount: j['wrongCount'] as int?,
      );
}

class ReviewRepository {
  final Dio _dio;
  const ReviewRepository(this._dio);

  Future<List<ReviewItem>> getWrongAnswers() => _list('/review/wrong-answers');
  Future<List<ReviewItem>> getBookmarks() => _list('/review/bookmarks');

  Future<List<ReviewItem>> _list(String path) async {
    try {
      final r = await _dio.get<Map<String, dynamic>>(path);
      final list = (r.data!['data'] as List<dynamic>);
      return list
          .map((e) => ReviewItem.fromJson(e as Map<String, dynamic>))
          .toList();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }
}

final reviewRepositoryProvider = Provider<ReviewRepository>(
  (ref) => ReviewRepository(ref.watch(dioProvider)),
);
final wrongAnswersProvider = FutureProvider.autoDispose<List<ReviewItem>>(
  (ref) => ref.watch(reviewRepositoryProvider).getWrongAnswers(),
);
final bookmarksProvider = FutureProvider.autoDispose<List<ReviewItem>>(
  (ref) => ref.watch(reviewRepositoryProvider).getBookmarks(),
);

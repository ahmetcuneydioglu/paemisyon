import 'dart:async';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/error/failure.dart';
import '../../../core/network/dio_client.dart';
import '../domain/catalog_models.dart';

/// Katalog okuma (Doc 7 §4.3). Bearer token Dio interceptor'dan gelir.
class CatalogRepository {
  final Dio _dio;
  const CatalogRepository(this._dio);

  Future<List<T>> _list<T>(
      String path, T Function(Map<String, dynamic>) from) async {
    try {
      final res = await _dio.get<Map<String, dynamic>>(path);
      final data = (res.data?['data'] as List<dynamic>?) ?? const [];
      return data.map((e) => from(e as Map<String, dynamic>)).toList();
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }

  Future<List<ModuleItem>> getModules() =>
      _list('/catalog/modules', ModuleItem.fromJson);

  Future<List<CourseItem>> getCourses(String moduleId) =>
      _list('/catalog/modules/$moduleId/courses', CourseItem.fromJson);

  /// Ders öğrenme merkezi: konu ağacı + kişisel özet (Doc 25 wireframe 05).
  Future<CourseTopics> getTopics(String courseId) async {
    try {
      final res = await _dio
          .get<Map<String, dynamic>>('/catalog/courses/$courseId/topics');
      return CourseTopics.fromJson(
          (res.data?['data'] as Map<String, dynamic>?) ?? const {});
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }

  /// Madde Atlası — fetih haritası (Doc 25 §4).
  Future<TopicAtlas> getAtlas(String topicId) async {
    try {
      final res = await _dio
          .get<Map<String, dynamic>>('/catalog/topics/$topicId/atlas');
      return TopicAtlas.fromJson(
          (res.data?['data'] as Map<String, dynamic>?) ?? const {});
    } on DioException catch (e) {
      if (e.type == DioExceptionType.connectionError ||
          e.type == DioExceptionType.connectionTimeout) {
        throw const NetworkFailure();
      }
      throw const ServerFailure();
    }
  }
}

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.watch(dioProvider)),
);

/// Katalog nadiren değişir → 5 dk bellekte tut. Ekranlar arası gezinme
/// yeniden istek atmaz (algılanan hız); süre dolunca kendiliğinden tazelenir.
void _cacheFor(Ref ref, Duration duration) {
  final link = ref.keepAlive();
  final timer = Timer(duration, link.close);
  ref.onDispose(timer.cancel);
}

final modulesProvider = FutureProvider.autoDispose<List<ModuleItem>>((ref) {
  _cacheFor(ref, const Duration(minutes: 5));
  return ref.watch(catalogRepositoryProvider).getModules();
});

final coursesProvider =
    FutureProvider.autoDispose.family<List<CourseItem>, String>((ref, moduleId) {
  _cacheFor(ref, const Duration(minutes: 5));
  return ref.watch(catalogRepositoryProvider).getCourses(moduleId);
});

final topicsProvider =
    FutureProvider.autoDispose.family<CourseTopics, String>((ref, courseId) {
  // Kişisel katman (hakimiyet) içerir — kısa önbellek: seans sonrası tazelensin.
  _cacheFor(ref, const Duration(minutes: 1));
  return ref.watch(catalogRepositoryProvider).getTopics(courseId);
});

final atlasProvider =
    FutureProvider.autoDispose.family<TopicAtlas, String>((ref, topicId) {
  // Fetih durumu seans sonrası değişir — kısa önbellek.
  _cacheFor(ref, const Duration(minutes: 1));
  return ref.watch(catalogRepositoryProvider).getAtlas(topicId);
});

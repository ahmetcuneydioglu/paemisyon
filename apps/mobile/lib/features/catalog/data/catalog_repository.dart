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

  Future<List<TopicItem>> getTopics(String courseId) =>
      _list('/catalog/courses/$courseId/topics', TopicItem.fromJson);
}

final catalogRepositoryProvider = Provider<CatalogRepository>(
  (ref) => CatalogRepository(ref.watch(dioProvider)),
);

final modulesProvider = FutureProvider.autoDispose<List<ModuleItem>>(
  (ref) => ref.watch(catalogRepositoryProvider).getModules(),
);

final coursesProvider =
    FutureProvider.autoDispose.family<List<CourseItem>, String>(
  (ref, moduleId) => ref.watch(catalogRepositoryProvider).getCourses(moduleId),
);

final topicsProvider =
    FutureProvider.autoDispose.family<List<TopicItem>, String>(
  (ref, courseId) => ref.watch(catalogRepositoryProvider).getTopics(courseId),
);

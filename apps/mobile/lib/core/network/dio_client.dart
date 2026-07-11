import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../config/app_config.dart';

/// Tek Dio örneği (Doc 3 §3.1). Interceptor'lar buradan eklenir.
/// Auth token yenileme interceptor'ı Sprint 1'de (Doc 8) eklenecek.
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Accept-Language': 'tr'},
    ),
  );

  // Geliştirmede istek/yanıt logu (production'da kapatılır).
  assert(() {
    dio.interceptors.add(
      LogInterceptor(requestHeader: false, responseBody: false),
    );
    return true;
  }());

  return dio;
});

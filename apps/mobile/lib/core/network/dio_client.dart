import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

/// Tek Dio örneği (Doc 3 §3.1).
/// Auth interceptor: her isteğe mevcut Supabase access token'ını Bearer olarak ekler.
/// Böylece NestJS API isteği doğrular (Doc 8). supabase_flutter token'ı arka planda yeniler.
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Accept-Language': 'tr'},
    ),
  );

  dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        final token = Supabase.instance.client.auth.currentSession?.accessToken;
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
    ),
  );

  assert(() {
    dio.interceptors.add(
      LogInterceptor(requestHeader: false, responseBody: false),
    );
    return true;
  }());

  return dio;
});

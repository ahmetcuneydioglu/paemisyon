import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../config/app_config.dart';

/// Tek Dio örneği (Doc 3 §3.1) + token yaşam döngüsü (Doc 8 §5):
///  1) İstek öncesi: oturum süresi dolmuşsa ÖNCE tazele, sonra Bearer ekle
///     (soğuk açılışta saklanan token bayat olabilir — 401 yerine sessiz tazeleme).
///  2) 401 gelirse: bir kez tazele + isteği yinele. Hâlâ 401 ise (iptal edilmiş
///     oturum / silinmiş hesap) oturumu kapat → router login'e götürür.
final dioProvider = Provider<Dio>((ref) {
  final dio = Dio(
    BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 20),
      headers: {'Accept-Language': 'tr'},
    ),
  );

  dio.interceptors.add(AuthTokenInterceptor(dio));

  assert(() {
    dio.interceptors.add(
      LogInterceptor(requestHeader: false, responseBody: false),
    );
    return true;
  }());

  return dio;
});

class AuthTokenInterceptor extends Interceptor {
  final Dio _dio;
  AuthTokenInterceptor(this._dio);

  GoTrueClient get _auth => Supabase.instance.client.auth;

  @override
  Future<void> onRequest(
    RequestOptions options,
    RequestInterceptorHandler handler,
  ) async {
    var session = _auth.currentSession;
    // Süresi dolmuş token'la istek atma — önce tazele (soğuk açılış senaryosu).
    if (session != null && session.isExpired) {
      try {
        await _auth.refreshSession();
        session = _auth.currentSession;
      } catch (_) {
        // Ağ yok ya da refresh token geçersiz: eldeki token'la devam;
        // sonuç 401 olursa onError yolu devralır.
      }
    }
    final token = session?.accessToken;
    if (token != null) {
      options.headers['Authorization'] = 'Bearer $token';
    }
    handler.next(options);
  }

  @override
  Future<void> onError(
    DioException err,
    ErrorInterceptorHandler handler,
  ) async {
    final is401 = err.response?.statusCode == 401;
    final alreadyRetried = err.requestOptions.extra['auth_retried'] == true;

    if (!is401 || alreadyRetried || _auth.currentSession == null) {
      handler.next(err);
      return;
    }

    try {
      await _auth.refreshSession();
      final token = _auth.currentSession?.accessToken;
      if (token == null) throw const AuthException('oturum yok');

      final retryOptions = err.requestOptions
        ..headers['Authorization'] = 'Bearer $token'
        ..extra['auth_retried'] = true;
      final response = await _dio.fetch<dynamic>(retryOptions);
      handler.resolve(response);
    } catch (_) {
      // Tazeleme de kurtarmadı: oturum ölü (iptal / silinmiş hesap).
      // Oturumu kapat — GoRouter auth stream'iyle login'e döner.
      try {
        await _auth.signOut();
      } catch (_) {/* zaten kapalıysa sorun değil */}
      handler.next(err);
    }
  }
}

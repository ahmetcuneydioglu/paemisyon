import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_config.dart';

/// Supabase Auth sarmalayıcı (Doc 8). YALNIZCA kimlik; veri hep NestJS API'den.
class AuthRepository {
  final SupabaseClient _client;
  const AuthRepository(this._client);

  Session? get currentSession => _client.auth.currentSession;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<void> signInWithPassword(String email, String password) {
    return _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp(
      String email, String password, String displayName) {
    return _client.auth.signUp(
      email: email,
      password: password,
      data: {'display_name': displayName.trim()},
      emailRedirectTo: '${AppConfig.webBaseUrl}/auth/callback?next=%2Fbugun',
    );
  }

  Future<void> resendConfirmation(String email) => _client.auth.resend(
        type: OtpType.signup,
        email: email,
        emailRedirectTo: '${AppConfig.webBaseUrl}/auth/callback?next=%2Fbugun',
      );

  Future<void> requestPasswordReset(String email) =>
      _client.auth.resetPasswordForEmail(
        email,
        redirectTo:
            '${AppConfig.webBaseUrl}/auth/callback?next=%2Fsifre-yenile',
      );

  Future<void> updatePassword(String password) =>
      _client.auth.updateUser(UserAttributes(password: password));

  Future<void> signOut() => _client.auth.signOut();
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(Supabase.instance.client),
);

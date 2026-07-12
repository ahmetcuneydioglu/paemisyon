import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

/// Supabase Auth sarmalayıcı (Doc 8). YALNIZCA kimlik; veri hep NestJS API'den.
class AuthRepository {
  final SupabaseClient _client;
  const AuthRepository(this._client);

  Session? get currentSession => _client.auth.currentSession;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<void> signInWithPassword(String email, String password) {
    return _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp(String email, String password) {
    return _client.auth.signUp(email: email, password: password);
  }

  Future<void> signOut() => _client.auth.signOut();
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(Supabase.instance.client),
);

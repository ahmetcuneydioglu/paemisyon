import 'dart:convert';
import 'dart:io' show Platform;
import 'dart:math';

import 'package:crypto/crypto.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
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

  // ── Sosyal giriş (Doc 28 P0-①): web'le TEK hesap ──
  // Native kimlik akışı → Supabase signInWithIdToken; tarayıcı açılmaz.
  // Aynı e-posta = aynı Supabase kullanıcısı → web'de Google/Apple ile kayıt
  // olan kullanıcı mobile de girer (hesap sürekliliği kırığı kapanır).

  /// Sign in with Apple (iOS birincil — HIG). Nonce ile replay koruması.
  Future<void> signInWithApple() async {
    final rawNonce = _generateNonce();
    final hashedNonce = sha256.convert(utf8.encode(rawNonce)).toString();

    final credential = await SignInWithApple.getAppleIDCredential(
      scopes: [
        AppleIDAuthorizationScopes.email,
        AppleIDAuthorizationScopes.fullName,
      ],
      nonce: hashedNonce,
    );
    final idToken = credential.identityToken;
    if (idToken == null) {
      throw const AuthException('Apple kimliği alınamadı — tekrar dene.');
    }

    await _client.auth.signInWithIdToken(
      provider: OAuthProvider.apple,
      idToken: idToken,
      nonce: rawNonce,
    );

    // Apple adı YALNIZ ilk girişte verir — kaçırma, profile yaz.
    final fullName = [credential.givenName, credential.familyName]
        .whereType<String>()
        .join(' ')
        .trim();
    if (fullName.isNotEmpty) {
      await _client.auth
          .updateUser(UserAttributes(data: {'display_name': fullName}));
    }
  }

  /// Google ile giriş. iOS client ID'leri dart-define'dan gelir
  /// (GOOGLE_IOS_CLIENT_ID / GOOGLE_WEB_CLIENT_ID); boşsa buton gizlenir.
  Future<void> signInWithGoogle() async {
    final googleSignIn = GoogleSignIn(
      // clientId YALNIZ iOS/macOS'ta verilir. Android'de OAuth istemcisi
      // paket adı + SHA-1 ile eşleşir; buraya iOS client ID geçilirse hesap
      // seçici açılır ama kimlik doğrulama tamamlanamaz — kullanıcı "giriş
      // başarısız" görür. (Android'de gerçek cihazda tespit edildi.)
      clientId: (Platform.isIOS || Platform.isMacOS)
          ? AppConfig.googleIosClientId
          : null,
      // Supabase, idToken audience'ı olarak WEB client ID bekler.
      serverClientId: AppConfig.googleWebClientId,
    );
    final account = await googleSignIn.signIn();
    if (account == null) return; // kullanıcı vazgeçti — hata değil
    final auth = await account.authentication;
    final idToken = auth.idToken;
    if (idToken == null) {
      throw const AuthException('Google kimliği alınamadı — tekrar dene.');
    }
    await _client.auth.signInWithIdToken(
      provider: OAuthProvider.google,
      idToken: idToken,
      accessToken: auth.accessToken,
    );
  }

  String _generateNonce([int length = 32]) {
    const charset =
        '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._';
    final random = Random.secure();
    return List.generate(length, (_) => charset[random.nextInt(charset.length)])
        .join();
  }

  Future<void> signOut() => _client.auth.signOut();
}

final authRepositoryProvider = Provider<AuthRepository>(
  (ref) => AuthRepository(Supabase.instance.client),
);

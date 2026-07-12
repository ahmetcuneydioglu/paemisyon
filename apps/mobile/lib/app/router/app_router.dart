import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/me/presentation/home_screen.dart';

/// Auth state stream'ini router'ın dinleyebileceği bir Listenable'a çevirir.
class GoRouterRefreshStream extends ChangeNotifier {
  GoRouterRefreshStream(Stream<dynamic> stream) {
    notifyListeners();
    _sub = stream.asBroadcastStream().listen((_) => notifyListeners());
  }

  late final StreamSubscription<dynamic> _sub;

  @override
  void dispose() {
    _sub.cancel();
    super.dispose();
  }
}

/// Uygulama yönlendirmesi. Auth durumuna göre koruma (Doc 11):
/// giriş yoksa → /auth/login, varsa korumalı sayfalara erişim.
final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final refresh = GoRouterRefreshStream(auth.authStateChanges);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    refreshListenable: refresh,
    redirect: (context, state) {
      final loggedIn = auth.currentSession != null;
      final loc = state.matchedLocation;
      final atAuth = loc == '/auth/login' || loc == '/auth/register';
      if (!loggedIn) return atAuth ? null : '/auth/login';
      if (atAuth) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
      GoRoute(
          path: '/auth/login',
          builder: (context, state) => const LoginScreen()),
      GoRoute(
          path: '/auth/register',
          builder: (context, state) => const RegisterScreen()),
      // Sonraki rotalar: /onboarding, /catalog, /quiz, /profile ... (Doc 11/12)
    ],
  );
});

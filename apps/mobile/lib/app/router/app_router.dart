import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/health/presentation/health_screen.dart';

/// Uygulama yönlendirmesi (go_router). Rotalar sprint sırasına göre eklenir.
final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/',
    routes: [
      // Walking skeleton doğrulama ekranı. Sprint 7'de gerçek Home ile değişir.
      GoRoute(path: '/', builder: (context, state) => const HealthScreen()),
      // Sonraki rotalar (Doc 11/12):
      // /onboarding, /auth/login, /home, /catalog, /quiz, /result, /profile ...
    ],
  );
});

import 'dart:async';

import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/billing/presentation/paywall_screen.dart';
import '../../features/catalog/presentation/courses_screen.dart';
import '../../features/exams/presentation/exam_leaderboard_screen.dart';
import '../../features/exams/presentation/exam_result_screen.dart';
import '../../features/exams/presentation/exam_runner_screen.dart';
import '../../features/exams/presentation/exams_list_screen.dart';
import '../../features/catalog/presentation/modules_screen.dart';
import '../../features/catalog/presentation/topics_screen.dart';
import '../../features/me/presentation/home_screen.dart';
import '../../features/me/presentation/onboarding_screen.dart';
import '../../features/me/presentation/profile_screen.dart';
import '../../features/progress/presentation/leaderboard_screen.dart';
import '../../features/progress/presentation/progress_screen.dart';
import '../../features/quiz/domain/quiz_models.dart';
import '../../features/quiz/presentation/quiz_screen.dart';
import '../../features/quiz/presentation/result_screen.dart';
import '../../features/review/presentation/review_screen.dart';

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
      GoRoute(
          path: '/catalog', builder: (context, state) => const ModulesScreen()),
      GoRoute(
        path: '/catalog/module/:id',
        builder: (context, state) => CoursesScreen(
          moduleId: state.pathParameters['id']!,
          moduleName: state.extra as String? ?? 'Dersler',
        ),
      ),
      GoRoute(
        path: '/catalog/course/:id',
        builder: (context, state) => TopicsScreen(
          courseId: state.pathParameters['id']!,
          courseName: state.extra as String? ?? 'Konular',
        ),
      ),
      GoRoute(
        path: '/quiz',
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>;
          return QuizScreen(
            topicId: args['topicId'] as String?,
            courseId: args['courseId'] as String?,
            topicName: args['topicName'] as String,
            mode: args['mode'] as String,
            questionCount: args['count'] as int? ?? 10,
          );
        },
      ),
      GoRoute(
        path: '/quiz/result',
        builder: (context, state) =>
            ResultScreen(result: state.extra as QuizResult),
      ),
      GoRoute(
          path: '/progress',
          builder: (context, state) => const ProgressScreen()),
      GoRoute(
          path: '/leaderboard',
          builder: (context, state) => const LeaderboardScreen()),
      GoRoute(
          path: '/review', builder: (context, state) => const ReviewScreen()),
      // ── Denemeler (Doc 18): ortak /exams API ──
      GoRoute(
          path: '/denemeler',
          builder: (context, state) => const ExamsListScreen()),
      GoRoute(
        path: '/denemeler/sonuc/:attemptId',
        builder: (context, state) =>
            ExamResultScreen(attemptId: state.pathParameters['attemptId']!),
      ),
      GoRoute(
        path: '/denemeler/:id/siralama',
        builder: (context, state) =>
            ExamLeaderboardScreen(examId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/denemeler/:id',
        builder: (context, state) =>
            ExamRunnerScreen(examId: state.pathParameters['id']!),
      ),
      GoRoute(
          path: '/paywall', builder: (context, state) => const PaywallScreen()),
      GoRoute(
          path: '/onboarding',
          builder: (context, state) => const OnboardingScreen()),
      GoRoute(
          path: '/profile', builder: (context, state) => const ProfileScreen()),
    ],
  );
});

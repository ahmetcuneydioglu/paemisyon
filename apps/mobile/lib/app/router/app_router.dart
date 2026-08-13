import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/billing/presentation/paywall_screen.dart';
import '../../features/catalog/presentation/atlas_screen.dart';
import '../../features/catalog/presentation/courses_screen.dart';
import '../../features/catalog/presentation/modules_screen.dart';
import '../../features/catalog/presentation/topics_screen.dart';
import '../../features/exams/presentation/exam_leaderboard_screen.dart';
import '../../features/exams/presentation/exam_result_screen.dart';
import '../../features/exams/presentation/exam_runner_screen.dart';
import '../../features/exams/presentation/exams_list_screen.dart';
import '../../features/intro/intro_prefs.dart';
import '../../features/intro/presentation/intro_screen.dart';
import '../../features/me/presentation/badges_screen.dart';
import '../../features/me/presentation/home_screen.dart';
import '../../features/me/presentation/onboarding_screen.dart';
import '../../features/me/presentation/profile_screen.dart';
import '../../features/me/presentation/profile_settings_screen.dart';
import '../../features/progress/presentation/leaderboard_screen.dart';
import '../../features/progress/presentation/progress_screen.dart';
import '../../features/quiz/domain/quiz_models.dart';
import '../../features/quiz/presentation/quiz_screen.dart';
import '../../features/quiz/presentation/result_screen.dart';
import '../../features/review/presentation/review_screen.dart';
import '../shell/app_shell.dart';

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

final _rootNavigatorKey = GlobalKey<NavigatorState>();

/// Uygulama yönlendirmesi (Doc 25 §7, Doc 28 P1-6):
/// 5 bölgeli bottom tab kabuğu (Bugün · Kütüphane · Denemeler · Performans ·
/// Ben) + kabuksuz TAM EKRAN rotalar (oynatıcılar, onboarding, paywall, auth).
/// Auth durumuna göre koruma: giriş yoksa → /auth/login.
final appRouterProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authRepositoryProvider);
  final refresh = GoRouterRefreshStream(auth.authStateChanges);
  ref.onDispose(refresh.dispose);

  return GoRouter(
    initialLocation: '/',
    navigatorKey: _rootNavigatorKey,
    refreshListenable: refresh,
    redirect: (context, state) {
      final loggedIn = auth.currentSession != null;
      final loc = state.matchedLocation;
      final atAuth = loc == '/auth/login' || loc == '/auth/register';
      final atIntro = loc == '/intro';
      if (!loggedIn) {
        // First-launch tanıtımı: yalnız İLK açılış + oturum yokken (bayrak
        // cihazda kalıcı — mevcut/çıkış yapmış kullanıcı yeniden görmez).
        // ref.read: bayrak değişimi navigasyonu yeniden kurmaz; tanıtım
        // çıkışı zaten açık bir context.go ile yapılır.
        if (!ref.read(introSeenProvider)) return atIntro ? null : '/intro';
        return atAuth ? null : '/auth/login';
      }
      if (atAuth || atIntro) return '/';
      return null;
    },
    routes: [
      // ── Kabuk: 5 bölge — her dal kendi stack'ini korur ──
      StatefulShellRoute.indexedStack(
        builder: (context, state, shell) => AppShell(shell: shell),
        branches: [
          // 1 · Bugün
          StatefulShellBranch(routes: [
            GoRoute(path: '/', builder: (context, state) => const HomeScreen()),
          ]),
          // 2 · Kütüphane (dersler + tekrar kapıları)
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/catalog',
                builder: (context, state) => const ModulesScreen(),
                routes: [
                  GoRoute(
                    path: 'module/:id',
                    builder: (context, state) {
                      // extra: {name, key} (Doc 20) — eski String biçimi de desteklenir.
                      final extra = state.extra;
                      final map =
                          extra is Map<String, dynamic> ? extra : const {};
                      return CoursesScreen(
                        moduleId: state.pathParameters['id']!,
                        moduleName: (map['name'] as String?) ??
                            (extra as String?) ??
                            'Dersler',
                        moduleKey: map['key'] as String?,
                      );
                    },
                  ),
                  GoRoute(
                    path: 'course/:id',
                    builder: (context, state) => TopicsScreen(
                      courseId: state.pathParameters['id']!,
                      courseName: state.extra as String? ?? 'Konular',
                    ),
                  ),
                ]),
            GoRoute(
                path: '/review',
                builder: (context, state) => const ReviewScreen()),
          ]),
          // 3 · Denemeler
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/denemeler',
                builder: (context, state) => const ExamsListScreen(),
                routes: [
                  GoRoute(
                    path: 'sonuc/:attemptId',
                    builder: (context, state) => ExamResultScreen(
                        attemptId: state.pathParameters['attemptId']!),
                  ),
                  GoRoute(
                    path: ':id/siralama',
                    builder: (context, state) => ExamLeaderboardScreen(
                        examId: state.pathParameters['id']!),
                  ),
                ]),
          ]),
          // 4 · Performans
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/progress',
                builder: (context, state) => const ProgressScreen()),
            GoRoute(
                path: '/leaderboard',
                builder: (context, state) => const LeaderboardScreen()),
          ]),
          // 5 · Ben
          StatefulShellBranch(routes: [
            GoRoute(
                path: '/profile',
                builder: (context, state) => const ProfileScreen(),
                routes: [
                  GoRoute(
                    path: 'settings',
                    builder: (context, state) =>
                        const ProfileSettingsScreen(),
                  ),
                  GoRoute(
                    path: 'badges',
                    builder: (context, state) => const BadgesScreen(),
                  ),
                ]),
          ]),
        ],
      ),

      // ── Kabuksuz TAM EKRAN rotalar (tab bar gizli — Doc 25 §7) ──
      GoRoute(
        path: '/quiz',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>;
          return QuizScreen(
            topicId: args['topicId'] as String?,
            courseId: args['courseId'] as String?,
            articleNo: args['articleNo'] as String?,
            fromBookmarks: args['fromBookmarks'] as bool? ?? false,
            resumeSessionId: args['resumeSessionId'] as String?,
            topicName: args['topicName'] as String,
            mode: args['mode'] as String,
            questionCount: args['count'] as int? ?? 10,
            patrol: args['patrol'] as bool? ?? false,
            archiveExamId: args['archiveExamId'] as String?,
            personalExam: args['personalExam'] as bool? ?? false,
          );
        },
      ),
      GoRoute(
        path: '/quiz/result',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final extra = state.extra;
          if (extra is QuizResult) return ResultScreen(result: extra);
          final map = extra as Map<String, dynamic>;
          return ResultScreen(
            result: map['result'] as QuizResult,
            patrol: map['patrol'] as bool? ?? false,
          );
        },
      ),
      // Madde Atlası — fetih haritası (Doc 25 §4).
      GoRoute(
        path: '/atlas',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) {
          final args = state.extra as Map<String, dynamic>;
          return AtlasScreen(
            topicId: args['topicId'] as String,
            topicName: args['topicName'] as String? ?? 'Kanun',
          );
        },
      ),
      // Deneme oynatıcı: süre baskısı — kabuksuz.
      GoRoute(
        path: '/denemeler/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (context, state) =>
            ExamRunnerScreen(examId: state.pathParameters['id']!),
      ),
      GoRoute(
          path: '/paywall',
          parentNavigatorKey: _rootNavigatorKey,
          builder: (context, state) => const PaywallScreen()),
      GoRoute(
          path: '/onboarding',
          parentNavigatorKey: _rootNavigatorKey,
          builder: (context, state) => const OnboardingScreen()),
      GoRoute(
          path: '/intro',
          parentNavigatorKey: _rootNavigatorKey,
          builder: (context, state) => const IntroScreen()),
      GoRoute(
          path: '/auth/login',
          parentNavigatorKey: _rootNavigatorKey,
          builder: (context, state) => const LoginScreen()),
      GoRoute(
          path: '/auth/register',
          parentNavigatorKey: _rootNavigatorKey,
          builder: (context, state) => const RegisterScreen()),
    ],
  );
});

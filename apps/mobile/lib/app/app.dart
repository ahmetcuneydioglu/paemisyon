import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/notifications/notification_service.dart';
import '../core/offline/connectivity_provider.dart';
import '../core/offline/sync_service.dart';
import '../core/theme/app_theme.dart';
import '../core/theme/theme_mode_provider.dart';
import '../shared/widgets/offline_banner.dart';
import 'router/app_router.dart';

/// Uygulama kabuğu: tema + router + offline durum çubuğu.
/// Bağlantı geri geldiğinde bekleyen cevap kuyruğunu senkronize eder (Sprint 5).
class PaemisyonApp extends ConsumerStatefulWidget {
  const PaemisyonApp({super.key});

  @override
  ConsumerState<PaemisyonApp> createState() => _PaemisyonAppState();
}

class _PaemisyonAppState extends ConsumerState<PaemisyonApp> {
  /// Bildirim payload'ını rotaya çevirir. Dil: 'daily-quiz' → Günün Quizi;
  /// `question:<uuid>` → tek soruluk seans (panelden gönderilen push).
  /// Router redirect'i oturum/tanıtım korumasını kendisi uygular.
  void _openFromNotification(String payload) {
    final router = ref.read(appRouterProvider);
    if (payload == NotificationService.payloadDailyQuiz) {
      router.push('/quiz', extra: {
        'topicName': 'Günün Quizi',
        'mode': 'daily',
        'count': 10,
        'source': 'notif',
      });
      return;
    }
    if (payload == 'denemeler') {
      router.go('/denemeler');
      return;
    }
    // "Seni geçti" dürtmesi → doğrudan sıralama ekranı.
    if (payload == 'leaderboard') {
      router.push('/leaderboard');
      return;
    }
    final single = RegExp(r'^question:([0-9a-fA-F-]{36})$').firstMatch(payload);
    if (single != null) {
      router.push('/quiz', extra: {
        'topicName': 'Günün Sorusu',
        'mode': 'practice',
        'questionId': single.group(1),
        'count': 1,
        'source': 'notif',
      });
    }
  }

  @override
  void initState() {
    super.initState();
    // Bildirime dokunuş → doğrudan soru ekranı (uygulama açık/arka planda).
    NotificationService.onTap = _openFromNotification;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Açılışta bekleyen kuyruğu (varsa) gönder + sayacı başlat.
      ref.read(syncServiceProvider).flush();
      // Bildirime dokunularak SOĞUK açıldıysa aynı derin bağlantı çalışsın.
      ref
          .read(notificationServiceProvider)
          .launchPayload()
          .then((p) => p != null ? _openFromNotification(p) : null);
    });
  }

  @override
  void dispose() {
    NotificationService.onTap = null;
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);

    // Çevrimdışı → çevrimiçi geçişinde kuyruğu boşalt.
    ref.listen<bool>(isOnlineProvider, (prev, next) {
      if (next && prev == false) {
        ref.read(syncServiceProvider).flush();
      }
    });

    return MaterialApp.router(
      title: 'Paemisyon',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      darkTheme: AppTheme.dark,
      // Tema tercihi (Doc 28 P1-11): sistem/açık/koyu — ayarlardan.
      themeMode: ref.watch(themeModeProvider),
      routerConfig: router,
      builder: (context, child) => Column(
        children: [
          const OfflineBanner(),
          Expanded(child: child ?? const SizedBox.shrink()),
        ],
      ),
    );
  }
}

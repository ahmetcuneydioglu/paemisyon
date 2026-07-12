import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/offline/connectivity_provider.dart';
import '../core/offline/sync_service.dart';
import '../core/theme/app_theme.dart';
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
  @override
  void initState() {
    super.initState();
    // Açılışta bekleyen kuyruğu (varsa) gönder + sayacı başlat.
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(syncServiceProvider).flush();
    });
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

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/offline/answer_queue.dart';
import '../../core/offline/connectivity_provider.dart';

/// Uygulama genelinde ince bir durum çubuğu (Doc 12): çevrimdışıyken ve
/// bekleyen cevap varken görünür. Çevrimiçi ve kuyruk boşken yer kaplamaz.
class OfflineBanner extends ConsumerWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final online = ref.watch(isOnlineProvider);
    final pending = ref.watch(pendingAnswerCountProvider);

    if (online && pending == 0) return const SizedBox.shrink();

    final scheme = Theme.of(context).colorScheme;
    final (bg, fg, icon, text) = !online
        ? (
            scheme.errorContainer,
            scheme.onErrorContainer,
            Icons.cloud_off_rounded,
            pending > 0
                ? 'Çevrimdışısın — $pending cevap kaydedildi, bağlantı gelince gönderilecek'
                : 'Çevrimdışısın'
          )
        : (
            scheme.tertiaryContainer,
            scheme.onTertiaryContainer,
            Icons.cloud_sync_rounded,
            '$pending cevap senkronize ediliyor…'
          );

    return Material(
      color: bg,
      child: SafeArea(
        bottom: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
          child: Row(
            children: [
              Icon(icon, size: 16, color: fg),
              const SizedBox(width: 8),
              Expanded(
                child: Text(text,
                    style: TextStyle(color: fg, fontSize: 12.5),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../error/failure.dart';
import '../../features/quiz/data/quiz_repository.dart';
import 'answer_queue.dart';

/// Çevrimdışı cevap kuyruğunu sunucuya boşaltır (Doc 3 §5.1).
/// Bağlantı geri geldiğinde tetiklenir; kuyruk boşsa hızlıca döner.
class SyncService {
  final Ref _ref;
  SyncService(this._ref);

  bool _running = false;

  /// Kuyruğu gönderir. Kaç cevabın senkronlandığını döndürür.
  /// Ağ yine yoksa kalanı kuyrukta bırakır; sunucu kalıcı reddederse düşürür
  /// (sonsuz yeniden-deneme olmasın).
  Future<int> flush() async {
    if (_running) return 0;
    _running = true;
    try {
      final queue = _ref.read(answerQueueProvider);
      final items = List<QueuedAnswer>.from(await queue.all())
        ..sort((a, b) => a.createdAt.compareTo(b.createdAt));
      if (items.isEmpty) {
        _setPending(0);
        return 0;
      }

      final repo = _ref.read(quizRepositoryProvider);
      final remaining = <QueuedAnswer>[];
      var synced = 0;
      var offline = false;

      for (final a in items) {
        if (offline) {
          remaining.add(a); // ağ koptu → kalanı koru
          continue;
        }
        try {
          await repo.answer(
            a.sessionId,
            questionId: a.questionId,
            versionId: a.versionId,
            selectedOptionId: a.selectedOptionId,
            timeSpentMs: a.timeSpentMs,
          );
          synced++;
        } on NetworkFailure {
          remaining.add(a);
          offline = true; // hâlâ çevrimdışı → dur, kalanı sakla
        } on Failure {
          // Sunucu kalıcı reddetti (oturum kapanmış vb.) → düşür.
        }
      }

      await queue.replaceAll(remaining);
      _setPending(remaining.length);
      return synced;
    } finally {
      _running = false;
    }
  }

  void _setPending(int n) =>
      _ref.read(pendingAnswerCountProvider.notifier).state = n;
}

final syncServiceProvider = Provider<SyncService>((ref) => SyncService(ref));

import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Çevrimdışıyken verilen bir quiz cevabı (Doc 3 §5.1 — veri kaybı yok).
/// Bağlantı gelince [SyncService] sunucuya gönderir. Backend upsert idempotent
/// olduğu için aynı cevabın tekrar gönderilmesi güvenli.
class QueuedAnswer {
  final String sessionId;
  final String questionId;
  final String versionId;
  final String? selectedOptionId;
  final int? timeSpentMs;

  /// Sıra ve tekilleştirme için istemci tarafı damga (epoch ms).
  final int createdAt;

  const QueuedAnswer({
    required this.sessionId,
    required this.questionId,
    required this.versionId,
    required this.createdAt,
    this.selectedOptionId,
    this.timeSpentMs,
  });

  Map<String, dynamic> toJson() => {
        'sessionId': sessionId,
        'questionId': questionId,
        'versionId': versionId,
        'selectedOptionId': selectedOptionId,
        'timeSpentMs': timeSpentMs,
        'createdAt': createdAt,
      };

  factory QueuedAnswer.fromJson(Map<String, dynamic> j) => QueuedAnswer(
        sessionId: j['sessionId'] as String,
        questionId: j['questionId'] as String,
        versionId: j['versionId'] as String,
        selectedOptionId: j['selectedOptionId'] as String?,
        timeSpentMs: j['timeSpentMs'] as int?,
        createdAt: j['createdAt'] as int,
      );
}

/// Kalıcı cevap kuyruğu. Küçük ve nadir yazıldığı için shared_preferences yeterli;
/// tam offline soru-bankası cache'i gerektiğinde Drift'e taşınır.
class AnswerQueue {
  static const _key = 'offline_answer_queue_v1';

  Future<List<QueuedAnswer>> all() async {
    final prefs = await SharedPreferences.getInstance();
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return const [];
    final list = jsonDecode(raw) as List<dynamic>;
    return list
        .map((e) => QueuedAnswer.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> enqueue(QueuedAnswer a) async {
    final items = List<QueuedAnswer>.from(await all());
    // Aynı (oturum, soru) için tek kayıt tut — en son cevap kazanır.
    items.removeWhere(
        (e) => e.sessionId == a.sessionId && e.questionId == a.questionId);
    items.add(a);
    await _write(items);
  }

  Future<void> replaceAll(List<QueuedAnswer> items) => _write(items);

  Future<int> count() async => (await all()).length;

  Future<void> _write(List<QueuedAnswer> items) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(
        _key, jsonEncode(items.map((e) => e.toJson()).toList()));
  }
}

final answerQueueProvider = Provider<AnswerQueue>((ref) => AnswerQueue());

/// Bekleyen cevap sayısı (UI rozeti / banner için). Kuyruk değişince güncellenir.
final pendingAnswerCountProvider = StateProvider<int>((ref) => 0);

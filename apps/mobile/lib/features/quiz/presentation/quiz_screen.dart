import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/offline/answer_queue.dart';
import '../../../core/offline/sync_service.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../review/data/review_repository.dart';
import '../data/quiz_repository.dart';
import '../domain/quiz_models.dart';

/// Tek quiz motoru (Doc 10 §2.5) — alıştırma + deneme (süreli) modları.
/// Değerlendirme sunucuda; deneme modunda doğru cevap istemciye hiç gelmez,
/// süre de SUNUCUDA denetlenir (buradaki sayaç yalnızca gösterge).
class QuizScreen extends ConsumerStatefulWidget {
  final String? topicId;
  final String? courseId; // ders geneli deneme
  final String topicName;
  final String mode; // 'practice' | 'exam'
  final int questionCount;
  const QuizScreen({
    super.key,
    this.topicId,
    this.courseId,
    required this.topicName,
    required this.mode,
    this.questionCount = 10,
  });

  @override
  ConsumerState<QuizScreen> createState() => _QuizScreenState();
}

class _QuizScreenState extends ConsumerState<QuizScreen> {
  StartedSession? _session;
  Object? _loadError;
  int _index = 0;
  String? _selected;
  AnswerFeedback? _feedback; // practice geri bildirimi
  bool _busy = false;
  DateTime _qStart = DateTime.now();

  // Deneme sayacı (gösterge — asıl denetim sunucuda).
  Timer? _timer;
  int _remainingSeconds = 0;

  // Bu oturumda favorilenen sorular (yıldız durumu).
  final Set<String> _bookmarked = {};

  // Günün quizi de öğrenme akışı: practice gibi anlık geri bildirim gösterir.
  bool get _isPractice =>
      widget.mode == 'practice' || widget.mode == 'daily';

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _loadError = null);
    try {
      final s = await ref.read(quizRepositoryProvider).start(
            mode: widget.mode,
            topicId: widget.topicId,
            courseId: widget.courseId,
            count: widget.questionCount,
          );
      setState(() {
        _session = s;
        _qStart = DateTime.now();
      });
      if (s.plannedDurationSeconds != null) {
        _startTimer(s.plannedDurationSeconds!);
      }
    } catch (e) {
      setState(() => _loadError = e);
    }
  }

  void _startTimer(int seconds) {
    _remainingSeconds = seconds;
    _timer = Timer.periodic(const Duration(seconds: 1), (t) {
      if (!mounted) return;
      setState(() => _remainingSeconds--);
      if (_remainingSeconds <= 0) {
        t.cancel();
        _snack('Süre doldu — sınav sonlandırılıyor.');
        _finish();
      }
    });
  }

  QuizQuestion get _q => _session!.questions[_index];
  bool get _isLast => _index == _session!.questions.length - 1;

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _busy = true);
    final selected = _selected;
    final timeSpent = DateTime.now().difference(_qStart).inMilliseconds;
    try {
      final fb = await ref.read(quizRepositoryProvider).answer(
            _session!.sessionId,
            questionId: _q.questionId,
            versionId: _q.versionId,
            selectedOptionId: selected,
            timeSpentMs: timeSpent,
          );
      if (_isPractice) {
        setState(() => _feedback = fb); // geri bildirimi göster
      } else {
        await _advance(); // deneme: geri bildirim yok, ilerle
      }
    } on NetworkFailure {
      await _queueOffline(selected, timeSpent); // çevrimdışı → kuyruğa al, ilerle
    } on ExamTimeOverFailure {
      _snack('Sınav süresi doldu — kalan sorular boş sayılır.');
      await _finish();
    } on DailyLimitFailure catch (f) {
      _showPaywall(f.message); // freemium limit → premium teklifi
    } on Failure catch (f) {
      _snack(f.message);
    } catch (_) {
      _snack('Cevap gönderilemedi, tekrar dene.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  /// Çevrimdışıyken cevabı yerel kuyruğa alır ve ilerler (Doc 3 §5.1).
  Future<void> _queueOffline(String? selected, int timeSpent) async {
    final queue = ref.read(answerQueueProvider);
    await queue.enqueue(QueuedAnswer(
      sessionId: _session!.sessionId,
      questionId: _q.questionId,
      versionId: _q.versionId,
      selectedOptionId: selected,
      timeSpentMs: timeSpent,
      createdAt: DateTime.now().millisecondsSinceEpoch,
    ));
    ref.read(pendingAnswerCountProvider.notifier).state = await queue.count();
    _snack('Çevrimdışısın — cevabın kaydedildi, bağlantı gelince gönderilecek.');
    await _advance();
  }

  Future<void> _showPaywall(String message) async {
    if (!mounted) return;
    final go = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.workspace_premium_rounded),
        title: const Text('Günlük hakkın doldu'),
        content: Text(message),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Sonra')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text("Premium'a Geç")),
        ],
      ),
    );
    if (go == true && mounted) context.push('/paywall');
  }

  Future<void> _advance() async {
    if (_isLast) {
      await _finish();
      return;
    }
    setState(() {
      _index++;
      _selected = null;
      _feedback = null;
      _qStart = DateTime.now();
    });
  }

  Future<void> _finish() async {
    if (_busy && _timer == null) return;
    _timer?.cancel();
    _timer = null;
    setState(() => _busy = true);
    try {
      // Çevrimdışıyken biriken cevaplar varsa önce onları gönder — skor doğru olsun.
      await ref.read(syncServiceProvider).flush();
      final result =
          await ref.read(quizRepositoryProvider).complete(_session!.sessionId);
      if (mounted) context.pushReplacement('/quiz/result', extra: result);
    } on NetworkFailure {
      _snack(
          'Bağlantı yok — cevapların kaydedildi. Testi bitirmek için internet gerekli.');
    } on Failure catch (f) {
      _snack(f.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  // ── Favori (yıldız) ──
  Future<void> _toggleBookmark() async {
    final id = _q.questionId;
    final wasBookmarked = _bookmarked.contains(id);
    setState(() {
      wasBookmarked ? _bookmarked.remove(id) : _bookmarked.add(id);
    });
    try {
      final repo = ref.read(reviewRepositoryProvider);
      wasBookmarked ? await repo.removeBookmark(id) : await repo.addBookmark(id);
    } catch (_) {
      // Geri al + bilgilendir.
      setState(() {
        wasBookmarked ? _bookmarked.add(id) : _bookmarked.remove(id);
      });
      _snack('Favori kaydedilemedi, tekrar dene.');
    }
  }

  // ── Hata bildir ──
  Future<void> _reportQuestion() async {
    final controller = TextEditingController();
    final message = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Soru hatası bildir'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          maxLength: 500,
          decoration: const InputDecoration(
            hintText: 'Sorun ne? (örn. cevap anahtarı hatalı, yazım hatası…)',
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Vazgeç')),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Gönder'),
          ),
        ],
      ),
    );
    if (message == null || message.length < 5) return;
    try {
      await ref
          .read(quizRepositoryProvider)
          .reportQuestion(_q.questionId, message);
      _snack('Teşekkürler! Bildirimin editör ekibine iletildi. 🙏');
    } on Failure catch (f) {
      _snack(f.message);
    }
  }

  void _snack(String m) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    }
  }

  String get _timerText {
    final m = (_remainingSeconds ~/ 60).toString().padLeft(2, '0');
    final s = (_remainingSeconds % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    if (_loadError != null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.topicName)),
        body: ErrorStateView(
          message: _loadError is Failure
              ? (_loadError! as Failure).message
              : 'Yüklenemedi.',
          onRetry: _load,
        ),
      );
    }
    if (_session == null) {
      return Scaffold(
        appBar: AppBar(title: Text(widget.topicName)),
        body: const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LoadingSkeleton(height: 20, width: 120),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 60),
              SizedBox(height: AppSpacing.md),
              LoadingSkeleton(height: 48),
              SizedBox(height: AppSpacing.sm),
              LoadingSkeleton(height: 48),
            ],
          ),
        ),
      );
    }

    final total = _session!.questions.length;
    final timerLow = _remainingSeconds > 0 && _remainingSeconds <= 60;
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: () => context.pop()),
        title: LinearProgressIndicator(value: (_index + 1) / total),
        centerTitle: false,
        actions: [
          if (_timer != null)
            Center(
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.sm, vertical: 4),
                decoration: BoxDecoration(
                  color: timerLow
                      ? Theme.of(context).colorScheme.errorContainer
                      : Theme.of(context).colorScheme.surfaceContainerHighest,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '⏱ $_timerText',
                  style: TextStyle(
                    fontFeatures: const [FontFeature.tabularFigures()],
                    color: timerLow
                        ? Theme.of(context).colorScheme.onErrorContainer
                        : null,
                  ),
                ),
              ),
            ),
          IconButton(
            tooltip: 'Favorilere ekle',
            icon: Icon(_bookmarked.contains(_q.questionId)
                ? Icons.star_rounded
                : Icons.star_border_rounded),
            onPressed: _toggleBookmark,
          ),
          IconButton(
            tooltip: 'Hata bildir',
            icon: const Icon(Icons.flag_outlined),
            onPressed: _reportQuestion,
          ),
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.sm),
            child: Center(child: Text('${_index + 1}/$total')),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(AppSpacing.lg),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(_q.stem, style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: AppSpacing.lg),
              ..._q.options.map(_optionTile),
              if (_feedback?.explanation != null) ...[
                const SizedBox(height: AppSpacing.md),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.md),
                    child: Text('Açıklama: ${_feedback!.explanation!}'),
                  ),
                ),
              ],
              const SizedBox(height: AppSpacing.lg),
              _bottomButton(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _optionTile(QuizOption o) {
    final scheme = Theme.of(context).colorScheme;
    final answered = _feedback != null; // practice'te cevaptan sonra
    Color? bg;
    if (answered) {
      if (o.id == _feedback!.correctOptionId) {
        bg = scheme.primaryContainer; // doğru → vurgulu
      } else if (o.id == _selected) {
        bg = scheme.errorContainer; // seçilen yanlış
      }
    } else if (o.id == _selected) {
      bg = scheme.secondaryContainer; // seçili
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: Card(
        color: bg,
        child: ListTile(
          title: Text('${o.label}) ${o.text}'),
          onTap: answered ? null : () => setState(() => _selected = o.id),
        ),
      ),
    );
  }

  Widget _bottomButton() {
    // practice: cevaptan önce "Onayla", sonra "Sonraki"/"Bitir".
    // exam: "İleri" (gönder + ilerle), son soruda "Bitir".
    if (_isPractice) {
      if (_feedback == null) {
        return PrimaryButton(
            label: 'Onayla', loading: _busy, onPressed: _submit);
      }
      return PrimaryButton(
          label: _isLast ? 'Bitir' : 'Sonraki',
          loading: _busy,
          onPressed: _advance);
    }
    return PrimaryButton(
        label: _isLast ? 'Bitir' : 'İleri', loading: _busy, onPressed: _submit);
  }
}

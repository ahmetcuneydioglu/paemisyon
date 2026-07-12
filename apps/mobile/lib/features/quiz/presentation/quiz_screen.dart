import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/primary_button.dart';
import '../data/quiz_repository.dart';
import '../domain/quiz_models.dart';

/// Tek quiz motoru (Doc 10 §2.5) — practice + exam modları.
/// Değerlendirme sunucuda; exam'de doğru cevap istemciye hiç gelmez.
class QuizScreen extends ConsumerStatefulWidget {
  final String topicId;
  final String topicName;
  final String mode; // 'practice' | 'exam'
  const QuizScreen({
    super.key,
    required this.topicId,
    required this.topicName,
    required this.mode,
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

  bool get _isPractice => widget.mode == 'practice';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() => _loadError = null);
    try {
      final s = await ref
          .read(quizRepositoryProvider)
          .start(widget.mode, widget.topicId);
      setState(() {
        _session = s;
        _qStart = DateTime.now();
      });
    } catch (e) {
      setState(() => _loadError = e);
    }
  }

  QuizQuestion get _q => _session!.questions[_index];
  bool get _isLast => _index == _session!.questions.length - 1;

  Future<void> _submit() async {
    if (_busy) return;
    setState(() => _busy = true);
    try {
      final fb = await ref.read(quizRepositoryProvider).answer(
            _session!.sessionId,
            questionId: _q.questionId,
            versionId: _q.versionId,
            selectedOptionId: _selected,
            timeSpentMs: DateTime.now().difference(_qStart).inMilliseconds,
          );
      if (_isPractice) {
        setState(() => _feedback = fb); // geri bildirimi göster
      } else {
        await _advance(); // exam: geri bildirim yok, ilerle
      }
    } on Failure catch (f) {
      _snack(f.message);
    } catch (_) {
      _snack('Cevap gönderilemedi, tekrar dene.');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
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
    setState(() => _busy = true);
    try {
      final result =
          await ref.read(quizRepositoryProvider).complete(_session!.sessionId);
      if (mounted) context.pushReplacement('/quiz/result', extra: result);
    } on Failure catch (f) {
      _snack(f.message);
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _snack(String m) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    }
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
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: () => context.pop()),
        title: LinearProgressIndicator(value: (_index + 1) / total),
        centerTitle: false,
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: AppSpacing.md),
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

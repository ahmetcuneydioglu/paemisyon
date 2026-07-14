import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../quiz/data/quiz_repository.dart';
import '../../quiz/domain/quiz_models.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Deneme çözme (Doc 18 §2.2) — mobil tek sütun. Küresel pencere sayacı;
/// her seçim SUNUCUYA anında kaydedilir (yarıda kalırsa devam); süre bitince
/// otomatik teslim. Değerlendirme sunucuda; cevap anahtarı sızmaz.
class ExamRunnerScreen extends ConsumerStatefulWidget {
  final String examId;
  const ExamRunnerScreen({super.key, required this.examId});

  @override
  ConsumerState<ExamRunnerScreen> createState() => _ExamRunnerScreenState();
}

enum _SaveState { saved, saving, failed }

class _ExamRunnerScreenState extends ConsumerState<ExamRunnerScreen> {
  StartedExam? _exam;
  Object? _loadError;
  final Map<String, String> _answers = {};
  final Map<String, _SaveState> _save = {};
  final Map<String, DateTime> _qStart = {};
  Timer? _timer;
  Duration _left = Duration.zero;
  bool _finishing = false;

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
      final s = await ref.read(examsRepositoryProvider).start(widget.examId);
      if (!mounted) return;
      setState(() {
        _exam = s;
        _answers.addAll(s.givenAnswers);
      });
      _startTimer();
    } on ExamFlowFailure catch (f) {
      if (f.code == 'EXAM_ALREADY_TAKEN' && f.attemptId != null && mounted) {
        context.pushReplacement('/denemeler/sonuc/${f.attemptId}');
        return;
      }
      if (mounted) setState(() => _loadError = f);
    } catch (e) {
      if (mounted) setState(() => _loadError = e);
    }
  }

  void _startTimer() {
    void tick() {
      final left = _exam!.endsAt.difference(DateTime.now());
      setState(() => _left = left.isNegative ? Duration.zero : left);
      if (left.isNegative || left.inSeconds <= 0) {
        _timer?.cancel();
        _finish(auto: true);
      }
    }

    tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => tick());
  }

  int get _answered => _answers.length;

  Future<void> _select(QuizQuestion q, String optionId) async {
    setState(() {
      _answers[q.questionId] = optionId;
      _save[q.questionId] = _SaveState.saving;
    });
    try {
      await ref.read(quizRepositoryProvider).answer(
            _exam!.sessionId,
            questionId: q.questionId,
            versionId: q.versionId,
            selectedOptionId: optionId,
            timeSpentMs: _qStart[q.questionId] != null
                ? DateTime.now().difference(_qStart[q.questionId]!).inMilliseconds
                : null,
          );
      if (mounted) setState(() => _save[q.questionId] = _SaveState.saved);
    } on ExamTimeOverFailure {
      _finish(auto: true);
    } catch (_) {
      if (mounted) setState(() => _save[q.questionId] = _SaveState.failed);
    }
  }

  Future<void> _confirmFinish() async {
    final blank = _exam!.questions.length - _answered;
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Testi Bitir'),
        content: Text(blank > 0
            ? '$blank boş sorun var. Sınavı bitirmek istediğine emin misin?'
            : 'Tüm soruları cevapladın. Sınavı bitirmek istiyor musun?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Devam Et')),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Kaydet ve Bitir'),
          ),
        ],
      ),
    );
    if (ok == true) _finish();
  }

  Future<void> _finish({bool auto = false}) async {
    if (_finishing) return;
    _finishing = true;
    _timer?.cancel();
    // Başarısız kalan kayıtları son bir kez dene.
    for (final e in _save.entries.where((e) => e.value == _SaveState.failed).toList()) {
      final q = _exam!.questions.firstWhere((x) => x.questionId == e.key);
      final opt = _answers[e.key];
      if (opt != null) {
        try {
          await ref.read(quizRepositoryProvider).answer(_exam!.sessionId,
              questionId: q.questionId, versionId: q.versionId, selectedOptionId: opt);
        } catch (_) {/* sonuç ekranı tembel finalize eder */}
      }
    }
    try {
      await ref.read(quizRepositoryProvider).complete(_exam!.sessionId);
    } catch (_) {/* pencere kapalıysa sunucu zaten finalize etti */}
    if (mounted) {
      context.pushReplacement('/denemeler/sonuc/${_exam!.sessionId}');
    }
  }

  String get _timeText {
    final s = _left.inSeconds;
    String two(int n) => n.toString().padLeft(2, '0');
    return '${two(s ~/ 3600)}:${two((s % 3600) ~/ 60)}:${two(s % 60)}';
  }

  @override
  Widget build(BuildContext context) {
    if (_loadError != null) {
      final f = _loadError;
      return Scaffold(
        appBar: AppBar(title: const Text('Deneme')),
        body: ErrorStateView(
          message: f is Failure ? f.message : 'Sınav başlatılamadı.',
          onRetry: _load,
        ),
      );
    }
    if (_exam == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Deneme')),
        body: const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(children: [
            LoadingSkeleton(height: 24, width: 160),
            SizedBox(height: AppSpacing.md),
            LoadingSkeleton(height: 200),
          ]),
        ),
      );
    }

    final exam = _exam!;
    final low = _left.inSeconds <= 60 && _left.inSeconds > 0;
    return PopScope(
      canPop: false, // yanlışlıkla çıkışı engelle (cevaplar sunucuda güvende)
      onPopInvokedWithResult: (didPop, _) {
        if (!didPop) _confirmLeave();
      },
      child: Scaffold(
        appBar: AppBar(
          title: Text(exam.title, overflow: TextOverflow.ellipsis),
          leading: IconButton(
            icon: const Icon(Icons.close_rounded),
            onPressed: _confirmLeave,
          ),
        ),
        body: ListView.builder(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.md, AppSpacing.md, AppSpacing.md, 120),
          itemCount: exam.questions.length,
          itemBuilder: (context, i) => _questionTile(exam.questions[i], i + 1),
        ),
        bottomSheet: Container(
          padding: EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm,
              AppSpacing.md, AppSpacing.sm + MediaQuery.paddingOf(context).bottom),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface,
            border: Border(top: BorderSide(color: Theme.of(context).dividerColor)),
          ),
          child: Row(
            children: [
              Row(children: [
                Icon(Icons.timer_outlined, size: 18, color: low ? Colors.red : null),
                const SizedBox(width: 4),
                Text(_timeText,
                    style: TextStyle(
                        fontFeatures: const [FontFeature.tabularFigures()],
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: low ? Colors.red : null)),
              ]),
              const SizedBox(width: AppSpacing.sm),
              Text('$_answered/${exam.questions.length}',
                  style: Theme.of(context).textTheme.bodySmall),
              const Spacer(),
              PrimaryButton(
                label: _finishing ? 'Bitiriliyor…' : 'Testi Bitir',
                loading: _finishing,
                onPressed: _finishing ? null : _confirmFinish,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Future<void> _confirmLeave() async {
    final leave = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Sınavdan çık'),
        content: const Text(
            'Cevapların kaydedildi; süre dolmadan geri dönüp devam edebilirsin. Çıkmak istiyor musun?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Kal')),
          TextButton(onPressed: () => Navigator.pop(ctx, true), child: const Text('Çık')),
        ],
      ),
    );
    if (leave == true && mounted) context.pop();
  }

  Widget _questionTile(QuizQuestion q, int order) {
    _qStart.putIfAbsent(q.questionId, () => DateTime.now());
    final selected = _answers[q.questionId];
    final scheme = Theme.of(context).colorScheme;
    return Card(
      margin: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('$order. ${q.stem}',
                style: Theme.of(context).textTheme.titleSmall),
            const SizedBox(height: AppSpacing.sm),
            ...q.options.map((o) {
              final chosen = selected == o.id;
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: InkWell(
                  onTap: () => _select(q, o.id),
                  borderRadius: BorderRadius.circular(8),
                  child: Container(
                    padding: const EdgeInsets.all(AppSpacing.sm),
                    decoration: BoxDecoration(
                      color: chosen ? scheme.secondaryContainer : null,
                      border: Border.all(
                          color: chosen ? scheme.secondary : scheme.outlineVariant),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Text('${o.label})  ',
                            style: const TextStyle(fontWeight: FontWeight.bold)),
                        Expanded(child: Text(o.text)),
                        if (chosen) Icon(Icons.check_circle, size: 18, color: scheme.secondary),
                      ],
                    ),
                  ),
                ),
              );
            }),
            if (_save[q.questionId] == _SaveState.failed)
              const Padding(
                padding: EdgeInsets.only(top: 4),
                child: Text('Kaydedilemedi — tekrar seç.',
                    style: TextStyle(fontSize: 12, color: Colors.red)),
              ),
          ],
        ),
      ),
    );
  }
}

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_haptics.dart';
import '../../../core/theme/app_motion.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../../../shared/widgets/option_row.dart';
import '../../../shared/widgets/primary_button.dart';
import '../../../shared/widgets/question_media.dart';
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

  // Optik form (Doc 27 wireframe 10): soru başına sayfa + navigatör.
  final PageController _pageController = PageController();
  int _index = 0;

  /// "Emin değilim" bayrağı — oturum içi taktik aracıdır, sunucuya YAZILMAZ.
  final Set<String> _flags = {};

  // Canlı nabız: şu an sınavda olan kişi sayısı (~20 sn'de bir yoklanır).
  Timer? _presenceTimer;
  int? _online;

  @override
  void initState() {
    super.initState();
    _load();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _presenceTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startPresence() {
    Future<void> poll() async {
      try {
        final p =
            await ref.read(examsRepositoryProvider).presence(widget.examId);
        if (mounted) setState(() => _online = p.active);
      } catch (_) {/* nabız süsleyicidir — hata sınavı etkilemez */}
    }

    poll();
    _presenceTimer =
        Timer.periodic(const Duration(seconds: 20), (_) => poll());
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
      _startPresence();
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
  int get _total => _exam?.questions.length ?? 0;

  void _goTo(int i, {bool animate = false}) {
    if (i < 0 || i >= _total) return;
    if (animate) {
      _pageController.animateToPage(i,
          duration: AppMotion.respect(AppMotion.standard),
          curve: AppMotion.standardCurve);
    } else {
      _pageController.jumpToPage(i);
    }
  }

  void _toggleFlag(String questionId) {
    AppHaptics.select();
    setState(() {
      _flags.contains(questionId)
          ? _flags.remove(questionId)
          : _flags.add(questionId);
    });
  }

  Future<void> _select(QuizQuestion q, String optionId) async {
    AppHaptics.select(); // dokunma onayı (P2-18); doğru/yanlış sızdırmaz
    // İlk cevapta otomatik ilerle (100 soruda tap sayısını yarıya indirir);
    // cevabını DEĞİŞTİRENİ sayfadan koparmayız.
    final wasAnswered = _answers.containsKey(q.questionId);
    final fromIndex = _index;
    setState(() {
      _answers[q.questionId] = optionId;
      _save[q.questionId] = _SaveState.saving;
    });
    if (!wasAnswered && fromIndex < _total - 1) {
      Future.delayed(const Duration(milliseconds: 220), () {
        // Kullanıcı bu arada elle gezindiyse yerinden oynatma.
        if (mounted && _index == fromIndex) _goTo(fromIndex + 1, animate: true);
      });
    }
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
    final blank = _total - _answered;
    final flagged = _flags.length;
    final detail = [
      if (blank > 0) '$blank boş',
      if (flagged > 0) '$flagged bayraklı',
    ].join(' ve ');
    final ok = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Testi Bitir'),
        content: Text(detail.isNotEmpty
            ? '$detail sorun var. Sınavı bitirmek istediğine emin misin?'
            : 'Tüm soruları cevapladın. Sınavı bitirmek istiyor musun?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Devam Et')),
          FilledButton(
            style: FilledButton.styleFrom(
                backgroundColor: context.tokens.danger),
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
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [
            LoadingSkeleton(height: 24, width: 160),
            SizedBox(height: AppSpacing.lg),
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
          actions: [
            // Canlı katılımcı nabzı: şu an sınavda olan kişi sayısı.
            if (_online != null)
              Padding(
                padding: const EdgeInsets.only(right: AppSpacing.lg),
                child: Semantics(
                  label: 'Şu an sınavda $_online kişi var',
                  excludeSemantics: true,
                  child: Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.sm + 2,
                        vertical: AppSpacing.xs),
                    decoration: BoxDecoration(
                      color: context.tokens.accentLive.withValues(alpha: 0.12),
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusFull),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        PulseDot(color: context.tokens.accentLive),
                        const SizedBox(width: AppSpacing.xs),
                        Text('$_online',
                            style: AppTypography.label.copyWith(
                                color: context.tokens.accentLive)),
                      ],
                    ),
                  ),
                ),
              ),
          ],
        ),
        // Soru başına sayfa (optik form modeli): kaydırarak veya navigatörden
        // geçilir; her sayfa kendi içinde kaydırılır (uzun kök + 5 şık).
        body: PageView.builder(
          controller: _pageController,
          itemCount: exam.questions.length,
          onPageChanged: (i) {
            setState(() => _index = i);
            _qStart.putIfAbsent(
                exam.questions[i].questionId, () => DateTime.now());
          },
          itemBuilder: (context, i) => SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(
                AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xl),
            child: _questionTile(exam.questions[i], i + 1),
          ),
        ),
        bottomNavigationBar: _BottomBar(
          timeText: _timeText,
          lowTime: low,
          answered: _answered,
          total: exam.questions.length,
          flagged: _flags.length,
          index: _index,
          isFlagged: _flags.contains(exam.questions[_index].questionId),
          finishing: _finishing,
          onPrev: _index > 0 ? () => _goTo(_index - 1, animate: true) : null,
          onNext: _index < exam.questions.length - 1
              ? () => _goTo(_index + 1, animate: true)
              : null,
          onFlag: () => _toggleFlag(exam.questions[_index].questionId),
          onNavigator: _showNavigator,
          onFinish: _finishing ? null : _confirmFinish,
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

  /// Optik form navigatörü: dolu/boş/bayraklı ızgara — dokunulan soruya atlar.
  Future<void> _showNavigator() async {
    final exam = _exam!;
    final target = await showModalBottomSheet<int>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) {
        final tokens = ctx.tokens;
        final blank = exam.questions.length - _answered;
        final perQuestion = blank > 0 ? _left.inSeconds ~/ blank : 0;
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(AppSpacing.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Optik form',
                    style:
                        AppTypography.heading.copyWith(color: tokens.ink)),
                const SizedBox(height: AppSpacing.xs),
                Text(
                  'dolu $_answered · bayraklı ${_flags.length} · boş $blank'
                  '${blank > 0 && perQuestion > 0 ? '  ·  kalan öneri: boş soru başına ~$perQuestion sn' : ''}',
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft),
                ),
                const SizedBox(height: AppSpacing.md),
                Flexible(
                  child: SingleChildScrollView(
                    child: Wrap(
                      spacing: AppSpacing.xs,
                      runSpacing: AppSpacing.xs,
                      children: [
                        for (var i = 0; i < exam.questions.length; i++)
                          _NavigatorCell(
                            order: i + 1,
                            filled:
                                _answers.containsKey(exam.questions[i].questionId),
                            flagged:
                                _flags.contains(exam.questions[i].questionId),
                            current: i == _index,
                            onTap: () => Navigator.pop(ctx, i),
                          ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(children: [
                  _LegendDot(color: tokens.accentSession, label: 'dolu'),
                  const SizedBox(width: AppSpacing.md),
                  _LegendDot(color: tokens.warning, label: 'bayraklı'),
                  const SizedBox(width: AppSpacing.md),
                  _LegendDot(color: tokens.surfaceAlt, label: 'boş'),
                ]),
              ],
            ),
          ),
        );
      },
    );
    if (target != null && mounted) _goTo(target);
  }

  Widget _questionTile(QuizQuestion q, int order) {
    _qStart.putIfAbsent(q.questionId, () => DateTime.now());
    final selected = _answers[q.questionId];
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Text('SORU $order / $_total',
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft)),
              const Spacer(),
              if (_flags.contains(q.questionId))
                Row(children: [
                  Icon(Icons.flag_rounded, size: 14, color: tokens.warning),
                  const SizedBox(width: 2),
                  Text('emin değilim',
                      style: AppTypography.caption
                          .copyWith(color: tokens.warning)),
                ]),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(q.stem,
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          if (q.mediaUrl != null) ...[
            const SizedBox(height: AppSpacing.md),
            QuestionMedia(url: q.mediaUrl!),
          ],
          const SizedBox(height: AppSpacing.md),
          for (final o in q.options) ...[
            OptionRow(
              label: o.label,
              text: o.text,
              state: selected == o.id
                  ? OptionRowState.selected
                  : OptionRowState.idle,
              onTap: () => _select(q, o.id),
            ),
            const SizedBox(height: AppSpacing.xs),
          ],
          if (_save[q.questionId] == _SaveState.failed)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Text('Kaydedilemedi — tekrar seç.',
                  style:
                      AppTypography.label.copyWith(color: tokens.danger)),
            ),
        ],
      ),
    );
  }
}

/// Alt kumanda: sayaç + bitir · gezinme + bayrak + optik form kapısı.
/// İki satır: üstte durum (süre, bitir), altta soru gezintisi.
class _BottomBar extends StatelessWidget {
  final String timeText;
  final bool lowTime;
  final int answered;
  final int total;
  final int flagged;
  final int index;
  final bool isFlagged;
  final bool finishing;
  final VoidCallback? onPrev;
  final VoidCallback? onNext;
  final VoidCallback onFlag;
  final VoidCallback onNavigator;
  final VoidCallback? onFinish;

  const _BottomBar({
    required this.timeText,
    required this.lowTime,
    required this.answered,
    required this.total,
    required this.flagged,
    required this.index,
    required this.isFlagged,
    required this.finishing,
    required this.onPrev,
    required this.onNext,
    required this.onFlag,
    required this.onNavigator,
    required this.onFinish,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return SafeArea(
      top: false,
      child: Container(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.sm),
        decoration: BoxDecoration(
          color: tokens.surface,
          border: Border(top: BorderSide(color: tokens.line)),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(
              children: [
                Icon(Icons.timer_outlined,
                    size: 18, color: lowTime ? tokens.danger : tokens.ink),
                const SizedBox(width: 4),
                Text(timeText,
                    style: AppTypography.heading.copyWith(
                        fontFeatures: const [FontFeature.tabularFigures()],
                        color: lowTime ? tokens.danger : tokens.ink)),
                const Spacer(),
                PrimaryButton(
                  label: finishing ? 'Bitiriliyor…' : 'Testi Bitir',
                  loading: finishing,
                  onPressed: onFinish,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                IconButton(
                  onPressed: onPrev,
                  icon: const Icon(Icons.chevron_left_rounded),
                  tooltip: 'Önceki soru',
                  visualDensity: VisualDensity.compact,
                ),
                // Optik form kapısı: doluluk özeti + ızgaraya atlama.
                Expanded(
                  child: Semantics(
                    button: true,
                    label:
                        'Optik formu aç. $total sorunun $answered tanesi dolu, $flagged bayraklı',
                    excludeSemantics: true,
                    child: Material(
                      color: tokens.surfaceAlt,
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusFull),
                      child: InkWell(
                        onTap: onNavigator,
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusFull),
                        child: Container(
                          height: AppSpacing.minTouchTarget,
                          alignment: Alignment.center,
                          child: Row(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.grid_view_rounded,
                                  size: 16, color: tokens.inkSoft),
                              const SizedBox(width: AppSpacing.xs),
                              Text('$answered/$total dolu',
                                  style: AppTypography.label
                                      .copyWith(color: tokens.ink)),
                              if (flagged > 0) ...[
                                const SizedBox(width: AppSpacing.xs),
                                Text('· ⚑$flagged',
                                    style: AppTypography.label
                                        .copyWith(color: tokens.warning)),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                IconButton(
                  onPressed: onFlag,
                  isSelected: isFlagged,
                  tooltip: isFlagged ? 'Bayrağı kaldır' : 'Emin değilim',
                  visualDensity: VisualDensity.compact,
                  icon: Icon(
                    isFlagged ? Icons.flag_rounded : Icons.flag_outlined,
                    color: isFlagged ? tokens.warning : tokens.inkSoft,
                  ),
                ),
                IconButton(
                  onPressed: onNext,
                  icon: const Icon(Icons.chevron_right_rounded),
                  tooltip: 'Sonraki soru',
                  visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

/// Optik form hücresi: numara + durum (dolu / bayraklı / boş / açık soru).
class _NavigatorCell extends StatelessWidget {
  final int order;
  final bool filled;
  final bool flagged;
  final bool current;
  final VoidCallback onTap;
  const _NavigatorCell({
    required this.order,
    required this.filled,
    required this.flagged,
    required this.current,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final bg = flagged
        ? Color.alphaBlend(
            tokens.warning.withValues(alpha: 0.25), tokens.surface)
        : filled
            ? Color.alphaBlend(
                tokens.accentSession.withValues(alpha: 0.25), tokens.surface)
            : tokens.surfaceAlt;
    return Semantics(
      button: true,
      label:
          'Soru $order${filled ? ', dolu' : ', boş'}${flagged ? ', bayraklı' : ''}',
      selected: current,
      excludeSemantics: true,
      child: Material(
        color: bg,
        borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
          child: Container(
            width: 44,
            height: 44,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              border: Border.all(
                color: current ? tokens.brand : tokens.line,
                width: current ? 2 : 1,
              ),
            ),
            child: Text('$order',
                style: AppTypography.label.copyWith(
                    color: filled || flagged ? tokens.ink : tokens.inkSoft)),
          ),
        ),
      ),
    );
  }
}

class _LegendDot extends StatelessWidget {
  final Color color;
  final String label;
  const _LegendDot({required this.color, required this.label});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: Color.alphaBlend(
                color.withValues(alpha: 0.25), tokens.surface),
            borderRadius: BorderRadius.circular(3),
            border: Border.all(color: tokens.line),
          ),
        ),
        const SizedBox(width: AppSpacing.xs),
        Text(label,
            style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
      ],
    );
  }
}

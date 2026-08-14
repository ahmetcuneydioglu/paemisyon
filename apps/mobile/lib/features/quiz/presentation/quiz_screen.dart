import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/offline/answer_queue.dart';
import '../../../core/offline/sync_service.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/article_card.dart';
import '../../../shared/widgets/explanation_box.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../core/theme/app_haptics.dart';
import '../../../core/theme/app_motion.dart';
import '../../../shared/widgets/option_row.dart';
import '../../../shared/widgets/question_media.dart';
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
  final String? articleNo;
  /// Tek soruluk bildirim seansı (push derin bağlantısı).
  final String? questionId; // Madde Atlası: maddeden seans (Doc 25 §4)
  final bool fromBookmarks; // Favorilerden seans (Doc 27 B dilimi)
  /// Doluysa yeni seans BAŞLATILMAZ; yarım seans kaldığı yerden açılır (P0-②).
  final String? resumeSessionId;
  final String topicName;
  final String mode; // 'practice' | 'exam' | 'daily' | 'review'
  final int questionCount;

  /// İlk Devriye (Doc 24 Gün 0): sonuç ekranı skor değil TEŞHİS karnesi olur.
  final bool patrol;

  /// Arşiv denemesi: biten denemenin sabit seti (mode=exam, süre sunucudan).
  final String? archiveExamId;

  /// Kişisel deneme: hedef sınavın müfredat ağırlıklarıyla (mode=exam).
  final bool personalExam;
  const QuizScreen({
    super.key,
    this.topicId,
    this.courseId,
    this.articleNo,
    this.questionId,
    this.fromBookmarks = false,
    this.resumeSessionId,
    required this.topicName,
    required this.mode,
    this.questionCount = 10,
    this.patrol = false,
    this.archiveExamId,
    this.personalExam = false,
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
  // AI koç açıklaması (Doc 24 §4 Faz 2) — soru başına istekle gelir.
  AiExplanation? _ai;
  bool _aiBusy = false;
  bool _busy = false;
  DateTime _qStart = DateTime.now();
  // Deneme/exam: arka planda süren cevap gönderimleri — _finish hepsini bekler
  // (skor eksik cevapla hesaplanmasın).
  final Set<Future<void>> _inflight = {};
  DateTime _lastAdvanceAt = DateTime.fromMillisecondsSinceEpoch(0);

  // Deneme sayacı (gösterge — asıl denetim sunucuda).
  Timer? _timer;
  int _remainingSeconds = 0;

  // Bu oturumda favorilenen sorular (yıldız durumu).
  final Set<String> _bookmarked = {};

  // Günün quizi ve yanlış tekrarı da öğrenme akışıdır: anlık geri bildirim.
  bool get _isPractice =>
      widget.mode == 'practice' ||
      widget.mode == 'daily' ||
      widget.mode == 'review';

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
      final repo = ref.read(quizRepositoryProvider);
      final StartedSession s;
      var startIndex = 0;
      if (widget.resumeSessionId != null) {
        // Yarım seans (P0-②): aynı set, ilk cevapsız sorudan devam.
        final resumed = await repo.resume(widget.resumeSessionId!);
        s = resumed.session;
        startIndex = s.questions
            .indexWhere((q) => !resumed.answeredQuestionIds.contains(q.questionId));
      } else {
        s = await repo.start(
          mode: widget.mode,
          topicId: widget.topicId,
          courseId: widget.courseId,
          articleNo: widget.articleNo,
          questionId: widget.questionId,
          archiveExamId: widget.archiveExamId,
          personalExam: widget.personalExam,
          fromBookmarks: widget.fromBookmarks,
          count: widget.questionCount,
        );
      }
      setState(() {
        _session = s;
        _index = startIndex < 0 ? s.questions.length - 1 : startIndex;
        _qStart = DateTime.now();
      });
      if (startIndex < 0) {
        // Tüm sorular zaten cevaplı — doğrudan bitir, sonucu göster.
        await _finish();
        return;
      }
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
    final selected = _selected;
    final timeSpent = DateTime.now().difference(_qStart).inMilliseconds;

    // Geri bildirimsiz modlar (deneme/exam): İLERİ ANINDA — cevap arka planda
    // gönderilir, kullanıcı ağ turunu beklemez. Sunucu yine tek otorite;
    // _finish tüm arka plan gönderimlerini bekleyip öyle skorlar.
    if (!_isPractice) {
      // Hızlı çift dokunma sonraki soruyu yanlışlıkla BOŞ geçmesin.
      final now = DateTime.now();
      if (selected == null &&
          now.difference(_lastAdvanceAt) < const Duration(milliseconds: 400)) {
        return;
      }
      _lastAdvanceAt = now;
      final send = _sendInBackground(_q, selected, timeSpent);
      _inflight.add(send);
      send.whenComplete(() => _inflight.remove(send));
      await _advance();
      return;
    }

    setState(() => _busy = true);
    try {
      final fb = await ref.read(quizRepositoryProvider).answer(
            _session!.sessionId,
            questionId: _q.questionId,
            versionId: _q.versionId,
            selectedOptionId: selected,
            timeSpentMs: timeSpent,
          );
      // Haptic (Doc 28 P2-18): doğruda hafif onay, yanlışta orta dokunuş.
      if (fb.isCorrect == true) {
        AppHaptics.correct();
      } else if (fb.isCorrect == false) {
        AppHaptics.wrong();
      }
      setState(() => _feedback = fb); // geri bildirimi göster
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

  /// Deneme/exam arka plan gönderimi: hata akışları kullanıcıyı DURDURMAZ —
  /// çevrimdışıysa kuyruğa düşer (flush _finish'te), süre bittiyse sınav
  /// kapatılır, limit dolduysa kibar duvar gösterilir.
  Future<void> _sendInBackground(
      QuizQuestion q, String? selected, int timeSpent) async {
    try {
      await ref.read(quizRepositoryProvider).answer(
            _session!.sessionId,
            questionId: q.questionId,
            versionId: q.versionId,
            selectedOptionId: selected,
            timeSpentMs: timeSpent,
          );
    } on NetworkFailure {
      final queue = ref.read(answerQueueProvider);
      await queue.enqueue(QueuedAnswer(
        sessionId: _session!.sessionId,
        questionId: q.questionId,
        versionId: q.versionId,
        selectedOptionId: selected,
        timeSpentMs: timeSpent,
        createdAt: DateTime.now().millisecondsSinceEpoch,
      ));
      ref.read(pendingAnswerCountProvider.notifier).state = await queue.count();
    } on ExamTimeOverFailure {
      if (mounted) {
        _snack('Sınav süresi doldu — kalan sorular boş sayılır.');
        // AWAIT EDİLMEZ: _finish bu gönderimin bitmesini bekliyor — burada
        // await etmek karşılıklı bekleme (deadlock) yaratırdı.
        unawaited(_finish());
      }
    } on DailyLimitFailure catch (f) {
      if (mounted) _showPaywall(f.message);
    } on Failure catch (f) {
      if (mounted) _snack(f.message);
    } catch (_) {
      /* tekil kayıp cevap _finish flush'ıyla telafi edilemezse skor yine
         sunucudaki kayıtlardan hesaplanır — oturum kilitlenmez */
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

  /// Kibar duvar (Doc 25 akış H): flow cezalandırılmaz, koç çerçevesi kullanılır.
  Future<void> _showPaywall(String message) async {
    if (!mounted) return;
    final go = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        icon: const Icon(Icons.workspace_premium_rounded),
        title: const Text('Koç seni durdurmak istemiyor'),
        content: Text(
          'Bugünkü ücretsiz hakkın doldu — tam ısınmışken. '
          'Premium ile koç seni hiçbir gün durdurmaz.\n\n$message',
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Yarın devam ederim')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Premium ile sürdür')),
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
      _ai = null;
      _qStart = DateTime.now();
    });
  }

  /// "Koça sor: Neden?" — AI çeldirici analizi (önbellekliyse hak düşmez).
  Future<void> _askCoach() async {
    if (_aiBusy || _selected == null) return;
    setState(() => _aiBusy = true);
    try {
      final ai = await ref.read(quizRepositoryProvider).aiExplain(
            versionId: _q.versionId,
            chosenOptionId: _selected!,
          );
      if (mounted) setState(() => _ai = ai);
    } on DailyLimitFailure catch (f) {
      _showPaywall(f.message);
    } on Failure catch (f) {
      _snack(f.message);
    } finally {
      if (mounted) setState(() => _aiBusy = false);
    }
  }

  Future<void> _finish() async {
    if (_busy && _timer == null) return;
    _timer?.cancel();
    _timer = null;
    setState(() => _busy = true);
    try {
      // Arka planda süren cevap gönderimleri bitmeden skorlama yapılmaz.
      if (_inflight.isNotEmpty) await Future.wait(_inflight.toList());
      // Çevrimdışıyken biriken cevaplar varsa önce onları gönder — skor doğru olsun.
      await ref.read(syncServiceProvider).flush();
      final result =
          await ref.read(quizRepositoryProvider).complete(_session!.sessionId);
      // Rozet kazanımı gerçek dönüm noktasıdır — belirgin haptic (P2-18).
      if (result.earnedBadges.isNotEmpty) AppHaptics.celebrate();
      if (mounted) {
        context.pushReplacement('/quiz/result',
            extra: {'result': result, 'patrol': widget.patrol});
      }
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

  /// Resmî madde metni sheet'i (Doc 28 P0-④) — ArticleCard ilk kez sahnede.
  void _showArticleSheet(RelatedArticle article) {
    final text = article.text!;
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (ctx) => DraggableScrollableSheet(
        expand: false,
        initialChildSize: 0.7,
        maxChildSize: 0.95,
        builder: (ctx, scrollController) => SingleChildScrollView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, 0, AppSpacing.lg, AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              ArticleCard(
                title: 'Madde ${article.no}',
                officialText: text.body,
              ),
              const SizedBox(height: AppSpacing.sm),
              Text(
                [
                  'Kaynak: ${text.source}',
                  if (text.effectiveInfo != null) text.effectiveInfo!,
                  if (text.verifiedAt != null)
                    'Doğrulama: ${text.verifiedAt!.substring(0, 10)}',
                ].join(' · '),
                style: AppTypography.caption
                    .copyWith(color: ctx.tokens.inkSoft),
              ),
            ],
          ),
        ),
      ),
    );
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
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LoadingSkeleton(height: 20, width: 120),
              SizedBox(height: AppSpacing.lg),
              LoadingSkeleton(height: 60),
              SizedBox(height: AppSpacing.lg),
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
        // Reels-vari akış: sola kaydır = Sonraki/İleri (butonla aynı kurallar
        // — practice'te cevaplamadan atlanmaz). Sağa kaydırma yok: cevaplar
        // sunucuya işlendiği için geri dönüş desteklenmez.
        child: GestureDetector(
          behavior: HitTestBehavior.translucent,
          onHorizontalDragEnd: _onSwipe,
          child: AnimatedSwitcher(
            duration: AppMotion.respect(AppMotion.standard),
            switchInCurve: AppMotion.standardCurve,
            switchOutCurve: AppMotion.standardCurve,
            transitionBuilder: (child, animation) => FadeTransition(
              opacity: animation,
              child: SlideTransition(
                position: Tween<Offset>(
                  begin: const Offset(0.12, 0), // sağdan hafif kayarak gelir
                  end: Offset.zero,
                ).animate(animation),
                child: child,
              ),
            ),
            child: SingleChildScrollView(
              key: ValueKey(_index),
          padding: const EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Text(_q.stem, style: AppTypography.heading),
              if (_q.mediaUrl != null) ...[
                const SizedBox(height: AppSpacing.md),
                QuestionMedia(url: _q.mediaUrl!),
              ],
              const SizedBox(height: AppSpacing.xl),
              ..._q.options.map(_optionTile),
              // Açıklama cevaptan hemen sonra AYNI ekranda (Doc 26 §4 #6).
              if (_feedback != null &&
                  (_feedback!.explanation != null ||
                      _feedback!.legalReference != null)) ...[
                const SizedBox(height: AppSpacing.lg),
                ExplanationBox(
                  explanation: [
                    if (_feedback!.explanation != null) _feedback!.explanation!,
                    if (_feedback!.legalReference != null)
                      'Dayanak: ${_feedback!.legalReference!}',
                  ].join('\n\n'),
                  source: _feedback!.source,
                ),
              ],
              // Resmî madde metni köprüsü (Doc 28 P0-④): öğren-dene-yanıl-ANLA.
              if (_feedback?.relatedArticle?.text != null) ...[
                const SizedBox(height: AppSpacing.sm),
                OutlinedButton.icon(
                  onPressed: () =>
                      _showArticleSheet(_feedback!.relatedArticle!),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: context.tokens.accentAtlas,
                    side: BorderSide(color: context.tokens.accentAtlas),
                    minimumSize:
                        const Size.fromHeight(AppSpacing.minTouchTarget),
                  ),
                  icon: const Icon(Icons.menu_book_rounded, size: 18),
                  label: Text(
                      'Madde ${_feedback!.relatedArticle!.no} — resmî metni oku'),
                ),
              ],
              // AI koç: yanlış cevapta çeldirici analizi (Doc 24 §4 Faz 2).
              if (_feedback != null && _feedback!.isCorrect == false) ...[
                const SizedBox(height: AppSpacing.sm),
                if (_ai == null)
                  OutlinedButton.icon(
                    onPressed: _aiBusy ? null : _askCoach,
                    icon: _aiBusy
                        ? const SizedBox(
                            width: 16,
                            height: 16,
                            child: CircularProgressIndicator(strokeWidth: 2),
                          )
                        : const Icon(Icons.psychology_rounded, size: 18),
                    label: Text(
                        _aiBusy ? 'Koç düşünüyor…' : 'Koça sor: Neden yanlış?'),
                  )
                else
                  _CoachExplanation(ai: _ai!),
              ],
              const SizedBox(height: AppSpacing.xl),
              _bottomButton(),
            ],
          ),
            ),
          ),
        ),
      ),
    );
  }

  /// Sola kaydırma = Sonraki/İleri (buton kuralları aynen geçerli).
  void _onSwipe(DragEndDetails d) {
    final v = d.primaryVelocity ?? 0;
    if (v > -300) return; // yalnız kararlı SOLA kaydırma
    if (_busy) return;
    if (_isPractice) {
      // Cevaplamadan atlama yok — küçük dokunuşla hatırlat.
      if (_feedback == null) {
        AppHaptics.select();
        return;
      }
      _advance();
    } else {
      _submit(); // deneme/exam: İleri ile birebir aynı (boş geçme hakkı dahil)
    }
  }

  Widget _optionTile(QuizOption o) {
    final answered = _feedback != null; // practice'te cevaptan sonra
    // Durum eşlemesi (Doc 26 §4 #5): renk + ikon birlikte; anında, animasyonsuz.
    final OptionRowState state;
    if (answered) {
      if (o.id == _feedback!.correctOptionId) {
        state = OptionRowState.correct;
      } else if (o.id == _selected) {
        state = OptionRowState.wrongPick;
      } else {
        state = OptionRowState.dimmed;
      }
    } else {
      state = o.id == _selected ? OptionRowState.selected : OptionRowState.idle;
    }

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: OptionRow(
        label: o.label,
        text: o.text,
        state: state,
        // Practice: dokunuş = cevap (Doc 26 §3.4 — öğrenme anında gecikme
        // olmaz; ayrıca "Onayla" ara adımı kaldırıldı). Exam: önce seç,
        // "İleri" gönderir — boş bırakma hakkı korunur.
        onTap: answered || _busy
            ? null
            : () {
                setState(() => _selected = o.id);
                if (_isPractice) _submit();
              },
      ),
    );
  }

  Widget _bottomButton() {
    // practice: dokunuş cevapladığı için cevaptan ÖNCE buton yok;
    // sonra "Sonraki"/"Bitir". exam: "İleri" (gönder + ilerle).
    if (_isPractice) {
      if (_feedback == null) return const SizedBox.shrink();
      return PrimaryButton(
          label: _isLast ? 'Bitir' : 'Sonraki',
          loading: _busy,
          onPressed: _advance);
    }
    return PrimaryButton(
        label: _isLast ? 'Bitir' : 'İleri', loading: _busy, onPressed: _submit);
  }
}

/// AI koç açıklama kutusu — atlas accent'iyle, kaynak satırı gibi alçakgönüllü.
class _CoachExplanation extends StatelessWidget {
  final AiExplanation ai;
  const _CoachExplanation({required this.ai});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.accentAtlas.withValues(alpha: 0.08),
        border: Border.all(color: tokens.accentAtlas.withValues(alpha: 0.35)),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.psychology_rounded,
                  size: 18, color: tokens.accentAtlas),
              const SizedBox(width: AppSpacing.xs),
              Text('KOÇ',
                  style: AppTypography.caption
                      .copyWith(color: tokens.accentAtlas)),
              const Spacer(),
              if (ai.remainingToday != null)
                Text('bugün ${ai.remainingToday} hak kaldı',
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft)),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(ai.text,
              style: AppTypography.body.copyWith(color: tokens.ink)),
        ],
      ),
    );
  }
}

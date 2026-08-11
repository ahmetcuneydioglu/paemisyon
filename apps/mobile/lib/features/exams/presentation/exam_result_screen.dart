import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/explanation_box.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/option_row.dart';
import '../../../shared/widgets/question_media.dart';
import '../../quiz/data/quiz_repository.dart';
import '../../review/data/review_repository.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Deneme sonucu + inceleme (Doc 18 §2.4, Doc 28 P1-9). Puan = NET.
/// İnceleme, seans oynatıcıyla AYNI dili konuşur: OptionRow durumları
/// (correct/wrongPick/dimmed) + ExplanationBox — ham renk kullanılmaz.
class ExamResultScreen extends ConsumerWidget {
  final String attemptId;
  const ExamResultScreen({super.key, required this.attemptId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final result = ref.watch(examAttemptProvider(attemptId));
    return Scaffold(
      appBar: AppBar(title: const Text('Sınav Sonucu')),
      body: result.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(children: [
            LoadingSkeleton(height: 160),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 200),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Sonuç yüklenemedi.',
          onRetry: () => ref.invalidate(examAttemptProvider(attemptId)),
        ),
        data: (r) => _Body(result: r),
      ),
    );
  }
}

class _Body extends ConsumerStatefulWidget {
  final AttemptResult result;
  const _Body({required this.result});

  @override
  ConsumerState<_Body> createState() => _BodyState();
}

class _BodyState extends ConsumerState<_Body> {
  /// Favori durumu — açılışta sunucudan tohumlanır, dokunuşta iyimser güncellenir.
  final Set<String> _bookmarked = {};

  @override
  void initState() {
    super.initState();
    ref.read(reviewRepositoryProvider).getBookmarks().then((rows) {
      if (mounted) {
        setState(() => _bookmarked.addAll(rows.map((r) => r.questionId)));
      }
    }).catchError((_) {/* tohum alınamazsa yıldızlar boş başlar */});
  }

  Future<void> _toggleBookmark(String questionId) async {
    final had = _bookmarked.contains(questionId);
    setState(() => had ? _bookmarked.remove(questionId) : _bookmarked.add(questionId));
    try {
      final repo = ref.read(reviewRepositoryProvider);
      had ? await repo.removeBookmark(questionId) : await repo.addBookmark(questionId);
    } catch (_) {
      if (mounted) {
        setState(() =>
            had ? _bookmarked.add(questionId) : _bookmarked.remove(questionId));
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Favori kaydedilemedi — tekrar dene.')));
      }
    }
  }

  Future<void> _report(String questionId) async {
    final controller = TextEditingController();
    final message = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Bu soruda ne yanlış?'),
        content: TextField(
          controller: controller,
          autofocus: true,
          maxLines: 3,
          maxLength: 500,
          decoration: const InputDecoration(
              hintText: 'ör. cevap anahtarı yanlış, yazım hatası, şık eksik…'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Vazgeç')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, controller.text.trim()),
              child: const Text('Bildir')),
        ],
      ),
    );
    // Diyalog kapanış ANİMASYONU bitmeden dispose etme — TextField hâlâ
    // controller'a bağlıyken '_dependents.isEmpty' assert'iyle çöker.
    Future.delayed(const Duration(milliseconds: 400), controller.dispose);
    if (message == null || message.length < 5 || !mounted) return;
    try {
      await ref.read(quizRepositoryProvider).reportQuestion(questionId, message);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Bildirimin alındı — editör ekibi inceleyecek.')));
      }
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Bildirim gönderilemedi — tekrar dene.')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final result = widget.result;
    // Önce kendinle kıyas (Doc 24 §2) — alınamazsa satır sessizce gizlenir.
    final delta = ref.watch(attemptDeltaProvider(result.attemptId)).valueOrNull;
    return ListView(
      padding: const EdgeInsets.all(AppSpacing.lg),
      children: [
        _ScoreCard(result: result, delta: delta),
        const SizedBox(height: AppSpacing.lg),
        Row(
          children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () =>
                    context.push('/denemeler/${result.examId}/siralama'),
                child: const Text('Sıralama'),
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: FilledButton(
                onPressed: () => context.go('/denemeler'),
                child: const Text('Denemeler'),
              ),
            ),
          ],
        ),
        // ── Derin analiz: konu kırılımı — kaybettirenler üstte (web ile eş) ──
        if (result.topicBreakdown.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xl),
          _TopicBreakdownCard(rows: result.topicBreakdown),
        ],
        // ── Süre yönetimi şeridi: soru sırasına göre harcanan süre ──
        if (result.timing.any((t) => (t.timeSpentMs ?? 0) > 0)) ...[
          const SizedBox(height: AppSpacing.lg),
          _TimingStrip(timing: result.timing),
        ],
        const SizedBox(height: AppSpacing.xl),
        Text('Cevap İncelemesi',
            style: AppTypography.heading
                .copyWith(color: context.tokens.ink)),
        const SizedBox(height: AppSpacing.xs),
        ...result.review.map((q) => _ReviewTile(
              q: q,
              bookmarked: _bookmarked.contains(q.questionId),
              onBookmark: () => _toggleBookmark(q.questionId),
              onReport: () => _report(q.questionId),
            )),
        const SizedBox(height: AppSpacing.xl),
      ],
    );
  }
}

/// Sonuç kartı: net puan büyük (display), altında Doğru/Yanlış/Boş rozetleri.
/// Renkli zemin yerine renkli SAYI — iki temada da kontrast korunur.
class _ScoreCard extends StatelessWidget {
  final AttemptResult result;

  /// Bir önceki denemeye göre net farkı; null = ilk deneme / veri yok.
  final double? delta;
  const _ScoreCard({required this.result, this.delta});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        color: tokens.surfaceAlt,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        children: [
          Text(result.examTitle,
              textAlign: TextAlign.center,
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.md),
          Text(result.score?.toStringAsFixed(2) ?? '—',
              style: AppTypography.display.copyWith(color: tokens.brand)),
          Text('NET PUAN',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
          if (delta != null) ...[
            const SizedBox(height: AppSpacing.xs),
            Text(
              'geçen denemeden ${delta! > 0 ? '+' : ''}${delta!.toStringAsFixed(2)} net',
              style: AppTypography.label.copyWith(
                color: delta! > 0
                    ? tokens.success
                    : delta! < 0
                        ? tokens.warning
                        : tokens.inkSoft,
              ),
            ),
          ],
          const SizedBox(height: AppSpacing.lg),
          Row(
            children: [
              _StatCell(
                  label: 'Doğru',
                  value: result.correctCount,
                  color: tokens.success),
              const SizedBox(width: AppSpacing.sm),
              _StatCell(
                  label: 'Yanlış',
                  value: result.wrongCount,
                  color: tokens.danger),
              const SizedBox(width: AppSpacing.sm),
              _StatCell(
                  label: 'Boş',
                  value: result.blankCount,
                  color: tokens.warning),
            ],
          ),
        ],
      ),
    );
  }
}

class _StatCell extends StatelessWidget {
  final String label;
  final int value;
  final Color color;
  const _StatCell(
      {required this.label, required this.value, required this.color});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Expanded(
      child: Semantics(
        label: '$label: $value',
        excludeSemantics: true,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
          decoration: BoxDecoration(
            color: Color.alphaBlend(
                color.withValues(alpha: 0.10), tokens.surface),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
            border: Border.all(color: color.withValues(alpha: 0.35)),
          ),
          child: Column(
            children: [
              Text('$value',
                  style: AppTypography.title.copyWith(color: color)),
              const SizedBox(height: 2),
              Text(label,
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Konu kırılımı (Doc 27 wireframe 11) — "kaybettirenler üstte": her kayıplı
/// satırdan tek tıkla kapatma seansı. Kayıp net = yanlış×1,25 + boş.
class _TopicBreakdownCard extends StatelessWidget {
  final List<AttemptTopicRow> rows;
  const _TopicBreakdownCard({required this.rows});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final sorted = [...rows]..sort((a, b) => b.lostNet.compareTo(a.lostNet));
    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('KONU KIRILIMI — KAYBETTİRENLER ÜSTTE',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
          const SizedBox(height: AppSpacing.sm),
          for (final t in sorted) ...[
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(t.topicName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.body
                              .copyWith(color: tokens.ink)),
                      Text.rich(
                        TextSpan(
                          style: AppTypography.caption
                              .copyWith(color: tokens.inkSoft),
                          children: [
                            TextSpan(
                                text: 'D${t.correct} ',
                                style: TextStyle(color: tokens.success)),
                            TextSpan(
                                text: 'Y${t.wrong} ',
                                style: TextStyle(color: tokens.danger)),
                            TextSpan(text: 'B${t.blank}'),
                            if (t.lostNet > 0)
                              TextSpan(
                                  text:
                                      '  ·  kayıp −${t.lostNet.toStringAsFixed(2).replaceFirst(RegExp(r'\.?0+$'), '')} net',
                                  style: TextStyle(
                                      color: tokens.ink,
                                      fontWeight: FontWeight.w700)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                if (t.wrong + t.blank > 0)
                  OutlinedButton(
                    onPressed: () => context.push('/quiz', extra: {
                      'topicId': t.topicId,
                      'topicName': t.topicName,
                      'mode': 'practice',
                      'count': 10,
                    }),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: tokens.brand,
                      side: BorderSide(color: tokens.brand.withValues(alpha: 0.5)),
                      visualDensity: VisualDensity.compact,
                      minimumSize: const Size(0, 36),
                    ),
                    child: const Text('Kapat'),
                  ),
              ],
            ),
            if (t != sorted.last)
              Divider(height: AppSpacing.lg, color: tokens.line),
          ],
          const SizedBox(height: AppSpacing.xs),
          Text(
            '"Kapat" o konudan seans başlatır; yanlışların zaten tekrar kuyruğunda.',
            style: AppTypography.caption.copyWith(color: tokens.inkSoft),
          ),
        ],
      ),
    );
  }
}

/// Süre yönetimi şeridi (web TimingStrip'in mobil eşi): soru sırasına göre
/// harcanan süre çubukları — doğru/yanlış/boş renkli; ortalamanın 1,5 katını
/// aşanlar uyarı bordürüyle işaretli. Yatay kaydırmalı (100 soruya dayanır).
class _TimingStrip extends StatelessWidget {
  final List<AttemptTiming> timing;
  const _TimingStrip({required this.timing});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final withTime =
        timing.where((t) => (t.timeSpentMs ?? 0) > 0).toList();
    final avg = withTime.isEmpty
        ? 0
        : withTime.map((t) => t.timeSpentMs!).reduce((a, b) => a + b) /
            withTime.length;
    final maxMs = withTime.isEmpty
        ? 1
        : withTime.map((t) => t.timeSpentMs!).reduce((a, b) => a > b ? a : b);
    AttemptTiming? slowest;
    for (final t in withTime) {
      if (slowest == null || t.timeSpentMs! > slowest.timeSpentMs!) slowest = t;
    }

    Color colorOf(String status) => switch (status) {
          'correct' => tokens.success,
          'wrong' => tokens.danger,
          _ => tokens.inkSoft,
        };

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('SÜRE YÖNETİMİ',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
          const SizedBox(height: AppSpacing.sm),
          Semantics(
            label: slowest != null
                ? 'Soru başına süre grafiği. En çok zaman yiyen: soru ${slowest.order}, ${(slowest.timeSpentMs! / 1000).round()} saniye'
                : 'Soru başına süre grafiği',
            excludeSemantics: true,
            child: SizedBox(
              height: 72,
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    for (final t in timing)
                      Padding(
                        padding: const EdgeInsets.only(right: 3),
                        child: Container(
                          width: 8,
                          height: t.timeSpentMs == null || t.timeSpentMs == 0
                              ? 4
                              : (8 + 64 * (t.timeSpentMs! / maxMs))
                                  .clamp(8, 72)
                                  .toDouble(),
                          decoration: BoxDecoration(
                            color: colorOf(t.status).withValues(
                                alpha:
                                    (t.timeSpentMs ?? 0) > 0 ? 0.85 : 0.25),
                            borderRadius: BorderRadius.circular(2),
                            border: avg > 0 &&
                                    (t.timeSpentMs ?? 0) > avg * 1.5
                                ? Border.all(color: tokens.warning, width: 1.5)
                                : null,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          Text.rich(
            TextSpan(
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
              children: [
                TextSpan(
                    text: '■ ', style: TextStyle(color: tokens.success)),
                const TextSpan(text: 'doğru  '),
                TextSpan(text: '■ ', style: TextStyle(color: tokens.danger)),
                const TextSpan(text: 'yanlış  '),
                TextSpan(text: '■ ', style: TextStyle(color: tokens.inkSoft)),
                const TextSpan(text: 'boş  '),
                TextSpan(text: '□ ', style: TextStyle(color: tokens.warning)),
                const TextSpan(text: 'ortalamanın 1,5 katından yavaş'),
                if (slowest != null)
                  TextSpan(
                      text:
                          '\nEn çok zaman yiyen: S${slowest.order} (${(slowest.timeSpentMs! / 1000).round()} sn)'),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _ReviewTile extends StatelessWidget {
  final ReviewQuestion q;
  final bool bookmarked;
  final VoidCallback onBookmark;
  final VoidCallback onReport;
  const _ReviewTile({
    required this.q,
    required this.bookmarked,
    required this.onBookmark,
    required this.onReport,
  });

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final blank = q.selectedOptionId == null;
    return Container(
      margin: const EdgeInsets.only(top: AppSpacing.md),
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('${q.order}. ${q.stem}',
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
              state: o.isCorrect
                  ? OptionRowState.correct
                  : q.selectedOptionId == o.id
                      ? OptionRowState.wrongPick
                      : OptionRowState.dimmed,
            ),
            const SizedBox(height: AppSpacing.xs),
          ],
          if (blank)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Text('Bu soruyu boş bıraktın.',
                  style: AppTypography.label.copyWith(color: tokens.warning)),
            ),
          if (q.explanation != null && q.explanation!.isNotEmpty) ...[
            const SizedBox(height: AppSpacing.sm),
            ExplanationBox(explanation: q.explanation!, source: q.source),
          ] else if (q.source != null && q.source!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.only(top: AppSpacing.xs),
              child: Text('Kaynak: ${q.source}',
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft)),
            ),
          // Aksiyonlar: favorile (tekrar reçetesine girer) + hata bildir.
          const SizedBox(height: AppSpacing.xs),
          Row(
            mainAxisAlignment: MainAxisAlignment.end,
            children: [
              TextButton.icon(
                onPressed: onBookmark,
                style: TextButton.styleFrom(
                  foregroundColor:
                      bookmarked ? tokens.accentStreak : tokens.inkSoft,
                  visualDensity: VisualDensity.compact,
                ),
                icon: Icon(
                  bookmarked
                      ? Icons.star_rounded
                      : Icons.star_border_rounded,
                  size: 18,
                ),
                label: Text(bookmarked ? 'Favoride' : 'Favorile',
                    style: AppTypography.label),
              ),
              const SizedBox(width: AppSpacing.xs),
              TextButton.icon(
                onPressed: onReport,
                style: TextButton.styleFrom(
                  foregroundColor: tokens.inkSoft,
                  visualDensity: VisualDensity.compact,
                ),
                icon: const Icon(Icons.flag_outlined, size: 18),
                label: const Text('Hata bildir', style: AppTypography.label),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

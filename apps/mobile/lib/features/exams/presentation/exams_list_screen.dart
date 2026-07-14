import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/exams_repository.dart';
import '../domain/exam_models.dart';

/// Denemeler listesi (Doc 18) — iOS 26 dili: bölümlü hiyerarşi (Canlı →
/// Yaklaşan → Geçmiş), tek accent, durumlar rozetle. İş mantığı aynen:
/// /exams listesi + üç durum; kartlar yalnız sunumu modernleştirir.
///
/// Geçmiş kartlarında "Net · %" gösterebilmek için mevcut myAttempts()
/// listeyle birleştirilir (sunum katmanı — backend değişikliği yok).
final examsScreenDataProvider = FutureProvider.autoDispose<
    (List<ExamListItem>, Map<String, AttemptResult>)>((ref) async {
  final repo = ref.watch(examsRepositoryProvider);
  final list = await repo.list();
  var mine = <String, AttemptResult>{};
  try {
    final attempts = await repo.myAttempts();
    mine = {for (final a in attempts) a.examId: a};
  } catch (_) {
    // Özet alınamazsa kartlar netsiz gösterilir — liste yine çalışır.
  }
  return (list, mine);
});

class ExamsListScreen extends ConsumerWidget {
  const ExamsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final data = ref.watch(examsScreenDataProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Denemeler')),
      body: data.when(
        loading: () => ListView(
          padding: const EdgeInsets.all(AppSpacing.md),
          children: const [
            LoadingSkeleton(height: 180),
            SizedBox(height: AppSpacing.md),
            LoadingSkeleton(height: 64),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 64),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 64),
          ],
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Denemeler yüklenemedi.',
          onRetry: () => ref.invalidate(examsScreenDataProvider),
        ),
        data: (d) {
          final (list, mine) = d;
          if (list.isEmpty) {
            return const EmptyStateView(
              icon: Icons.event_note_rounded,
              message:
                  'Şu an yayında deneme yok.\nYenileri eklendiğinde burada görünecek.',
            );
          }
          return RefreshIndicator(
            onRefresh: () async => ref.invalidate(examsScreenDataProvider),
            child: _Sections(list: list, mine: mine),
          );
        },
      ),
    );
  }
}

/// Listeyi Canlı → Yaklaşan → Geçmiş bölümlerine ayırır; kademeli giriş
/// animasyonu için her öğe sırasına göre gecikmeli belirir.
class _Sections extends ConsumerWidget {
  final List<ExamListItem> list;
  final Map<String, AttemptResult> mine;
  const _Sections({required this.list, required this.mine});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final active = list.where((e) => e.state == ExamState.active).toList();
    final upcoming = list.where((e) => e.state == ExamState.upcoming).toList()
      ..sort((a, b) => a.startAt.compareTo(b.startAt)); // en yakın önce
    final ended = list.where((e) => e.state == ExamState.ended).toList();

    // Sonuç/sınav ekranından dönünce liste tazelensin (durum değişmiş olabilir).
    Future<void> go(String path) async {
      await context.push(path);
      ref.invalidate(examsScreenDataProvider);
    }

    var i = 0;
    final children = <Widget>[
      if (active.isNotEmpty) ...[
        const _SectionHeader('CANLI'),
        for (final e in active)
          _Staggered(
            index: i++,
            child: _HeroExamCard(
              exam: e,
              onExpired: () => ref.invalidate(examsScreenDataProvider),
              onOpen: go,
            ),
          ),
      ],
      if (upcoming.isNotEmpty) ...[
        const _SectionHeader('YAKLAŞAN'),
        for (final e in upcoming)
          _Staggered(index: i++, child: _UpcomingRow(exam: e)),
      ],
      if (ended.isNotEmpty) ...[
        const _SectionHeader('GEÇMİŞ'),
        for (final e in ended)
          _Staggered(
            index: i++,
            child: _PastRow(exam: e, result: mine[e.id], onOpen: go),
          ),
      ],
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.md, AppSpacing.xs, AppSpacing.md, AppSpacing.xl),
      children: children,
    );
  }
}

// ── Yardımcı biçimler ──

const _months = [
  'Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz',
  'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara', // ignore: require_trailing_commas
];

String _two(int n) => n.toString().padLeft(2, '0');
String _hm(DateTime d) {
  final l = d.toLocal();
  return '${_two(l.hour)}:${_two(l.minute)}';
}

String _countdown(Duration d) {
  final s = d.inSeconds < 0 ? 0 : d.inSeconds;
  return '${_two(s ~/ 3600)}:${_two((s % 3600) ~/ 60)}:${_two(s % 60)}';
}

// ── Bölüm başlığı ──

class _SectionHeader extends StatelessWidget {
  final String label;
  const _SectionHeader(this.label);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.xs, AppSpacing.md, AppSpacing.xs, AppSpacing.sm),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.8,
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      );
}

// ── Rozet sistemi: durumlar buton yerine rozetle anlatılır ──

class _Badge extends StatelessWidget {
  final String label;
  final Color color;
  final bool dot;
  const _Badge(this.label, {required this.color, this.dot = false});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.14),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dot) ...[
              _PulseDot(color: color),
              const SizedBox(width: 5),
            ],
            Text(label,
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600, color: color)),
          ],
        ),
      );
}

/// Canlı rozetindeki nefes alan nokta.
class _PulseDot extends StatefulWidget {
  final Color color;
  const _PulseDot({required this.color});

  @override
  State<_PulseDot> createState() => _PulseDotState();
}

class _PulseDotState extends State<_PulseDot>
    with SingleTickerProviderStateMixin {
  late final AnimationController _c = AnimationController(
      vsync: this, duration: const Duration(milliseconds: 900))
    ..repeat(reverse: true);

  @override
  void dispose() {
    _c.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => FadeTransition(
        opacity: Tween(begin: 0.35, end: 1.0)
            .animate(CurvedAnimation(parent: _c, curve: Curves.easeInOut)),
        child: Container(
          width: 7,
          height: 7,
          decoration:
              BoxDecoration(color: widget.color, shape: BoxShape.circle),
        ),
      );
}

// ── Mikro animasyonlar ──

/// Kademeli giriş: sırasına göre gecikmeli fade + yukarı kayma.
class _Staggered extends StatefulWidget {
  final int index;
  final Widget child;
  const _Staggered({required this.index, required this.child});

  @override
  State<_Staggered> createState() => _StaggeredState();
}

class _StaggeredState extends State<_Staggered> {
  bool _visible = false;

  @override
  void initState() {
    super.initState();
    Future.delayed(Duration(milliseconds: 40 * widget.index.clamp(0, 10)), () {
      if (mounted) setState(() => _visible = true);
    });
  }

  @override
  Widget build(BuildContext context) => AnimatedSlide(
        offset: _visible ? Offset.zero : const Offset(0, 0.04),
        duration: const Duration(milliseconds: 280),
        curve: Curves.easeOutCubic,
        child: AnimatedOpacity(
          opacity: _visible ? 1 : 0,
          duration: const Duration(milliseconds: 280),
          child: widget.child,
        ),
      );
}

/// Basınca hafifçe küçülen kart sarmalayıcısı (premium dokunuş hissi).
class _Pressable extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  const _Pressable({required this.child, this.onTap});

  @override
  State<_Pressable> createState() => _PressableState();
}

class _PressableState extends State<_Pressable> {
  bool _down = false;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTapDown: widget.onTap == null
            ? null
            : (_) => setState(() => _down = true),
        onTapUp: (_) => setState(() => _down = false),
        onTapCancel: () => setState(() => _down = false),
        onTap: widget.onTap,
        child: AnimatedScale(
          scale: _down ? 0.98 : 1,
          duration: const Duration(milliseconds: 110),
          curve: Curves.easeOut,
          child: widget.child,
        ),
      );
}

/// Açılışta yumuşakça dolan ilerleme çubuğu.
class _AnimatedBar extends StatelessWidget {
  final double value; // 0..1
  final Color color;
  const _AnimatedBar({required this.value, required this.color});

  @override
  Widget build(BuildContext context) => TweenAnimationBuilder<double>(
        tween: Tween(begin: 0, end: value.clamp(0.0, 1.0)),
        duration: const Duration(milliseconds: 700),
        curve: Curves.easeOutCubic,
        builder: (context, v, _) => ClipRRect(
          borderRadius: BorderRadius.circular(3),
          child: LinearProgressIndicator(
            value: v,
            minHeight: 5,
            color: color,
            backgroundColor: color.withValues(alpha: 0.15),
          ),
        ),
      );
}

// ── İkonlu meta satırı: soru · süre · katılım tek satırda ──

class _MetaRow extends StatelessWidget {
  final ExamListItem exam;
  const _MetaRow({required this.exam});

  @override
  Widget build(BuildContext context) {
    final style = Theme.of(context).textTheme.bodySmall;
    Widget item(IconData icon, String text) => Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 14, color: style?.color),
            const SizedBox(width: 3),
            Text(text, style: style),
          ],
        );
    return Wrap(
      spacing: AppSpacing.sm + 2,
      children: [
        item(Icons.checklist_rounded, '${exam.questionCount} soru'),
        item(Icons.schedule_rounded, '${exam.durationMinutes} dk'),
        item(Icons.people_alt_outlined, '${exam.participantCount}'),
      ],
    );
  }
}

// ── CANLI: hero kart — sayaç + pencere ilerlemesi + tek CTA ──

class _HeroExamCard extends StatefulWidget {
  final ExamListItem exam;
  final VoidCallback onExpired;
  final Future<void> Function(String path) onOpen;
  const _HeroExamCard(
      {required this.exam, required this.onExpired, required this.onOpen});

  @override
  State<_HeroExamCard> createState() => _HeroExamCardState();
}

class _HeroExamCardState extends State<_HeroExamCard> {
  Timer? _timer;
  Duration _left = Duration.zero;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final left = widget.exam.endAt.difference(DateTime.now());
    if (left.isNegative) {
      _timer?.cancel();
      widget.onExpired(); // pencere kapandı → liste tazelenir, kart Geçmiş'e iner
      return;
    }
    setState(() => _left = left);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final exam = widget.exam;
    final scheme = Theme.of(context).colorScheme;
    final total = exam.endAt.difference(exam.startAt);
    final remainingFrac = total.inSeconds == 0
        ? 0.0
        : _left.inSeconds / total.inSeconds;
    final finished = exam.myAttempt?.status == 'completed';

    final (ctaLabel, ctaPath) = finished
        ? ('Sonucum', '/denemeler/sonuc/${exam.myAttempt!.id}')
        : (
            exam.myAttempt != null ? 'Devam et' : 'Sınavı başlat',
            '/denemeler/${exam.id}',
          );

    return _Pressable(
      onTap: () => widget.onOpen(ctaPath),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.md),
        decoration: BoxDecoration(
          color: scheme.primaryContainer.withValues(alpha: 0.45),
          border: Border.all(color: scheme.primary.withValues(alpha: 0.35)),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                const _Badge('Canlı', color: AppColors.success, dot: true),
                if (exam.isPremium) ...[
                  const SizedBox(width: AppSpacing.xs),
                  _Badge('Premium', color: scheme.tertiary),
                ],
                const Spacer(),
                Text(
                  _countdown(_left),
                  style: TextStyle(
                    fontFeatures: const [FontFeature.tabularFigures()],
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: scheme.primary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(exam.title,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: Theme.of(context)
                    .textTheme
                    .titleMedium
                    ?.copyWith(fontWeight: FontWeight.w600)),
            const SizedBox(height: AppSpacing.xs),
            _MetaRow(exam: exam),
            const SizedBox(height: AppSpacing.sm + 2),
            _AnimatedBar(value: remainingFrac, color: scheme.primary),
            const SizedBox(height: AppSpacing.xs),
            Text('Bitiş ${_hm(exam.endAt)}',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: AppSpacing.sm + 2),
            FilledButton(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                visualDensity: VisualDensity.compact,
              ),
              onPressed: () => widget.onOpen(ctaPath),
              child: Text(ctaLabel),
            ),
          ],
        ),
      ),
    );
  }
}

// ── YAKLAŞAN: takvim bloklu kompakt satır ──

class _UpcomingRow extends StatelessWidget {
  final ExamListItem exam;
  const _UpcomingRow({required this.exam});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final l = exam.startAt.toLocal();
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md, vertical: AppSpacing.sm + 2),
      decoration: BoxDecoration(
        border: Border.all(color: scheme.outlineVariant),
        borderRadius: BorderRadius.circular(AppSpacing.radius),
      ),
      child: Row(
        children: [
          // Takvim bloğu: gün büyük, ay küçük — ham tarih metni yerine.
          SizedBox(
            width: 40,
            child: Column(
              children: [
                Text('${l.day}',
                    style: Theme.of(context)
                        .textTheme
                        .titleMedium
                        ?.copyWith(fontWeight: FontWeight.w700, height: 1.1)),
                Text(_months[l.month - 1],
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.sm + 2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(exam.title,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(context)
                        .textTheme
                        .bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  '${_hm(exam.startAt)} · ${exam.questionCount} soru · ${exam.durationMinutes} dk',
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.xs),
          if (exam.isPremium) ...[
            _Badge('Premium', color: scheme.tertiary),
            const SizedBox(width: AppSpacing.xs),
          ],
          const _Badge('Yakında', color: AppColors.warning),
        ],
      ),
    );
  }
}

// ── GEÇMİŞ: tek satır — Net · % öne çıkar; kartın tamamı tıklanır ──

class _PastRow extends StatelessWidget {
  final ExamListItem exam;
  final AttemptResult? result;
  final Future<void> Function(String path) onOpen;
  const _PastRow({required this.exam, required this.result, required this.onOpen});

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final attended = exam.myAttempt != null;
    final l = exam.startAt.toLocal();

    // Katıldıysa → sonucum; katılmadıysa → sıralama.
    final path = attended
        ? '/denemeler/sonuc/${exam.myAttempt!.id}'
        : '/denemeler/${exam.id}/siralama';

    final subtitle = _subtitle(context, l);

    return _Pressable(
      onTap: () => onOpen(path),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.sm + 2),
        decoration: BoxDecoration(
          border: Border.all(color: scheme.outlineVariant),
          borderRadius: BorderRadius.circular(AppSpacing.radius),
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(exam.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context)
                          .textTheme
                          .bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  const SizedBox(height: 2),
                  subtitle,
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            attended
                ? const _Badge('Katıldın', color: AppColors.success)
                : _Badge('Sona erdi', color: scheme.onSurfaceVariant),
            const SizedBox(width: AppSpacing.xs),
            Icon(Icons.chevron_right_rounded,
                size: 20, color: scheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }

  /// Katıldıysa sonucu öne çıkar (Net kalın + %); yoksa sınav özeti.
  Widget _subtitle(BuildContext context, DateTime l) {
    final small = Theme.of(context).textTheme.bodySmall;
    final r = result;
    if (r != null && r.score != null && exam.questionCount > 0) {
      final pct = (r.correctCount / exam.questionCount * 100).round();
      return Text.rich(
        TextSpan(
          style: small,
          children: [
            const TextSpan(text: 'Net '),
            TextSpan(
              text: r.score!.toStringAsFixed(2),
              style: TextStyle(
                fontWeight: FontWeight.w700,
                color: Theme.of(context).colorScheme.onSurface,
              ),
            ),
            TextSpan(text: ' · %$pct · D${r.correctCount} Y${r.wrongCount}'),
          ],
        ),
      );
    }
    return Text(
      '${l.day} ${_months[l.month - 1]} · ${exam.questionCount} soru · Katılım ${exam.participantCount}'
      '${exam.avgScore != null ? ' · Ort ${exam.avgScore!.toStringAsFixed(2)}' : ''}',
      style: small,
      maxLines: 1,
      overflow: TextOverflow.ellipsis,
    );
  }
}

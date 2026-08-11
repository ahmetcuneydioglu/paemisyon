import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/accent_palette.dart';
import '../../../core/theme/app_colors.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
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
          padding: const EdgeInsets.all(AppSpacing.lg),
          children: const [
            LoadingSkeleton(height: 180),
            SizedBox(height: AppSpacing.lg),
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
          // Yayında deneme yokken de "bana özel deneme" kapısı açık kalır.
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
    Future<void> go(String path, [Object? extra]) async {
      await context.push(path, extra: extra);
      ref.invalidate(examsScreenDataProvider);
    }

    var i = 0;
    final children = <Widget>[
      // Bana özel deneme: randevu beklemeden, müfredat ağırlıklarıyla (madde 3).
      StaggeredReveal(index: i++, child: _PersonalExamCard(onOpen: go)),
      if (list.isEmpty)
        const Padding(
          padding: EdgeInsets.only(top: AppSpacing.xl),
          child: EmptyStateView(
            icon: Icons.event_note_rounded,
            message:
                'Şu an yayında canlı deneme yok.\nYenileri eklendiğinde burada görünecek.',
          ),
        ),
      if (active.isNotEmpty) ...[
        const _SectionHeader('CANLI'),
        for (final e in active)
          StaggeredReveal(
            index: i++,
            child: _HeroExamCard(
              exam: e,
              onExpired: () => ref.invalidate(examsScreenDataProvider),
              onOpen: go,
            ),
          ),
      ],
      if (upcoming.isNotEmpty) ...[
        // En yakın deneme özel karta çıkar: geri sayım + açıklama (kullanıcı
        // isteği) — "Yakında" rozeti yerine sahnenin sahibi olur.
        const _SectionHeader('SIRADAKİ DENEME'),
        StaggeredReveal(
          index: i++,
          child: _NextExamCard(
            exam: upcoming.first,
            onStarted: () => ref.invalidate(examsScreenDataProvider),
          ),
        ),
        if (upcoming.length > 1) ...[
          const _SectionHeader('YAKLAŞAN'),
          for (final e in upcoming.skip(1))
            StaggeredReveal(index: i++, child: _UpcomingRow(exam: e)),
        ],
      ],
      if (ended.isNotEmpty) ...[
        const _SectionHeader('GEÇMİŞ'),
        for (final e in ended)
          StaggeredReveal(
            index: i++,
            child: _PastRow(exam: e, result: mine[e.id], onOpen: go),
          ),
      ],
    ];

    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg, AppSpacing.xs, AppSpacing.lg, AppSpacing.xxl),
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
            AppSpacing.xs, AppSpacing.lg, AppSpacing.xs, AppSpacing.sm),
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
  final Color bg;
  final Color fg;
  final Color? dotColor;
  const _Badge(this.label, {required this.bg, required this.fg, this.dotColor});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            if (dotColor != null) ...[
              PulseDot(color: dotColor!),
              const SizedBox(width: 5),
            ],
            Text(label,
                style: TextStyle(
                    fontSize: 11, fontWeight: FontWeight.w600, color: fg)),
          ],
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
    final pal = AccentPalette.of(context);
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

    return PressableScale(
      onTap: () => widget.onOpen(ctaPath),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: pal.heroBg,
          border: Border.all(color: pal.heroBorder),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                _Badge('Canlı',
                    bg: pal.liveBg, fg: pal.liveFg, dotColor: AppColors.teal400),
                if (exam.isPremium) ...[
                  const SizedBox(width: AppSpacing.xs),
                  _Badge('Premium', bg: pal.proBg, fg: pal.proFg),
                ],
                const Spacer(),
                Text(
                  _countdown(_left),
                  style: TextStyle(
                    fontFeatures: const [FontFeature.tabularFigures()],
                    fontSize: 15,
                    fontWeight: FontWeight.w700,
                    color: pal.accentText,
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
            AnimatedFillBar(value: remainingFrac, color: pal.accent),
            const SizedBox(height: AppSpacing.xs),
            Text('Bitiş ${_hm(exam.endAt)}',
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: AppSpacing.sm + 2),
            FilledButton(
              style: FilledButton.styleFrom(
                minimumSize: const Size.fromHeight(44),
                visualDensity: VisualDensity.compact,
                backgroundColor: pal.accent,
                foregroundColor: Colors.white,
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

// ── BANA ÖZEL: kullanıcı tetiklemeli ağırlıklı deneme (Doc 18 devamı) ──

class _PersonalExamCard extends StatelessWidget {
  final Future<void> Function(String path, [Object? extra]) onOpen;
  const _PersonalExamCard({required this.onOpen});

  Future<void> _pickCount(BuildContext context) async {
    final count = await showModalBottomSheet<int>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.all(AppSpacing.lg),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text('Kaç soruluk olsun?',
                    style: Theme.of(ctx)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700)),
              ),
            ),
            for (final (n, sub) in [
              (25, 'Kısa tur · ~30 dk'),
              (50, 'Yarım format · ~1 saat'),
              (100, 'Gerçek format · ~2 saat'),
            ])
              ListTile(
                leading: const Icon(Icons.checklist_rounded),
                title: Text('$n soru'),
                subtitle: Text(sub),
                onTap: () => Navigator.pop(ctx, n),
              ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
    if (count == null || !context.mounted) return;
    await onOpen('/quiz', {
      'personalExam': true,
      'topicName': 'Kişisel Deneme',
      'mode': 'exam',
      'count': count,
    });
  }

  @override
  Widget build(BuildContext context) {
    final pal = AccentPalette.of(context);
    return PressableScale(
      onTap: () => _pickCount(context),
      child: Container(
        margin: const EdgeInsets.only(
            top: AppSpacing.sm, bottom: AppSpacing.xs),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.sm + 2),
              decoration: BoxDecoration(
                color: pal.accent.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
              child: Icon(Icons.bolt_rounded, color: pal.accent),
            ),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Bana özel deneme',
                      style: Theme.of(context)
                          .textTheme
                          .titleSmall
                          ?.copyWith(fontWeight: FontWeight.w700)),
                  const SizedBox(height: 2),
                  Text(
                    'Randevu bekleme — müfredat ağırlıklarıyla, görmediğin sorulardan. Sıralamaya girmez.',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ],
              ),
            ),
            const SizedBox(width: AppSpacing.xs),
            Icon(Icons.chevron_right_rounded,
                color: Theme.of(context).colorScheme.onSurfaceVariant),
          ],
        ),
      ),
    );
  }
}

// ── SIRADAKİ: geri sayımlı hero kart (kullanıcı isteği) ──
// Başlangıca kalan süre canlı sayılır; süre dolunca liste tazelenir ve
// deneme Canlı bölümüne (başlat CTA'lı hero karta) geçer.

class _NextExamCard extends StatefulWidget {
  final ExamListItem exam;
  final VoidCallback onStarted;
  const _NextExamCard({required this.exam, required this.onStarted});

  @override
  State<_NextExamCard> createState() => _NextExamCardState();
}

class _NextExamCardState extends State<_NextExamCard> {
  Timer? _timer;
  Duration _left = Duration.zero;

  @override
  void initState() {
    super.initState();
    _tick();
    _timer = Timer.periodic(const Duration(seconds: 1), (_) => _tick());
  }

  void _tick() {
    final left = widget.exam.startAt.difference(DateTime.now());
    if (left.isNegative) {
      _timer?.cancel();
      widget.onStarted(); // sınav başladı → liste tazelenir, kart Canlı olur
      return;
    }
    setState(() => _left = left);
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }

  /// Sayaç parçaları: 1 günden uzaksa gün ayrı kutuda gösterilir.
  List<(String value, String label)> get _units {
    final days = _left.inDays;
    final h = _left.inHours % 24;
    final m = _left.inMinutes % 60;
    final s = _left.inSeconds % 60;
    return [
      if (days > 0) ('$days', 'GÜN'),
      (_two(days > 0 ? h : _left.inHours), 'SAAT'),
      (_two(m), 'DAKİKA'),
      (_two(s), 'SANİYE'),
    ];
  }

  @override
  Widget build(BuildContext context) {
    final exam = widget.exam;
    final pal = AccentPalette.of(context);
    final l = exam.startAt.toLocal();
    final desc = exam.description?.trim();

    return Semantics(
      label:
          '${exam.title}, başlamasına ${_left.inHours} saat ${_left.inMinutes % 60} dakika var',
      excludeSemantics: true,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: pal.heroBg,
          border: Border.all(color: pal.heroBorder),
          borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              children: [
                _Badge('Sıradaki', bg: pal.warnBg, fg: pal.warnFg),
                if (exam.isPremium) ...[
                  const SizedBox(width: AppSpacing.xs),
                  _Badge('Premium', bg: pal.proBg, fg: pal.proFg),
                ],
                const Spacer(),
                Text(
                  '${l.day} ${_months[l.month - 1]} · ${_hm(exam.startAt)}',
                  style: Theme.of(context).textTheme.bodySmall,
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
            if (desc != null && desc.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.xs),
              Text(desc,
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.bodySmall),
            ],
            const SizedBox(height: AppSpacing.md),
            // Geri sayım blokları — tabular rakam, birim etiketli.
            Row(
              children: [
                for (final (index, u) in _units.indexed) ...[
                  if (index > 0)
                    Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: AppSpacing.xs),
                      child: Text(':',
                          style: TextStyle(
                              fontSize: 20,
                              fontWeight: FontWeight.w700,
                              color: pal.accentText)),
                    ),
                  Expanded(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          vertical: AppSpacing.sm + 2),
                      decoration: BoxDecoration(
                        color: Theme.of(context)
                            .colorScheme
                            .surface
                            .withValues(alpha: 0.55),
                        borderRadius:
                            BorderRadius.circular(AppSpacing.radiusMd),
                        border: Border.all(color: pal.heroBorder),
                      ),
                      child: Column(
                        children: [
                          Text(u.$1,
                              style: TextStyle(
                                fontFeatures: const [
                                  FontFeature.tabularFigures()
                                ],
                                fontSize: 22,
                                fontWeight: FontWeight.w800,
                                height: 1.1,
                                color: pal.accentText,
                              )),
                          const SizedBox(height: 2),
                          Text(u.$2,
                              style: TextStyle(
                                fontSize: 9,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 0.8,
                                color: Theme.of(context)
                                    .colorScheme
                                    .onSurfaceVariant,
                              )),
                        ],
                      ),
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: AppSpacing.sm + 2),
            _MetaRow(exam: exam),
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
    final pal = AccentPalette.of(context);
    final l = exam.startAt.toLocal();
    return Container(
      margin: const EdgeInsets.only(bottom: AppSpacing.sm),
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.sm + 2),
      decoration: BoxDecoration(
        border: Border.all(color: scheme.outlineVariant),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
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
            _Badge('Premium', bg: pal.proBg, fg: pal.proFg),
            const SizedBox(width: AppSpacing.xs),
          ],
          _Badge('Yakında', bg: pal.warnBg, fg: pal.warnFg),
        ],
      ),
    );
  }
}

// ── GEÇMİŞ: tek satır — Net · % öne çıkar; kartın tamamı tıklanır ──

class _PastRow extends StatelessWidget {
  final ExamListItem exam;
  final AttemptResult? result;
  final Future<void> Function(String path, [Object? extra]) onOpen;
  const _PastRow({required this.exam, required this.result, required this.onOpen});

  /// Geçmiş deneme artık ölü değil (arşiv modu): dokunuş seçenek sunar —
  /// sonuç/sıralama + "Arşivde çöz" (sabit set, süreli, sıralamasız pratik).
  Future<void> _openSheet(BuildContext context) async {
    final attended = exam.myAttempt != null;
    await showModalBottomSheet<void>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(
                  AppSpacing.lg, AppSpacing.lg, AppSpacing.lg, AppSpacing.xs),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(exam.title,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: Theme.of(ctx)
                        .textTheme
                        .titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700)),
              ),
            ),
            ListTile(
              leading: const Icon(Icons.replay_rounded),
              title: Text(attended ? 'Arşivde tekrar çöz' : 'Arşivde çöz'),
              subtitle: const Text(
                  'Aynı sorular, aynı süre — sıralamaya girmez, pratik sayılır.'),
              onTap: () {
                Navigator.pop(ctx);
                onOpen('/quiz', {
                  'archiveExamId': exam.id,
                  'topicName': exam.title,
                  'mode': 'exam',
                });
              },
            ),
            if (attended)
              ListTile(
                leading: const Icon(Icons.assessment_outlined),
                title: const Text('Sonucum'),
                onTap: () {
                  Navigator.pop(ctx);
                  onOpen('/denemeler/sonuc/${exam.myAttempt!.id}');
                },
              ),
            ListTile(
              leading: const Icon(Icons.emoji_events_outlined),
              title: const Text('Sıralama'),
              onTap: () {
                Navigator.pop(ctx);
                onOpen('/denemeler/${exam.id}/siralama');
              },
            ),
            const SizedBox(height: AppSpacing.sm),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    final pal = AccentPalette.of(context);
    final attended = exam.myAttempt != null;
    final l = exam.startAt.toLocal();

    final subtitle = _subtitle(context, l);

    return PressableScale(
      onTap: () => _openSheet(context),
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.sm + 2),
        decoration: BoxDecoration(
          border: Border.all(color: scheme.outlineVariant),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
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
                ? _Badge('Katıldın', bg: pal.liveBg, fg: pal.liveFg)
                : _Badge('Sona erdi',
                    bg: scheme.onSurfaceVariant.withValues(alpha: 0.12),
                    fg: scheme.onSurfaceVariant),
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

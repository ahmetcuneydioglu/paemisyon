import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/accent_palette.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/focus_sheet.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../../../shared/widgets/rank_insignia.dart';
import '../../../shared/widgets/session_button.dart';
import '../../../shared/widgets/streak_badge.dart';
import '../../coach/data/coach_repository.dart';
import '../../coach/domain/coach_models.dart';

/// Kişisel Koç ana ekranı (Doc 19 §4). Dashboard DEĞİL: "bugün benim için
/// ne var?" sorusunun cevabı. Kartlar SUNUCUDAN gelir; bu ekran hiçbir kural
/// bilmez — yalnız çizer ve dokunuşu yönlendirir. Tek istek: GET /me/coach.
class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final brief = ref.watch(coachBriefProvider);

    // İlk giriş: hedef sınav seçilmemişse onboarding'e götür (Doc 11 §2).
    ref.listen(coachBriefProvider, (prev, next) {
      final b = next.valueOrNull;
      if (b != null && !b.onboardingCompleted) context.go('/onboarding');
    });

    return Scaffold(
      appBar: AppBar(
        title: const Text('Paemisyon'),
        actions: [
          IconButton(
            tooltip: 'Profil & Ayarlar',
            icon: const Icon(Icons.person_rounded),
            onPressed: () => context.push('/profile'),
          ),
        ],
      ),
      body: brief.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.xl),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              LoadingSkeleton(height: 28, width: 200),
              SizedBox(height: AppSpacing.lg),
              LoadingSkeleton(height: 130),
              SizedBox(height: AppSpacing.lg),
              LoadingSkeleton(height: 72),
              SizedBox(height: AppSpacing.sm),
              LoadingSkeleton(height: 72),
              SizedBox(height: AppSpacing.sm),
              LoadingSkeleton(height: 72),
            ],
          ),
        ),
        error: (err, _) => ErrorStateView(
          message: err is Failure ? err.message : 'Koç ekranı yüklenemedi.',
          onRetry: () => ref.invalidate(coachBriefProvider),
        ),
        data: (b) => RefreshIndicator(
          onRefresh: () async => ref.invalidate(coachBriefProvider),
          child: _CoachBody(brief: b),
        ),
      ),
    );
  }
}

class _CoachBody extends ConsumerWidget {
  final CoachBrief brief;
  const _CoachBody({required this.brief});

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 6) return 'İyi geceler';
    if (h < 12) return 'Günaydın';
    if (h < 18) return 'İyi günler';
    return 'İyi akşamlar';
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final pal = AccentPalette.of(context);
    final name = (brief.displayName?.trim().isNotEmpty ?? false)
        ? brief.displayName!.trim()
        : null;

    // "Bugün Çalış" = KOÇ SEANSI (Doc 25 §5): kapsamsız practice —
    // karışımı sunucu kurar (%40 zayıf + %25 yanlış + %35 yeni; sınav
    // modunda tersine). Deneme günü hero denemeye götürür.
    Future<void> openCoachSession() async {
      final remaining = brief.goal - brief.answered;
      final count = brief.mode == 'streak_risk'
          ? 5 // mini seans: seri kurtarmaya 5 soru yeter
          : remaining.clamp(5, 20);
      await context.push('/quiz', extra: {
        'topicName': 'Koç Seansı',
        'mode': 'practice',
        'count': count,
      });
      ref.invalidate(coachBriefProvider);
    }

    // Kart/CTA dokunuşu: rotaya git, dönünce brief'i tazele (yaşayan ekran).
    Future<void> open(String type, String route,
        [Map<String, dynamic> meta = const {}]) async {
      switch (type) {
        case 'daily_quiz':
          await context.push('/quiz', extra: {
            'topicName': 'Günün Quizi',
            'mode': 'daily',
            'count': meta['count'] as int? ?? 10,
          });
        case 'weak_topic':
          await context.push('/quiz', extra: {
            'topicId': meta['topicId'] as String?,
            'topicName': meta['topicName'] as String? ?? 'Güçlendirme',
            'mode': 'practice',
            'count': 10,
          });
        default:
          await context.push(route);
      }
      ref.invalidate(coachBriefProvider);
    }

    var i = 0;
    return ListView(
      padding: const EdgeInsets.fromLTRB(
          AppSpacing.lg, AppSpacing.xs, AppSpacing.lg, AppSpacing.xxl),
      children: [
        // ── Selam + seri chip'i ──
        StaggeredReveal(
          index: i++,
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      name != null ? '$_greeting, $name' : _greeting,
                      style: theme.textTheme.headlineSmall,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                    if (brief.preferredModuleName != null) ...[
                      const SizedBox(height: 2),
                      Text('Hedef: ${brief.preferredModuleName}',
                          style: theme.textTheme.bodySmall),
                    ],
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  if (brief.streakCurrent > 0)
                    StreakBadge(
                      days: brief.streakCurrent,
                      atRisk: brief.streakAtRisk,
                    ),
                  // Sınav geri sayımı (Doc 25 §3: exam_mode/taper pili).
                  if (brief.daysToExam != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    _ExamCountdownPill(days: brief.daysToExam!),
                  ],
                ],
              ),
            ],
          ),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Bugün hero'su: hedef halkası + Bugün Çalış + Odak ucu (Doc 25 §5) ──
        StaggeredReveal(
          index: i++,
          child: _TodayHero(
            brief: brief,
            pal: pal,
            onPrimary: () => brief.mode == 'exam_day'
                ? open(
                    brief.primaryActionType,
                    brief.primaryAction.route,
                    brief.cards.isNotEmpty ? brief.cards.first.meta : const {},
                  )
                : openCoachSession(),
            onFocusTap: () async {
              // "Nereye bakılacağını kullanıcı, neye bakılacağını koç seçer."
              final choice = await showFocusSheet(
                context,
                selectedId: 'coach',
                options: const [
                  FocusOption(
                      id: 'coach', label: 'Koç seçsin', subtitle: 'önerilen'),
                  FocusOption(
                      id: 'course',
                      label: 'Ders / konu seç',
                      drillsDown: true),
                  FocusOption(id: 'wrongs', label: 'Sadece yanlışlarım'),
                ],
              );
              if (choice == null || !context.mounted) return;
              switch (choice) {
                case 'course':
                  await open('default', '/catalog');
                case 'wrongs':
                  await open('default', '/review');
                default: // koç seçsin → karışım motorlu koç seansı
                  await openCoachSession();
              }
            },
          ),
        ),
        const SizedBox(height: AppSpacing.sm),

        // ── Koç kartları: "bugün senin için" ──
        StaggeredReveal(index: i++, child: const _SectionHeader('BUGÜN SENİN İÇİN')),
        for (final card in brief.cards)
          StaggeredReveal(
            index: i++,
            child: _CoachCardTile(
              card: card,
              pal: pal,
              onTap: card.cta != null || card.type == 'daily_quiz'
                  ? () => open(card.type, card.cta?.route ?? '/catalog', card.meta)
                  : null,
            ),
          ),

        // ── Rütbe arması (Doc 24 §5): meslek diliyle ilerleme ──
        if (brief.rank != null) ...[
          const SizedBox(height: AppSpacing.xs),
          StaggeredReveal(
            index: i++,
            child: RankInsignia(
              level: brief.rank!.level,
              name: brief.rank!.name,
              score: brief.rank!.score,
              progressToNext: brief.rank!.progressToNext,
              nextName: brief.rank!.next?.name,
              pointsToNext: brief.rank!.next != null
                  ? brief.rank!.next!.minScore - brief.rank!.score
                  : null,
            ),
          ),
        ],

        // ── Rozet rafı: sıradaki rozet ilerlemesi ──
        if (brief.nextBadge != null) ...[
          const SizedBox(height: AppSpacing.xs),
          StaggeredReveal(
            index: i++,
            child: _NextBadgeTile(badge: brief.nextBadge!, pal: pal),
          ),
        ],
        const SizedBox(height: AppSpacing.lg),

        // ── Kompakt istatistik şeridi (detay → İlerlemem) ──
        StaggeredReveal(
          index: i++,
          child: _StatsStrip(brief: brief),
        ),
        const SizedBox(height: AppSpacing.lg),

        // ── Hızlı erişim ──
        StaggeredReveal(
          index: i++,
          child: Row(
            children: [
              _QuickAction(
                icon: Icons.menu_book_rounded,
                label: 'Çalış',
                onTap: () => open('default', '/catalog'),
              ),
              const SizedBox(width: AppSpacing.sm),
              _QuickAction(
                icon: Icons.edit_note_rounded,
                label: 'Denemeler',
                onTap: () => open('default', '/denemeler'),
              ),
              const SizedBox(width: AppSpacing.sm),
              _QuickAction(
                icon: Icons.insights_rounded,
                label: 'İlerlemem',
                onTap: () => open('default', '/progress'),
              ),
              const SizedBox(width: AppSpacing.sm),
              _QuickAction(
                icon: Icons.emoji_events_rounded,
                label: 'Sıralama',
                onTap: () => open('default', '/leaderboard'),
              ),
            ],
          ),
        ),

        // ── Premium CTA (yalnızca free) ──
        if (!brief.isPremium) ...[
          const SizedBox(height: AppSpacing.lg),
          StaggeredReveal(
            index: i++,
            child: PressableScale(
              onTap: () => open('default', '/paywall'),
              child: Container(
                padding: const EdgeInsets.symmetric(
                    horizontal: AppSpacing.lg, vertical: AppSpacing.sm + 2),
                decoration: BoxDecoration(
                  color: pal.proBg,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
                ),
                child: Row(
                  children: [
                    Icon(Icons.workspace_premium_rounded, color: pal.proFg),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Sınırsız soru için Premium',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  color: pal.proFg)),
                          Text('Günlük sınırı kaldır, tüm içeriğe eriş.',
                              style:
                                  TextStyle(fontSize: 12, color: pal.proFg)),
                        ],
                      ),
                    ),
                    Icon(Icons.chevron_right_rounded, color: pal.proFg),
                  ],
                ),
              ),
            ),
          ),
        ],
      ],
    );
  }
}

// ── Sınav geri sayım pili (Doc 25 §3) ──

class _ExamCountdownPill extends StatelessWidget {
  final int days;
  const _ExamCountdownPill({required this.days});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final label = days == 0 ? 'Bugün sınav günü' : 'Sınava $days gün';
    return Semantics(
      label: label,
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.md, vertical: AppSpacing.xs + 2),
        decoration: BoxDecoration(
          color: tokens.brand.withValues(alpha: 0.10),
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.event_rounded, size: 13, color: tokens.brand),
            const SizedBox(width: AppSpacing.xs),
            Text(label,
                style: AppTypography.label.copyWith(color: tokens.brand)),
          ],
        ),
      ),
    );
  }
}

// ── Bugün hero'su ──

class _TodayHero extends StatelessWidget {
  final CoachBrief brief;
  final AccentPalette pal;
  final VoidCallback onPrimary;
  final VoidCallback onFocusTap;
  const _TodayHero(
      {required this.brief,
      required this.pal,
      required this.onPrimary,
      required this.onFocusTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final remaining = brief.goal - brief.answered;
    final headline = remaining > 0
        ? 'Bugünkü hedefine $remaining soru kaldı'
        : 'Bugünkü hedefini tamamladın 🎉';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: pal.heroBg,
        border: Border.all(color: pal.heroBorder),
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
      ),
      child: Row(
        children: [
          AnimatedGoalRing(
            value: brief.goal > 0 ? brief.answered / brief.goal : 0,
            color: pal.accent,
            center: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('${brief.answered}/${brief.goal}',
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w700, height: 1.1)),
                Text('soru', style: theme.textTheme.labelSmall),
              ],
            ),
          ),
          const SizedBox(width: AppSpacing.lg),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(headline,
                    style: theme.textTheme.titleSmall
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 2),
                Text(
                  'Bu hafta ${brief.weeklyActiveDays}/${brief.weeklyGoalDays} aktif gün',
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: AppSpacing.sm),
                SessionButton(
                  label: brief.primaryAction.label,
                  onPressed: onPrimary,
                  focusLabel: 'Odak: Koç seçiyor',
                  onFocusTap: onFocusTap,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
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

// ── Koç kartı: ikon + başlık + gövde + hafif CTA ──

class _CoachCardTile extends StatelessWidget {
  final CoachCard card;
  final AccentPalette pal;
  final VoidCallback? onTap;
  const _CoachCardTile({required this.card, required this.pal, this.onTap});

  (IconData, Color) _visual(BuildContext context) {
    final scheme = Theme.of(context).colorScheme;
    return switch (card.type) {
      'exam_live' => (Icons.sensors_rounded, pal.liveFg),
      'exam_in_progress' => (Icons.play_circle_outline_rounded, pal.accentText),
      'exam_today' => (Icons.event_available_rounded, pal.accentText),
      'new_exam' => (Icons.fiber_new_rounded, pal.accentText),
      'streak_risk' => (Icons.local_fire_department_rounded, pal.warnFg),
      'goal_remaining' => (Icons.flag_rounded, pal.accentText),
      'quick_review' => (Icons.refresh_rounded, pal.liveFg),
      'weak_topic' => (Icons.trending_down_rounded, pal.warnFg),
      'course_trend' => (Icons.trending_up_rounded, pal.liveFg),
      'daily_quiz' => (Icons.today_rounded, pal.accentText),
      'badge_near' => (Icons.military_tech_rounded, pal.proFg),
      'comeback' => (Icons.waving_hand_rounded, pal.warnFg),
      'exam_mode' => (Icons.shield_moon_rounded, pal.accentText),
      'taper' => (Icons.self_improvement_rounded, pal.liveFg),
      'slump_watch' => (Icons.spa_rounded, pal.warnFg),
      _ => (Icons.auto_awesome_rounded, scheme.onSurfaceVariant),
    };
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final (icon, color) = _visual(context);

    return PressableScale(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: AppSpacing.sm),
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.sm + 2),
        decoration: BoxDecoration(
          border: Border.all(color: theme.colorScheme.outlineVariant),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Row(
          children: [
            Icon(icon, size: 22, color: color),
            const SizedBox(width: AppSpacing.sm + 2),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(card.title,
                      style: theme.textTheme.bodyMedium
                          ?.copyWith(fontWeight: FontWeight.w600)),
                  if (card.body != null && card.body!.isNotEmpty) ...[
                    const SizedBox(height: 1),
                    Text(card.body!,
                        style: theme.textTheme.bodySmall,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis),
                  ],
                ],
              ),
            ),
            if (card.cta != null) ...[
              const SizedBox(width: AppSpacing.xs),
              Text(card.cta!.label,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: pal.accentText)),
            ],
          ],
        ),
      ),
    );
  }
}

// ── Rozet rafı ──

class _NextBadgeTile extends StatelessWidget {
  final NextBadge badge;
  final AccentPalette pal;
  const _NextBadgeTile({required this.badge, required this.pal});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.lg, vertical: AppSpacing.sm + 2),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        children: [
          Icon(Icons.military_tech_rounded, size: 22, color: pal.proFg),
          const SizedBox(width: AppSpacing.sm + 2),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('${badge.name} rozeti · ${badge.progress}/${badge.target}',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600)),
                const SizedBox(height: 6),
                AnimatedFillBar(
                  value: badge.target > 0 ? badge.progress / badge.target : 0,
                  color: pal.proFg,
                  height: 4,
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Kompakt istatistik şeridi ──

class _StatsStrip extends StatelessWidget {
  final CoachBrief brief;
  const _StatsStrip({required this.brief});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    Widget cell(String value, String label, {bool divider = true}) => Expanded(
          child: Container(
            decoration: divider
                ? BoxDecoration(
                    border: Border(
                        right:
                            BorderSide(color: theme.colorScheme.outlineVariant)))
                : null,
            child: Column(
              children: [
                Text(value, style: theme.textTheme.titleMedium),
                const SizedBox(height: 2),
                Text(label, style: theme.textTheme.bodySmall),
              ],
            ),
          ),
        );

    return Container(
      padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm + 2),
      decoration: BoxDecoration(
        border: Border.all(color: theme.colorScheme.outlineVariant),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      ),
      child: Row(
        children: [
          cell('${brief.totalSolved}', 'Çözülen'),
          cell('%${brief.accuracy}', 'Doğruluk'),
          cell('${brief.totalSessions}', 'Oturum', divider: false),
        ],
      ),
    );
  }
}

// ── Hızlı erişim ──

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction(
      {required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Expanded(
      child: PressableScale(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm + 4),
          decoration: BoxDecoration(
            border: Border.all(color: theme.colorScheme.outlineVariant),
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          child: Column(
            children: [
              Icon(icon, color: theme.colorScheme.primary, size: 22),
              const SizedBox(height: AppSpacing.xs),
              Text(label,
                  style: const TextStyle(fontSize: 12),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis),
            ],
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/error/failure.dart';
import '../../../core/notifications/notification_service.dart';
import '../../../core/notifications/push_service.dart';
import '../../../core/theme/accent_palette.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/activity_heat_strip.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/focus_sheet.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../../../shared/widgets/micro_interactions.dart';
import '../../../shared/widgets/rank_insignia.dart';
import '../../../shared/widgets/streak_badge.dart';
import '../../catalog/presentation/focus_drilldown_sheet.dart';
import '../../coach/data/coach_repository.dart';
import '../../coach/domain/coach_models.dart';
import '../../progress/data/progress_repository.dart';
import '../data/me_repository.dart';
import '../../quiz/data/quiz_repository.dart';
import '../../quiz/domain/quiz_models.dart';

/// Tek seferlik bildirim daveti — oturum içinde ve cihazda bir kez.
bool _reminderOfferInFlight = false;
Future<void> _maybeOfferReminder(BuildContext context, WidgetRef ref) async {
  if (_reminderOfferInFlight) return;
  _reminderOfferInFlight = true;
  const kFlag = 'notif_offer_shown_v1';
  final prefs = await SharedPreferences.getInstance();
  if (prefs.getBool(kFlag) == true ||
      ref.read(reminderSettingsProvider).enabled) {
    return; // zaten soruldu ya da açık
  }
  await prefs.setBool(kFlag, true); // bir kez — reddedene ısrar yok
  if (!context.mounted) return;
  final accept = await showModalBottomSheet<bool>(
    context: context,
    showDragHandle: true,
    builder: (ctx) => SafeArea(
      child: Padding(
        padding: const EdgeInsets.fromLTRB(
            AppSpacing.xl, 0, AppSpacing.xl, AppSpacing.xl),
        child: Column(mainAxisSize: MainAxisSize.min, children: [
          Icon(Icons.notifications_active_rounded,
              size: 40, color: ctx.tokens.brand),
          const SizedBox(height: AppSpacing.md),
          Text('Günün sorusu her akşam cebine gelsin mi?',
              textAlign: TextAlign.center,
              style: AppTypography.heading.copyWith(color: ctx.tokens.ink)),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Her akşam 19.00\'da tek soruluk kısa bir hatırlatma — '
            'serin kopmasın. Saatini Ayarlar\'dan değiştirebilirsin.',
            textAlign: TextAlign.center,
            style: AppTypography.body.copyWith(color: ctx.tokens.inkSoft),
          ),
          const SizedBox(height: AppSpacing.lg),
          SizedBox(
            width: double.infinity,
            child: FilledButton(
                onPressed: () => Navigator.pop(ctx, true),
                child: const Text('Bildirimleri Aç')),
          ),
          TextButton(
              onPressed: () => Navigator.pop(ctx, false),
              child: const Text('Şimdi değil')),
        ]),
      ),
    ),
  );
  if (accept == true) {
    final ok =
        await ref.read(reminderSettingsProvider.notifier).setEnabled(true);
    if (!ok && context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
          content: Text(
              'Bildirim izni verilmedi — Ayarlar > Bildirimler\'den açabilirsin.')));
    }
  }
}

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
      // Bildirim senkronu (P1-7 + Faz 1): her açılışta 5 günlük pencere
      // tazelenir (günün sorusu özetleri çekilir); hedef dolduysa bugünkü
      // bildirim atlanır — koç, işini bitirmiş kullanıcıyı akşam dürtmez.
      if (b != null) {
        ref.read(reminderSettingsProvider.notifier).syncWithGoal(
            goalMetToday: b.goal > 0 && b.answered >= b.goal);
        // Tek seferlik izin daveti: kullanıcı ayarları keşfetmek zorunda
        // kalmasın — koç ekrana ilk gelişte nazikçe sorar (reddedilirse bir
        // daha çıkmaz; ayarlardan her zaman açılabilir).
        _maybeOfferReminder(context, ref);
        // FCM token kaydı (Faz 2) — idempotent; yapılandırma yoksa sessiz.
        ref.read(pushServiceProvider).register();
      }
    });

    return Scaffold(
      // Profil ikonu kaldırıldı (Doc 28 P1-6): "Ben" artık bottom tab'da.
      appBar: AppBar(title: const Text('Paemisyon')),
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
        case 'quick_review':
        case 'exam_mode' when route == '/review':
          // Yanlış tekrarı artık gerçek reçeteye gider (Doc 28 P0-⑤):
          // liste değil, doğrudan review seansı.
          await context.push('/quiz', extra: {
            'topicName': 'Yanlış Turu',
            'mode': 'review',
            'count': (meta['wrongCount'] as int?)?.clamp(1, 20) ?? 10,
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
                  // Seri sigortası (Doc 24 §7.2): risk anında güven verir.
                  if (brief.streakAtRisk && brief.freezesLeft > 0) ...[
                    const SizedBox(height: AppSpacing.xs),
                    _FreezePill(count: brief.freezesLeft),
                  ],
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

        // ── Devam eden seans çapası (Doc 28 P0-②): kayıp iş = kayıp güven ──
        Consumer(builder: (context, ref, _) {
          final active = ref.watch(activeSessionProvider).valueOrNull;
          if (active == null) return const SizedBox.shrink();
          return Padding(
            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
            child: StaggeredReveal(
              index: i,
              child: _ActiveSessionCard(
                active: active,
                onResume: () async {
                  if (active.resumable) {
                    await context.push('/quiz', extra: {
                      'resumeSessionId': active.sessionId,
                      'topicName': active.scopeName ?? 'Seans',
                      'mode': active.mode,
                    });
                  } else {
                    // Eski oturum (soru sırası kayıtsız) — bitir, sonucu gör.
                    final result = await ref
                        .read(quizRepositoryProvider)
                        .complete(active.sessionId);
                    if (context.mounted) {
                      await context.push('/quiz/result', extra: result);
                    }
                  }
                  ref.invalidate(activeSessionProvider);
                  ref.invalidate(coachBriefProvider);
                },
              ),
            ),
          );
        }),

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
                  // Gerçek drill-down (Doc 28 P2-17): katalog ekranına
                  // fırlatma yok — ders → konu inişi aynı sheet akışında.
                  final target = await showFocusDrillDown(
                    context,
                    moduleId:
                        ref.read(meProvider).valueOrNull?.preferredModuleId,
                  );
                  if (target == null || !context.mounted) return;
                  await context.push('/quiz', extra: {
                    'topicId': target.topicId,
                    'courseId': target.courseId,
                    'topicName': target.name,
                    'mode': 'practice',
                    'count': 10,
                  });
                  ref.invalidate(coachBriefProvider);
                case 'wrongs':
                  await open('quick_review', '/review');
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

        // ── Nöbet çizelgesi (Doc 28 P1-10): son 7 gün, boş gün suçlanmaz ──
        Consumer(builder: (context, ref, _) {
          final activity = ref.watch(activityProvider(14)).valueOrNull;
          if (activity == null || activity.isEmpty) {
            return const SizedBox.shrink();
          }
          return Padding(
            padding: const EdgeInsets.only(top: AppSpacing.xs),
            child: Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: context.tokens.surface,
                border: Border.all(color: context.tokens.line),
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
              child: ActivityHeatStrip(
                singleRow: true,
                days: [
                  for (final d in activity)
                    (date: d.date, count: d.questionsAnswered),
                ],
              ),
            ),
          );
        }),
        const SizedBox(height: AppSpacing.xs),

        // ── Haftalık fotoğraf (Doc 27 B dilimi): ders bazlı mastery değişimi ──
        if (brief.weeklyPhoto.isNotEmpty) ...[
          const SizedBox(height: AppSpacing.xs),
          StaggeredReveal(
            index: i++,
            child: _WeeklyPhotoCard(
              rows: brief.weeklyPhoto,
              onTap: () => open('default', '/progress'),
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

        // Hızlı erişim satırı kaldırıldı (Doc 28 P1-6): bölgeler artık
        // bottom tab'da yaşıyor — Bugün sadeleşti, ekran koça kaldı.

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

// ── Devam eden seans kartı (Doc 28 P0-②) ──

class _ActiveSessionCard extends StatelessWidget {
  final ActiveSession active;
  final VoidCallback onResume;
  const _ActiveSessionCard({required this.active, required this.onResume});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return InkWell(
      onTap: onResume,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        decoration: BoxDecoration(
          color: tokens.accentSession.withValues(alpha: 0.10),
          border: Border.all(color: tokens.accentSession),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        ),
        child: Row(
          children: [
            Icon(Icons.pause_circle_rounded,
                size: 26, color: tokens.accentSession),
            const SizedBox(width: AppSpacing.md),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Yarım kalan seansın var'
                    '${active.scopeName != null ? ' · ${active.scopeName}' : ''}',
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: AppTypography.label.copyWith(color: tokens.ink),
                  ),
                  Text(
                    active.resumable
                        ? '${active.answeredCount}/${active.totalQuestions} çözüldü — kaldığın yerden devam et'
                        : '${active.answeredCount}/${active.totalQuestions} çözüldü — bitir, sonucunu gör',
                    style:
                        AppTypography.caption.copyWith(color: tokens.inkSoft),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right_rounded, color: tokens.inkSoft),
          ],
        ),
      ),
    );
  }
}

// ── Seri sigortası pili (Doc 24 §7.2) ──

class _FreezePill extends StatelessWidget {
  final int count;
  const _FreezePill({required this.count});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Semantics(
      label: '$count seri sigortası hakkın var',
      excludeSemantics: true,
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.sm, vertical: AppSpacing.xs),
        decoration: BoxDecoration(
          color: tokens.success.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        ),
        child: Text('🛡 sigorta hazır ($count)',
            style: AppTypography.caption.copyWith(color: tokens.success)),
      ),
    );
  }
}

// ── Haftalık fotoğraf kartı (Doc 27): ders bazlı Δ listesi ──

class _WeeklyPhotoCard extends StatelessWidget {
  final List<WeeklyPhotoRow> rows;
  final VoidCallback onTap;
  const _WeeklyPhotoCard({required this.rows, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final shown = rows.take(4).toList();
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
      child: Container(
        padding: const EdgeInsets.symmetric(
            horizontal: AppSpacing.lg, vertical: AppSpacing.md),
        decoration: BoxDecoration(
          border: Border.all(color: tokens.line),
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          color: tokens.surface,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.photo_camera_rounded,
                    size: 18, color: tokens.brand),
                const SizedBox(width: AppSpacing.sm),
                Text('HAFTALIK FOTOĞRAF',
                    style:
                        AppTypography.caption.copyWith(color: tokens.inkSoft)),
                const Spacer(),
                Icon(Icons.chevron_right_rounded,
                    size: 18, color: tokens.inkSoft),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            for (final r in shown)
              Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.xs),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(r.courseName,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: AppTypography.body
                              .copyWith(color: tokens.ink, fontSize: 13)),
                    ),
                    Text(
                      '${r.deltaPct > 0 ? '▲' : '▼'} %${r.deltaPct.abs()}',
                      style: AppTypography.label.copyWith(
                        color:
                            r.deltaPct >= 0 ? tokens.success : tokens.danger,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
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

  // Marka dünyası (icon/splash/intro ile aynı) — hero tek vitrin kartıdır.
  static const _navyTop = Color(0xFF27548F);
  static const _navyMid = Color(0xFF1B3A6B);
  static const _navyDeep = Color(0xFF122A52);
  static const _amber = Color(0xFFF3A93C);
  static const _teal = Color(0xFF2FC493);
  static const _softInk = Color(0xFF9FB6D6);

  @override
  Widget build(BuildContext context) {
    final remaining = brief.goal - brief.answered;
    final done = brief.goal > 0 && remaining <= 0;
    final headline = done
        ? 'Bugünkü hedef tamam 🎉'
        : 'Hedefe $remaining soru kaldı';

    return Container(
      padding: const EdgeInsets.all(AppSpacing.xl),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(AppSpacing.radiusLg + 4),
        gradient: const LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [_navyTop, _navyMid, _navyDeep],
          stops: [0, .55, 1],
        ),
        boxShadow: [
          BoxShadow(
            color: _navyDeep.withValues(alpha: .35),
            blurRadius: 24,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              AnimatedGoalRing(
                size: 84,
                value: brief.goal > 0 ? brief.answered / brief.goal : 0,
                color: done ? _teal : _amber,
                center: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text('${brief.answered}/${brief.goal}',
                        style: AppTypography.heading.copyWith(
                            color: Colors.white, height: 1.05)),
                    Text('soru',
                        style:
                            AppTypography.caption.copyWith(color: _softInk)),
                  ],
                ),
              ),
              const SizedBox(width: AppSpacing.lg),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(headline,
                        style: AppTypography.heading
                            .copyWith(color: Colors.white)),
                    const SizedBox(height: AppSpacing.sm),
                    // Haftalık ritim: gün noktaları — "4/5 aktif gün" GÖRSEL.
                    Row(
                      children: [
                        for (var i = 0; i < brief.weeklyGoalDays; i++)
                          Container(
                            width: 10,
                            height: 10,
                            margin: const EdgeInsets.only(right: 5),
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              color: i < brief.weeklyActiveDays
                                  ? _teal
                                  : Colors.transparent,
                              border: i < brief.weeklyActiveDays
                                  ? null
                                  : Border.all(
                                      color: Colors.white
                                          .withValues(alpha: .35)),
                            ),
                          ),
                        const SizedBox(width: AppSpacing.xs),
                        Text(
                          '${brief.weeklyActiveDays}/${brief.weeklyGoalDays} aktif gün',
                          style: AppTypography.caption
                              .copyWith(color: _softInk),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: AppSpacing.lg),
          // Ana eylem: navy üstünde amber — vitrin CTA'sı.
          SizedBox(
            height: 52,
            child: FilledButton(
              onPressed: onPrimary,
              style: FilledButton.styleFrom(
                backgroundColor: _amber,
                foregroundColor: _navyDeep,
                textStyle: AppTypography.label
                    .copyWith(fontSize: 16, fontWeight: FontWeight.w800),
                shape: RoundedRectangleBorder(
                    borderRadius:
                        BorderRadius.circular(AppSpacing.radiusMd + 2)),
              ),
              child: Text(brief.primaryAction.label),
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          // Odak ucu: cam rozet — "nereye bakılacağını sen seçersin".
          Center(
            child: Semantics(
              button: true,
              label: 'Odak: Koç seçiyor — odak seç',
              child: Material(
                color: Colors.white.withValues(alpha: .10),
                borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                child: InkWell(
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                  onTap: onFocusTap,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(
                        horizontal: AppSpacing.lg, vertical: AppSpacing.sm),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.center_focus_strong_rounded,
                            size: 16, color: _amber),
                        const SizedBox(width: AppSpacing.xs),
                        Text('Odak: Koç seçiyor',
                            style: AppTypography.caption.copyWith(
                                color: Colors.white,
                                fontWeight: FontWeight.w600)),
                        const Icon(Icons.expand_more_rounded,
                            size: 18, color: _softInk),
                      ],
                    ),
                  ),
                ),
              ),
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
      'onboarding' => (Icons.flag_rounded, pal.accentText),
      'post_exam' => (Icons.hourglass_bottom_rounded, pal.accentText),
      'aftermath' => (Icons.favorite_rounded, pal.liveFg),
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
      child: Column(
        children: [
          Row(
            children: [
              cell('${brief.totalSolved}', 'Çözülen'),
              cell('%${brief.accuracy}', 'Doğruluk'),
              cell('${brief.totalSessions}', 'Oturum', divider: false),
            ],
          ),
          // Rekorlar (gamification.records) — web'le eş bilgi (Doc 28 P0-③).
          if (brief.records != null) ...[
            const SizedBox(height: AppSpacing.sm),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Text(
                [
                  if (brief.records!.bestNet != null)
                    'En iyi net ${brief.records!.bestNet!.toStringAsFixed(2)}',
                  'en uzun seri ${brief.records!.longestStreak} gün',
                  'günde en çok ${brief.records!.maxDailyQuestions} soru',
                ].join(' · '),
                textAlign: TextAlign.center,
                style: theme.textTheme.bodySmall,
              ),
            ),
          ],
        ],
      ),
    );
  }
}


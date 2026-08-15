import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/error/failure.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/error_state.dart';
import '../../../shared/widgets/loading_skeleton.dart';
import '../data/mevzuat_repository.dart';
import 'toc_sheet.dart';

/// Mevzuat detayı (Doc 29 §8 üst blok): kimlik + güncellik + kaynak +
/// okumaya başla / içindekiler / quiz köprüsü.
class LegislationDetailScreen extends ConsumerWidget {
  final String slug;
  const LegislationDetailScreen({super.key, required this.slug});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final tokens = context.tokens;
    final detail = ref.watch(legislationDetailProvider(slug));

    return Scaffold(
      appBar: AppBar(title: Text(detail.valueOrNull?.shortName ?? 'Mevzuat')),
      body: detail.when(
        loading: () => const Padding(
          padding: EdgeInsets.all(AppSpacing.lg),
          child: Column(children: [
            LoadingSkeleton(height: 140),
            SizedBox(height: AppSpacing.lg),
            LoadingSkeleton(height: 52),
            SizedBox(height: AppSpacing.sm),
            LoadingSkeleton(height: 52),
          ]),
        ),
        error: (e, _) => ErrorStateView(
          message: e is Failure ? e.message : 'Mevzuat yüklenemedi.',
          onRetry: () => ref.invalidate(legislationDetailProvider(slug)),
        ),
        data: (d) => ListView(
          padding: const EdgeInsets.fromLTRB(
              AppSpacing.lg, AppSpacing.sm, AppSpacing.lg, AppSpacing.xxl),
          children: [
            // ── Kimlik kartı ──
            Container(
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: tokens.surface,
                border: Border.all(color: tokens.line),
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    if (d.number != null)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.sm, vertical: 2),
                        decoration: BoxDecoration(
                          color: tokens.brand.withValues(alpha: .1),
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusFull),
                        ),
                        child: Text('${d.number} sayılı',
                            style: AppTypography.caption
                                .copyWith(color: tokens.brand)),
                      ),
                    const SizedBox(width: AppSpacing.sm),
                    Text(_typeLabel(d.type),
                        style: AppTypography.caption
                            .copyWith(color: tokens.inkSoft)),
                  ]),
                  const SizedBox(height: AppSpacing.sm),
                  Text(d.name,
                      style:
                          AppTypography.title.copyWith(color: tokens.ink)),
                  const SizedBox(height: AppSpacing.sm),
                  Text(
                    [
                      '${d.articleCount} madde',
                      if (d.questionCount > 0)
                        '${d.questionCount} soru çıkmış',
                    ].join(' · '),
                    style: AppTypography.caption
                        .copyWith(color: tokens.inkSoft),
                  ),
                  if (d.lastVerifiedAt != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Row(children: [
                      Icon(Icons.verified_outlined,
                          size: 14, color: tokens.success),
                      const SizedBox(width: AppSpacing.xs),
                      Text(
                        '${_date(d.lastVerifiedAt!)} itibarıyla resmî kaynaktan doğrulandı',
                        style: AppTypography.caption
                            .copyWith(color: tokens.success),
                      ),
                    ]),
                  ],
                  if (d.effectiveInfo != null) ...[
                    const SizedBox(height: AppSpacing.xs),
                    Text(d.effectiveInfo!,
                        style: AppTypography.caption
                            .copyWith(color: tokens.inkSoft)),
                  ],
                ],
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            // ── Ana eylem: okumaya başla ──
            SizedBox(
              height: 52,
              child: FilledButton.icon(
                icon: const Icon(Icons.auto_stories_rounded),
                label: const Text('Okumaya başla'),
                onPressed: d.articleCount == 0
                    ? null
                    : () => context.push('/mevzuat/${d.slug}/oku'),
                style: FilledButton.styleFrom(
                  backgroundColor: tokens.brand,
                  foregroundColor: tokens.surface,
                  textStyle: AppTypography.label
                      .copyWith(fontSize: 16, fontWeight: FontWeight.w700),
                  shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusMd + 2)),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            // ── İçindekiler ──
            if (d.toc.isNotEmpty)
              OutlinedButton.icon(
                icon: const Icon(Icons.toc_rounded, size: 20),
                label: Text('İçindekiler (${d.toc.length} madde)'),
                onPressed: () async {
                  final no = await showTocSheet(context,
                      sections: d.sections, toc: d.toc);
                  if (no != null && context.mounted) {
                    context.push(
                        '/mevzuat/${d.slug}/oku?madde=${Uri.encodeComponent(no)}');
                  }
                },
              ),
            // ── Quiz köprüsü (Doc 29 §15) ──
            if (d.questionCount > 0 && d.topicId != null) ...[
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton.icon(
                icon: Icon(Icons.track_changes_rounded,
                    size: 20, color: tokens.accentSession),
                label: Text('Bu kanundan ${d.questionCount} soru çöz',
                    style: TextStyle(color: tokens.accentSession)),
                onPressed: () => context.push('/quiz', extra: {
                  'topicId': d.topicId,
                  'topicName': d.shortName ?? d.name,
                  'mode': 'practice',
                  'count': 10,
                }),
              ),
            ],
            // ── Resmî kaynak (güven) ──
            if (d.officialSourceUrl != null) ...[
              const SizedBox(height: AppSpacing.lg),
              Center(
                child: TextButton.icon(
                  icon: const Icon(Icons.open_in_new_rounded, size: 16),
                  label: const Text('Resmî Kaynak (mevzuat.gov.tr)'),
                  onPressed: () => launchUrl(
                      Uri.parse(d.officialSourceUrl!),
                      mode: LaunchMode.externalApplication),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  static String _typeLabel(String t) => switch (t) {
        'kanun' => 'Kanun',
        'yonetmelik' => 'Yönetmelik',
        'cbk' => 'Cumhurbaşkanlığı Kararnamesi',
        'genelge' => 'Genelge',
        _ => 'Mevzuat',
      };

  static String _date(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}.${d.month.toString().padLeft(2, '0')}.${d.year}';
}

import 'package:flutter/material.dart';

import '../../core/theme/app_haptics.dart';
import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Odak seçici seçeneği (Doc 25 §5).
class FocusOption {
  final String id;
  final String label;
  final String? subtitle;

  /// Alt seçim gerektirir (Ders/Konu/Kanun) — sağda › gösterilir.
  final bool drillsDown;

  const FocusOption({
    required this.id,
    required this.label,
    this.subtitle,
    this.drillsDown = false,
  });
}

/// Seçenek görselleri: id → (ikon, vurgu rengi, açıklama, rozet).
/// Bilinmeyen id nötr görünümle düşer — sheet genel amaçlı kalır.
({IconData icon, Color color, String? description, String? badge}) _visualOf(
    BuildContext context, FocusOption o) {
  final tokens = context.tokens;
  return switch (o.id) {
    'coach' => (
        icon: Icons.auto_awesome_rounded,
        color: tokens.accentStreak,
        description:
            'Zayıf konuların ve tekrar zamanı gelen yanlışlarınla dengeli karışım.',
        badge: 'Önerilen',
      ),
    'course' => (
        icon: Icons.tune_rounded,
        color: tokens.brand,
        description: 'Belirli bir derse ya da konuya odaklan.',
        badge: null,
      ),
    'wrongs' => (
        icon: Icons.history_rounded,
        color: tokens.success,
        description: 'Tekrar zamanı gelen yanlışlarını kapat.',
        badge: null,
      ),
    _ => (
        icon: Icons.track_changes_rounded,
        color: tokens.brand,
        description: o.subtitle,
        badge: null,
      ),
  };
}

/// Odak seçici sheet'i (Doc 26 §4 #8): "nereye bakılacağını kullanıcı,
/// neye bakılacağını koç seçer." Seçilen id'yi döndürür (vazgeçince null).
/// Odak GEÇİCİDİR — kalıcılık notu sheet'in içinde sabittir.
Future<String?> showFocusSheet(
  BuildContext context, {
  required List<FocusOption> options,
  required String selectedId,
}) {
  return showModalBottomSheet<String>(
    context: context,
    isScrollControlled: true,
    showDragHandle: true,
    builder: (context) =>
        _FocusSheetBody(options: options, selectedId: selectedId),
  );
}

class _FocusSheetBody extends StatefulWidget {
  final List<FocusOption> options;
  final String selectedId;

  const _FocusSheetBody({required this.options, required this.selectedId});

  @override
  State<_FocusSheetBody> createState() => _FocusSheetBodyState();
}

class _FocusSheetBodyState extends State<_FocusSheetBody> {
  late String _selected = widget.selectedId;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return SafeArea(
      child: Padding(
        padding: EdgeInsets.only(
          left: AppSpacing.xl,
          right: AppSpacing.xl,
          bottom: AppSpacing.xl + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text('Bugün neye odaklanalım?',
                style: AppTypography.title.copyWith(color: tokens.ink)),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Nereye bakılacağını sen seç — neye bakılacağını koç bilir.',
              style: AppTypography.body.copyWith(color: tokens.inkSoft),
            ),
            const SizedBox(height: AppSpacing.xl),
            ...widget.options.map((o) => _optionCard(o)),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(Icons.wb_twilight_rounded,
                    size: 14, color: tokens.inkSoft),
                const SizedBox(width: AppSpacing.xs),
                Expanded(
                  child: Text(
                    'Odak bugün için geçerli — yarın koça döner.',
                    style:
                        AppTypography.caption.copyWith(color: tokens.inkSoft),
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.lg),
            SizedBox(
              height: 52,
              child: FilledButton(
                onPressed: () => Navigator.of(context).pop(_selected),
                style: FilledButton.styleFrom(
                  backgroundColor: tokens.brand,
                  foregroundColor: tokens.surface,
                  textStyle: AppTypography.label
                      .copyWith(fontSize: 16, fontWeight: FontWeight.w700),
                  shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusMd + 2)),
                ),
                child: const Text('Seansı başlat'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _optionCard(FocusOption o) {
    final tokens = context.tokens;
    final v = _visualOf(context, o);
    final selected = o.id == _selected;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.md),
      child: Semantics(
        inMutuallyExclusiveGroup: true,
        selected: selected,
        label: v.description == null ? o.label : '${o.label} — ${v.description}',
        excludeSemantics: true,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: () {
              AppHaptics.select();
              setState(() => _selected = o.id);
            },
            borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
            child: AnimatedContainer(
              duration: AppMotion.respect(AppMotion.quick),
              curve: AppMotion.quickCurve,
              padding: const EdgeInsets.all(AppSpacing.lg),
              decoration: BoxDecoration(
                color: selected
                    ? tokens.brand.withValues(alpha: .07)
                    : tokens.surfaceAlt,
                borderRadius: BorderRadius.circular(AppSpacing.radiusLg),
                border: Border.all(
                  color: selected ? tokens.brand : tokens.line,
                  width: selected ? 1.6 : 1,
                ),
              ),
              child: Row(
                children: [
                  // İkon plakası — seçenek kimliği bir bakışta.
                  Container(
                    width: 44,
                    height: 44,
                    decoration: BoxDecoration(
                      color: v.color.withValues(alpha: .14),
                      borderRadius:
                          BorderRadius.circular(AppSpacing.radiusMd),
                    ),
                    child: Icon(v.icon, size: 22, color: v.color),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(children: [
                          Text(o.label,
                              style: AppTypography.label.copyWith(
                                fontSize: 16,
                                color: tokens.ink,
                                fontWeight: selected
                                    ? FontWeight.w700
                                    : FontWeight.w600,
                              )),
                          if (v.badge != null) ...[
                            const SizedBox(width: AppSpacing.sm),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: AppSpacing.sm, vertical: 2),
                              decoration: BoxDecoration(
                                color: tokens.accentStreak
                                    .withValues(alpha: .15),
                                borderRadius: BorderRadius.circular(
                                    AppSpacing.radiusFull),
                              ),
                              child: Text(v.badge!,
                                  style: AppTypography.caption.copyWith(
                                    color: tokens.accentStreak,
                                    fontWeight: FontWeight.w700,
                                    fontSize: 11,
                                  )),
                            ),
                          ],
                        ]),
                        if (v.description != null) ...[
                          const SizedBox(height: 2),
                          Text(v.description!,
                              style: AppTypography.caption
                                  .copyWith(color: tokens.inkSoft)),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  if (o.drillsDown && !selected)
                    Icon(Icons.chevron_right_rounded,
                        size: 20, color: tokens.inkSoft)
                  else
                    AnimatedSwitcher(
                      duration: AppMotion.respect(AppMotion.quick),
                      child: selected
                          ? Icon(Icons.check_circle_rounded,
                              key: const ValueKey('on'),
                              size: 22,
                              color: tokens.brand)
                          : Icon(Icons.circle_outlined,
                              key: const ValueKey('off'),
                              size: 22,
                              color: tokens.line),
                    ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

import 'package:flutter/material.dart';

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
          left: AppSpacing.lg,
          right: AppSpacing.lg,
          top: AppSpacing.md,
          bottom: AppSpacing.lg + MediaQuery.viewInsetsOf(context).bottom,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: tokens.line,
                  borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
                ),
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text('Bugün neye odaklanalım?',
                style: AppTypography.heading.copyWith(color: tokens.ink)),
            const SizedBox(height: AppSpacing.md),
            ...widget.options.map((o) {
              final selected = o.id == _selected;
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: Semantics(
                  inMutuallyExclusiveGroup: true,
                  selected: selected,
                  label: o.subtitle == null ? o.label : '${o.label} — ${o.subtitle}',
                  excludeSemantics: true,
                  child: Material(
                    color: tokens.surface,
                    borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                    child: InkWell(
                      onTap: () => setState(() => _selected = o.id),
                      borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                      child: Container(
                        constraints: const BoxConstraints(
                            minHeight: AppSpacing.minTouchTarget),
                        padding: const EdgeInsets.symmetric(
                            horizontal: AppSpacing.md,
                            vertical: AppSpacing.sm + 2),
                        decoration: BoxDecoration(
                          border: Border.all(
                            color: selected ? tokens.brand : tokens.line,
                            width: selected ? 1.5 : 1,
                          ),
                          borderRadius:
                              BorderRadius.circular(AppSpacing.radiusSm),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              selected
                                  ? Icons.radio_button_checked_rounded
                                  : Icons.radio_button_off_rounded,
                              size: 18,
                              color: selected ? tokens.brand : tokens.inkSoft,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(o.label,
                                      style: AppTypography.body.copyWith(
                                        color: tokens.ink,
                                        fontWeight: selected
                                            ? FontWeight.w600
                                            : FontWeight.w400,
                                      )),
                                  if (o.subtitle != null)
                                    Text(o.subtitle!,
                                        style: AppTypography.caption
                                            .copyWith(color: tokens.inkSoft)),
                                ],
                              ),
                            ),
                            if (o.drillsDown)
                              Icon(Icons.chevron_right_rounded,
                                  size: 18, color: tokens.inkSoft),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
              );
            }),
            const SizedBox(height: AppSpacing.xs),
            Text(
              'Odak bugün için geçerli — yarın koça döner.',
              style: AppTypography.caption.copyWith(color: tokens.inkSoft),
            ),
            const SizedBox(height: AppSpacing.md),
            FilledButton(
              onPressed: () => Navigator.of(context).pop(_selected),
              child: const Text('Seansı başlat'),
            ),
          ],
        ),
      ),
    );
  }
}

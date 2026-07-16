import 'package:flutter/material.dart';

import '../../core/theme/app_motion.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Madde kartı (Doc 26 §4 #14) — Atlas'ın kalbi: resmî metin ↔ "polis diliyle"
/// AI özeti arasında geçişli iki yüz. AI özeti yoksa/kilitliyse kilit yüzü
/// gösterilir (boş durum da tasarlanır — placeholder yasak).
class ArticleCard extends StatefulWidget {
  /// "Madde 16 — Zor ve silah kullanma"
  final String title;
  final String officialText;

  /// AI sadeleştirmesi; null = henüz yok veya kilitli.
  final String? simplifiedText;

  /// Saha senaryosu (varsa AI yüzünün altında italik gösterilir).
  final String? scenarioText;

  /// simplifiedText null iken gösterilecek eylem (örn. kayıt/premium CTA).
  final String? lockedCtaLabel;
  final VoidCallback? onLockedCta;

  const ArticleCard({
    super.key,
    required this.title,
    required this.officialText,
    this.simplifiedText,
    this.scenarioText,
    this.lockedCtaLabel,
    this.onLockedCta,
  });

  @override
  State<ArticleCard> createState() => _ArticleCardState();
}

class _ArticleCardState extends State<ArticleCard> {
  bool _showSimplified = false;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: tokens.surface,
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: tokens.line),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(widget.title,
              style: AppTypography.heading.copyWith(color: tokens.ink)),
          const SizedBox(height: AppSpacing.md),
          _FaceToggle(
            simplified: _showSimplified,
            onChanged: (v) => setState(() => _showSimplified = v),
          ),
          const SizedBox(height: AppSpacing.md),
          AnimatedSwitcher(
            duration: AppMotion.respect(AppMotion.standard),
            switchInCurve: AppMotion.standardCurve,
            child: _showSimplified ? _simplifiedFace(tokens) : _officialFace(tokens),
          ),
        ],
      ),
    );
  }

  Widget _officialFace(AppTokens tokens) => Text(
        widget.officialText,
        key: const ValueKey('official'),
        style: AppTypography.body.copyWith(color: tokens.ink),
      );

  Widget _simplifiedFace(AppTokens tokens) {
    if (widget.simplifiedText == null) {
      return Container(
        key: const ValueKey('locked'),
        width: double.infinity,
        padding: const EdgeInsets.all(AppSpacing.lg),
        decoration: BoxDecoration(
          color: tokens.surfaceAlt,
          borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisSize: MainAxisSize.min,
          children: [
            Row(children: [
              Icon(Icons.lock_outline_rounded, size: 16, color: tokens.inkSoft),
              const SizedBox(width: AppSpacing.xs),
              Expanded(
                child: Text('Polis diliyle özet için giriş yap',
                    style:
                        AppTypography.label.copyWith(color: tokens.inkSoft)),
              ),
            ]),
            if (widget.lockedCtaLabel != null) ...[
              const SizedBox(height: AppSpacing.sm),
              OutlinedButton(
                onPressed: widget.onLockedCta,
                style: OutlinedButton.styleFrom(
                  foregroundColor: tokens.ink,
                  side: BorderSide(color: tokens.ink, width: 1.5),
                  minimumSize: const Size(0, AppSpacing.minTouchTarget),
                ),
                child: Text(widget.lockedCtaLabel!),
              ),
            ],
          ],
        ),
      );
    }
    return Column(
      key: const ValueKey('simplified'),
      crossAxisAlignment: CrossAxisAlignment.start,
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(widget.simplifiedText!,
            style: AppTypography.body.copyWith(color: tokens.ink)),
        if (widget.scenarioText != null) ...[
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Saha senaryosu: ${widget.scenarioText!}',
            style: AppTypography.body.copyWith(
                color: tokens.inkSoft, fontStyle: FontStyle.italic),
          ),
        ],
      ],
    );
  }
}

class _FaceToggle extends StatelessWidget {
  final bool simplified;
  final ValueChanged<bool> onChanged;

  const _FaceToggle({required this.simplified, required this.onChanged});

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.all(3),
      decoration: BoxDecoration(
        color: tokens.surfaceAlt,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          _segment('Resmî metin', !simplified, () => onChanged(false), tokens),
          _segment('🗣 Polis diliyle', simplified, () => onChanged(true), tokens),
        ],
      ),
    );
  }

  Widget _segment(
      String label, bool active, VoidCallback onTap, AppTokens tokens) {
    return Semantics(
      button: true,
      selected: active,
      label: label,
      excludeSemantics: true,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
        child: AnimatedContainer(
          duration: AppMotion.respect(AppMotion.quick),
          curve: AppMotion.quickCurve,
          constraints: const BoxConstraints(minHeight: 38),
          padding: const EdgeInsets.symmetric(
              horizontal: AppSpacing.md, vertical: AppSpacing.sm),
          decoration: BoxDecoration(
            color: active ? tokens.surface : Colors.transparent,
            borderRadius: BorderRadius.circular(AppSpacing.radiusFull),
            border:
                active ? Border.all(color: tokens.line) : null,
          ),
          child: Text(
            label,
            style: AppTypography.label.copyWith(
                color: active ? tokens.ink : tokens.inkSoft),
          ),
        ),
      ),
    );
  }
}

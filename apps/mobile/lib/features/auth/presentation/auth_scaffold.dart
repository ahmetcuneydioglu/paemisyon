import 'package:flutter/material.dart';

import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../../../shared/widgets/brand_glyph.dart';

/// Auth ekranları ortak kabuğu: marka glifi + başlık/alt başlık + içerik.
/// Klavye açılınca içerik kayar; küçük ekranda glif küçülür.
class AuthScaffold extends StatelessWidget {
  const AuthScaffold({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final compact = MediaQuery.of(context).size.height < 700;
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 440), // tablet
            child: SingleChildScrollView(
              padding: const EdgeInsets.symmetric(
                  horizontal: AppSpacing.xl, vertical: AppSpacing.xl),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(height: compact ? AppSpacing.lg : AppSpacing.xxxl),
                  Center(child: BrandGlyph(size: compact ? 56 : 72)),
                  SizedBox(height: compact ? AppSpacing.lg : AppSpacing.xl),
                  Text(title,
                      textAlign: TextAlign.center,
                      style: AppTypography.title.copyWith(color: tokens.ink)),
                  const SizedBox(height: AppSpacing.xs),
                  Text(subtitle,
                      textAlign: TextAlign.center,
                      style:
                          AppTypography.body.copyWith(color: tokens.inkSoft)),
                  SizedBox(height: compact ? AppSpacing.xl : AppSpacing.xxl),
                  ...children,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Auth alanları ortak stil: dolgu zeminli, yumuşak köşeli, ikonlu.
InputDecoration authFieldDecoration(
  BuildContext context, {
  required String label,
  IconData? icon,
  Widget? suffix,
}) {
  final tokens = context.tokens;
  return InputDecoration(
    labelText: label,
    prefixIcon: icon != null ? Icon(icon, size: 20) : null,
    suffixIcon: suffix,
    filled: true,
    fillColor: tokens.surfaceAlt,
    border: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
      borderSide: BorderSide.none,
    ),
    enabledBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
      borderSide: BorderSide(color: tokens.line),
    ),
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
      borderSide: BorderSide(color: tokens.brand, width: 1.6),
    ),
    contentPadding: const EdgeInsets.symmetric(
        horizontal: AppSpacing.lg, vertical: AppSpacing.lg),
  );
}

/// Hata bandı — çıplak kırmızı metin yerine yumuşak kutulu uyarı.
class AuthErrorBanner extends StatelessWidget {
  const AuthErrorBanner(this.message, {super.key});
  final String message;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: tokens.danger.withValues(alpha: .10),
        borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
        border: Border.all(color: tokens.danger.withValues(alpha: .35)),
      ),
      child: Row(children: [
        Icon(Icons.error_outline_rounded, size: 18, color: tokens.danger),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Text(message,
              style: AppTypography.caption.copyWith(color: tokens.danger)),
        ),
      ]),
    );
  }
}

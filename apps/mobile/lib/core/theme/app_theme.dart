import 'package:flutter/material.dart';

import 'app_colors.dart';
import 'app_spacing.dart';
import 'app_tokens.dart';
import 'app_typography.dart';

/// Uygulama teması (Material 3, açık + koyu). Tüm ekranlar bunu kullanır.
/// Semantic renkler AppTokens (ThemeExtension) üzerinden gelir — bileşenler
/// ham hex değil `context.tokens.*` kullanır (Doc 26).
class AppTheme {
  const AppTheme._();

  static ThemeData get light => _base(Brightness.light, AppTokens.light);
  static ThemeData get dark => _base(Brightness.dark, AppTokens.dark);

  static ThemeData _base(Brightness brightness, AppTokens tokens) {
    final scheme = ColorScheme.fromSeed(
      seedColor: AppColors.seed,
      brightness: brightness,
    ).copyWith(
      surface: tokens.surface,
      onSurface: tokens.ink,
      outlineVariant: tokens.line,
      error: tokens.danger,
    );

    return ThemeData(
      useMaterial3: true,
      colorScheme: scheme,
      extensions: [tokens],
      scaffoldBackgroundColor: tokens.surfaceAlt,
      dividerColor: tokens.line,
      appBarTheme: AppBarTheme(
        backgroundColor: tokens.surfaceAlt,
        foregroundColor: tokens.ink,
        centerTitle: true,
        elevation: 0,
        titleTextStyle: AppTypography.heading.copyWith(color: tokens.ink),
      ),
      textTheme: const TextTheme(
        displaySmall: AppTypography.display,
        titleLarge: AppTypography.title,
        titleMedium: AppTypography.heading,
        bodyMedium: AppTypography.body,
        labelLarge: AppTypography.label,
        labelSmall: AppTypography.caption,
      ),
      filledButtonTheme: FilledButtonThemeData(
        style: FilledButton.styleFrom(
          minimumSize: const Size.fromHeight(52), // ≥44pt dokunma hedefi
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          ),
          textStyle: AppTypography.label.copyWith(fontSize: 16),
        ),
      ),
      cardTheme: CardThemeData(
        elevation: 0,
        color: tokens.surface,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
          side: BorderSide(color: tokens.line),
        ),
      ),
      bottomSheetTheme: BottomSheetThemeData(
        backgroundColor: tokens.surface,
        shape: const RoundedRectangleBorder(
          borderRadius: BorderRadius.vertical(top: Radius.circular(AppSpacing.radiusLg)),
        ),
      ),
    );
  }
}

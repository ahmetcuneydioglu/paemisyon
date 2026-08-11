import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:sign_in_with_apple/sign_in_with_apple.dart';
import 'package:supabase_flutter/supabase_flutter.dart';

import '../../../core/config/app_config.dart';
import '../../../core/theme/app_spacing.dart';
import '../../../core/theme/app_tokens.dart';
import '../../../core/theme/app_typography.dart';
import '../data/auth_repository.dart';

/// Sosyal giriş butonları (Doc 28 P0-①) — giriş VE kayıt ekranlarında aynı.
/// Web'le TEK hesap: aynı Google/Apple kimliği aynı Supabase kullanıcısıdır.
/// Apple üstte (HIG — iOS'ta üçüncü taraf girişlerin önünde olmalı).
class SocialSignInButtons extends ConsumerStatefulWidget {
  const SocialSignInButtons({super.key});

  @override
  ConsumerState<SocialSignInButtons> createState() =>
      _SocialSignInButtonsState();
}

class _SocialSignInButtonsState extends ConsumerState<SocialSignInButtons> {
  String? _busy; // 'apple' | 'google'

  Future<void> _run(String key, Future<void> Function() action) async {
    if (_busy != null) return;
    setState(() => _busy = key);
    try {
      await action();
      // Başarıda yönlendirme router'ın auth redirect'inden gelir.
    } on SignInWithAppleAuthorizationException catch (e) {
      if (e.code != AuthorizationErrorCode.canceled) {
        _snack('Apple ile giriş başarısız — tekrar dene.');
      }
    } on AuthException catch (e) {
      _snack(e.message);
    } catch (_) {
      _snack('Giriş başarısız — tekrar dene.');
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  void _snack(String m) {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(m)));
    }
  }

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    final repo = ref.read(authRepositoryProvider);
    final showApple = Platform.isIOS;
    final showGoogle = AppConfig.hasGoogleSignIn;
    if (!showApple && !showGoogle) return const SizedBox.shrink();

    Widget button({
      required String key,
      required Widget icon,
      required String label,
      required Color background,
      required Color foreground,
      Color? border,
      required Future<void> Function() action,
    }) {
      final loading = _busy == key;
      return Padding(
        padding: const EdgeInsets.only(bottom: AppSpacing.sm),
        child: SizedBox(
          height: 48, // ≥44pt dokunma hedefi
          child: FilledButton.icon(
            style: FilledButton.styleFrom(
              backgroundColor: background,
              foregroundColor: foreground,
              side: border != null ? BorderSide(color: border) : null,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd),
              ),
            ),
            onPressed: _busy != null ? null : () => _run(key, action),
            icon: loading
                ? SizedBox(
                    width: 18,
                    height: 18,
                    child: CircularProgressIndicator(
                        strokeWidth: 2, color: foreground),
                  )
                : icon,
            label: Text(label, style: AppTypography.label.copyWith(fontSize: 15)),
          ),
        ),
      );
    }

    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Row(
          children: [
            Expanded(child: Divider(color: tokens.line)),
            Padding(
              padding:
                  const EdgeInsets.symmetric(horizontal: AppSpacing.md),
              child: Text('veya',
                  style:
                      AppTypography.caption.copyWith(color: tokens.inkSoft)),
            ),
            Expanded(child: Divider(color: tokens.line)),
          ],
        ),
        const SizedBox(height: AppSpacing.md),
        if (showApple)
          button(
            key: 'apple',
            icon: const Icon(Icons.apple, size: 22),
            label: 'Apple ile devam et',
            // HIG: Apple butonu siyah/beyaz — temaya göre ters.
            background: isDark ? Colors.white : Colors.black,
            foreground: isDark ? Colors.black : Colors.white,
            action: repo.signInWithApple,
          ),
        if (showGoogle)
          button(
            key: 'google',
            icon: Text('G',
                style: AppTypography.heading
                    .copyWith(color: tokens.ink, fontWeight: FontWeight.w800)),
            label: 'Google ile devam et',
            background: tokens.surface,
            foreground: tokens.ink,
            border: tokens.line,
            action: repo.signInWithGoogle,
          ),
      ],
    );
  }
}

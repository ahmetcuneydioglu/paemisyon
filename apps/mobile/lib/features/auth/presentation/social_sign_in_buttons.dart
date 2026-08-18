import 'dart:io';

import 'package:flutter/foundation.dart' show kDebugMode;
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
/// Marka kurallarına uygun: Apple (HIG: siyah/beyaz, gerçek logo, iOS'ta
/// üçüncü taraf girişlerin ÖNÜNDE) + Google (resmî renkli G, beyaz zemin).
/// Web'le TEK hesap: aynı kimlik aynı Supabase kullanıcısıdır.
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
    } catch (e) {
      // Teşhis: mağaza/platform istisnaları (ör. Google
      // PlatformException status:10 DEVELOPER_ERROR) kullanıcıya gösterilmez
      // ama sebebi bilmeden hata ayıklanamıyor — geliştirmede log'a düşsün.
      if (kDebugMode) debugPrint('[auth] $key girişi başarısız: $e');
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
    final repo = ref.read(authRepositoryProvider);
    final showApple = Platform.isIOS;
    final showGoogle = AppConfig.hasGoogleSignIn;
    if (!showApple && !showGoogle) return const SizedBox.shrink();

    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (showApple)
          _SocialButton(
            loading: _busy == 'apple',
            disabled: _busy != null,
            // HIG: koyu temada beyaz buton + siyah logo; açıkta tersi.
            background: isDark ? Colors.white : Colors.black,
            foreground: isDark ? Colors.black : Colors.white,
            icon: Icon(Icons.apple,
                size: 24, color: isDark ? Colors.black : Colors.white),
            label: 'Apple ile devam et',
            onPressed: () => _run('apple', repo.signInWithApple),
          ),
        if (showApple && showGoogle) const SizedBox(height: AppSpacing.md),
        if (showGoogle)
          _SocialButton(
            loading: _busy == 'google',
            disabled: _busy != null,
            // Google marka kuralı: beyaz zemin + resmî renkli G (her temada).
            background: Colors.white,
            foreground: const Color(0xFF1F1F1F),
            border: isDark ? null : const Color(0xFFDADCE0),
            icon: Image.asset('assets/icons/google_g.png',
                width: 20, height: 20),
            label: 'Google ile devam et',
            onPressed: () => _run('google', repo.signInWithGoogle),
          ),
      ],
    );
  }
}

/// Tek tip sosyal buton: 52pt, gerçek logo solda sabit hizada, metin ortada.
class _SocialButton extends StatelessWidget {
  const _SocialButton({
    required this.icon,
    required this.label,
    required this.background,
    required this.foreground,
    required this.onPressed,
    required this.loading,
    required this.disabled,
    this.border,
  });

  final Widget icon;
  final String label;
  final Color background;
  final Color foreground;
  final Color? border;
  final VoidCallback onPressed;
  final bool loading;
  final bool disabled;

  @override
  Widget build(BuildContext context) {
    return Semantics(
      button: true,
      label: label,
      child: SizedBox(
        height: 52,
        child: Material(
          color: background,
          borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
          child: InkWell(
            borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
            onTap: disabled ? null : onPressed,
            child: Container(
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(AppSpacing.radiusMd + 2),
                border: border != null ? Border.all(color: border!) : null,
              ),
              padding:
                  const EdgeInsets.symmetric(horizontal: AppSpacing.lg),
              child: Stack(
                alignment: Alignment.center,
                children: [
                  Align(
                    alignment: Alignment.centerLeft,
                    child: loading
                        ? SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                                strokeWidth: 2, color: foreground),
                          )
                        : icon,
                  ),
                  Text(
                    label,
                    style: AppTypography.label.copyWith(
                      fontSize: 16,
                      fontWeight: FontWeight.w600,
                      color: disabled
                          ? foreground.withValues(alpha: .5)
                          : foreground,
                    ),
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

/// "ya da" ayracı — auth ekranlarında ortak.
class AuthDivider extends StatelessWidget {
  const AuthDivider({super.key, this.label = 'ya da'});
  final String label;

  @override
  Widget build(BuildContext context) {
    final tokens = context.tokens;
    return Row(children: [
      Expanded(child: Divider(color: tokens.line)),
      Padding(
        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
        child: Text(label,
            style: AppTypography.caption.copyWith(color: tokens.inkSoft)),
      ),
      Expanded(child: Divider(color: tokens.line)),
    ]);
  }
}

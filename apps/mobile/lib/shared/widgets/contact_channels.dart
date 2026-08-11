import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../core/constants/contact.dart';
import '../../core/theme/app_spacing.dart';
import '../../core/theme/app_tokens.dart';
import '../../core/theme/app_typography.dart';

/// Bağlantıların görünüm varyantı.
enum ContactChannelsVariant {
  /// Birincil CTA — ilk kanal dolu, diğerleri çerçeveli buton (satın alma akışı).
  buttons,

  /// Sade satır — destek/alt bilgi bağlamı.
  inline,
}

/// İletişim kanalı bağlantıları (Telegram/Instagram) — TEK EKRANA ÖZEL DEĞİL.
/// Premium satın alma, destek ve profil aynı bileşeni `variant` ile kullanır.
/// Kullanıcı adı bileşene gömülü değildir; [AppContact] tek kaynaktır.
///
/// a11y: dokunma hedefi ≥44pt, ikon `excludeSemantics` (etiket metinden okunur),
/// her bağlantı "link" semantiğiyle duyurulur.
class ContactChannels extends StatelessWidget {
  const ContactChannels({
    super.key,
    this.channels = AppContact.purchaseChannels,
    this.variant = ContactChannelsVariant.buttons,
    this.onLaunchFailed,
  });

  final List<ContactChannel> channels;
  final ContactChannelsVariant variant;

  /// Bağlantı açılamazsa çağrılır (varsayılan: SnackBar).
  final void Function(ContactChannel channel)? onLaunchFailed;

  Future<void> _open(BuildContext context, ContactChannel c) async {
    final messenger = ScaffoldMessenger.maybeOf(context);
    var ok = false;
    try {
      ok = await launchUrl(
        Uri.parse(c.url),
        mode: LaunchMode.externalApplication,
      );
    } catch (_) {
      ok = false;
    }
    if (ok) return;

    if (onLaunchFailed != null) {
      onLaunchFailed!(c);
      return;
    }
    messenger?.showSnackBar(
      SnackBar(content: Text('${c.label} açılamadı — ${c.handle}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    return switch (variant) {
      ContactChannelsVariant.buttons => _buttons(context),
      ContactChannelsVariant.inline => _inline(context),
    };
  }

  Widget _buttons(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final (i, c) in channels.indexed) ...[
          if (i > 0) const SizedBox(height: AppSpacing.sm),
          Semantics(
            link: true,
            label: '${c.label} ${c.handle}',
            excludeSemantics: true,
            child: i == 0
                ? FilledButton.icon(
                    onPressed: () => _open(context, c),
                    icon: Icon(c.icon, size: 20),
                    label: _label(context, c, onBrand: true),
                  )
                : OutlinedButton.icon(
                    onPressed: () => _open(context, c),
                    icon: Icon(c.icon, size: 20),
                    label: _label(context, c, onBrand: false),
                  ),
          ),
        ],
      ],
    );
  }

  /// Buton metni: kanal adı + soluk kullanıcı adı (web ile aynı hiyerarşi).
  Widget _label(BuildContext context, ContactChannel c, {required bool onBrand}) {
    return Text.rich(
      TextSpan(
        text: c.label,
        children: [
          TextSpan(
            text: '  ${c.handle}',
            style: AppTypography.body.copyWith(
              fontWeight: FontWeight.w400,
              color: (onBrand
                      ? Theme.of(context).colorScheme.onPrimary
                      : context.tokens.inkSoft)
                  .withValues(alpha: onBrand ? 0.85 : 1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _inline(BuildContext context) {
    final tokens = context.tokens;
    return Wrap(
      spacing: AppSpacing.sm,
      runSpacing: AppSpacing.sm,
      children: [
        for (final c in channels)
          Semantics(
            link: true,
            label: '${c.label} ${c.handle}',
            excludeSemantics: true,
            child: InkWell(
              onTap: () => _open(context, c),
              borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
              child: Container(
                constraints: const BoxConstraints(
                  minHeight: AppSpacing.minTouchTarget,
                ),
                padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                decoration: BoxDecoration(
                  border: Border.all(color: tokens.line),
                  borderRadius: BorderRadius.circular(AppSpacing.radiusSm),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(c.icon, size: 16, color: tokens.inkSoft),
                    const SizedBox(width: AppSpacing.sm),
                    Text(
                      c.handle,
                      style: AppTypography.label.copyWith(color: tokens.inkSoft),
                    ),
                  ],
                ),
              ),
            ),
          ),
      ],
    );
  }
}

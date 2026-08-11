import 'package:flutter/material.dart';

/// İletişim kanalları — TEK KAYNAK (web karşılığı: `apps/web/src/lib/contact.ts`).
///
/// Premium satın alma ve destek aynı kullanıcı adını buradan okur; kullanıcı adı
/// değişirse yalnız bu dosya düzenlenir. Ekranlara `t.me/...` gibi ham bağlantı
/// veya `@handle` metni SERPİŞTİRİLMEZ.
enum ContactChannelKey { telegram, instagram, email }

@immutable
class ContactChannel {
  const ContactChannel({
    required this.key,
    required this.label,
    required this.handle,
    required this.url,
    required this.icon,
  });

  final ContactChannelKey key;

  /// Kanal adı ("Telegram") — ikon `excludeSemantics` olduğu için erişilebilir
  /// ad HER ZAMAN bu metinden gelir.
  final String label;

  /// Görünen kullanıcı adı ("@paemvemisyon") ya da e-posta adresi.
  final String handle;

  final String url;
  final IconData icon;
}

/// Kanal sabitleri. İkonlar uygulamanın geri kalanıyla aynı aileden (Material
/// "rounded") seçilir — marka SVG'si taşımak yeni bir bağımlılık gerektirirdi ve
/// kanal adı zaten metinde yazdığı için tanınırlık ikona bağlı değil.
class AppContact {
  const AppContact._();

  /// Telegram ve Instagram'da kullanıcı adı AYNI — tek sabit.
  static const String handle = 'paemvemisyon';

  static const ContactChannel telegram = ContactChannel(
    key: ContactChannelKey.telegram,
    label: 'Telegram',
    handle: '@$handle',
    url: 'https://t.me/$handle',
    icon: Icons.send_rounded,
  );

  static const ContactChannel instagram = ContactChannel(
    key: ContactChannelKey.instagram,
    label: 'Instagram',
    handle: '@$handle',
    url: 'https://instagram.com/$handle',
    icon: Icons.photo_camera_rounded,
  );

  static const ContactChannel email = ContactChannel(
    key: ContactChannelKey.email,
    label: 'E-posta',
    handle: 'destek@paemisyon.com',
    url: 'mailto:destek@paemisyon.com',
    icon: Icons.mail_outline_rounded,
  );

  /// Satın alma/destek için gösterilen sosyal kanallar (sırayla).
  static const List<ContactChannel> purchaseChannels = [telegram, instagram];
}

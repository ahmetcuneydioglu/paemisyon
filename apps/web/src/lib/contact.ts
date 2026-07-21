/**
 * İletişim kanalları — TEK KAYNAK. Premium satın alma, destek ve footer
 * aynı kullanıcı adını buradan okur; kullanıcı adı değişirse tek yer düzenlenir.
 */
export const CONTACT_HANDLE = "paemvemisyon";

export const CONTACT = {
  telegram: {
    key: "telegram" as const,
    label: "Telegram",
    handle: `@${CONTACT_HANDLE}`,
    href: `https://t.me/${CONTACT_HANDLE}`,
  },
  instagram: {
    key: "instagram" as const,
    label: "Instagram",
    handle: `@${CONTACT_HANDLE}`,
    href: `https://instagram.com/${CONTACT_HANDLE}`,
  },
  email: {
    key: "email" as const,
    label: "E-posta",
    handle: "destek@paemisyon.com",
    href: "mailto:destek@paemisyon.com",
  },
} as const;

export type ContactChannel = (typeof CONTACT)[keyof typeof CONTACT];

/** Satın alma/destek için kullanılan sosyal kanallar (sırayla gösterilir). */
export const PURCHASE_CHANNELS: ContactChannel[] = [CONTACT.telegram, CONTACT.instagram];

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export const NOTIFICATION_TABS = [
  ['/notifications', 'Genel Bakış'],
  ['/notifications/new', 'Yeni Bildirim'],
  ['/notifications/campaigns', 'Kampanyalar'],
  ['/notifications/automations', 'Otomatik Bildirimler'],
  ['/notifications/segments', 'Segmentler'],
  ['/notifications/templates', 'Şablonlar'],
  ['/notifications/scheduled', 'Planlanmış'],
  ['/notifications/history', 'Gönderim Geçmişi'],
  ['/notifications/analytics', 'Analizler'],
  ['/notifications/settings', 'Ayarlar'],
] as const;

/** Bildirim Merkezi alt sekmeleri (Doc 52 §12). */
export function NotificationTabs() {
  const pathname = usePathname();
  return (
    <nav className="mb-6 -mx-1 flex gap-1 overflow-x-auto pb-1" aria-label="Bildirim Merkezi bölümleri">
      {NOTIFICATION_TABS.map(([href, label]) => {
        const active = href === '/notifications' ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`whitespace-nowrap rounded-full px-3 py-1.5 text-sm ${
              active ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

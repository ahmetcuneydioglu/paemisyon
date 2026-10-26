import { NotificationTabs } from '@/components/notifications/tabs';

/** Bildirim Merkezi kabuğu: başlık sayfada, alt sekmeler burada (Doc 52 §12). */
export default function NotificationsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <NotificationTabs />
      {children}
    </div>
  );
}

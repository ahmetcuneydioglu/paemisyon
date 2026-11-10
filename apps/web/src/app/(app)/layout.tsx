import { Suspense } from "react";
import { NotificationOpenTracker } from "@/components/notifications/notification-open-tracker";

/**
 * Girişli katman (Doc 27): kimlik middleware sınırında zorunlu tutulur ve
 * tüm veri uçları ayrıca JWT doğrular. Kabuk alt gruplarda —
 * (shell) = L2 sidebar'lı çalışma alanı · tur = L3 odak (kabuksuz).
 *
 * Push açılış izleyicisi (`?nid=`) BURADA durur, kabukta değil: web push
 * hedeflerinin çoğu L3 odak sayfalarıdır (/seans, /kartlar) ve kabuk orada
 * yoktur — izleyici kabukta kaldığında bu açılışlar hiç kaydedilmiyordu
 * (Doc 52/08, 10 Kas 2026).
 */
export default function AppLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen">
      {children}
      <Suspense fallback={null}>
        <NotificationOpenTracker />
      </Suspense>
    </div>
  );
}

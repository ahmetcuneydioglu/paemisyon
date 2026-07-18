import type { ReactNode } from "react";
import { CommandPalette } from "./command-palette";
import { MobileAppHeader, MobileBottomNavigation } from "./mobile-navigation";
import { Sidebar } from "./sidebar";

/** Tüm girişli L2 sayfaların ortak responsive navigasyon kabuğu. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileAppHeader />
        <main className="min-w-0 pb-[calc(70px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNavigation />
      <CommandPalette />
    </div>
  );
}

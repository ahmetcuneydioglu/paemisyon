import type { ReactNode } from "react";
import { CommandPalette } from "./command-palette";
import { MobileAppHeader, MobileBottomNavigation } from "./mobile-navigation";
import { Sidebar } from "./sidebar";
import { TopStrip } from "./top-strip";

/** Tüm girişli L2 sayfaların ortak kabuğu (Doc 27 §1 L2): sidebar · üst şerit · içerik · ⌘K. */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-bg md:flex">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <MobileAppHeader />
        <TopStrip />
        <main className="min-w-0 pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          {children}
        </main>
      </div>
      <MobileBottomNavigation />
      <CommandPalette />
    </div>
  );
}

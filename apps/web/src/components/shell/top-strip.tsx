import Link from "next/link";
import { Pause, Search, UserRound } from "lucide-react";
import { api } from "@/lib/api";
import { activeSessionHref, type ActiveSession } from "@/lib/public-api";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { KeyHint } from "@/components/ui/key-hint";
import { CmdkButton } from "./cmdk-button";
import { RegionTitle } from "./region-title";

/**
 * Üst şerit (Doc 27 L2): bölge adı · ⌘K · "devam et" pili (Doc 27 §2.4 oturum
 * hafızası) · zil (Doc 52) · tema · profil. Yalnız ≥md; dar ekranda MobileAppHeader. Veri
 * alınamazsa pil sessizce yoktur — şerit sayfayı asla bloklamaz.
 */
export async function TopStrip() {
  const active = await api<ActiveSession | null>("/quiz/active-session").catch(
    () => null,
  );
  return (
    <header className="sticky top-0 z-30 hidden h-14 items-center gap-3 border-b border-line bg-bg/90 px-6 backdrop-blur md:flex">
      <RegionTitle className="type-subhead text-ink" />
      <CmdkButton className="tk-interactive ml-2 hidden h-9 cursor-pointer items-center gap-2 rounded-control border border-line px-3 text-[13px] text-ink-soft hover:border-ink-soft hover:text-ink lg:flex">
        <Search size={16} aria-hidden />
        <span>Ara</span>
        <KeyHint keys="⌘K" />
      </CmdkButton>
      <div className="flex-1" />
      {active?.resumable ? (
        <Link
          href={activeSessionHref(active)}
          className="tk-interactive flex h-9 items-center gap-2 rounded-pill bg-warning-soft px-3 text-[13px] font-semibold text-warning-ink hover:brightness-105"
        >
          <Pause size={14} aria-hidden />
          <span className="tabular">
            {active.answeredCount}/{active.totalQuestions}
          </span>
          <span className="hidden lg:inline">kaldığın yerden devam</span>
        </Link>
      ) : null}
      <NotificationBell />
      <ThemeToggle compact />
      <Link
        href="/profil"
        aria-label="Profil"
        className="tk-interactive flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:border-ink-soft hover:text-ink"
      >
        <UserRound size={18} aria-hidden />
      </Link>
    </header>
  );
}

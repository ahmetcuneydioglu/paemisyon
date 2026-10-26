"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/cn";
import type { InboxPage } from "@/lib/notifications";
import { Popover } from "@/components/ui/popover";
import { NotificationRow } from "./notification-row";

const POLL_MS = 60_000;

/**
 * Zil + okunmamış rozeti (Doc 52 karar 5). Masaüstünde son dört bildirimi
 * açılır panelde gösterir; dar ekranda doğrudan /bildirimler'e gider. Sayaç
 * odağa dönüşte ve dakikada bir tazelenir; hata sessizdir (kabuk bloklanmaz).
 */
export function NotificationBell({ mobile = false }: { mobile?: boolean }) {
  const pathname = usePathname();
  const [count, setCount] = useState<number | null>(null);
  const [recent, setRecent] = useState<InboxPage | null>(null);

  const refresh = useCallback(() => {
    apiClient<{ count: number }>("/me/notifications/unread-count")
      .then((r) => setCount(r.count))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, POLL_MS);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh, pathname]);

  const badge =
    count && count > 0 ? (
      <span
        className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-accent px-1 text-[11px] font-semibold text-on-accent"
        aria-hidden
      >
        {count > 99 ? "99+" : count}
      </span>
    ) : null;
  const label = count ? `Bildirimler, ${count} okunmamış` : "Bildirimler";

  if (mobile) {
    return (
      <Link
        href="/bildirimler"
        aria-label={label}
        className="tk-interactive relative flex size-11 items-center justify-center rounded-control text-ink-soft hover:bg-surface-alt hover:text-ink"
      >
        <Bell size={22} strokeWidth={1.75} aria-hidden />
        {badge}
      </Link>
    );
  }

  return (
    <Popover
      align="end"
      className="w-[400px] p-3"
      trigger={({ open, toggle, id }) => (
        <button
          type="button"
          aria-label={label}
          aria-expanded={open}
          aria-controls={id}
          onClick={() => {
            if (!open)
              apiClient<InboxPage>("/me/notifications?limit=4")
                .then(setRecent)
                .catch(() => setRecent({ items: [], nextCursor: null }));
            toggle();
          }}
          className={cn(
            "tk-interactive relative flex size-9 items-center justify-center rounded-full border border-line bg-surface text-ink-soft hover:border-ink-soft hover:text-ink",
            open && "border-ink-soft text-ink",
          )}
        >
          <Bell size={18} aria-hidden />
          {badge}
        </button>
      )}
    >
      {(close) => (
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between px-1">
            <span className="type-subhead text-ink">
              Bildirimler{count ? ` · ${count} yeni` : ""}
            </span>
            {count ? (
              <button
                type="button"
                className="type-body-sm text-accent-ink hover:underline"
                onClick={() => {
                  apiClient("/me/notifications/read-all", { method: "POST" })
                    .then(() => {
                      setCount(0);
                      setRecent((r) => r && { ...r, items: r.items.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })) });
                    })
                    .catch(() => undefined);
                }}
              >
                Tümünü okundu say
              </button>
            ) : null}
          </div>
          {recent == null ? (
            <p className="type-body-sm px-1 py-3 text-ink-subtle">Yükleniyor…</p>
          ) : recent.items.length === 0 ? (
            <p className="type-body-sm px-1 py-3 text-ink-subtle">Henüz bildirim yok.</p>
          ) : (
            recent.items.map((it) => (
              <NotificationRow key={it.id} item={it} compact onNavigate={close} />
            ))
          )}
          <Link
            href="/bildirimler"
            onClick={close}
            className="type-body-sm border-t border-line pt-2 text-center text-accent-ink hover:underline"
          >
            Tümünü gör →
          </Link>
        </div>
      )}
    </Popover>
  );
}

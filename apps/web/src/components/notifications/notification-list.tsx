"use client";

import { Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { groupInbox, type InboxItem, type InboxPage } from "@/lib/notifications";
import { Button, ButtonLink } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { EmptyState } from "@/components/ui/empty-state";
import { NotificationRow } from "./notification-row";

/**
 * /bildirimler listesi: Tümü · Okunmamış süzgeci, gün grupları, "Tümünü okundu
 * say", imleçli "daha fazla". Görünen satırlar okunmuş sayılmaz; okuma
 * dokunuşla (clicked → readAt) ya da toplu düğmeyle olur.
 */
export function NotificationList() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [items, setItems] = useState<InboxItem[] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(
    (after: string | null) => {
      const qs = new URLSearchParams({ limit: "30" });
      if (unreadOnly) qs.set("unreadOnly", "true");
      if (after) qs.set("cursor", after);
      return apiClient<InboxPage>(`/me/notifications?${qs}`);
    },
    [unreadOnly],
  );

  // Süzgeç değişince baştan yükle; sonuç geldiğinde state yazılır (efektte senkron setState yok).
  useEffect(() => {
    let cancelled = false;
    fetchPage(null)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setCursor(page.nextCursor);
        setError(null);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Bildirimler alınamadı.");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage]);

  const loadMore = async () => {
    if (!cursor) return;
    setBusy(true);
    try {
      const page = await fetchPage(cursor);
      setItems((prev) => [...(prev ?? []), ...page.items]);
      setCursor(page.nextCursor);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Bildirimler alınamadı.");
    } finally {
      setBusy(false);
    }
  };

  const unread = items?.filter((i) => !i.readAt).length ?? 0;
  const readAll = async () => {
    await apiClient("/me/notifications/read-all", { method: "POST" }).catch(() => undefined);
    setItems((prev) => prev?.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })) ?? prev);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Chip label="Tümü" selected={!unreadOnly} onClick={() => setUnreadOnly(false)} />
        <Chip label={unread ? `Okunmamış · ${unread}` : "Okunmamış"} selected={unreadOnly} onClick={() => setUnreadOnly(true)} />
        <div className="flex-1" />
        {unread > 0 ? (
          <Button variant="ghost" size="sm" onClick={readAll}>
            Tümünü okundu say
          </Button>
        ) : null}
      </div>
      {error ? <p className="type-body-sm rounded-card bg-danger-soft px-4 py-3 text-danger-ink">{error}</p> : null}
      {items == null ? (
        <p className="type-body-sm text-ink-subtle">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={unreadOnly ? "Okunmamış bildirim yok" : "Henüz bildirim yok"}
          body="Deneme sonuçların, günün sorusu ve hatırlatmaların burada birikir. Günde en fazla bir hatırlatma gönderiyoruz."
          action={<ButtonLink href="/profil/bildirimler" variant="secondary">Bildirim tercihleri</ButtonLink>}
        />
      ) : (
        groupInbox(items).map((g) => (
          <section key={g.label} className="flex flex-col gap-2">
            <h2 className="type-label text-ink-subtle">{g.label.toLocaleUpperCase("tr-TR")}</h2>
            {g.items.map((it) => (
              <NotificationRow key={it.id} item={it} />
            ))}
          </section>
        ))
      )}
      {cursor ? (
        <Button variant="secondary" onClick={loadMore} loading={busy}>
          Daha eski bildirimler
        </Button>
      ) : items && items.length > 0 ? (
        <p className="type-body-sm text-center text-ink-subtle">Bildirimler 180 gün saklanır.</p>
      ) : null}
    </div>
  );
}

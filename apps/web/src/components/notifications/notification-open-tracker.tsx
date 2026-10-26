"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { apiClient } from "@/lib/api-client";

/**
 * Web push tıklaması `?nid=<bildirim>` ile gelir (push.service webLink). Kabuk
 * `opened` olayını yazar ve parametreyi adresten siler; sayfa yeniden yüklenmez.
 */
export function NotificationOpenTracker() {
  const params = useSearchParams();
  const pathname = usePathname();
  const nid = params.get("nid");
  useEffect(() => {
    if (!nid || !/^[0-9a-f-]{36}$/i.test(nid)) return;
    apiClient(`/me/notifications/${nid}/events`, {
      method: "POST",
      body: { type: "opened", source: "web" },
    }).catch(() => undefined);
    const next = new URLSearchParams(params.toString());
    next.delete("nid");
    const qs = next.toString();
    window.history.replaceState(null, "", `${pathname}${qs ? `?${qs}` : ""}`);
  }, [nid, params, pathname]);
  return null;
}

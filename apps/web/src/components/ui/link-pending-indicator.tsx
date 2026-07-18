"use client";

import { useLinkStatus } from "next/link";

/** Link içinde kullanılır; tıklanan hedef yanıt verene kadar anlık geri bildirim verir. */
export function LinkPendingIndicator() {
  const { pending } = useLinkStatus();
  if (!pending) return null;

  return (
    <span
      className="pointer-events-none absolute inset-x-2 bottom-0 h-0.5 overflow-hidden rounded-full bg-brand/20"
      role="status"
      aria-label="Sayfa açılıyor"
    >
      <span className="block h-full w-1/2 animate-pulse rounded-full bg-brand motion-reduce:animate-none" />
    </span>
  );
}

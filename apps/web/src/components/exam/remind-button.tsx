"use client";

import { useState } from "react";
import { Bell, BellOff } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

/** "Hatırlat" (Doc 50 M1 hero-b): 1 gün ve 1 saat önce push. Durum sunucuda. */
export function RemindButton({
  examId,
  initial,
  className,
}: {
  examId: string;
  initial: boolean;
  className?: string;
}) {
  const [on, setOn] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      const r = await apiClient<{ reminding: boolean }>(`/exams/${examId}/remind`, {
        method: "POST",
        body: { on: !on },
      });
      setOn(r.reminding);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Hatırlatma ayarlanamadı.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className={className}>
      <Button
        variant="secondary"
        onClick={() => void toggle()}
        loading={busy}
        aria-pressed={on}
        leadingIcon={on ? <BellOff size={18} aria-hidden /> : <Bell size={18} aria-hidden />}
        className="w-full"
      >
        {on ? "Hatırlatma açık" : "Hatırlat"}
      </Button>
      {error ? <p className="type-body-sm mt-1 text-danger-ink">{error}</p> : null}
    </div>
  );
}

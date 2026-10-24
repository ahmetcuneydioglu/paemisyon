"use client";

import { useEffect, useState } from "react";

/** Kalan süre sayacı (hh:mm:ss) — sunucu son tarihine sayar. */
export function DeadlineClock({
  deadlineAt,
  className,
}: {
  deadlineAt: string;
  className?: string;
}) {
  const [left, setLeft] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setLeft(Math.max(0, new Date(deadlineAt).getTime() - Date.now()));
    const t0 = setTimeout(tick, 0);
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [deadlineAt]);
  if (left === null) return <span className={className}>--:--:--</span>;
  const s = Math.floor(left / 1000);
  const hh = String(Math.floor(s / 3600)).padStart(2, "0");
  const mm = String(Math.floor((s % 3600) / 60)).padStart(2, "0");
  const ss = String(s % 60).padStart(2, "0");
  return (
    <span className={className} role="timer" aria-label="Kalan süre">
      {hh}:{mm}:{ss}
    </span>
  );
}

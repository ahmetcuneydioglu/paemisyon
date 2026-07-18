"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Bir sonraki denemeye geri sayım — eski ana sayfa #clock (gün/saat/dk/sn).
 * Süre dolunca sayfayı tazeler (liste durumları sunucudan yeniden hesaplanır).
 */
export function Countdown({ target }: { target: string }) {
  const router = useRouter();
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const compute = () => Math.max(0, new Date(target).getTime() - Date.now());
    const tick = () => {
      const ms = compute();
      setLeft(ms);
      if (ms <= 0) {
        clearInterval(t);
        router.refresh();
      }
    };
    const t0 = setTimeout(tick, 0); // ilk değer sonraki tick'te (senkron setState yasağı)
    const t = setInterval(tick, 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [target, router]);

  if (left === null) return null;
  const s = Math.floor(left / 1000);
  const units = [
    { v: Math.floor(s / 86400), l: "Gün" },
    { v: Math.floor((s % 86400) / 3600), l: "Saat" },
    { v: Math.floor((s % 3600) / 60), l: "Dakika" },
    { v: s % 60, l: "Saniye" },
  ];

  return (
    <div className="flex justify-center gap-3" role="timer" aria-live="off">
      {units.map((u) => (
        <div key={u.l} className="min-w-[72px] bg-(--color-navy-deep) px-3 py-2 text-center">
          <div className="font-heading text-3xl font-bold text-(--color-yellow) tabular-nums">
            {String(u.v).padStart(2, "0")}
          </div>
          <div className="text-[11px] font-semibold tracking-wide text-white/80">{u.l}</div>
        </div>
      ))}
    </div>
  );
}

"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * Bir sonraki denemeye geri sayım — eski ana sayfa #clock (gün/saat/dk/sn).
 * Süre dolunca sayfayı tazeler (liste durumları sunucudan yeniden hesaplanır).
 */
/**
 * `blocks` (varsayılan): eski ana sayfanın 4 kutulu büyük sayacı.
 * `inline`: tek satır, dar alanlar için ("4 sa 59 dk"). Duyuru şeridi bunu
 * kullanır — kutulu sürüm 330px genişlik istiyor ve mobilde şeridin çağrı
 * düğmesini ekran dışına itiyordu.
 */
export function Countdown({
  target,
  variant = "blocks",
}: {
  target: string;
  variant?: "blocks" | "inline";
}) {
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

  if (variant === "inline") {
    // Sıfır olan baştaki birimler gizlenir: "0 gün 4 sa" yerine "4 sa".
    const gosterilecek = units.filter((u, i) => u.v > 0 || units.slice(0, i).some((x) => x.v > 0));
    const kisa: Record<string, string> = { Gün: "gün", Saat: "sa", Dakika: "dk", Saniye: "sn" };
    return (
      <span className="tabular" role="timer" aria-live="off">
        {(gosterilecek.length ? gosterilecek : units.slice(-1))
          .slice(0, 3)
          .map((u) => `${u.v} ${kisa[u.l]}`)
          .join(" ")}
      </span>
    );
  }

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

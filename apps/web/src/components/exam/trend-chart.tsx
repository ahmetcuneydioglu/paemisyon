import { Lock } from "lucide-react";
import Link from "next/link";
import type { ExamHistory } from "@/lib/types";
import { fmtNet } from "@/lib/exam-ui";
import { Card } from "@/components/ui/card";

/**
 * Net gelişim grafiği (Doc 50 M8): son 6 resmî çözüm. Çizgi SVG (token rengi
 * `currentColor`), etiketler HTML; dar ekranda küçülmez. Premium değilse kilit.
 */
export function TrendChart({ trend }: { trend: ExamHistory["trend"] }) {
  const pts = trend.points;
  const W = 600;
  const H = 140;
  const min = Math.min(0, ...pts.map((p) => p.score)) - 5;
  const max = Math.max(100, ...pts.map((p) => p.score));
  const x = (i: number) => (pts.length <= 1 ? W / 2 : 12 + (i * (W - 24)) / (pts.length - 1));
  const y = (v: number) => H - 10 - ((v - min) / (max - min)) * (H - 20);
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.score).toFixed(1)}`).join(" ");

  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <span className="type-label text-ink-subtle">Net gelişimi · son 6 resmî çözüm</span>
        {trend.locked ? (
          <Lock size={16} className="text-ink-subtle" aria-hidden />
        ) : trend.delta != null ? (
          <span className={trend.delta >= 0 ? "type-subhead text-accent-ink" : "type-subhead text-warning-ink"}>
            {trend.delta >= 0 ? "+" : ""}
            {fmtNet(trend.delta)}
          </span>
        ) : null}
      </div>
      {trend.locked ? (
        <div className="flex flex-col gap-2">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-28 w-full text-line opacity-60" aria-hidden>
            <path d={`M12,${H - 30} L${W / 4},${H - 50} L${W / 2},${H - 45} L${(3 * W) / 4},${H - 70} L${W - 12},${H - 85}`} fill="none" stroke="currentColor" strokeWidth="2.5" />
          </svg>
          <p className="type-body-sm text-ink-soft">
            Net gelişim grafiği ve ortalama Premium ile açılır.{" "}
            <Link href="/premium" className="font-semibold text-accent-ink hover:underline">Premium&apos;u incele</Link>
          </p>
        </div>
      ) : pts.length < 2 ? (
        <p className="type-body-sm text-ink-soft">İki resmî çözümden sonra gelişim çizgin burada başlar.</p>
      ) : (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} className="h-32 w-full" role="img" aria-label={`Net gelişimi: ${pts.map((p) => fmtNet(p.score)).join(", ")}`}>
            {[0.25, 0.5, 0.75].map((f) => (
              <line key={f} x1="0" x2={W} y1={10 + f * (H - 20)} y2={10 + f * (H - 20)} className="stroke-line" strokeWidth="1" />
            ))}
            <path d={d} fill="none" className="stroke-accent" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {pts.map((p, i) => (
              <circle key={p.attemptId} cx={x(i)} cy={y(p.score)} r="4.5" className="fill-accent" />
            ))}
          </svg>
          <div className="flex justify-between">
            {pts.map((p) => (
              <span key={p.attemptId} className="type-body-sm tabular text-ink-subtle">
                {fmtNet(p.score)}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-6">
            <Stat label="Ortalama" value={fmtNet(trend.mean)} />
            <Stat label="En iyi" value={fmtNet(trend.best)} />
          </div>
        </>
      )}
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="flex flex-col">
      <span className="type-label text-ink-subtle">{label}</span>
      <span className="type-subhead tabular text-ink">{value}</span>
    </span>
  );
}

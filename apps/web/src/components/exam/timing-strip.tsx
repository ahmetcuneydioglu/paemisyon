import { Card, CardTitle } from "@/components/ui/card";

export interface TimingCell {
  order: number;
  timeSpentMs: number | null;
  status: "correct" | "wrong" | "blank";
}

const statusTone: Record<TimingCell["status"], string> = {
  correct: "bg-success/70",
  wrong: "bg-danger/70",
  blank: "bg-line",
};

/**
 * Süre yönetimi şeridi (Doc 27 §3.8, wireframe 11): soru sırasına göre harcanan
 * süre — hangi bölümde yavaşladın, hangi soru tipi zaman yedi. Çubuk yüksekliği
 * süreye oranlı; ortalamanın 1,5 katını aşan sorular işaretlenir (sakin dil,
 * suçlama yok). Süre verisi olmayan eski denemelerde dürüst boş durum.
 */
export function TimingStrip({ timing }: { timing: TimingCell[] }) {
  const timed = timing.filter((t) => t.timeSpentMs != null && t.timeSpentMs > 0);
  if (timing.length === 0) return null;

  if (timed.length === 0) {
    return (
      <Card className="mt-4">
        <CardTitle>Süre yönetimi</CardTitle>
        <p className="mt-1 text-[14px] text-ink-soft">
          Bu denemede soru başına süre verisi yok — bundan sonraki denemelerde otomatik
          toplanır ve şerit burada oluşur.
        </p>
      </Card>
    );
  }

  const avg = timed.reduce((s, t) => s + t.timeSpentMs!, 0) / timed.length;
  const max = timed.reduce((m, t) => Math.max(m, t.timeSpentMs!), 0);
  const slowThreshold = avg * 1.5;
  const slow = [...timed]
    .filter((t) => t.timeSpentMs! > slowThreshold)
    .sort((a, b) => b.timeSpentMs! - a.timeSpentMs!)
    .slice(0, 3);
  const sec = (ms: number) => Math.round(ms / 1000);

  return (
    <Card className="mt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <CardTitle>Süre yönetimi</CardTitle>
        <span className="tabular tk-caption">
          soru başına ort. {sec(avg)}sn · {timed.length} soruda ölçüldü
        </span>
      </div>
      <div
        className="mt-3 flex h-20 items-end gap-[3px] overflow-x-auto pb-1"
        role="img"
        aria-label={`Soru başına süre şeridi — ortalama ${sec(avg)} saniye`}
      >
        {timing.map((t) => {
          const h =
            t.timeSpentMs != null && t.timeSpentMs > 0
              ? Math.max(6, (t.timeSpentMs / max) * 72)
              : 4;
          const isSlow = t.timeSpentMs != null && t.timeSpentMs > slowThreshold;
          return (
            <div
              key={t.order}
              title={`Soru ${t.order}: ${t.timeSpentMs != null ? `${sec(t.timeSpentMs)}sn` : "ölçüm yok"} · ${
                t.status === "correct" ? "doğru" : t.status === "wrong" ? "yanlış" : "boş"
              }`}
              className={[
                "min-w-[7px] flex-1 rounded-t-sm",
                statusTone[t.status],
                isSlow ? "outline outline-1 outline-warning" : "",
              ].join(" ")}
              style={{ height: `${h}px` }}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <p className="tk-caption">
          <span className="text-success">■ doğru</span> · <span className="text-danger">■ yanlış</span>{" "}
          · ■ boş · <span className="text-warning">□ ortalamanın 1,5 katından yavaş</span>
        </p>
        {slow.length > 0 && (
          <p className="tabular text-[12px] text-ink-soft">
            En çok zaman yiyenler:{" "}
            {slow.map((t) => `S${t.order} (${sec(t.timeSpentMs!)}sn)`).join(" · ")}
          </p>
        )}
      </div>
    </Card>
  );
}

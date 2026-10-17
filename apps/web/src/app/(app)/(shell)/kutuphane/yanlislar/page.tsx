import type { Metadata } from "next";
import { RotateCcw } from "lucide-react";
import { api } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = {
  title: "Yanlışlarım",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

interface WrongRow {
  questionId: string;
  wrongCount: number;
  stem: string | null;
  topicName: string | null;
}

/**
 * Yanlışlarım: tüm çözülmemiş yanlışların tek kuyruğu. Doğru çözülen soru kuyruktan
 * düşer. Ücretsiz: tekrar turu son 7 günün yanlışlarından; premium süresiz.
 */
export default async function YanlislarPage() {
  const rows = await api<WrongRow[]>("/review/wrong-answers").catch(
    () => [] as WrongRow[],
  );
  const byTopic = new Map<string, number>();
  for (const r of rows)
    byTopic.set(
      r.topicName ?? "Diğer",
      (byTopic.get(r.topicName ?? "Diğer") ?? 0) + 1,
    );
  const topTopics = [...byTopic.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4);
  const n = Math.min(10, rows.length);

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="min-w-0 flex-1">
        <Breadcrumb
          className="mb-3"
          items={[
            { label: "Kütüphane", href: "/kutuphane" },
            { label: "Yanlışlarım" },
          ]}
        />
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="type-title text-ink">Yanlışlarım</h1>
            <p className="type-body-sm text-ink-soft">
              {rows.length > 0 ? (
                <>
                  Kuyrukta <b className="tabular text-ink">{rows.length}</b>{" "}
                  soru — doğru çözdüğünde kendiliğinden düşer.
                  {topTopics.length > 0 ? (
                    <>
                      {" "}
                      En çok:{" "}
                      {topTopics.map(([t, c]) => `${t} (${c})`).join(" · ")}.
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  Kuyruk temiz — yanlışların buraya düşer, sistem onları
                  unutmaz.
                </>
              )}
            </p>
          </div>
          {rows.length > 0 ? (
            <ButtonLink
              href={`/seans?mode=review&count=${n}&scope=${encodeURIComponent("Yanlış tekrarı")}`}
            >
              {n} soruluk tekrar turu
            </ButtonLink>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <DataTable
            caption="Çözülmemiş yanlışlar"
            rows={rows}
            rowKey={(r) => r.questionId}
            columns={[
              {
                key: "soru",
                header: "Soru",
                cell: (r) => (
                  <span className="line-clamp-2 max-w-[52ch] text-ink">
                    {r.stem ?? "—"}
                  </span>
                ),
              },
              {
                key: "konu",
                header: "Konu",
                hideBelowMd: true,
                cell: (r) => (
                  <span className="whitespace-nowrap text-ink-soft">
                    {r.topicName ?? "—"}
                  </span>
                ),
              },
              {
                key: "yanlis",
                header: "Yanlış",
                align: "right",
                cell: (r) => <Badge tone="danger">×{r.wrongCount}</Badge>,
              },
            ]}
          />
        ) : (
          <Card className="border-dashed">
            <EmptyState
              icon={RotateCcw}
              title="Çözülmemiş yanlışın yok"
              body="Turlarda yanlış yaptığın her soru buraya düşer; doğru çözene kadar seni bekler."
              action={
                <ButtonLink href="/seans" variant="secondary">
                  Koç turu başlat
                </ButtonLink>
              }
            />
          </Card>
        )}
      </div>
      <CoachRail />
    </div>
  );
}

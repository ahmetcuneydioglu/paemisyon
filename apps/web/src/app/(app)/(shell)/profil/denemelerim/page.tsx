import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { ExamHistory, ExamHistoryItem } from "@/lib/types";
import { fmtNet } from "@/lib/exam-ui";
import { formatDate } from "@/lib/format";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ListRow } from "@/components/ui/list-row";
import { SectionHeader } from "@/components/ui/section-header";
import { TrendChart } from "@/components/exam/trend-chart";

export const metadata: Metadata = { title: "Deneme geçmişi", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Deneme geçmişi (Doc 50 M8): net gelişimi + üç grup (denemeler · haftalık · bana özel). */
export default async function MyExamsPage() {
  const h = await api<ExamHistory>("/exams/history/mine");
  const empty = h.denemeler.length + h.haftalik.length + h.kisisel.length === 0;
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:px-6">
      <Breadcrumb items={[{ label: "Denemeler", href: "/denemeler" }, { label: "Deneme geçmişi" }]} />
      <h1 className="type-title text-ink">Deneme geçmişi</h1>
      {empty ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="Henüz çözüm yok"
            body="İlk denemeni çöz, gelişimin burada görünsün."
            action={<ButtonLink href="/denemeler" variant="secondary">Denemelere git</ButtonLink>}
          />
        </Card>
      ) : (
        <>
          <TrendChart trend={h.trend} />
          <Group title="Denemeler" items={h.denemeler} />
          <Group title="Haftalık" items={h.haftalik} />
          <Group title="Bana özel" items={h.kisisel} />
        </>
      )}
    </div>
  );
}

function Group({ title, items }: { title: string; items: ExamHistoryItem[] }) {
  if (items.length === 0) return null;
  return (
    <section className="flex flex-col gap-2">
      <SectionHeader title={title} />
      <Card className="py-1">
        {items.map((it, i) => {
          const sub = `${it.completedAt ? formatDate(it.completedAt) : "—"} · ${
            it.role === "official" ? "resmî" : it.role === "practice" ? "tekrar" : it.role === "personal" ? `${it.totalQuestions} soru` : ""
          }${it.closedReason === "timeout" ? " · süre doldu" : ""}`;
          const right = it.resultLocked
            ? "sonuç bekliyor"
            : it.rank != null
              ? `${it.rank}.`
              : it.role === "official"
                ? "sıralama bekliyor"
                : "sırasız";
          return (
            <ListRow
              key={it.attemptId}
              title={it.title}
              subtitle={sub}
              trailing={
                <span className="flex flex-col items-end">
                  <span className={it.resultLocked ? "type-subhead text-ink-subtle" : "type-subhead tabular text-ink"}>
                    {it.resultLocked ? "—" : fmtNet(it.score)}
                  </span>
                  <span className="type-body-sm text-ink-subtle">{right}</span>
                </span>
              }
              href={`/sonuc/${it.attemptId}`}
              divider={i < items.length - 1}
            />
          );
        })}
      </Card>
    </section>
  );
}

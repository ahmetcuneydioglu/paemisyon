import type { Metadata } from "next";
import { ClipboardCheck } from "lucide-react";
import { api } from "@/lib/api";
import type { MyAttempt } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Denemelerim",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function MyExamsPage() {
  const attempts = await api<MyAttempt[]>("/exams/attempts/mine");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:px-6">
      <Breadcrumb
        className="mb-3"
        items={[{ label: "Ben", href: "/profil" }, { label: "Denemelerim" }]}
      />
      <h1 className="type-title text-ink">Denemelerim</h1>
      <p className="type-body-sm mt-1 mb-5 text-ink-soft">
        Web ve mobildeki bütün deneme geçmişin.
      </p>
      {attempts.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardCheck}
            title="Henüz deneme çözmedin"
            body="İlk denemenden sonra gelişim arşivin burada başlayacak."
            action={<ButtonLink href="/denemeler">Denemelere git</ButtonLink>}
          />
        </Card>
      ) : (
        <DataTable
          caption="Deneme geçmişim"
          rows={attempts}
          rowKey={(a) => a.attemptId}
          columns={[
            {
              key: "deneme",
              header: "Deneme",
              cell: (a) => (
                <span className="type-subhead text-ink">
                  {a.exam?.title ?? "Deneme"}
                </span>
              ),
            },
            {
              key: "tarih",
              header: "Tarih",
              hideBelowMd: true,
              cell: (a) => formatDate(a.startedAt),
            },
            {
              key: "durum",
              header: "Durum",
              cell: (a) =>
                a.status === "completed" ? (
                  <Badge tone="success">Tamamlandı</Badge>
                ) : (
                  <Badge tone="warning">Devam ediyor</Badge>
                ),
            },
            {
              key: "net",
              header: "Net",
              align: "right",
              cell: (a) => (
                <span className="type-subhead text-ink">
                  {a.score != null ? a.score.toFixed(2) : "—"}
                </span>
              ),
            },
            {
              key: "eylem",
              header: "",
              align: "right",
              cell: (a) =>
                a.status === "completed" ? (
                  <ButtonLink
                    href={`/sonuc/${a.attemptId}`}
                    variant="secondary"
                    size="sm"
                  >
                    Sonucu aç
                  </ButtonLink>
                ) : (
                  <ButtonLink
                    href={a.exam?.id ? `/sinav/${a.exam.id}` : "/denemeler"}
                    size="sm"
                  >
                    Devam et
                  </ButtonLink>
                ),
            },
          ]}
        />
      )}
    </div>
  );
}

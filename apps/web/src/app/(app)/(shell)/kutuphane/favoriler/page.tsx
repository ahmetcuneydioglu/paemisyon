import type { Metadata } from "next";
import { Star } from "lucide-react";
import { api } from "@/lib/api";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import { EmptyState } from "@/components/ui/empty-state";
import { KeyHint } from "@/components/ui/key-hint";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = {
  title: "Favorilerim",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

interface BookmarkRow {
  questionId: string;
  stem: string | null;
  topicName: string | null;
}

/** Favorilerim: "bunu sonra çözeceğim" koleksiyonu; tur içinde F ile eklenir. */
export default async function FavorilerPage() {
  const rows = await api<BookmarkRow[]>("/review/bookmarks").catch(
    () => [] as BookmarkRow[],
  );
  const n = Math.min(10, rows.length);

  return (
    <div className="mx-auto flex max-w-7xl gap-8 px-4 py-6 md:px-6">
      <div className="min-w-0 flex-1">
        <Breadcrumb
          className="mb-3"
          items={[
            { label: "Kütüphane", href: "/kutuphane" },
            { label: "Favorilerim" },
          ]}
        />
        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h1 className="type-title text-ink">Favorilerim</h1>
            <p className="type-body-sm text-ink-soft">
              {rows.length > 0 ? (
                <>
                  <b className="tabular text-ink">{rows.length}</b> yıldızlı
                  soru — tur içinde <KeyHint keys="F" /> ile eklenir.
                </>
              ) : (
                <>Henüz favori yok — bir turda beğendiğin soruyu favorile.</>
              )}
            </p>
          </div>
          {rows.length > 0 ? (
            <ButtonLink
              href={`/seans?mode=favorites&count=${n}&scope=${encodeURIComponent("Favorilerim")}`}
            >
              {n} favoriyle tur
            </ButtonLink>
          ) : null}
        </div>

        {rows.length > 0 ? (
          <DataTable
            caption="Favori sorular"
            rows={rows}
            rowKey={(r) => r.questionId}
            columns={[
              {
                key: "soru",
                header: "Soru",
                cell: (r) => (
                  <span className="line-clamp-2 max-w-[56ch] text-ink">
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
            ]}
          />
        ) : (
          <Card className="border-dashed">
            <EmptyState
              icon={Star}
              title="Koleksiyonun boş"
              body="Tur sırasında bir soruyu sonra tekrar çözmek istersen favorine ekle; buradan toplu çözersin."
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

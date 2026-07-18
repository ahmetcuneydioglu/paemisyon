import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Favorilerim", robots: { index: false } };
export const dynamic = "force-dynamic";

interface BookmarkRow {
  questionId: string;
  stem: string | null;
  topicName: string | null;
}

/**
 * Favorilerim (Doc 25 Bölge 2): "bunu sonra çözeceğim" el koleksiyonu.
 * Seans içinde F ile yıldızlanan sorular burada; favori reçetesiyle çözülür.
 */
export default async function FavorilerPage() {
  const rows = await api<BookmarkRow[]>("/review/bookmarks").catch(() => [] as BookmarkRow[]);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      <div className="min-w-0 flex-1">
        <nav className="tk-caption mb-3" aria-label="breadcrumb">
          <Link href="/kutuphane" className="hover:text-ink">Kütüphane</Link> › Favorilerim
        </nav>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Favorilerim</h1>
            <p className="mt-1 text-[13px] text-ink-soft">
              {rows.length > 0 ? (
                <>
                  <b className="tabular text-ink">{rows.length}</b> yıldızlı soru — seans içinde{" "}
                  <kbd className="rounded border border-line px-1">F</kbd> ile eklenir.
                </>
              ) : (
                <>Henüz favori yok — bir seansta beğendiğin soruyu ☆ ile işaretle.</>
              )}
            </p>
          </div>
          {rows.length > 0 && (
            <ButtonLink
              href={`/seans?mode=favorites&count=${Math.min(10, rows.length)}&scope=${encodeURIComponent("Favorilerim")}`}
            >
              {Math.min(10, rows.length)} favoriyle seans
            </ButtonLink>
          )}
        </div>

        {rows.length > 0 ? (
          <Card className="p-0">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="tk-caption border-b border-line text-left">
                  <th className="px-4 py-2.5 font-semibold">Soru</th>
                  <th className="px-4 py-2.5 font-semibold">Konu</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.questionId} className="border-b border-line last:border-0">
                    <td className="max-w-[52ch] px-4 py-2.5 text-ink">
                      <span className="line-clamp-2">{r.stem ?? "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-ink-soft">
                      {r.topicName ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="border-dashed p-8 text-center">
            <p className="text-2xl" aria-hidden>☆</p>
            <CardTitle className="mt-2">Koleksiyonun boş</CardTitle>
            <p className="mx-auto mt-1 max-w-[44ch] text-[14px] text-ink-soft">
              Seans sırasında bir soruyu sonra tekrar çözmek istersen ☆ ile favorine ekle;
              buradan toplu çözersin.
            </p>
            <div className="mt-4">
              <ButtonLink href="/seans" variant="secondary">
                Koç seansı başlat
              </ButtonLink>
            </div>
          </Card>
        )}
      </div>

      <CoachRail />
    </div>
  );
}

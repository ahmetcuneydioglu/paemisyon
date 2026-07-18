import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { CoachRail } from "@/components/shell/coach-rail";

export const metadata: Metadata = { title: "Yanlışlarım", robots: { index: false } };
export const dynamic = "force-dynamic";

interface WrongRow {
  questionId: string;
  wrongCount: number;
  stem: string | null;
  topicName: string | null;
}

/**
 * Yanlışlarım (Doc 25 Bölge 2): tüm çözülmemiş yanlışların tek kuyruğu.
 * "Hatalarım kaybolmasın" — doğru çözülen soru kuyruktan kendiliğinden düşer.
 * Free: tekrar seansı son 7 günün yanlışlarından; premium: süresiz hafıza.
 */
export default async function YanlislarPage() {
  const rows = await api<WrongRow[]>("/review/wrong-answers").catch(() => [] as WrongRow[]);
  const byTopic = new Map<string, number>();
  for (const r of rows) {
    const t = r.topicName ?? "Diğer";
    byTopic.set(t, (byTopic.get(t) ?? 0) + 1);
  }
  const topTopics = [...byTopic.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6">
      <div className="min-w-0 flex-1">
        <nav className="tk-caption mb-3" aria-label="breadcrumb">
          <Link href="/kutuphane" className="hover:text-ink">Kütüphane</Link> › Yanlışlarım
        </nav>

        <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-heading text-xl font-bold text-ink">Yanlışlarım</h1>
            <p className="mt-1 text-[13px] text-ink-soft">
              {rows.length > 0 ? (
                <>
                  Kuyrukta <b className="tabular text-ink">{rows.length}</b> soru — doğru
                  çözdüğünde kendiliğinden düşer.
                  {topTopics.length > 0 && (
                    <> En çok: {topTopics.map(([t, n]) => `${t} (${n})`).join(" · ")}.</>
                  )}
                </>
              ) : (
                <>Kuyruk temiz — yanlışların buraya düşer, sistem onları unutmaz.</>
              )}
            </p>
          </div>
          {rows.length > 0 && (
            <ButtonLink
              href={`/seans?mode=review&count=${Math.min(10, rows.length)}&scope=${encodeURIComponent("Yanlış tekrarı")}`}
            >
              {Math.min(10, rows.length)} soruluk tekrar seansı
            </ButtonLink>
          )}
        </div>

        {rows.length > 0 ? (
          <Card className="p-0">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="tk-caption border-b border-line text-left">
                  <th className="px-4 py-2.5 font-semibold">Soru</th>
                  <th className="px-3 py-2.5 font-semibold">Konu</th>
                  <th className="px-4 py-2.5 text-right font-semibold">Yanlış</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.questionId} className="border-b border-line last:border-0">
                    <td className="max-w-[48ch] px-4 py-2.5 text-ink">
                      <span className="line-clamp-2">{r.stem ?? "—"}</span>
                    </td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-ink-soft">
                      {r.topicName ?? "—"}
                    </td>
                    <td className="tabular px-4 py-2.5 text-right font-bold text-danger">
                      ×{r.wrongCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        ) : (
          <Card className="border-dashed p-8 text-center">
            <p className="text-2xl" aria-hidden>✨</p>
            <CardTitle className="mt-2">Çözülmemiş yanlışın yok</CardTitle>
            <p className="mx-auto mt-1 max-w-[44ch] text-[14px] text-ink-soft">
              Seanslarda yanlış yaptığın her soru buraya düşer; doğru çözene kadar seni bekler.
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

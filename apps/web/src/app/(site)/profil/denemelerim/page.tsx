import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { MyAttempt } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = { title: "Denemelerim", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Denemelerim — Doc 18 §2.7. iOS'ta çözülenler de görünür (ortak QuizSession). */
export default async function DenemelerimPage() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/giris");

  const attempts = await api<MyAttempt[]>("/exams/attempts/mine").catch(() => [] as MyAttempt[]);

  if (attempts.length === 0) {
    return (
      <div>
        <h2 className="head2">Denemelerim</h2>
        <EmptyState
          icon="icon-calendar"
          title="Henüz deneme çözmedin"
          message="Çözdüğün denemeler ve sonuçların burada listelenecek — iOS'ta çözdüklerin dahil."
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="head2">Denemelerim</h2>
      <div className="mx-auto max-w-4xl px-4 py-8">
        <table className="exam-table">
          <thead>
            <tr>
              <th>Deneme</th>
              <th>Tarih</th>
              <th>Durum</th>
              <th>Net</th>
              <th aria-label="İşlem" />
            </tr>
          </thead>
          <tbody>
            {attempts.map((a) => (
              <tr key={a.attemptId}>
                <td data-label="Deneme" className="font-semibold">
                  {a.exam?.title ?? "—"}
                </td>
                <td data-label="Tarih">{formatDate(a.startedAt)}</td>
                <td data-label="Durum">
                  {a.status === "completed" ? (
                    <span className="text-(--color-green)">Tamamlandı</span>
                  ) : (
                    <span className="text-(--color-orange)">Devam ediyor</span>
                  )}
                </td>
                <td data-label="Net">{a.score != null ? a.score.toFixed(2) : "—"}</td>
                <td>
                  {a.status === "completed" && (
                    <Link href={`/sonuc/${a.attemptId}`} className="btn2 btn2-orange">
                      Sonuç
                    </Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

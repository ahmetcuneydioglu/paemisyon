import type { Metadata } from "next";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { ExamListItem } from "@/lib/types";
import { ExamTable } from "@/components/exam-table";

export const metadata: Metadata = {
  title: "Denemeler",
  description:
    "Yaklaşan ve geçmiş online polislik deneme sınavları — tarih, katılım ve ortalamalarıyla.",
  alternates: { canonical: "/denemeler" },
};

export const dynamic = "force-dynamic";

/** Deneme listesi — eski /sinavlar (Doc 18 §3). */
export default async function DenemelerPage() {
  const [exams, { data: auth }] = await Promise.all([
    api<ExamListItem[]>("/exams").catch(() => [] as ExamListItem[]),
    (await supabaseServer()).auth.getUser(),
  ]);

  return (
    <div>
      <h2 className="head2">Sınavlar</h2>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ExamTable exams={exams} loggedIn={!!auth.user} />
      </div>
    </div>
  );
}

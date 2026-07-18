import type { Metadata } from "next";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { ExamListItem, MyAttempt } from "@/lib/types";
import { ExamTable } from "@/components/exam-table";
import { ExamCenter } from "@/components/exam/exam-center";

export const metadata: Metadata = {
  title: "Denemeler",
  description:
    "Yaklaşan ve geçmiş online polislik deneme sınavları — tarih, katılım ve ortalamalarıyla.",
  alternates: { canonical: "/denemeler" },
};

export const dynamic = "force-dynamic";

/**
 * Deneme merkezi (Doc 27 §3.8) — aynı URL iki derinlik:
 * girişsiz → miras tablo (SEO), girişli → takvim + geri sayım + gelişim çizgim.
 */
export default async function DenemelerPage() {
  const [exams, { data: auth }] = await Promise.all([
    api<ExamListItem[]>("/exams").catch(() => [] as ExamListItem[]),
    (await supabaseServer()).auth.getUser(),
  ]);

  if (auth.user) {
    const attempts = await api<MyAttempt[]>("/exams/attempts/mine").catch(
      () => [] as MyAttempt[],
    );
    return <ExamCenter exams={exams} attempts={attempts} />;
  }

  return (
    <div>
      <h2 className="head2">Sınavlar</h2>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ExamTable exams={exams} loggedIn={false} />
      </div>
    </div>
  );
}

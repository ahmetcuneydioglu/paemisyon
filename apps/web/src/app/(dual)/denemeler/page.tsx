import type { Metadata } from "next";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
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
  const [publicExams, user] = await Promise.all([
    api<ExamListItem[]>("/exams", { auth: false, next: { revalidate: 30 } }).catch(
      () => [] as ExamListItem[],
    ),
    getCurrentUser(),
  ]);

  if (user) {
    const attempts = await api<MyAttempt[]>("/exams/attempts/mine").catch(
      () => [] as MyAttempt[],
    );
    const attemptByExam = new Map(
      attempts
        .filter((attempt) => attempt.exam)
        .map((attempt) => [attempt.exam!.id, attempt] as const),
    );
    const exams = publicExams.map((exam) => {
      const attempt = attemptByExam.get(exam.id);
      return {
        ...exam,
        myAttempt: attempt
          ? { id: attempt.attemptId, status: attempt.status }
          : null,
      };
    });
    return <ExamCenter exams={exams} attempts={attempts} />;
  }

  return (
    <div>
      <h2 className="head2">Sınavlar</h2>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ExamTable exams={publicExams} loggedIn={false} />
      </div>
    </div>
  );
}

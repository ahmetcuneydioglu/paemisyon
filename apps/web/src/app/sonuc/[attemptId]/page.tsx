import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { AttemptResult } from "@/lib/types";
import { ResultTiles } from "@/components/result-tiles";
import { ReviewList } from "@/components/review-list";

export const metadata: Metadata = { title: "Sınav Sonucu", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Sonuç + inceleme — eski sinav-sonuc.php (Doc 18 §2.4). Yalnız sahibi. */
export default async function SonucPage({ params }: { params: Promise<{ attemptId: string }> }) {
  const { attemptId } = await params;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/giris");

  let result: AttemptResult;
  try {
    result = await api<AttemptResult>(`/exams/attempts/${attemptId}`);
  } catch (e) {
    if (e instanceof ApiError && e.code === "EXAM_IN_PROGRESS") {
      const examId = (e.details as { examId?: string } | undefined)?.examId;
      return (
        <div className="mx-auto max-w-2xl px-4 py-16">
          <div className="card-content text-center">
            <h1 className="head3 mb-3">
              <i className="icon-timer" aria-hidden />
              Sınav Devam Ediyor
            </h1>
            <p className="mb-6 text-sm">
              Bu sınavın süresi henüz dolmadı — sonucu, sınav bittikten sonra görebilirsin.
            </p>
            {examId && (
              <Link href={`/sinav/${examId}`} className="btn-old btn-old-green">
                Sınava Dön
              </Link>
            )}
          </div>
        </div>
      );
    }
    throw e;
  }

  return (
    <div>
      <ResultTiles result={result} />
      <div className="mx-auto max-w-3xl px-4 pt-6 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          <Link href={`/siralama/${result.exam.id}`} className="btn-old btn-old-navy">
            Sıralamayı Gör
          </Link>
          <Link href="/denemeler" className="btn-old btn-old-green">
            Diğer Denemeler
          </Link>
        </div>
      </div>
      <h2 className="head2 mt-8">Cevap İncelemesi</h2>
      <ReviewList questions={result.review} showAnswers />
    </div>
  );
}

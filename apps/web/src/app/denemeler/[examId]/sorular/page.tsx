import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import type { ReviewQuestion } from "@/lib/types";
import { EmptyState } from "@/components/empty-state";
import { ReviewList } from "@/components/review-list";

export const metadata: Metadata = { title: "Sınav Soruları", robots: { index: false } };
export const dynamic = "force-dynamic";

interface BrowsePayload {
  examId: string;
  title: string;
  questions: ReviewQuestion[];
}

/** Sınav sonrası serbest görüntüleme — eski /sorular (Doc 18 §7). Cevap anahtarı YOK. */
export default async function SorularPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  let data: BrowsePayload;
  try {
    data = await api<BrowsePayload>(`/exams/${examId}/questions`);
  } catch (e) {
    const msg =
      e instanceof ApiError && e.code === "QUESTIONS_NOT_OPEN"
        ? "Bu denemenin soruları görüntülemeye açık değil (sınav bitmemiş ya da kapalı)."
        : "Sorular görüntülenemiyor.";
    return (
      <div>
        <h2 className="head2">Sınav Soruları</h2>
        <EmptyState icon="icon-question" title="Görüntülenemiyor" message={msg} />
      </div>
    );
  }

  return (
    <div>
      <h2 className="head2">{data.title} — Sorular</h2>
      <p className="mx-auto max-w-3xl px-4 pt-4 text-center text-[13px] text-neutral-500">
        Bu ekranda sorular incelemelik olarak gösterilir; doğru cevaplar yer almaz.
      </p>
      <ReviewList questions={data.questions} showAnswers={false} />
    </div>
  );
}

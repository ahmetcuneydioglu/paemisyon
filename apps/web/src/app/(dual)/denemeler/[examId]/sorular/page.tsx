import type { Metadata } from "next";
import { HelpCircle } from "lucide-react";
import { api, ApiError } from "@/lib/api";
import type { ReviewQuestion } from "@/lib/types";
import { ReviewList } from "@/components/review-list";
import { EmptyState } from "@/components/ui/empty-state";
import { PageFrame, PageIntro } from "@/components/public/page-frame";

export const metadata: Metadata = {
  title: "Sınav Soruları",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

interface BrowsePayload {
  examId: string;
  title: string;
  questions: ReviewQuestion[];
}

/** Sınav sonrası serbest görüntüleme — eski /sorular (Doc 18 §7). Cevap anahtarı YOK. */
export default async function SorularPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
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
      <PageFrame width="narrow">
        <EmptyState
          icon={HelpCircle}
          title="Sorular görüntülenemiyor"
          body={msg}
        />
      </PageFrame>
    );
  }

  return (
    <PageFrame width="wide" className="flex flex-col gap-6">
      <PageIntro
        breadcrumb={[
          { label: "Denemeler", href: "/denemeler" },
          { label: data.title },
          { label: "Sorular" },
        ]}
        title={`${data.title} — Sorular`}
        lead="Bu ekranda sorular incelemelik olarak gösterilir; doğru cevaplar yer almaz."
      />
      <ReviewList questions={data.questions} showAnswers={false} />
    </PageFrame>
  );
}

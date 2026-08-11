import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { ExamPlayer, type StartPayload } from "@/components/exam/exam-player";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Arşiv Denemesi", robots: { index: false } };
export const dynamic = "force-dynamic";

/** /quiz/sessions (archiveExamId) yanıtı → ExamPlayer StartPayload eşlemesi. */
interface ArchiveStart {
  sessionId: string;
  plannedDurationSeconds: number | null;
  questions: {
    questionId: string;
    versionId: string;
    stem: string;
    mediaUrl: string | null;
    options: { id: string; label: string; text: string }[];
  }[];
}

/**
 * Arşiv denemesi (Doc 18 devamı): pencere kapanmış denemenin SABİT seti,
 * aynı süreyle — resmî sıralamaya girmez, tekrarlanabilir. Oynatıcı canlıyla
 * aynı (ExamPlayer); yalnız bitişte /sonuc yerine yerinde özet gösterilir.
 */
export default async function ArsivSinavPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;

  let title = "Deneme";
  let start: ArchiveStart;
  try {
    const [exam, session] = await Promise.all([
      api<{ title: string }>(`/exams/${examId}`),
      api<ArchiveStart>("/quiz/sessions", {
        method: "POST",
        body: JSON.stringify({ mode: "exam", archiveExamId: examId }),
      }),
    ]);
    title = exam.title;
    start = session;
  } catch (e) {
    if (e instanceof ApiError) return <ArchiveBlocked code={e.code} message={e.message} />;
    throw e;
  }

  const payload: StartPayload = {
    sessionId: start.sessionId,
    examId,
    title,
    endsAt: new Date(
      Date.now() + (start.plannedDurationSeconds ?? 0) * 1000,
    ).toISOString(),
    liveAnswerReveal: false,
    questions: start.questions.map((q, i) => ({ order: i + 1, ...q })),
    givenAnswers: [],
  };

  return <ExamPlayer start={payload} archive />;
}

function ArchiveBlocked({ code, message }: { code: string; message: string }) {
  const [icon, heading] =
    code === "PREMIUM_REQUIRED"
      ? ["🔒", "Premium deneme"]
      : ["⚠️", "Arşiv denemesi açılamadı"];
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-3xl" aria-hidden>
          {icon}
        </p>
        <CardTitle className="mt-3 text-[17px]">{heading}</CardTitle>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink
            href="/denemeler"
            variant={code === "PREMIUM_REQUIRED" ? "secondary" : "primary"}
          >
            Denemelere dön
          </ButtonLink>
          {code === "PREMIUM_REQUIRED" && (
            <ButtonLink href="/premium">Premium&apos;u incele</ButtonLink>
          )}
        </div>
      </Card>
    </div>
  );
}

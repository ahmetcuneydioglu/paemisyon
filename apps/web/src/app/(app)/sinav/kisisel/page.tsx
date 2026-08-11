import type { Metadata } from "next";
import { api, ApiError } from "@/lib/api";
import { ExamPlayer, type StartPayload } from "@/components/exam/exam-player";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Kişisel Deneme", robots: { index: false } };
export const dynamic = "force-dynamic";

interface PersonalStart {
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
 * Kişisel deneme (Doc 18 devamı): randevu beklemeden, hedef sınavın müfredat
 * ağırlıklarıyla, görülmemiş soru öncelikli süreli set — sıralamaya girmez.
 * Oynatıcı canlı denemeyle aynı; bitişte yerinde özet (archive modu).
 */
export default async function KisiselSinavPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const p = await searchParams;
  const raw = Number.parseInt(
    (Array.isArray(p.count) ? p.count[0] : p.count) ?? "",
    10,
  );
  const count = Number.isFinite(raw) ? Math.min(120, Math.max(5, raw)) : 100;

  let start: PersonalStart;
  try {
    start = await api<PersonalStart>("/quiz/sessions", {
      method: "POST",
      body: JSON.stringify({ mode: "exam", personalExam: true, questionCount: count }),
    });
  } catch (e) {
    if (e instanceof ApiError) return <PersonalBlocked message={e.message} />;
    throw e;
  }

  const payload: StartPayload = {
    sessionId: start.sessionId,
    examId: "kisisel",
    title: "Kişisel Deneme",
    endsAt: new Date(
      Date.now() + (start.plannedDurationSeconds ?? 0) * 1000,
    ).toISOString(),
    liveAnswerReveal: false,
    questions: start.questions.map((q, i) => ({ order: i + 1, ...q })),
    givenAnswers: [],
  };

  return <ExamPlayer start={payload} archive />;
}

function PersonalBlocked({ message }: { message: string }) {
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-3xl" aria-hidden>
          ⚠️
        </p>
        <CardTitle className="mt-3 text-[17px]">Kişisel deneme açılamadı</CardTitle>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">{message}</p>
        <div className="mt-6 flex justify-center">
          <ButtonLink href="/denemeler">Denemelere dön</ButtonLink>
        </div>
      </Card>
    </div>
  );
}

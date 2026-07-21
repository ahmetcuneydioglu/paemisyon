import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ExamPlayer, type StartPayload } from "@/components/exam/exam-player";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sınav", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Sınav çözme — L3 odak (Doc 27 §3.8). Kimlik (app) layout'unda garanti.
 * Oturum SUNUCUDA başlatılır/devam ettirilir; hata kodları ekranlara eşlenir.
 */
export default async function SinavPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;

  let start: StartPayload;
  try {
    start = await api<StartPayload>(`/exams/${examId}/start`, { method: "POST" });
  } catch (e) {
    if (e instanceof ApiError) {
      const attemptId = (e.details as { attemptId?: string } | undefined)?.attemptId;
      if (e.code === "EXAM_ALREADY_TAKEN" && attemptId) redirect(`/sonuc/${attemptId}`);
      return <ExamBlocked code={e.code} message={e.message} />;
    }
    throw e;
  }

  return <ExamPlayer start={start} />;
}

function ExamBlocked({ code, message }: { code: string; message: string }) {
  const [icon, title] =
    code === "EXAM_NOT_STARTED"
      ? ["⏳", "Sınav henüz başlamadı"]
      : code === "EXAM_ENDED"
        ? ["🏁", "Sınav süresi doldu"]
        : code === "PREMIUM_REQUIRED"
          ? ["🔒", "Premium deneme"]
          : ["⚠️", "Sınava girilemiyor"];
  return (
    <div className="grid min-h-[70vh] place-items-center px-4">
      <Card className="w-full max-w-md p-8 text-center">
        <p className="text-3xl" aria-hidden>
          {icon}
        </p>
        <CardTitle className="mt-3 text-[17px]">{title}</CardTitle>
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

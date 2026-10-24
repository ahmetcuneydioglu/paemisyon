import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { ExamPlayer, type StartPayload } from "@/components/exam/exam-player";
import { Card, CardTitle } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sınav", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Sınav çözme — L3 odak (Doc 27 §3.8 → Doc 50 M3/W2). Oturum SUNUCUDA
 * başlatılır/devam ettirilir; `?role=practice` tekrar çözüm açar. Hata kodları
 * ekranlara eşlenir; "zaten katıldın" sonuca gider.
 */
export default async function SinavPage({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ examId }, sp] = await Promise.all([params, searchParams]);
  const role = (Array.isArray(sp.role) ? sp.role[0] : sp.role) === "practice" ? "practice" : undefined;

  let start: StartPayload;
  try {
    start = await api<StartPayload>(`/exams/${examId}/start`, {
      method: "POST",
      body: JSON.stringify(role ? { role } : {}),
    });
  } catch (e) {
    if (e instanceof ApiError) {
      const details = (e.details ?? {}) as { attemptId?: string; canStartPractice?: boolean };
      if (e.code === "EXAM_ALREADY_TAKEN" && details.attemptId) redirect(`/sonuc/${details.attemptId}`);
      if (e.code === "OFFICIAL_IN_PROGRESS") redirect(`/sinav/${examId}`);
      return <ExamBlocked code={e.code} message={e.message} examId={examId} />;
    }
    throw e;
  }

  return <ExamPlayer start={start} kind={start.role === "practice" ? "practice" : "live"} />;
}

function ExamBlocked({ code, message, examId }: { code: string; message: string; examId: string }) {
  const [icon, title] =
    code === "EXAM_NOT_STARTED"
      ? ["⏳", "Sınav henüz başlamadı"]
      : code === "EXAM_CLOSED" || code === "EXAM_ENDED"
        ? ["🏁", "Bu deneme yeni çözüme kapalı"]
        : code === "OFFICIAL_FIRST"
          ? ["🎯", "Önce resmî çözüm"]
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
          {code === "OFFICIAL_FIRST" ? (
            <ButtonLink href={`/denemeler/${examId}/baslamadan-once`}>Kuralları gör ve başla</ButtonLink>
          ) : null}
          <ButtonLink href="/denemeler" variant={code === "PREMIUM_REQUIRED" || code === "OFFICIAL_FIRST" ? "secondary" : "primary"}>
            Denemelere dön
          </ButtonLink>
          {code === "PREMIUM_REQUIRED" && <ButtonLink href="/premium">Premium&apos;u incele</ButtonLink>}
        </div>
      </Card>
    </div>
  );
}

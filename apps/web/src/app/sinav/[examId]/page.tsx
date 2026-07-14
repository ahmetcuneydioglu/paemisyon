import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { api, ApiError } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import { ExamRunner, type StartPayload } from "@/components/exam-runner";

export const metadata: Metadata = { title: "Sınav", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Sınav çözme (eski /sinav/{id}) — giriş zorunlu. Oturum SUNUCUDA başlatılır/
 * devam ettirilir (Doc 18 §7); hata kodları eski akıştaki ekranlara eşlenir.
 */
export default async function SinavPage({ params }: { params: Promise<{ examId: string }> }) {
  const { examId } = await params;
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/giris");

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

  return <ExamRunner start={start} />;
}

function ExamBlocked({ code, message }: { code: string; message: string }) {
  const title =
    code === "EXAM_NOT_STARTED"
      ? "Sınav Henüz Başlamadı"
      : code === "EXAM_ENDED"
        ? "Sınav Süresi Doldu"
        : code === "PREMIUM_REQUIRED"
          ? "Premium Deneme"
          : "Sınava Girilemiyor";
  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <div className="card-content text-center">
        <h1 className="head3 mb-3">
          <i className={code === "PREMIUM_REQUIRED" ? "icon-lock" : "icon-information"} aria-hidden />
          {title}
        </h1>
        <p className="mb-6 text-sm">{message}</p>
        <Link href="/denemeler" className="btn-old btn-old-navy">
          Denemelere Dön
        </Link>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import type { MyAttempt } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/format";

export const metadata: Metadata = {
  title: "Denemelerim",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

export default async function MyExamsPage() {
  const attempts = await api<MyAttempt[]>("/exams/attempts/mine");
  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <Link
        href="/profil"
        className="text-[13px] font-bold text-brand hover:underline"
      >
        ← Profile dön
      </Link>
      <div className="mt-4">
        <h1 className="font-heading text-2xl font-bold text-ink">
          Denemelerim
        </h1>
        <p className="mt-1 text-[14px] text-ink-soft">
          Web ve mobildeki bütün deneme geçmişin.
        </p>
      </div>
      {attempts.length === 0 ? (
        <Card className="mt-5 py-10 text-center">
          <p className="font-heading text-[15px] font-bold text-ink">
            Henüz deneme çözmedin
          </p>
          <p className="mt-1 text-[13px] text-ink-soft">
            İlk denemenden sonra gelişim arşivin burada başlayacak.
          </p>
          <Link
            href="/denemeler"
            className="mt-4 inline-block text-[13px] font-bold text-brand hover:underline"
          >
            Denemelere git →
          </Link>
        </Card>
      ) : (
        <div className="mt-5 space-y-2">
          {attempts.map((attempt) => (
            <Card
              key={attempt.attemptId}
              className="flex flex-wrap items-center gap-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-[14px] font-bold text-ink">
                  {attempt.exam?.title ?? "Deneme"}
                </p>
                <p className="mt-1 text-[12px] text-ink-soft">
                  {formatDate(attempt.startedAt)} ·{" "}
                  {attempt.status === "completed"
                    ? "Tamamlandı"
                    : "Devam ediyor"}
                </p>
              </div>
              <div className="text-right">
                <span className="tk-caption">Net</span>
                <p className="tabular font-heading text-lg font-bold text-ink">
                  {attempt.score != null ? attempt.score.toFixed(2) : "—"}
                </p>
              </div>
              {attempt.status === "completed" ? (
                <Link
                  href={`/sonuc/${attempt.attemptId}`}
                  className="tk-interactive rounded-sm border border-line px-3 py-2 text-[13px] font-bold text-brand hover:border-brand"
                >
                  Sonucu aç
                </Link>
              ) : (
                <Link
                  href={
                    attempt.exam?.id
                      ? `/sinav/${attempt.exam.id}`
                      : "/denemeler"
                  }
                  className="tk-interactive rounded-sm border border-line px-3 py-2 text-[13px] font-bold text-brand hover:border-brand"
                >
                  Devam et
                </Link>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

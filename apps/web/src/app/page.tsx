import type { Metadata } from "next";
import Link from "next/link";
import { api } from "@/lib/api";
import { supabaseServer } from "@/lib/supabase/server";
import type { ExamListItem } from "@/lib/types";
import { Countdown } from "@/components/countdown";
import { ExamTable } from "@/components/exam-table";
import { formatDate, formatTime } from "@/lib/format";

export const metadata: Metadata = {
  title: "Paemisyon Denemeler — Online Polislik Deneme Sınavları",
  alternates: { canonical: "/" },
};

export const dynamic = "force-dynamic";

/** Ana sayfa — eski index: bir sonraki denemeye geri sayım + son 5 deneme. */
export default async function HomePage() {
  const [exams, { data: auth }] = await Promise.all([
    api<ExamListItem[]>("/exams").catch(() => [] as ExamListItem[]),
    (await supabaseServer()).auth.getUser(),
  ]);
  const loggedIn = !!auth.user;

  // Bir sonraki deneme: en yakın 'upcoming' (yoksa aktif olana işaret et).
  const next = [...exams]
    .filter((e) => e.state === "upcoming")
    .sort((a, b) => +new Date(a.startAt) - +new Date(b.startAt))[0];
  const active = exams.find((e) => e.state === "active");

  return (
    <div>
      <section className="bg-(--color-navy-dark) py-12 text-center text-white">
        <h1 className="font-heading mb-2 text-3xl font-bold">Online Deneme Sınavları</h1>
        <p className="mb-8 text-white/80">
          Gerçek sınav formatında canlı denemeler — sıralamanı gör, eksiklerini kapat.
        </p>
        {next ? (
          <>
            <p className="font-heading mb-4 text-lg font-medium">
              <i className="icon-calendar mr-2" aria-hidden />
              Sıradaki deneme: <strong>{next.title}</strong> —{" "}
              {formatDate(next.startAt)} {formatTime(next.startAt)}
            </p>
            <Countdown target={next.startAt} />
          </>
        ) : active ? (
          <div>
            <p className="font-heading mb-4 text-lg">
              <strong>{active.title}</strong> şu an devam ediyor!
            </p>
            <Link
              href={loggedIn ? `/sinav/${active.id}` : "/giris"}
              className="btn-old btn-old-green"
            >
              <i className="icon-timer mr-2" aria-hidden />
              Sınava Katıl
            </Link>
          </div>
        ) : (
          <Link href="/denemeler" className="btn-old btn-old-green">
            <i className="icon-test mr-2" aria-hidden />
            Denemelere Göz At
          </Link>
        )}
      </section>

      <h2 className="head2">Sınavlar</h2>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ExamTable exams={exams.slice(0, 5)} loggedIn={loggedIn} />
        {exams.length > 5 && (
          <p className="mt-6 text-center">
            <Link href="/denemeler" className="btn-old btn-old-navy">
              Tüm Denemeler
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

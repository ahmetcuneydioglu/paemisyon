import type { Metadata } from "next";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { ExamListItem, MyAttempt } from "@/lib/types";
import { ExamTable } from "@/components/exam-table";
import { ExamCenter } from "@/components/exam/exam-center";

export const metadata: Metadata = {
  title: "Denemeler",
  description:
    "Yaklaşan ve geçmiş online polislik deneme sınavları — tarih, katılım ve ortalamalarıyla.",
  alternates: { canonical: "/denemeler" },
};

export const dynamic = "force-dynamic";

/**
 * Deneme merkezi (Doc 27 §3.8) — aynı URL iki derinlik:
 * girişsiz → miras tablo (SEO), girişli → takvim + geri sayım + gelişim çizgim.
 */
export default async function DenemelerPage() {
  const [publicExams, user] = await Promise.all([
    api<ExamListItem[]>("/exams", { auth: false, next: { revalidate: 30 } }).catch(
      () => [] as ExamListItem[],
    ),
    getCurrentUser(),
  ]);

  if (user) {
    // Liste girişli olarak YENİDEN çekilir. Yukarıdaki çağrı `auth: false` ve
    // 30 sn önbellekli (misafir/SEO yolu için doğru) — ama o yanıtta kullanıcıya
    // özel alanlar HEP null döner. Katılım bilgisi elle birleştirildiği için bu
    // fark uzun süre görünmedi; arşiv sonucu eklenince ortaya çıktı: kullanıcı
    // "arşiv sonucum" girişini hiç göremedi (7 Eylül 2026).
    const [exams, attempts] = await Promise.all([
      api<ExamListItem[]>("/exams").catch(() => publicExams),
      api<MyAttempt[]>("/exams/attempts/mine").catch(() => [] as MyAttempt[]),
    ]);
    return <ExamCenter exams={exams} attempts={attempts} />;
  }

  return (
    <div>
      <h2 className="head2">Sınavlar</h2>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <ExamTable exams={publicExams} loggedIn={false} />
      </div>
    </div>
  );
}

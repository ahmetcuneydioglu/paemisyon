import type { Metadata } from "next";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { ExamListItem, MyAttempt } from "@/lib/types";
import type { MeDashboard } from "@/lib/public-api";
import { ExamTable } from "@/components/exam-table";
import { ExamCenter } from "@/components/exam/exam-center";
import {
  PageFrame,
  PageIntro,
  ClosingCta,
} from "@/components/public/page-frame";
import { ButtonLink } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Denemeler",
  description:
    "Yaklaşan ve geçmiş online polislik deneme sınavları — tarih, katılım ve ortalamalarıyla.",
  alternates: { canonical: "/denemeler" },
};

export const dynamic = "force-dynamic";

/**
 * Deneme merkezi (Doc 27 §3.8) — aynı URL iki derinlik:
 * girişsiz → liste (SEO), girişli → takvim + geri sayım + gelişim çizgim.
 */
export default async function DenemelerPage() {
  const [publicExams, user] = await Promise.all([
    api<ExamListItem[]>("/exams", {
      auth: false,
      next: { revalidate: 30 },
    }).catch(() => [] as ExamListItem[]),
    getCurrentUser(),
  ]);

  if (user) {
    // Liste girişli olarak YENİDEN çekilir. Yukarıdaki çağrı `auth: false` ve
    // 30 sn önbellekli (misafir/SEO yolu için doğru) — ama o yanıtta kullanıcıya
    // özel alanlar HEP null döner. Katılım bilgisi elle birleştirildiği için bu
    // fark uzun süre görünmedi; arşiv sonucu eklenince ortaya çıktı: kullanıcı
    // "arşiv sonucum" girişini hiç göremedi (7 Eylül 2026).
    const [exams, attempts, dashboard] = await Promise.all([
      api<ExamListItem[]>("/exams").catch(() => publicExams),
      api<MyAttempt[]>("/exams/attempts/mine").catch(() => [] as MyAttempt[]),
      // Kişisel deneme hakkı (Doc 46): kilit/kalan hak buradan kurulur.
      // Çekilemezse kart eski hâliyle çizilir — sunucudaki kapı zaten asıl
      // karar noktası; arayüz onu tekrar etmez, yalnız dürüstçe gösterir.
      api<MeDashboard>("/me/dashboard").catch(() => null),
    ]);
    return (
      <ExamCenter exams={exams} attempts={attempts} dashboard={dashboard} />
    );
  }

  return (
    <PageFrame width="wide" className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Canlı denemeler"
        title="Deneme sınavları"
        lead="Türkiye genelinde aynı anda yarış; süre bitince netini ve sıralamanı gör. Katılım için ücretsiz hesap yeterli."
      />
      <ExamTable exams={publicExams} loggedIn={false} />
      <ClosingCta
        title="Sıradaki denemeye hazır ol"
        body="Kayıt ol, deneme günü hatırlatma al; sonuçların ve yanlışların hesabında birikir."
        actions={<ButtonLink href="/kayit">Ücretsiz kayıt ol</ButtonLink>}
      />
    </PageFrame>
  );
}

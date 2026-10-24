import type { Metadata } from "next";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { ExamHistory, ExamListItem } from "@/lib/types";
import type { CikmisSinavOzet, MeDashboard } from "@/lib/public-api";
import { publicApiList } from "@/lib/public-api";
import { heroFor, normalizeExamListItem } from "@/lib/exam-ui";
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
    "Serbest ve haftalık online polislik deneme sınavları — netini ve Türkiye sıralamanı gör.",
  alternates: { canonical: "/denemeler" },
};

export const dynamic = "force-dynamic";

/**
 * Deneme merkezi (Doc 50 M1/W1) — aynı URL iki derinlik:
 * girişsiz → liste (SEO), girişli → hero + dört grup + koç rayı.
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
    // Liste girişli olarak YENİDEN çekilir: `auth: false` yanıtında kullanıcıya
    // özel alanlar hep null döner (7 Eylül 2026 dersi).
    const [exams, dashboard, history, pastExams] = await Promise.all([
      api<ExamListItem[]>("/exams").then((xs) => xs.map(normalizeExamListItem)).catch(() => publicExams.map(normalizeExamListItem)),
      api<MeDashboard>("/me/dashboard").catch(() => null),
      api<ExamHistory>("/exams/history/mine").catch(() => null),
      publicApiList<CikmisSinavOzet>("/cikmis-sinavlar").then((r) => r.items.filter((x) => x.tur === "resmi")),
    ]);
    const hero = heroFor(exams);
    const reminding =
      hero.kind === "weekly" && hero.exam.availability === "upcoming"
        ? await api<{ reminding: boolean }>(`/exams/${hero.exam.id}/remind`)
            .then((r) => r.reminding)
            .catch(() => false)
        : false;
    const lastPersonal = history?.kisisel[0]
      ? { attemptId: history.kisisel[0].attemptId, score: history.kisisel[0].score, completedAt: history.kisisel[0].completedAt }
      : null;
    return (
      <ExamCenter
        exams={exams}
        dashboard={dashboard}
        reminding={reminding}
        pastExams={pastExams}
        lastPersonal={lastPersonal}
      />
    );
  }

  return (
    <PageFrame width="wide" className="flex flex-col gap-6">
      <PageIntro
        eyebrow="Denemeler"
        title="Deneme sınavları"
        lead="Serbest denemeyi istediğin zaman çöz, haftalık denemede Türkiye geneliyle yarış; netini ve sıralamanı gör. Katılım için ücretsiz hesap yeterli."
      />
      <ExamTable exams={publicExams} loggedIn={false} />
      <ClosingCta
        title="Sıradaki denemeye hazır ol"
        body="Kayıt ol, haftalık deneme için hatırlatma al; sonuçların ve yanlışların hesabında birikir."
        actions={<ButtonLink href="/kayit">Ücretsiz kayıt ol</ButtonLink>}
      />
    </PageFrame>
  );
}

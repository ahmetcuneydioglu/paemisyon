import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Clock, Sparkles } from "lucide-react";
import { api } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth/current-user";
import type { ExamListItem } from "@/lib/types";
import type { MeDashboard } from "@/lib/public-api";
import { personalExamState } from "@/lib/personal-exam";
import { normalizeExamListItem } from "@/lib/exam-ui";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/notice";
import { PremiumBadge } from "@/components/ui/premium-badge";

export const metadata: Metadata = { title: "Kişisel deneme", robots: { index: false } };
export const dynamic = "force-dynamic";

/**
 * Kişisel deneme oluşturma (Doc 50 M7). Uzunluk seçilir; "oluştur" anında başlatır
 * (/sinav/kisisel). Dağılım resmî PAEM tablosu, soru seçimi zayıf konulara göre
 * (sunucu, Doc 46). Havuz anahtarı ("yanlışlarımdan") F3'te sunucu desteğiyle gelir.
 */
export default async function KisiselDenemePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/giris?next=%2Fdenemeler%2Fkisisel");
  const [dashboard, exams] = await Promise.all([
    api<MeDashboard>("/me/dashboard").catch(() => null),
    api<ExamListItem[]>("/exams").then((xs) => xs.map(normalizeExamListItem)).catch(() => [] as ExamListItem[]),
  ]);
  const { sinirsiz, kalan, hakkiBitti, secenekler } = personalExamState(dashboard);
  const active = exams.find((e) => e.myState === "in_progress" && e.my.active);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 px-4 py-6 md:px-6">
      <Breadcrumb items={[{ label: "Denemeler", href: "/denemeler" }, { label: "Kişisel deneme" }]} />
      <header className="flex flex-col gap-2">
        <h1 className="type-title inline-flex items-center gap-2 text-ink">
          <Sparkles size={22} className="text-accent-ink" aria-hidden /> Kişisel deneme
        </h1>
        <p className="type-body text-ink-soft">
          Yanlışlarından ve zayıf konularından seçilen sorular, resmî PAEM dağılımıyla. Sıralamaya girmez; sana ölçüm.
        </p>
      </header>

      {active ? (
        <Notice
          tone="warning"
          title="Önce devam eden denemeni bitir"
          action={<ButtonLink href={`/sinav/${active.id}${active.my.active?.role === "practice" ? "?role=practice" : ""}`} variant="secondary">Denemeye dön</ButtonLink>}
        >
          {active.title} · {active.my.active?.answered}/{active.questionCount} cevaplandı.
        </Notice>
      ) : null}

      <Card className="flex flex-col gap-3">
        <p className="type-label text-ink-subtle">Uzunluk</p>
        <div className="flex flex-wrap gap-2">
          {secenekler.map(({ sayi, kilitli, birincil }) =>
            kilitli ? (
              <Link
                key={sayi}
                href="/premium"
                className="tk-interactive inline-flex min-h-11 items-center gap-1.5 rounded-pill border border-dashed border-line px-4 type-subhead text-ink-soft hover:border-ink-soft hover:text-ink"
                title={`${sayi} soruluk kişisel deneme Premium'a özel`}
              >
                {sayi} soru <PremiumBadge variant="soft" />
              </Link>
            ) : (
              <ButtonLink
                key={sayi}
                href={active || hakkiBitti ? "#" : `/sinav/kisisel?count=${sayi}`}
                variant={birincil ? "primary" : "secondary"}
                className={active || hakkiBitti ? "pointer-events-none opacity-50" : undefined}
                aria-disabled={active || hakkiBitti ? true : undefined}
              >
                {sayi} soru
              </ButtonLink>
            ),
          )}
        </div>
        <p className="type-body-sm text-ink-subtle">100 soru gerçek sınav formatı; 25 ve 50 kısa turlar.</p>
      </Card>

      <Card className="flex flex-col gap-2">
        <p className="type-heading text-ink">Dağılım</p>
        <p className="type-body-sm text-ink-soft">
          Pay resmî PAEM tablosudur: Genel Kültür ve Analitik Düşünme %30, yedi hukuk ve mevzuat dersi %10&apos;ar. Kısa turlarda aynı oranla ölçeklenir. Soru seçimi görmediğin ve yanlış yaptığın sorulardan başlar; bir derste çözülmemiş soru azalırsa pay yanlışlardan tamamlanır.
        </p>
        <p className="type-body-sm inline-flex items-center gap-1.5 text-ink-soft">
          <Clock size={16} aria-hidden /> Süre soru başına 75 sn (100 soruda 125 dk); seçince başlar ve durmaz.
        </p>
      </Card>

      {!sinirsiz ? (
        <p className="type-body-sm text-ink-subtle">
          {hakkiBitti ? "Bugünkü hakkını kullandın — yarın yenileniyor." : `Bugün ${kalan} hakkın var.`}{" "}
          <Link href="/premium" className="font-semibold text-accent-ink hover:underline">Premium&apos;da sınırsız</Link>
        </p>
      ) : (
        <p className="type-body-sm text-ink-subtle">Kişisel deneme sıralamaya girmez; Premium hakkınla sınırsız.</p>
      )}
    </div>
  );
}

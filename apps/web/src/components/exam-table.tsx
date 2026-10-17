import { CalendarX } from "lucide-react";
import type { ExamListItem } from "@/lib/types";
import { formatDate, formatTimeRange } from "@/lib/format";
import { DataTable, type Column } from "@/components/ui/data-table";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PremiumBadge } from "@/components/ui/premium-badge";
import { EmptyState } from "@/components/ui/empty-state";

/**
 * Deneme listesi — girişsiz "Denemeler" vitrini (Doc 27 §3.8). Kit tablosu üstünde:
 * dar ekranda tarih/saat sütunları gizlenir, bilgi başlık hücresine iner; sağda
 * üç durumlu eylem (başlamadı / başlat-devam / sıralama-sorular-sonuç).
 */
export function ExamTable({
  exams,
  loggedIn,
}: {
  exams: ExamListItem[];
  loggedIn: boolean;
}) {
  if (exams.length === 0) {
    return (
      <EmptyState
        icon={CalendarX}
        title="Henüz yayınlanmış deneme yok"
        body="Yenileri eklendiğinde burada listelenecek."
      />
    );
  }
  const total = exams.length;
  const columns: Column<ExamListItem>[] = [
    {
      key: "no",
      header: "No",
      width: "3.5rem",
      align: "center",
      hideBelowMd: true,
      cell: (e) => (
        <span className="tabular text-ink-soft">
          {total - exams.indexOf(e)}
        </span>
      ),
    },
    {
      key: "title",
      header: "Deneme",
      cell: (e) => (
        <div className="flex flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="type-subhead text-ink">{e.title}</span>
            {e.isPremium ? <PremiumBadge variant="soft" /> : null}
          </span>
          <span className="type-body-sm text-ink-soft">
            {e.questionCount} soru · {e.durationMinutes} dk
            <span className="md:hidden">
              {" "}
              · {formatDate(e.startAt)} {formatTimeRange(e.startAt, e.endAt)}
            </span>
          </span>
        </div>
      ),
    },
    {
      key: "date",
      header: "Tarih",
      hideBelowMd: true,
      cell: (e) => <span className="tabular">{formatDate(e.startAt)}</span>,
    },
    {
      key: "time",
      header: "Sınav saati",
      hideBelowMd: true,
      cell: (e) => (
        <span className="tabular">{formatTimeRange(e.startAt, e.endAt)}</span>
      ),
    },
    {
      key: "stats",
      header: "Katılım / Ort.",
      align: "right",
      hideBelowMd: true,
      cell: (e) => (
        <span className="tabular">
          {e.participantCount} /{" "}
          {e.avgScore != null ? e.avgScore.toFixed(2) : "—"}
        </span>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">İşlemler</span>,
      align: "right",
      cell: (e) => <ExamActions exam={e} loggedIn={loggedIn} />,
    },
  ];
  return (
    <DataTable
      columns={columns}
      rows={exams}
      rowKey={(e) => e.id}
      caption="Deneme sınavları: tarih, katılım ve işlemler"
    />
  );
}

/** Üç durumlu eylem mantığı + kendi katılım durumun (Doc 18 §3). */
function ExamActions({
  exam,
  loggedIn,
}: {
  exam: ExamListItem;
  loggedIn: boolean;
}) {
  // Sunucu bileşeni + force-dynamic sayfa: istek anının saatini okumak kasıtlı
  // (eski "Devam Ediyor" eşiği). İstemci saf-render kuralı burada geçerli değil.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  const startedLongAgo = now - new Date(exam.startAt).getTime() > 30 * 60_000;

  if (exam.state === "upcoming") {
    return <Badge>Başlamadı</Badge>;
  }

  if (exam.state === "active") {
    if (exam.myAttempt?.status === "completed") {
      return (
        <ButtonLink
          href={`/sonuc/${exam.myAttempt.id}`}
          size="sm"
          variant="secondary"
        >
          Sonucum
        </ButtonLink>
      );
    }
    const label = exam.myAttempt
      ? "Devam et"
      : startedLongAgo
        ? "Sınav devam ediyor"
        : "Sınavı başlat";
    return (
      <ButtonLink href={loggedIn ? `/sinav/${exam.id}` : "/giris"} size="sm">
        {label}
      </ButtonLink>
    );
  }

  // ended
  return (
    <span className="inline-flex flex-col items-end gap-1.5 md:flex-row md:flex-wrap md:justify-end">
      <ButtonLink href={`/siralama/${exam.id}`} size="sm" variant="secondary">
        Sıralama
      </ButtonLink>
      {exam.questionsOpenAfterEnd && (
        <ButtonLink
          href={`/denemeler/${exam.id}/sorular`}
          size="sm"
          variant="ghost"
        >
          Sorular
        </ButtonLink>
      )}
      {exam.myAttempt ? (
        <ButtonLink
          href={`/sonuc/${exam.myAttempt.id}`}
          size="sm"
          variant="ghost"
        >
          Sonucum
        </ButtonLink>
      ) : (
        <Badge>Bitti</Badge>
      )}
    </span>
  );
}

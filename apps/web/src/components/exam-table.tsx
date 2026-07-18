import Link from "next/link";
import type { ExamListItem } from "@/lib/types";
import { formatDate, formatTimeRange } from "@/lib/format";

/**
 * Deneme listesi — eski sinavlar.php tablosu birebir (Doc 18 §4.1):
 * lacivert thead, zebra satırlar, sağa yaslı 3-durumlu btn2 aksiyonları.
 * Mobilde bloklaşır (data-label düzeltmesiyle).
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
      <p className="py-16 text-center text-sm text-neutral-500">
        Henüz yayınlanmış deneme yok — yenileri eklendiğinde burada listelenecek.
      </p>
    );
  }
  return (
    <table className="exam-table">
      <thead>
        <tr>
          <th className="w-12">No</th>
          <th>Deneme</th>
          <th>Tarih</th>
          <th>Sınav Saati</th>
          <th>Katılım / Ortalama</th>
          <th aria-label="İşlemler" />
        </tr>
      </thead>
      <tbody>
        {exams.map((e, i) => (
          <tr key={e.id}>
            <td data-label="No">{exams.length - i}</td>
            <td data-label="Deneme" className="font-semibold">
              {e.title}
              {e.isPremium && (
                <span className="ml-2 inline-flex items-center gap-1 bg-(--color-navy) px-2 py-0.5 text-[11px] font-bold text-(--color-yellow)">
                  <i className="icon-lock text-[10px]" aria-hidden /> PREMIUM
                </span>
              )}
              <span className="ml-2 text-[12px] font-normal text-neutral-500">
                {e.questionCount} soru · {e.durationMinutes} dk
              </span>
            </td>
            <td data-label="Tarih">{formatDate(e.startAt)}</td>
            <td data-label="Sınav Saati">{formatTimeRange(e.startAt, e.endAt)}</td>
            <td data-label="Katılım / Ortalama">
              {e.participantCount} / {e.avgScore != null ? e.avgScore.toFixed(2) : "—"}
            </td>
            <td>
              <ExamActions exam={e} loggedIn={loggedIn} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

/** Eski 3-durumlu buton mantığı + kendi katılım durumun (Doc 18 §3). */
function ExamActions({ exam, loggedIn }: { exam: ExamListItem; loggedIn: boolean }) {
  // Sunucu bileşeni + force-dynamic sayfa: istek anının saatini okumak kasıtlı
  // (eski "Devam Ediyor" eşiği). İstemci saf-render kuralı burada geçerli değil.
  // eslint-disable-next-line react-hooks/purity
  const startedLongAgo = Date.now() - new Date(exam.startAt).getTime() > 30 * 60_000;

  if (exam.state === "upcoming") {
    return (
      <span className="btn2 btn2-orange" aria-disabled="true">
        Sınav Başlamadı
      </span>
    );
  }

  if (exam.state === "active") {
    if (exam.myAttempt?.status === "completed") {
      return (
        <Link href={`/sonuc/${exam.myAttempt.id}`} className="btn2 btn2-red">
          Sonucum
        </Link>
      );
    }
    const label = exam.myAttempt
      ? "Devam Et"
      : startedLongAgo
        ? "Sınav Devam Ediyor"
        : "Sınavı Başlat";
    return (
      <Link href={loggedIn ? `/sinav/${exam.id}` : "/giris"} className="btn2 btn2-green">
        {label}
      </Link>
    );
  }

  // ended
  return (
    <span className="inline-flex flex-wrap justify-end gap-1.5">
      <Link href={`/siralama/${exam.id}`} className="btn2 btn2-orange">
        Sıralama
      </Link>
      {exam.questionsOpenAfterEnd && (
        <Link href={`/denemeler/${exam.id}/sorular`} className="btn2 btn2-green">
          Sorular
        </Link>
      )}
      {exam.myAttempt ? (
        <Link href={`/sonuc/${exam.myAttempt.id}`} className="btn2 btn2-red">
          Sınav Bitti
        </Link>
      ) : (
        <span className="btn2 btn2-red" aria-disabled="true">
          Sınav Bitti
        </span>
      )}
    </span>
  );
}

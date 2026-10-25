import { Flag } from "lucide-react";
import type { ReviewQuestion } from "@/lib/types";
import { formatStem } from "@/lib/stem-format";
import { Badge } from "@/components/ui/badge";
import {
  QuestionOption,
  type QuestionOptionState,
} from "@/components/ui/question";

/**
 * Cevap incelemesi — oynatıcıyla AYNI dil (QuestionOption durumları). Kartlar grid'de
 * bağımsız, mobilde tek sütun. showAnswers=false ise (sınav sonrası serbest görüntüleme)
 * cevap anahtarı ve açıklama gösterilmez. Kaynak etiketi panel ayarına bağlı (sunucu null
 * gönderir); denemede her zaman kapalı.
 */
export function ReviewList({
  questions,
  showAnswers,
}: {
  questions: ReviewQuestion[];
  showAnswers: boolean;
}) {
  return (
    <div className="flex flex-col gap-4">
      {showAnswers && (
        <div className="flex flex-wrap items-center gap-2" aria-hidden>
          <Badge tone="success">doğru cevap</Badge>
          <Badge tone="danger">senin yanlışın</Badge>
          <Badge tone="warning">boş bıraktığın</Badge>
          <Badge tone="neutral">
            <Flag size={12} aria-hidden /> emin değildim
          </Badge>
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {questions.map((q) => {
          const blank = q.selectedOptionId == null;
          return (
            <article
              key={q.questionId}
              className="flex flex-col gap-3 rounded-card border border-line bg-surface p-4"
              aria-label={`Soru ${q.order}`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="type-body whitespace-pre-line text-ink">
                  <span className="tabular font-semibold">{q.order}.</span>{" "}
                  {formatStem(q.stem)}
                </p>
                {q.flagged ? (
                  <Badge tone="neutral">
                    <Flag size={12} aria-hidden /> emin değildim
                  </Badge>
                ) : null}
              </div>
              {q.mediaUrl && (
                // Saklı medya URL'i (bilinmeyen host) — optimizer'a açılmaz.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={q.mediaUrl}
                  alt="Soru görseli"
                  loading="lazy"
                  decoding="async"
                  className="max-h-64 rounded-card border border-line"
                />
              )}

              <div className="flex flex-col gap-1.5">
                {q.options.map((o) => {
                  const chosen = q.selectedOptionId === o.id;
                  let state: QuestionOptionState = "disabled";
                  if (showAnswers) {
                    if (o.isCorrect) state = chosen ? "correct" : "missed";
                    else if (chosen) state = "incorrect";
                  } else if (chosen) {
                    state = "selected";
                  }
                  return (
                    <QuestionOption
                      key={o.id}
                      label={o.label}
                      text={o.text}
                      state={state}
                    />
                  );
                })}
              </div>

              {showAnswers && blank && (
                <p className="type-body-sm text-warning-ink">
                  Bu soruyu boş bıraktın.
                </p>
              )}
              {showAnswers && q.explanation && (
                <div className="flex flex-col gap-1 rounded-control bg-surface-alt p-3">
                  <span className="type-label text-ink-subtle">Açıklama</span>
                  <p className="type-body-sm text-ink">{q.explanation}</p>
                </div>
              )}
              {showAnswers && q.source && (
                <p className="type-body-sm text-ink-subtle">
                  Kaynak: {q.source}
                </p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

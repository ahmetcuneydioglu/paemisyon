import type { ReviewQuestion } from "@/lib/types";
import { OptionRow, type OptionState } from "@/components/ui/option-row";

/**
 * Cevap incelemesi — seans/deneme oynatıcısıyla AYNI tasarım dili (tk token
 * + OptionRow durumları). Eski 2 sütunlu miras düzen (QuestionColumns +
 * option-bar CSS'i) söküldü: kartlar grid'de bağımsızdır, iç içe geçmez,
 * mobilde tek sütuna düşer. showAnswers=false ise (sınav-sonrası serbest
 * görüntüleme) cevap anahtarı ve açıklama gösterilmez.
 */
export function ReviewList({
  questions,
  showAnswers,
}: {
  questions: ReviewQuestion[];
  showAnswers: boolean;
}) {
  return (
    <div>
      {showAnswers && (
        <div
          className="mb-4 flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-ink-soft"
          aria-hidden
        >
          <Legend className="border-success bg-success/10" label="Doğru cevap" />
          <Legend className="border-danger bg-danger/10" label="Senin yanlış cevabın" />
          <Legend className="border-warning bg-warning/10" label="Boş bıraktığın" />
        </div>
      )}

      <div className="grid items-start gap-4 lg:grid-cols-2">
        {questions.map((q) => {
          const blank = q.selectedOptionId == null;
          return (
            <article
              key={q.questionId}
              className="rounded-md border border-line bg-surface p-4"
              aria-label={`Soru ${q.order}`}
            >
              <p className="text-[15px] leading-relaxed text-ink">
                <span className="tabular font-bold">{q.order}.</span> {q.stem}
              </p>
              {q.mediaUrl && (
                // Saklı medya URL'i (bilinmeyen host) — optimizer'a açılmaz.
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={q.mediaUrl}
                  alt="Soru görseli"
                  loading="lazy"
                  decoding="async"
                  className="mt-2 max-h-64 rounded-sm border border-line"
                />
              )}

              <div className="mt-3 space-y-1.5">
                {q.options.map((o) => {
                  const chosen = q.selectedOptionId === o.id;
                  let state: OptionState = "dim";
                  if (showAnswers) {
                    if (o.isCorrect) state = "correct";
                    else if (chosen) state = "wrong";
                  } else if (chosen) {
                    state = "selected";
                  }
                  return (
                    <OptionRow
                      key={o.id}
                      label={o.label}
                      text={o.text}
                      state={state}
                      disabled
                    />
                  );
                })}
              </div>

              {showAnswers && blank && (
                <p className="mt-2 text-[12px] font-bold text-warning">
                  Bu soruyu boş bıraktın.
                </p>
              )}
              {showAnswers && q.explanation && (
                <div className="mt-3 rounded-sm bg-surface-alt p-3">
                  <p className="tk-caption">Açıklama</p>
                  <p className="mt-1 text-[13px] leading-relaxed text-ink">
                    {q.explanation}
                  </p>
                </div>
              )}
              {showAnswers && q.source && (
                <p className="tk-caption mt-2">Kaynak: {q.source}</p>
              )}
            </article>
          );
        })}
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className={`inline-block h-3.5 w-6 rounded-sm border ${className}`} />
      {label}
    </span>
  );
}

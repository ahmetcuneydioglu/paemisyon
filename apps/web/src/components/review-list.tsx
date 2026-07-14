import type { ReviewQuestion } from "@/lib/types";
import { QuestionColumns } from "./question-columns";

/**
 * Soru incelemesi — eski sinav-sonuc.php. SINAV EKRANIYLA BİREBİR aynı 2 sütunlu
 * düzen (QuestionColumns): şıklar pasif; doğru=yeşil, seçilen-yanlış=kırmızı bar,
 * altında açıklama. showAnswers=false ise (sınav-sonrası serbest görüntüleme)
 * cevap anahtarı gösterilmez.
 */
export function ReviewList({
  questions,
  showAnswers,
}: {
  questions: ReviewQuestion[];
  showAnswers: boolean;
}) {
  return (
    <div className="pb-8">
      {showAnswers && (
        <div className="mx-auto flex max-w-6xl flex-wrap justify-center gap-x-6 gap-y-2 px-4 pt-4 text-[13px]">
          <Legend color="var(--color-green)" label="Doğru cevap" />
          <Legend color="var(--color-red)" label="Senin yanlış cevabın" />
          <Legend color="var(--color-yellow)" label="Boş bıraktığın" text="#000" />
        </div>
      )}

      <QuestionColumns
        questions={questions}
        renderQuestion={(q) => {
          const blank = q.selectedOptionId == null;
          return (
            <>
              <div role="radiogroup" aria-label={`Soru ${q.order} incelemesi`}>
                {q.options.map((o) => {
                  const chosen = q.selectedOptionId === o.id;
                  let cls = "option-bar option-bar--static";
                  if (showAnswers && o.isCorrect) cls += " opt-true";
                  else if (showAnswers && chosen && !o.isCorrect) cls += " opt-false";
                  else if (chosen) cls += " opt-chosen";
                  return (
                    <div
                      key={o.id}
                      className={cls}
                      role="radio"
                      aria-checked={chosen}
                      aria-disabled="true"
                    >
                      <b>{o.label}.</b> {o.text}
                    </div>
                  );
                })}
              </div>

              {showAnswers && blank && (
                <p className="mt-1 text-[12px] font-semibold text-(--color-blue-blank)">
                  Bu soruyu boş bıraktın.
                </p>
              )}
              {showAnswers && q.explanation && (
                <div className="mt-2 border-l-4 border-(--color-green) bg-(--color-grey-bg) p-3 text-[13px] leading-relaxed">
                  <strong>Açıklama:</strong> {q.explanation}
                </div>
              )}
            </>
          );
        }}
      />
    </div>
  );
}

function Legend({ color, label, text = "#fff" }: { color: string; label: string; text?: string }) {
  return (
    <span className="flex items-center gap-1.5">
      <span
        className="inline-block h-3.5 w-6 border"
        style={{ background: color, borderColor: color, color: text }}
        aria-hidden
      />
      {label}
    </span>
  );
}

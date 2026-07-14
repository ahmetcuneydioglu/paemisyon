import type { ReviewQuestion } from "@/lib/types";

/**
 * Soru incelemesi — eski sinav-sonuc.php: her soru, şıklar pasif; doğru=yeşil,
 * seçilen-yanlış=kırmızı bar; altında açıklama kutusu. review=false ise
 * (sınav-sonrası serbest görüntüleme) cevap anahtarı gösterilmez.
 */
export function ReviewList({
  questions,
  showAnswers,
}: {
  questions: ReviewQuestion[];
  showAnswers: boolean;
}) {
  return (
    <ol className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      {questions.map((q) => (
        <li key={q.questionId} className="question-block">
          <p>
            <b>{q.order}.</b> {q.stem}
          </p>
          <div>
            {q.options.map((o) => {
              const chosen = q.selectedOptionId === o.id;
              let cls = "option-bar";
              if (showAnswers && o.isCorrect) cls += " opt-true";
              else if (showAnswers && chosen && !o.isCorrect) cls += " opt-false";
              else if (!showAnswers && chosen) cls += "";
              return (
                <div key={o.id} className={cls} aria-checked={chosen} role="radio">
                  <b>{o.label}.</b> {o.text}
                  {showAnswers && o.isCorrect && <span className="ml-auto text-sm">✓ Doğru cevap</span>}
                  {showAnswers && chosen && !o.isCorrect && (
                    <span className="ml-auto text-sm">Senin cevabın</span>
                  )}
                </div>
              );
            })}
          </div>
          {showAnswers && q.explanation && (
            <div className="mt-2 border-l-4 border-(--color-green) bg-(--color-grey-bg) p-3 text-[13px]">
              <strong>Açıklama:</strong> {q.explanation}
            </div>
          )}
          {showAnswers && q.selectedOptionId == null && (
            <p className="mt-1 text-[13px] font-semibold text-(--color-blue-blank)">Bu soruyu boş bıraktın.</p>
          )}
        </li>
      ))}
    </ol>
  );
}

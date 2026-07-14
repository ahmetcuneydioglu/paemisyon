import type { ReactNode } from "react";

/**
 * Ortak 2 sütunlu soru düzeni — eski #exam ekranı (Doc 18 §4.1).
 * Hem sınav çözme (exam-runner) hem sonuç incelemesi (review-list) BİREBİR
 * aynı yerleşimi kullanır: examShadow panel + orta dikey ayraç, soldan sağa
 * yarı yarıya bölünmüş sorular. Şık/altbilgi render'ı çağırana bırakılır.
 */
export function QuestionColumns<
  T extends { questionId: string; order: number; stem: string },
>({
  questions,
  renderQuestion,
}: {
  questions: T[];
  renderQuestion: (q: T) => ReactNode;
}) {
  const half = Math.ceil(questions.length / 2);
  const columns = [questions.slice(0, half), questions.slice(half)];

  return (
    <div className="exam-panel mx-auto mt-6 max-w-6xl px-4 py-6">
      <div className="exam-columns grid grid-cols-1 gap-x-16 md:grid-cols-2">
        {columns.map((col, ci) => (
          <ol key={ci}>
            {col.map((q) => (
              <li key={q.questionId} id={`soru-${q.order}`} className="question-block">
                <p>
                  <b>{q.order}.</b> {q.stem}
                </p>
                {renderQuestion(q)}
              </li>
            ))}
          </ol>
        ))}
      </div>
    </div>
  );
}

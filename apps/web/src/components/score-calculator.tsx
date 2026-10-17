"use client";

import { useId, useState } from "react";
import { StatTile } from "@/components/ui/stat-tile";

interface SectionInput {
  name: string;
  weightPercent: number;
}

/**
 * Net & ağırlıklı skor hesaplayıcı (Doc 23). Resmî puan formülü İDDİA EDİLMEZ —
 * net = doğru − yanlış/4 (yaygın uygulama, kapatılabilir) ve bölüm ağırlıklarına
 * göre 100 üzerinden TAHMİNİ skor gösterilir.
 */
export function ScoreCalculator({
  sections,
  totalQuestions,
}: {
  sections: SectionInput[];
  totalQuestions: number;
}) {
  const [rows, setRows] = useState(
    sections.map(() => ({ correct: "", wrong: "" })),
  );
  const [penalty, setPenalty] = useState(true);
  const penaltyId = useId();

  function setCell(i: number, field: "correct" | "wrong", value: string) {
    setRows((prev) =>
      prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)),
    );
  }

  const perSection = sections.map((s, i) => {
    const c = Math.max(0, Number(rows[i].correct) || 0);
    const w = Math.max(0, Number(rows[i].wrong) || 0);
    const questionCount = Math.round((totalQuestions * s.weightPercent) / 100);
    const net = penalty ? c - w / 4 : c;
    const ratio = questionCount > 0 ? Math.max(0, net) / questionCount : 0;
    return { ...s, questionCount, net, ratio };
  });

  const totalNet = perSection.reduce((sum, s) => sum + s.net, 0);
  const weighted = perSection.reduce(
    (sum, s) => sum + s.ratio * s.weightPercent,
    0,
  );
  const anyInput = rows.some((r) => r.correct !== "" || r.wrong !== "");

  const inputClass =
    "tabular h-11 w-20 rounded-control border border-line bg-surface px-2 text-ink outline-none focus:border-ink-soft";

  return (
    <div className="flex flex-col gap-5">
      <label
        htmlFor={penaltyId}
        className="type-body-sm flex min-h-11 items-center gap-2 text-ink"
      >
        <input
          id={penaltyId}
          type="checkbox"
          className="size-4 accent-accent"
          checked={penalty}
          onChange={(e) => setPenalty(e.target.checked)}
        />
        4 yanlış 1 doğruyu götürsün
      </label>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full border-collapse">
          <caption className="sr-only">
            Bölüm bazında doğru, yanlış ve net
          </caption>
          <thead>
            <tr className="border-b border-line text-left">
              <th scope="col" className="type-label px-4 py-3 text-ink-subtle">
                Bölüm
              </th>
              <th
                scope="col"
                className="type-label w-20 px-4 py-3 text-ink-subtle"
              >
                Ağırlık
              </th>
              <th
                scope="col"
                className="type-label w-28 px-4 py-3 text-ink-subtle"
              >
                Doğru
              </th>
              <th
                scope="col"
                className="type-label w-28 px-4 py-3 text-ink-subtle"
              >
                Yanlış
              </th>
              <th
                scope="col"
                className="type-label w-20 px-4 py-3 text-right text-ink-subtle"
              >
                Net
              </th>
            </tr>
          </thead>
          <tbody>
            {perSection.map((s, i) => (
              <tr key={s.name} className="border-b border-line last:border-b-0">
                <th
                  scope="row"
                  className="type-body-sm px-4 py-2 text-left font-normal text-ink"
                >
                  {s.name}
                </th>
                <td className="type-body-sm tabular px-4 py-2 text-ink-soft">
                  %{s.weightPercent}
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={rows[i].correct}
                    onChange={(e) => setCell(i, "correct", e.target.value)}
                    className={inputClass}
                    aria-label={`${s.name} doğru sayısı`}
                  />
                </td>
                <td className="px-4 py-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={rows[i].wrong}
                    onChange={(e) => setCell(i, "wrong", e.target.value)}
                    className={inputClass}
                    aria-label={`${s.name} yanlış sayısı`}
                  />
                </td>
                <td className="type-subhead tabular px-4 py-2 text-right text-ink">
                  {rows[i].correct !== "" || rows[i].wrong !== ""
                    ? s.net.toFixed(2)
                    : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <StatTile
          label="Toplam net"
          value={anyInput ? totalNet.toFixed(2) : null}
          emphasis
        />
        <StatTile
          label="Ağırlıklı skor"
          value={anyInput ? weighted.toFixed(1) : null}
          unit="/ 100"
          hint="tahminî"
        />
      </div>

      <p className="type-body-sm text-ink-subtle">
        Bu hesap bölüm ağırlıklarına dayalı bir tahmindir; resmî değerlendirme
        formülü değildir. Bölüm soru sayıları toplam soru sayısının ağırlığa
        göre dağılımından yaklaşık hesaplanır.
      </p>
    </div>
  );
}

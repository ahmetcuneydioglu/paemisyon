"use client";

import { useState } from "react";

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
  const [rows, setRows] = useState(sections.map(() => ({ correct: "", wrong: "" })));
  const [penalty, setPenalty] = useState(true);

  function setCell(i: number, field: "correct" | "wrong", value: string) {
    setRows((prev) => prev.map((r, j) => (j === i ? { ...r, [field]: value } : r)));
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
  const weighted =
    perSection.reduce((sum, s) => sum + s.ratio * s.weightPercent, 0);
  const anyInput = rows.some((r) => r.correct !== "" || r.wrong !== "");

  return (
    <div>
      <label className="mb-4 flex items-center gap-2 text-sm text-gray-600">
        <input
          type="checkbox"
          checked={penalty}
          onChange={(e) => setPenalty(e.target.checked)}
        />
        4 yanlış 1 doğruyu götürsün
      </label>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
              <th className="py-2 pr-2">Bölüm</th>
              <th className="w-20 py-2 pr-2">Ağırlık</th>
              <th className="w-24 py-2 pr-2">Doğru</th>
              <th className="w-24 py-2 pr-2">Yanlış</th>
              <th className="w-20 py-2 text-right">Net</th>
            </tr>
          </thead>
          <tbody>
            {perSection.map((s, i) => (
              <tr key={s.name} className="border-b border-gray-100">
                <td className="py-2 pr-2">{s.name}</td>
                <td className="py-2 pr-2 text-gray-500">%{s.weightPercent}</td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={rows[i].correct}
                    onChange={(e) => setCell(i, "correct", e.target.value)}
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    aria-label={`${s.name} doğru sayısı`}
                  />
                </td>
                <td className="py-2 pr-2">
                  <input
                    type="number"
                    min={0}
                    inputMode="numeric"
                    value={rows[i].wrong}
                    onChange={(e) => setCell(i, "wrong", e.target.value)}
                    className="w-20 rounded border border-gray-300 px-2 py-1"
                    aria-label={`${s.name} yanlış sayısı`}
                  />
                </td>
                <td className="py-2 text-right font-medium">
                  {rows[i].correct !== "" || rows[i].wrong !== "" ? s.net.toFixed(2) : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-sm text-gray-500">Toplam Net</p>
          <p className="font-heading text-3xl font-bold text-(--color-navy)">
            {anyInput ? totalNet.toFixed(2) : "—"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-5 text-center">
          <p className="text-sm text-gray-500">Ağırlıklı Skor (100 üzerinden, tahminî)</p>
          <p className="font-heading text-3xl font-bold text-(--color-navy)">
            {anyInput ? weighted.toFixed(1) : "—"}
          </p>
        </div>
      </div>

      <p className="mt-4 text-xs text-gray-400">
        Bu hesap bölüm ağırlıklarına dayalı bir tahmindir; resmî değerlendirme formülü değildir.
        Bölüm soru sayıları toplam soru sayısının ağırlığa göre dağılımından yaklaşık hesaplanır.
      </p>
    </div>
  );
}

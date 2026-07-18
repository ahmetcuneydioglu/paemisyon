"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { MasteryBar } from "@/components/ui/mastery-bar";

export interface TopicProgressRow {
  topicId: string;
  topicName: string;
  courseName: string;
  solvedCount: number;
  correctCount: number;
  mastery: number;
}

/**
 * Konu Haritası — genişleyebilir mastery tablosu (Doc 27 §3.9, wireframe 12).
 * Ders → konu kırılımı; filtreler webe özgü ("yalnız zayıflar" açılışta KAPALI —
 * önce dürüst genel fotoğraf). Kırmızı hücreden tek tık kapatma seansı.
 */
export function TopicMap({ rows }: { rows: TopicProgressRow[] }) {
  const [onlyWeak, setOnlyWeak] = useState(false);
  const [courseFilter, setCourseFilter] = useState<string>("");
  const [openCourses, setOpenCourses] = useState<Set<string>>(new Set());

  const courses = useMemo(() => {
    const map = new Map<string, TopicProgressRow[]>();
    for (const r of rows) {
      const list = map.get(r.courseName) ?? [];
      list.push(r);
      map.set(r.courseName, list);
    }
    return [...map.entries()]
      .map(([name, topics]) => {
        const solved = topics.reduce((s, t) => s + t.solvedCount, 0);
        const correct = topics.reduce((s, t) => s + t.correctCount, 0);
        return {
          name,
          topics: [...topics].sort((a, b) => a.mastery - b.mastery),
          solved,
          mastery: solved > 0 ? Math.round((correct / solved) * 100) : 0,
        };
      })
      .sort((a, b) => a.mastery - b.mastery);
  }, [rows]);

  const visible = courses
    .filter((c) => !courseFilter || c.name === courseFilter)
    .map((c) => ({
      ...c,
      topics: onlyWeak ? c.topics.filter((t) => t.mastery < 60) : c.topics,
    }))
    .filter((c) => c.topics.length > 0);

  function toggle(name: string) {
    setOpenCourses((p) => {
      const n = new Set(p);
      if (n.has(name)) n.delete(name);
      else n.add(name);
      return n;
    });
  }

  return (
    <div>
      {/* Filtre çubuğu */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setOnlyWeak((v) => !v)}
          aria-pressed={onlyWeak}
          className={[
            "tk-interactive cursor-pointer rounded-full border px-3 py-1 text-[13px] font-bold",
            onlyWeak
              ? "border-danger bg-danger/10 text-danger"
              : "border-line text-ink-soft hover:text-ink",
          ].join(" ")}
        >
          Yalnız zayıflar (&lt;%60)
        </button>
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          aria-label="Ders filtresi"
          className="cursor-pointer rounded-full border border-line bg-surface px-3 py-1 text-[13px] font-bold text-ink-soft"
        >
          <option value="">Ders: tümü</option>
          {courses.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="tk-caption ml-auto">
          {rows.length} konu izleniyor · renk + ok + sayı birlikte okunur
        </span>
      </div>

      <Card className="p-0">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="tk-caption border-b border-line text-left">
              <th className="w-8 px-3 py-2.5" />
              <th className="py-2.5 font-semibold">Ders / konu</th>
              <th className="px-3 py-2.5 text-right font-semibold">Çözülen</th>
              <th className="px-3 py-2.5 font-semibold">Doğruluk</th>
              <th className="px-4 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const open = openCourses.has(c.name) || !!courseFilter || onlyWeak;
              return [
                <tr
                  key={c.name}
                  className="tk-interactive cursor-pointer border-b border-line hover:bg-line/20"
                  onClick={() => toggle(c.name)}
                >
                  <td className="px-3 py-2.5 text-ink-soft" aria-hidden>
                    {open ? "▾" : "▸"}
                  </td>
                  <td className="py-2.5 font-bold text-ink">{c.name}</td>
                  <td className="tabular px-3 py-2.5 text-right text-ink-soft">{c.solved}</td>
                  <td className="px-3 py-2.5">
                    <MasteryBar value={c.solved > 0 ? c.mastery : null} />
                  </td>
                  <td />
                </tr>,
                ...(open
                  ? c.topics.map((t) => (
                      <tr key={t.topicId} className="border-b border-line last:border-0">
                        <td />
                        <td className="py-2 pl-4 text-ink-soft">{t.topicName}</td>
                        <td className="tabular px-3 py-2 text-right text-ink-soft">
                          {t.solvedCount}
                        </td>
                        <td className="px-3 py-2">
                          <MasteryBar value={t.solvedCount > 0 ? t.mastery : null} />
                        </td>
                        <td className="px-4 py-2 text-right">
                          <Link
                            href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                            className="tk-interactive inline-block rounded-full border border-line px-3 py-1 text-[12px] font-bold text-ink-soft hover:border-brand hover:text-brand"
                          >
                            kapat
                          </Link>
                        </td>
                      </tr>
                    ))
                  : []),
              ];
            })}
          </tbody>
        </table>
        {visible.length === 0 && (
          <p className="p-6 text-center text-[14px] text-ink-soft">
            {onlyWeak
              ? "Bu filtrede zayıf konu yok — harita temiz görünüyor."
              : "Henüz izlenecek konu verisi yok — birkaç seans sonra harita burada oluşur."}
          </p>
        )}
      </Card>
    </div>
  );
}

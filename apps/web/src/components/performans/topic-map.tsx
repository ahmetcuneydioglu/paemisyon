"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import { Chip } from "@/components/ui/chip";
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
 * Konu Haritası — genişleyebilir hakimiyet tablosu (Doc 27 §3.9). Ders → konu kırılımı;
 * "yalnız zayıflar" açılışta KAPALI (önce dürüst genel fotoğraf). Kırmızı satırdan tek tık
 * kapatma turu.
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

  const th = "type-label px-3 py-3 text-ink-subtle";
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Chip
          label="Yalnız zayıflar (<%60)"
          selected={onlyWeak}
          onClick={() => setOnlyWeak((v) => !v)}
        />
        <select
          value={courseFilter}
          onChange={(e) => setCourseFilter(e.target.value)}
          aria-label="Ders filtresi"
          className="type-subhead h-11 cursor-pointer rounded-pill border border-line bg-surface px-3.5 text-ink outline-none focus:border-ink-soft"
        >
          <option value="">Ders: tümü</option>
          {courses.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <span className="type-body-sm ml-auto text-ink-subtle">
          {rows.length} konu izleniyor · renk + sayı birlikte okunur
        </span>
      </div>

      <div className="overflow-x-auto rounded-card border border-line bg-surface">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-line text-left">
              <th className={cn(th, "w-10")} />
              <th className={th}>Ders / konu</th>
              <th className={cn(th, "text-right")}>Çözülen</th>
              <th className={th}>Doğruluk</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {visible.map((c) => {
              const open =
                openCourses.has(c.name) || !!courseFilter || onlyWeak;
              return [
                <tr
                  key={c.name}
                  className="tk-interactive cursor-pointer border-b border-line hover:bg-surface-alt/60"
                  onClick={() => toggle(c.name)}
                >
                  <td className="px-3 py-3 text-ink-subtle" aria-hidden>
                    {open ? (
                      <ChevronDown size={16} />
                    ) : (
                      <ChevronRight size={16} />
                    )}
                  </td>
                  <td className="type-subhead py-3 text-ink">{c.name}</td>
                  <td className="type-body-sm tabular px-3 py-3 text-right text-ink-soft">
                    {c.solved}
                  </td>
                  <td className="px-3 py-3">
                    <MasteryBar value={c.solved > 0 ? c.mastery : null} />
                  </td>
                  <td />
                </tr>,
                ...(open
                  ? c.topics.map((t) => (
                      <tr
                        key={t.topicId}
                        className="border-b border-line last:border-0"
                      >
                        <td />
                        <td className="type-body-sm py-2.5 pl-4 text-ink-soft">
                          {t.topicName}
                        </td>
                        <td className="type-body-sm tabular px-3 py-2.5 text-right text-ink-soft">
                          {t.solvedCount}
                        </td>
                        <td className="px-3 py-2.5">
                          <MasteryBar
                            value={t.solvedCount > 0 ? t.mastery : null}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Link
                            href={`/seans?topicId=${t.topicId}&scope=${encodeURIComponent(`${t.topicName} · kapatma`)}`}
                            className="tk-interactive inline-flex h-9 items-center rounded-control border border-line px-3 text-[13px] font-semibold text-ink-soft hover:border-ink-soft hover:text-ink"
                          >
                            Kapat
                          </Link>
                        </td>
                      </tr>
                    ))
                  : []),
              ];
            })}
          </tbody>
        </table>
        {visible.length === 0 ? (
          <p className="type-body-sm p-6 text-center text-ink-soft">
            {onlyWeak
              ? "Bu filtrede zayıf konu yok — harita temiz görünüyor."
              : "Henüz izlenecek konu verisi yok — birkaç tur sonra harita burada oluşur."}
          </p>
        ) : null}
      </div>
    </div>
  );
}

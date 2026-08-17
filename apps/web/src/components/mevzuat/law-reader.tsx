"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { ThreePane } from "@/components/shell/three-pane";
import type { MevzuatReading } from "@/lib/public-api";

/**
 * Girişli okuyucu (Doc 29 §33): AĞAÇ (içindekiler) | MADDELER | INSPECTOR
 * (kaydet + devam + quiz köprüsü). Anon /oku sayfasının app-kabuğu eşi —
 * middleware girişli isteği buraya rewrite eder, URL değişmez.
 */
interface Highlight {
  id: string;
  no: string;
  startOffset: number;
  endOffset: number;
  snippet: string;
}

/** Seçimin, madde metin kabı içindeki karakter aralığı (mark'lar hesaba katılır). */
function selectionOffsets(container: HTMLElement): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let pos = 0;
  let start = -1;
  let end = -1;
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const len = node.textContent?.length ?? 0;
    if (node === range.startContainer) start = pos + range.startOffset;
    if (node === range.endContainer) end = pos + range.endOffset;
    pos += len;
  }
  return start >= 0 && end > start ? { start, end } : null;
}

export function LawReader({ law }: { law: MevzuatReading }) {
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [highlights, setHighlights] = useState<Map<string, Highlight[]>>(new Map());
  const [notes, setNotes] = useState<Map<string, string>>(new Map());
  const [noteEditing, setNoteEditing] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [pendingSel, setPendingSel] = useState<{
    no: string;
    start: number;
    end: number;
    snippet: string;
  } | null>(null);
  const [activeNo, setActiveNo] = useState<string | null>(null);
  const lastSaved = useRef<string | null>(null);

  const bySection = useMemo(
    () => new Map(law.sections.map((s) => [s.id, s.heading])),
    [law.sections],
  );

  // Kayıtlı maddeler + işaret/not katmanı.
  useEffect(() => {
    apiClient<{ items: { lawSlug: string; no: string }[] }>("/me/article-bookmarks")
      .then((r) =>
        setBookmarked(
          new Set(r.items.filter((b) => b.lawSlug === law.slug).map((b) => b.no)),
        ),
      )
      .catch(() => {});
    apiClient<{ highlights: Highlight[]; notes: { no: string; text: string }[] }>(
      `/me/article-annotations?lawSlug=${encodeURIComponent(law.slug)}`,
    )
      .then((r) => {
        const byNo = new Map<string, Highlight[]>();
        for (const h of r.highlights) {
          byNo.set(h.no, [...(byNo.get(h.no) ?? []), h]);
        }
        setHighlights(byNo);
        setNotes(new Map(r.notes.map((n) => [n.no, n.text])));
      })
      .catch(() => {});
  }, [law.slug]);

  const addHighlight = () => {
    const p = pendingSel;
    if (!p) return;
    setPendingSel(null);
    window.getSelection()?.removeAllRanges();
    apiClient<{ ok: boolean; id?: string }>("/me/article-highlights", {
      method: "POST",
      body: JSON.stringify({
        lawSlug: law.slug,
        no: p.no,
        startOffset: p.start,
        endOffset: p.end,
        snippet: p.snippet,
      }),
    })
      .then((r) => {
        if (!r.ok || !r.id) return;
        setHighlights((m) => {
          const next = new Map(m);
          next.set(p.no, [
            ...(next.get(p.no) ?? []),
            { id: r.id!, no: p.no, startOffset: p.start, endOffset: p.end, snippet: p.snippet },
          ]);
          return next;
        });
      })
      .catch(() => {});
  };

  const removeHighlight = (no: string, id: string) => {
    setHighlights((m) => {
      const next = new Map(m);
      next.set(no, (next.get(no) ?? []).filter((h) => h.id !== id));
      return next;
    });
    apiClient(`/me/article-highlights/${id}`, { method: "DELETE" }).catch(() => {});
  };

  const saveNote = (no: string) => {
    const text = noteDraft.trim();
    setNoteEditing(null);
    setNotes((m) => {
      const next = new Map(m);
      if (text) next.set(no, text);
      else next.delete(no);
      return next;
    });
    apiClient("/me/article-notes", {
      method: "PUT",
      body: JSON.stringify({ lawSlug: law.slug, no, text }),
    }).catch(() => {});
  };

  /** Metni işaret aralıklarıyla parçalara böler (çapa doğrulamalı). */
  const renderText = (a: MevzuatReading["articles"][number]) => {
    const hs = highlights.get(a.no) ?? [];
    const ranges: [number, number, string][] = [];
    for (const h of hs) {
      let { startOffset: s0, endOffset: e0 } = h;
      const valid =
        s0 >= 0 && e0 <= a.text.length && e0 > s0 && a.text.slice(s0, e0) === h.snippet;
      if (!valid) {
        const idx = h.snippet ? a.text.indexOf(h.snippet) : -1;
        if (idx < 0) continue;
        s0 = idx;
        e0 = idx + h.snippet.length;
      }
      ranges.push([s0, e0, h.id]);
    }
    ranges.sort((x, y) => x[0] - y[0]);
    const parts: React.ReactNode[] = [];
    let cursor = 0;
    for (const [s0, e0, id] of ranges) {
      if (s0 < cursor) continue; // çakışan — ilki kazanır
      if (s0 > cursor) parts.push(a.text.slice(cursor, s0));
      parts.push(
        <mark
          key={id}
          title="İşareti kaldırmak için tıkla"
          onClick={() => removeHighlight(a.no, id)}
          className="cursor-pointer rounded-sm bg-amber-200/70 px-0.5 dark:bg-amber-500/30"
        >
          {a.text.slice(s0, e0)}
        </mark>,
      );
      cursor = e0;
    }
    if (cursor < a.text.length) parts.push(a.text.slice(cursor));
    return parts;
  };

  // Görünür madde takibi → okuma konumu (devam et) — 15 sn'de bir kaydet.
  useEffect(() => {
    const articles = Array.from(document.querySelectorAll<HTMLElement>("[data-madde]"));
    if (articles.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        const no = visible[0]?.target.getAttribute("data-madde");
        if (no) setActiveNo(no);
      },
      { rootMargin: "-15% 0px -70% 0px" },
    );
    articles.forEach((a) => observer.observe(a));
    return () => observer.disconnect();
  }, [law.slug]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (activeNo && activeNo !== lastSaved.current) {
        lastSaved.current = activeNo;
        apiClient("/me/reading-progress", {
          method: "POST",
          body: JSON.stringify({ lawSlug: law.slug, no: activeNo }),
        }).catch(() => {});
      }
    }, 15_000);
    return () => clearInterval(timer);
  }, [activeNo, law.slug]);

  const toggleBookmark = (no: string) => {
    const was = bookmarked.has(no);
    setBookmarked((s) => {
      const next = new Set(s);
      if (was) next.delete(no);
      else next.add(no);
      return next;
    });
    apiClient("/me/article-bookmarks", {
      method: was ? "DELETE" : "POST",
      body: JSON.stringify({ lawSlug: law.slug, no }),
    }).catch(() =>
      setBookmarked((s) => {
        const next = new Set(s);
        if (was) next.add(no);
        else next.delete(no);
        return next;
      }),
    );
  };

  // ── AĞAÇ: bölüm başlıklı içindekiler ──
  const tree = (
    <div className="max-h-[80vh] overflow-y-auto pr-1 text-sm">
      {law.articles.map((a, i) => {
        const prev = i > 0 ? law.articles[i - 1] : null;
        const heading =
          a.sectionId && a.sectionId !== prev?.sectionId
            ? bySection.get(a.sectionId)
            : null;
        return (
          <div key={a.slug}>
            {heading && (
              <p className="tk-caption mt-3 mb-1 text-[10px] font-semibold tracking-wide">
                {heading.toLocaleUpperCase("tr-TR")}
              </p>
            )}
            <a
              href={`#m-${a.slug}`}
              className={`block truncate rounded px-2 py-1 text-xs ${
                activeNo === a.no
                  ? "bg-(--tk-brand)/10 font-semibold text-(--tk-brand)"
                  : "text-(--tk-ink-soft) hover:bg-(--tk-surface-alt)"
              }`}
              title={a.title ?? undefined}
            >
              m.{a.no}
              {a.title ? ` — ${a.title}` : ""}
            </a>
          </div>
        );
      })}
    </div>
  );

  // ── MADDELER ──
  const article = (
    <div>
      <h1 className="tk-title mb-1">{law.name}</h1>
      <p className="tk-caption mb-6">
        Kaynak: {law.source}
        {law.effectiveInfo ? ` · ${law.effectiveInfo}` : ""}
        {law.verifiedAt
          ? ` · ${law.verifiedAt.slice(0, 10).split("-").reverse().join(".")} itibarıyla doğrulandı`
          : ""}
      </p>
      <div className="space-y-8">
        {law.articles.map((a, i) => {
          const prev = i > 0 ? law.articles[i - 1] : null;
          const heading =
            a.sectionId && a.sectionId !== prev?.sectionId
              ? bySection.get(a.sectionId)
              : null;
          const isBookmarked = bookmarked.has(a.no);
          return (
            <article
              key={a.slug}
              id={`m-${a.slug}`}
              data-madde={a.no}
              className="scroll-mt-20"
            >
              {heading && (
                <p className="mb-3 mt-6 border-b border-(--tk-line) pb-1 text-xs font-bold tracking-widest text-(--tk-brand)">
                  {heading.toLocaleUpperCase("tr-TR")}
                </p>
              )}
              <div className="mb-1 flex items-baseline gap-3">
                <h2 className="tk-heading text-(--tk-brand)">MADDE {a.no}</h2>
                {a.title && <span className="tk-caption">{a.title}</span>}
              </div>
              <div
                className="whitespace-pre-line text-[16px] leading-[1.65] text-(--tk-ink)"
                onMouseUp={(e) => {
                  const offs = selectionOffsets(e.currentTarget);
                  if (offs) {
                    setPendingSel({
                      no: a.no,
                      start: offs.start,
                      end: offs.end,
                      snippet: a.text.slice(offs.start, offs.end),
                    });
                  } else if (pendingSel?.no === a.no) {
                    setPendingSel(null);
                  }
                }}
              >
                {renderText(a)}
              </div>
              {notes.get(a.no) != null && noteEditing !== a.no && (
                <div className="mt-2 border-l-[3px] border-amber-400 bg-amber-50 p-3 dark:bg-amber-500/10">
                  <p className="mb-1 text-[10px] font-bold tracking-widest text-amber-600">
                    📝 NOTUM
                  </p>
                  <p className="whitespace-pre-line text-sm text-(--tk-ink)">
                    {notes.get(a.no)}
                  </p>
                </div>
              )}
              {noteEditing === a.no && (
                <div className="mt-2">
                  <textarea
                    autoFocus
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    maxLength={2000}
                    rows={3}
                    className="w-full rounded border border-(--tk-line) bg-(--tk-surface) p-2 text-sm text-(--tk-ink)"
                    placeholder='Örn. "Yakalama şartlarını tekrar çalış."'
                  />
                  <div className="mt-1 flex justify-end gap-2 text-xs">
                    <button
                      type="button"
                      className="text-(--tk-ink-soft)"
                      onClick={() => setNoteEditing(null)}
                    >
                      Vazgeç
                    </button>
                    <button
                      type="button"
                      className="font-semibold text-(--tk-brand)"
                      onClick={() => saveNote(a.no)}
                    >
                      Kaydet
                    </button>
                  </div>
                </div>
              )}
              <div className="mt-2 flex items-center gap-4 text-xs">
                <button
                  type="button"
                  onClick={() => toggleBookmark(a.no)}
                  className={`font-semibold ${
                    isBookmarked ? "text-(--tk-brand)" : "text-(--tk-ink-soft)"
                  } hover:text-(--tk-brand)`}
                >
                  {isBookmarked ? "🔖 Kaydedildi" : "📑 Kaydet"}
                </button>
                {pendingSel?.no === a.no && (
                  <button
                    type="button"
                    onClick={addHighlight}
                    className="rounded bg-amber-400/90 px-2 py-0.5 font-semibold text-amber-950"
                  >
                    🖍 İşaretle
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setNoteDraft(notes.get(a.no) ?? "");
                    setNoteEditing(noteEditing === a.no ? null : a.no);
                  }}
                  className={`font-semibold ${
                    notes.has(a.no) ? "text-amber-600" : "text-(--tk-ink-soft)"
                  } hover:text-amber-600`}
                >
                  {notes.has(a.no) ? "📝 Notum" : "📝 Not"}
                </button>
                {a.questionCount > 0 && (
                  <Link
                    href={`/kanun/${law.slug}/madde/${a.slug}`}
                    className="text-(--tk-ink-soft) hover:text-(--tk-brand)"
                  >
                    🎯 {a.questionCount} soru
                  </Link>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );

  // ── INSPECTOR ──
  const savedHere = law.articles.filter((a) => bookmarked.has(a.no));
  const inspector = (
    <div className="space-y-4">
      <div className="rounded-xl border border-(--tk-line) bg-(--tk-surface) p-4">
        <p className="tk-caption mb-2">BU KANUNDA KAYDETTİKLERİN</p>
        {savedHere.length === 0 ? (
          <p className="text-xs text-(--tk-ink-soft)">
            Henüz yok — madde altındaki “Kaydet” ile işaretle.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {savedHere.map((a) => (
              <a
                key={a.slug}
                href={`#m-${a.slug}`}
                className="rounded border border-(--tk-line) px-2 py-0.5 font-mono text-xs text-(--tk-ink-soft) hover:border-(--tk-brand) hover:text-(--tk-brand)"
              >
                m.{a.no}
              </a>
            ))}
          </div>
        )}
      </div>
      <div className="rounded-xl border border-(--tk-line) bg-(--tk-surface) p-4">
        <p className="tk-caption mb-2">ÇALIŞ</p>
        <Link
          href={`/kanun/${law.slug}`}
          className="block text-sm font-semibold text-(--tk-brand) hover:underline"
        >
          Madde Atlası + kanun turu →
        </Link>
      </div>
      {law.sourceUrl && (
        <a
          href={law.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="tk-caption block hover:underline"
        >
          Resmî Kaynak ({law.source}) ↗
        </a>
      )}
    </div>
  );

  return <ThreePane tree={tree} treeLabel="İçindekiler" article={article} inspector={inspector} />;
}

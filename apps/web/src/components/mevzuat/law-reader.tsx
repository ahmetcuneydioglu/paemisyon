"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { ThreePane } from "@/components/shell/three-pane";
import type { MevzuatReading } from "@/lib/public-api";
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Highlighter,
  StickyNote,
  Target,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArticleSummaryDisclosure } from "@/components/ozet/article-summary";

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
function selectionOffsets(
  container: HTMLElement,
): { start: number; end: number } | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return null;
  const range = sel.getRangeAt(0);
  if (
    !container.contains(range.startContainer) ||
    !container.contains(range.endContainer)
  ) {
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
  const [highlights, setHighlights] = useState<Map<string, Highlight[]>>(
    new Map(),
  );
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
    apiClient<{ items: { lawSlug: string; no: string }[] }>(
      "/me/article-bookmarks",
    )
      .then((r) =>
        setBookmarked(
          new Set(
            r.items.filter((b) => b.lawSlug === law.slug).map((b) => b.no),
          ),
        ),
      )
      .catch(() => {});
    apiClient<{
      highlights: Highlight[];
      notes: { no: string; text: string }[];
    }>(`/me/article-annotations?lawSlug=${encodeURIComponent(law.slug)}`)
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
            {
              id: r.id!,
              no: p.no,
              startOffset: p.start,
              endOffset: p.end,
              snippet: p.snippet,
            },
          ]);
          return next;
        });
      })
      .catch(() => {});
  };

  const removeHighlight = (no: string, id: string) => {
    setHighlights((m) => {
      const next = new Map(m);
      next.set(
        no,
        (next.get(no) ?? []).filter((h) => h.id !== id),
      );
      return next;
    });
    apiClient(`/me/article-highlights/${id}`, { method: "DELETE" }).catch(
      () => {},
    );
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
        s0 >= 0 &&
        e0 <= a.text.length &&
        e0 > s0 &&
        a.text.slice(s0, e0) === h.snippet;
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
          className="cursor-pointer rounded-[4px] bg-warning-soft px-0.5 text-warning-ink"
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
    const articles = Array.from(
      document.querySelectorAll<HTMLElement>("[data-madde]"),
    );
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
    <div className="pr-1">
      {law.articles.map((a, i) => {
        const prev = i > 0 ? law.articles[i - 1] : null;
        const heading =
          a.sectionId && a.sectionId !== prev?.sectionId
            ? bySection.get(a.sectionId)
            : null;
        return (
          <div key={a.slug}>
            {heading && (
              <p className="type-label mt-3 mb-1 text-ink-subtle">{heading}</p>
            )}
            <a
              href={`#m-${a.slug}`}
              className={cn(
                "block truncate rounded-control px-2 py-1 text-[13px]",
                activeNo === a.no
                  ? "bg-accent-soft font-semibold text-accent-ink"
                  : "text-ink-soft hover:bg-surface-alt",
              )}
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
      <h1 className="type-title mb-1 text-ink">{law.name}</h1>
      <p className="type-body-sm mb-6 text-ink-subtle">
        Kaynak: {law.source}
        {law.effectiveInfo ? ` · ${law.effectiveInfo}` : ""}
        {law.verifiedAt
          ? ` · ${law.verifiedAt.slice(0, 10).split("-").reverse().join(".")} itibarıyla doğrulandı`
          : ""}
      </p>
      <div className="flex flex-col gap-8">
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
                <p className="type-label mt-6 mb-3 border-b border-line pb-1 text-accent-ink">
                  {heading}
                </p>
              )}
              <div className="mb-1 flex items-baseline gap-3">
                <h2 className="type-heading text-accent-ink">Madde {a.no}</h2>
                {a.title && (
                  <span className="type-body-sm text-ink-subtle">
                    {a.title}
                  </span>
                )}
              </div>
              <div
                className="type-body max-w-[65ch] whitespace-pre-line text-ink"
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
              {a.summary && (
                <ArticleSummaryDisclosure
                  summary={a.summary}
                  href={`/kanun/${law.slug}/madde/${a.slug}`}
                  className="max-w-[65ch]"
                />
              )}
              {notes.get(a.no) != null && noteEditing !== a.no && (
                <div className="mt-2 rounded-control border-l-[3px] border-warning bg-warning-soft p-3">
                  <p className="type-label mb-1 inline-flex items-center gap-1 text-warning-ink">
                    <StickyNote size={12} aria-hidden /> Notum
                  </p>
                  <p className="type-body-sm whitespace-pre-line text-ink">
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
                    className="type-body-sm w-full rounded-control border border-line bg-surface p-2.5 text-ink outline-none focus:border-ink-soft"
                    placeholder='Örn. "Yakalama şartlarını tekrar çalış."'
                  />
                  <div className="mt-1 flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setNoteEditing(null)}
                    >
                      Vazgeç
                    </Button>
                    <Button size="sm" onClick={() => saveNote(a.no)}>
                      Kaydet
                    </Button>
                  </div>
                </div>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  aria-pressed={isBookmarked}
                  leadingIcon={
                    isBookmarked ? (
                      <BookmarkCheck size={16} aria-hidden />
                    ) : (
                      <Bookmark size={16} aria-hidden />
                    )
                  }
                  onClick={() => toggleBookmark(a.no)}
                >
                  {isBookmarked ? "Kaydedildi" : "Kaydet"}
                </Button>
                {pendingSel?.no === a.no && (
                  <Button
                    size="sm"
                    leadingIcon={<Highlighter size={16} aria-hidden />}
                    onClick={addHighlight}
                  >
                    İşaretle
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  leadingIcon={<StickyNote size={16} aria-hidden />}
                  onClick={() => {
                    setNoteDraft(notes.get(a.no) ?? "");
                    setNoteEditing(noteEditing === a.no ? null : a.no);
                  }}
                >
                  {notes.has(a.no) ? "Notum" : "Not"}
                </Button>
                {a.questionCount > 0 && (
                  <Link
                    href={`/kanun/${law.slug}/madde/${a.slug}`}
                    className="tk-interactive inline-flex h-9 items-center gap-1.5 rounded-control px-3 text-[13px] text-ink-soft hover:bg-surface-alt hover:text-ink"
                  >
                    <Target size={16} aria-hidden /> {a.questionCount} soru
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
    <div className="flex flex-col gap-3">
      <Card className="flex flex-col gap-2">
        <p className="type-label text-ink-subtle">Bu kanunda kaydettiklerin</p>
        {savedHere.length === 0 ? (
          <p className="type-body-sm text-ink-soft">
            Henüz yok — madde altındaki “Kaydet” ile işaretle.
          </p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {savedHere.map((a) => (
              <a
                key={a.slug}
                href={`#m-${a.slug}`}
                className="tk-interactive inline-flex h-8 items-center rounded-pill border border-line px-2.5 font-mono text-[12px] text-ink-soft hover:border-ink-soft hover:text-ink"
              >
                m.{a.no}
              </a>
            ))}
          </div>
        )}
      </Card>
      <Card className="flex flex-col gap-2">
        <p className="type-label text-ink-subtle">Çalış</p>
        <Link
          href={`/kanun/${law.slug}`}
          className="type-subhead text-accent-ink hover:underline"
        >
          Madde Atlası + kanun turu
        </Link>
      </Card>
      {law.sourceUrl && (
        <a
          href={law.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="type-body-sm inline-flex items-center gap-1 text-ink-subtle hover:text-ink hover:underline"
        >
          Resmî kaynak ({law.source}) <ExternalLink size={12} aria-hidden />
        </a>
      )}
    </div>
  );

  return (
    <ThreePane
      tree={tree}
      treeLabel="İçindekiler"
      article={article}
      inspector={inspector}
    />
  );
}

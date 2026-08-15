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
export function LawReader({ law }: { law: MevzuatReading }) {
  const [bookmarked, setBookmarked] = useState<Set<string>>(new Set());
  const [activeNo, setActiveNo] = useState<string | null>(null);
  const lastSaved = useRef<string | null>(null);

  const bySection = useMemo(
    () => new Map(law.sections.map((s) => [s.id, s.heading])),
    [law.sections],
  );

  // Kayıtlı maddeleri tohumla (rozetler doğru başlasın).
  useEffect(() => {
    apiClient<{ items: { lawSlug: string; no: string }[] }>("/me/article-bookmarks")
      .then((r) =>
        setBookmarked(
          new Set(r.items.filter((b) => b.lawSlug === law.slug).map((b) => b.no)),
        ),
      )
      .catch(() => {});
  }, [law.slug]);

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
              <div className="whitespace-pre-line text-[16px] leading-[1.65] text-(--tk-ink)">
                {a.text}
              </div>
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
          Madde Atlası + kanun seansı →
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

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ExternalLink, Lock } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import type { LessonBlock, LessonDetail } from "@/lib/anlatim";
import { Card } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { SummaryBody } from "@/components/ozet/summary-body";
import { cn } from "@/lib/cn";

const KAYIT_ARALIGI_MS = 2500;

/** Tablo: üç sütunda ilk sütun ölçüt (satır başlığı); dar ekranda hücreler başlıklarıyla alt alta. */
function TableBlock({ b }: { b: Extract<LessonBlock, { kind: "table" }> }) {
  return (
    <Card tone="alt" className="overflow-hidden p-0">
      <table className="hidden w-full sm:table">
        <thead>
          <tr>
            {b.headers.map((h, i) => (
              <th key={i} className="border-b border-line px-4 py-2 text-left type-label text-accent-ink">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {b.rows.map((r, i) => (
            <tr key={i}>
              {r.map((c, j) => (
                <td key={j} className={cn("px-4 py-2 align-top type-body-sm", j === 0 && b.headers.length === 3 ? "text-ink-soft" : "text-ink")}>
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="flex flex-col divide-y divide-line sm:hidden">
        {b.rows.map((r, i) => (
          <div key={i} className="flex flex-col gap-1 p-3">
            {r.map((c, j) => (
              <div key={j} className="flex flex-col">
                <dt className="type-label text-ink-subtle">{b.headers[j]}</dt>
                <dd className="type-body-sm text-ink">{c}</dd>
              </div>
            ))}
          </div>
        ))}
      </dl>
    </Card>
  );
}

/**
 * Ders okuyucu (Doc 57): bölümler + içindekiler; girişliyse kaydırma konumu seyrek ve sessiz kaydedilir,
 * "okudum" düğmesi hesapta işaretlenir; misafirde kayıt yok. Kaynakça yalnız kamuya açık kaynaklar.
 */
export function LessonReader({ lesson, loggedIn, premiumHref, loginHref }: { lesson: LessonDetail; loggedIn: boolean; premiumHref: string; loginHref: string }) {
  const [read, setRead] = useState(Boolean(lesson.progress?.readAt));
  const [saving, setSaving] = useState(false);
  const offset = useRef(lesson.progress?.offset ?? 0);
  const lastSent = useRef(lesson.progress?.offset ?? 0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restored = useRef(false);

  // Konumu geri yükle (gövde çizildikten sonra bir kez).
  useEffect(() => {
    if (restored.current || !lesson.body) return;
    restored.current = true;
    if (offset.current > 0) window.scrollTo({ top: offset.current, behavior: "auto" });
  }, [lesson.body]);

  // Kaydırma konumu: girişliyse 2,5 sn sessizlikten sonra kaydedilir.
  useEffect(() => {
    if (!loggedIn || !lesson.body) return;
    const onScroll = () => {
      offset.current = Math.max(0, Math.round(window.scrollY));
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        if (Math.abs(offset.current - lastSent.current) < 40) return;
        lastSent.current = offset.current;
        void apiClient("/me/lessons/progress", { method: "POST", body: { slug: lesson.slug, offset: offset.current } }).catch(() => undefined);
      }, KAYIT_ARALIGI_MS);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer.current) clearTimeout(timer.current);
    };
  }, [loggedIn, lesson.slug, lesson.body]);

  const markRead = async () => {
    setRead(true);
    if (!loggedIn) return;
    setSaving(true);
    try {
      await apiClient("/me/lessons/progress", { method: "POST", body: { slug: lesson.slug, offset: offset.current, read: true } });
    } catch {
      /* sessiz: okuma sürer */
    } finally {
      setSaving(false);
    }
  };

  if (lesson.locked || !lesson.body) {
    return (
      <Card tone="accent" className="flex flex-col gap-3 p-5">
        <p className="inline-flex items-center gap-2 type-subhead text-ink">
          <Lock size={16} aria-hidden /> Premium içerik
        </p>
        <p className="type-body text-ink-soft">Bu bölüm Premium üyelere açık. Dersin hedefi: {lesson.goal}</p>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href={premiumHref}>Premium&apos;u incele</ButtonLink>
          {!loggedIn ? (
            <ButtonLink href={loginHref} variant="secondary">
              Giriş yap
            </ButtonLink>
          ) : null}
        </div>
      </Card>
    );
  }

  const sections = lesson.body.sections;
  const idOf = (i: number) => `bolum-${i + 1}`;

  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_240px] lg:items-start lg:gap-8">
      <article className="flex min-w-0 flex-col gap-8">
        {sections.map((s, i) => (
          <section key={i} id={idOf(i)} className="flex scroll-mt-24 flex-col gap-3">
            <h2 className="type-heading text-ink">{s.title}</h2>
            <div className="flex flex-col gap-4">
              {s.blocks.map((b, j) => (b.kind === "text" ? <SummaryBody key={j} text={b.text} className="type-body text-ink" /> : <TableBlock key={j} b={b} />))}
            </div>
          </section>
        ))}

        {lesson.sources.length > 0 ? (
          <section className="flex flex-col gap-2 border-t border-line pt-5" aria-label="Kaynaklar">
            <h2 className="type-subhead text-ink">Kaynaklar</h2>
            <ul className="flex flex-col gap-1 type-body-sm text-ink-soft">
              {lesson.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-accent-ink hover:underline">
                      {s.label} <ExternalLink size={12} aria-hidden />
                    </a>
                  ) : (
                    s.label
                  )}
                  {s.kind === "article" ? <span className="ml-1 text-ink-subtle">· resmî madde metni</span> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <Card className="flex flex-col gap-3 p-5">
          <p className="inline-flex items-center gap-2 type-subhead text-ink">
            {read ? <CheckCircle2 size={16} className="text-success-ink" aria-hidden /> : null}
            {read ? "Bu dersi okudun" : "Dersin sonuna geldin"}
          </p>
          <p className="type-body-sm text-ink-soft">Okundu bilgisi, konuya hâkimiyet ölçümü değildir.</p>
          <div className="flex flex-wrap items-center gap-2">
            {loggedIn ? (
              <Button variant="secondary" onClick={() => void markRead()} disabled={read || saving}>
                {read ? "Okundu" : "Okudum olarak işaretle"}
              </Button>
            ) : (
              <ButtonLink href={loginHref} variant="secondary">
                Giriş yap, kaldığın yer saklansın
              </ButtonLink>
            )}
            {lesson.next ? (
              <ButtonLink href={`/anlatim/${lesson.next.slug}`}>
                Sonraki ders <ArrowRight size={16} aria-hidden />
              </ButtonLink>
            ) : null}
          </div>
        </Card>

        <nav className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-label="Komşu dersler">
          {lesson.prev ? (
            <Link href={`/anlatim/${lesson.prev.slug}`} className="tk-interactive flex min-w-0 items-center gap-3 rounded-card border border-line bg-surface p-4 hover:border-accent/50">
              <ArrowLeft size={16} className="shrink-0 text-ink-subtle" aria-hidden />
              <span className="flex min-w-0 flex-col">
                <span className="type-label text-ink-subtle">Önceki ders</span>
                <span className="type-subhead text-ink">{lesson.prev.title}</span>
              </span>
            </Link>
          ) : (
            <span className="hidden sm:block" />
          )}
          {lesson.next ? (
            <Link href={`/anlatim/${lesson.next.slug}`} className="tk-interactive flex min-w-0 items-center justify-end gap-3 rounded-card border border-line bg-surface p-4 text-right hover:border-accent/50">
              <span className="flex min-w-0 flex-col">
                <span className="type-label text-ink-subtle">Sonraki ders</span>
                <span className="type-subhead text-ink">{lesson.next.title}</span>
              </span>
              <ArrowRight size={16} className="shrink-0 text-ink-subtle" aria-hidden />
            </Link>
          ) : null}
        </nav>
      </article>

      <aside className="order-first lg:order-none lg:sticky lg:top-24">
        <Card tone="alt" className="flex flex-col gap-2 p-4">
          <p className="type-label text-ink-subtle">İçindekiler</p>
          <ol className="flex flex-col gap-1">
            {sections.map((s, i) => (
              <li key={i}>
                <a href={`#${idOf(i)}`} className="type-body-sm text-ink-soft hover:text-accent-ink">
                  {i + 1}. {s.title}
                </a>
              </li>
            ))}
          </ol>
        </Card>
      </aside>
    </div>
  );
}

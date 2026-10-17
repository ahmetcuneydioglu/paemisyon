"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { config } from "@/lib/config";
import { ChevronDown, ChevronRight, Lock } from "lucide-react";

interface Module {
  id: string;
  name: string;
}
interface Law {
  slug: string;
  topicId: string;
  name: string;
  questionCount: number;
}
interface Course {
  id: string;
  name: string;
  sectionName: string;
  weightPercent: number;
}
interface TopicNode {
  id: string;
  name: string;
  isPremium: boolean;
  children?: { id: string; name: string; isPremium: boolean }[];
}

type Step =
  | { kind: "root" }
  | { kind: "modules"; wantTopic: boolean }
  | { kind: "courses"; moduleId: string; wantTopic: boolean; items?: Course[] }
  | {
      kind: "topics";
      courseId: string;
      courseName: string;
      items?: TopicNode[];
    }
  | { kind: "laws"; items?: Law[] };

/**
 * Odak seçici (Doc 25 §5, wireframe 03): "Konuyu sen seç, soruları ben seçeyim."
 * Popover, hero'nun sessiz ucu. Odak geçicidir — yalnız bu turun kapsamını
 * belirler; kalıcı mod anahtarı yoktur.
 */
export function FocusPicker() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>({ kind: "root" });
  const [modules, setModules] = useState<Module[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklama + Esc kapatır.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function enterModules(wantTopic: boolean) {
    setError(null);
    try {
      if (!modules) {
        const data = await apiClient<Module[]>("/catalog/modules");
        setModules(data);
        // Tek sınav türü varsa ara adımı atla.
        if (data.length === 1) {
          void enterCourses(data[0].id, wantTopic);
          return;
        }
      } else if (modules.length === 1) {
        void enterCourses(modules[0].id, wantTopic);
        return;
      }
      setStep({ kind: "modules", wantTopic });
    } catch {
      setError("Katalog yüklenemedi. Tekrar dene.");
    }
  }

  async function enterCourses(moduleId: string, wantTopic: boolean) {
    setError(null);
    setStep({ kind: "courses", moduleId, wantTopic });
    try {
      const items = await apiClient<Course[]>(
        `/catalog/modules/${moduleId}/courses`,
      );
      setStep({ kind: "courses", moduleId, wantTopic, items });
    } catch {
      setError("Dersler yüklenemedi. Tekrar dene.");
      setStep({ kind: "root" });
    }
  }

  async function enterTopics(courseId: string, courseName: string) {
    setError(null);
    setStep({ kind: "topics", courseId, courseName });
    try {
      // Uç { topics, summary } döner (öğrenme merkezi ile ortak) — diziyi içinden al.
      const res = await apiClient<{ topics: TopicNode[] }>(
        `/catalog/courses/${courseId}/topics`,
      );
      setStep({ kind: "topics", courseId, courseName, items: res.topics });
    } catch {
      setError("Konular yüklenemedi. Tekrar dene.");
      setStep({ kind: "root" });
    }
  }

  async function enterLaws() {
    setError(null);
    setStep({ kind: "laws" });
    try {
      const res = await fetch(`${config.apiBaseUrl}/public/laws`);
      const json = (await res.json()) as { data?: Law[] };
      const items = (json.data ?? []).filter((l) => l.questionCount > 0);
      setStep({ kind: "laws", items });
    } catch {
      setError("Kanunlar yüklenemedi. Tekrar dene.");
      setStep({ kind: "root" });
    }
  }

  function start(params: URLSearchParams) {
    setOpen(false);
    router.push(`/seans${params.size ? `?${params}` : ""}`);
  }

  const itemCls =
    "tk-interactive flex min-h-11 w-full cursor-pointer items-center justify-between gap-2 rounded-control px-3 py-2 text-left type-body-sm text-ink hover:bg-surface-alt";

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setStep({ kind: "root" });
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className="tk-interactive inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-control px-3 type-body-sm text-ink-soft hover:bg-surface-alt hover:text-ink"
      >
        Odak: Koç seçiyor <ChevronDown size={16} aria-hidden />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Bugünkü turun kapsamı"
          className="absolute top-full left-0 z-30 mt-2 w-80 rounded-card border border-line bg-surface p-2"
        >
          <p className="type-label px-3 pt-2 pb-1 text-ink-subtle">
            Bugünkü turun kapsamı
          </p>

          {error && (
            <p className="type-body-sm px-3 py-1 text-danger-ink">{error}</p>
          )}

          {step.kind === "root" && (
            <div className="flex flex-col">
              <button
                type="button"
                className={itemCls}
                onClick={() => start(new URLSearchParams())}
              >
                <span>
                  <span className="type-subhead">Koç seçsin</span>
                  <span className="type-body-sm block text-ink-soft">
                    Zayıf konuların + yanlışların + yeni sorular
                  </span>
                </span>
                <span className="type-label shrink-0 text-ink-subtle">
                  varsayılan
                </span>
              </button>
              <button
                type="button"
                className={itemCls}
                onClick={() => void enterModules(false)}
              >
                Ders seç…{" "}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-ink-subtle"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                className={itemCls}
                onClick={() => void enterModules(true)}
              >
                Konu seç…{" "}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-ink-subtle"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                className={itemCls}
                onClick={() => void enterLaws()}
              >
                Kanun seç…{" "}
                <ChevronRight
                  size={16}
                  className="shrink-0 text-ink-subtle"
                  aria-hidden
                />
              </button>
              <button
                type="button"
                className={itemCls}
                onClick={() =>
                  start(
                    new URLSearchParams({
                      mode: "review",
                      scope: "Yanlış tekrarı",
                    }),
                  )
                }
              >
                <span>
                  Sadece yanlışlarım
                  <span className="type-body-sm block text-ink-soft">
                    En eski yanlışların önce — doğru çözersen kuyruktan düşer
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={itemCls}
                onClick={() =>
                  start(
                    new URLSearchParams({
                      mode: "favorites",
                      scope: "Favorilerim",
                    }),
                  )
                }
              >
                Favorilerim
              </button>
              <p className="type-body-sm px-3 pt-1.5 pb-2 text-ink-subtle">
                Odak bugünlük geçerli; kapsam içindeki soruları yine koç
                karıştırır.
              </p>
            </div>
          )}

          {step.kind === "modules" && modules && (
            <div className="flex flex-col">
              {modules.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={itemCls}
                  onClick={() => void enterCourses(m.id, step.wantTopic)}
                >
                  {m.name}{" "}
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-ink-subtle"
                    aria-hidden
                  />
                </button>
              ))}
            </div>
          )}

          {step.kind === "courses" && (
            <div className="flex max-h-80 flex-col overflow-y-auto">
              {!step.items && (
                <p className="type-body-sm px-3 py-2 text-ink-soft">
                  Yükleniyor…
                </p>
              )}
              {step.items?.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  className={itemCls}
                  onClick={() =>
                    step.wantTopic
                      ? void enterTopics(c.id, c.name)
                      : start(
                          new URLSearchParams({
                            courseId: c.id,
                            scope: c.name,
                          }),
                        )
                  }
                >
                  <span className="min-w-0 truncate">{c.name}</span>
                  <span className="type-label shrink-0 text-ink-subtle">
                    %{c.weightPercent}
                  </span>
                </button>
              ))}
            </div>
          )}

          {step.kind === "laws" && (
            <div className="flex max-h-80 flex-col overflow-y-auto">
              {!step.items && (
                <p className="type-body-sm px-3 py-2 text-ink-soft">
                  Yükleniyor…
                </p>
              )}
              {step.items?.map((l) => (
                <button
                  key={l.slug}
                  type="button"
                  className={itemCls}
                  onClick={() =>
                    start(
                      new URLSearchParams({
                        topicId: l.topicId,
                        scope: l.name,
                      }),
                    )
                  }
                >
                  <span className="min-w-0 truncate">{l.name}</span>
                  <span className="type-label shrink-0 text-ink-subtle">
                    {l.questionCount} soru
                  </span>
                </button>
              ))}
              {step.items?.length === 0 && (
                <p className="type-body-sm px-3 py-2 text-ink-soft">
                  Henüz sorusu olan kanun yok.
                </p>
              )}
            </div>
          )}

          {step.kind === "topics" && (
            <div className="flex max-h-80 flex-col overflow-y-auto">
              {!step.items && (
                <p className="type-body-sm px-3 py-2 text-ink-soft">
                  Yükleniyor…
                </p>
              )}
              {step.items
                ?.flatMap((t) => [t, ...(t.children ?? [])])
                .map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={itemCls}
                    onClick={() =>
                      start(
                        new URLSearchParams({
                          topicId: t.id,
                          scope: `${step.courseName} · ${t.name}`,
                        }),
                      )
                    }
                  >
                    <span className="min-w-0 truncate">{t.name}</span>
                    {t.isPremium && (
                      <Lock
                        size={14}
                        className="shrink-0 text-ink-subtle"
                        aria-label="premium"
                      />
                    )}
                  </button>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

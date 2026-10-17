import type { ReactNode } from "react";

/**
 * L4 Okuma şablonu (Doc 27 §1): AĞAÇ (256) | MAKALE (≤65ch, akışkan) | INSPECTOR (320).
 * 1024 altında ağaç açılır-kapanır bölüme, inspector içeriğin altına iner (Doc 27 §4).
 */
export function ThreePane({
  tree,
  treeLabel = "Maddeler",
  article,
  inspector,
}: {
  tree: ReactNode;
  treeLabel?: string;
  article: ReactNode;
  inspector?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-[1440px] gap-8 px-4 py-6 max-lg:flex-col md:px-6">
      <details
        className="shrink-0 rounded-card border border-line bg-surface open:pb-2 max-lg:px-3 lg:w-64 lg:border-0 lg:bg-transparent lg:[&>summary]:hidden"
        open
      >
        <summary className="type-label cursor-pointer py-3 text-ink-soft lg:hidden">
          {treeLabel} ▾
        </summary>
        <nav
          aria-label={treeLabel}
          className="lg:sticky lg:top-20 lg:max-h-[calc(100dvh-6rem)] lg:overflow-y-auto"
        >
          {tree}
        </nav>
      </details>
      <article className="min-w-0 flex-1">{article}</article>
      {inspector ? (
        <aside className="w-80 shrink-0 max-lg:w-full">
          <div className="lg:sticky lg:top-20">{inspector}</div>
        </aside>
      ) : null}
    </div>
  );
}

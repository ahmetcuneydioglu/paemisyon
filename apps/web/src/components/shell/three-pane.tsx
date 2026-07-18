import type { ReactNode } from "react";

/**
 * L4 Okuma şablonu (Doc 27 §1): AĞAÇ | MAKALE | INSPECTOR.
 * 1024 altında inspector içeriğin altına, ağaç açılır-kapanır bölüme iner —
 * telefondan gelen kullanıcı kırık sayfa görmez (Doc 27 §4).
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
    <div className="mx-auto flex max-w-7xl gap-6 px-6 py-6 max-lg:flex-col">
      <details
        className="w-60 shrink-0 open:pb-2 lg:pointer-events-none lg:w-64 lg:[&>summary]:hidden"
        open
      >
        <summary className="tk-caption cursor-pointer py-2 lg:hidden">{treeLabel} ▾</summary>
        <nav aria-label={treeLabel} className="lg:pointer-events-auto lg:sticky lg:top-6">
          {tree}
        </nav>
      </details>
      <article className="min-w-0 flex-1">{article}</article>
      {inspector && (
        <aside className="w-72 shrink-0 max-lg:w-full">
          <div className="lg:sticky lg:top-6">{inspector}</div>
        </aside>
      )}
    </div>
  );
}

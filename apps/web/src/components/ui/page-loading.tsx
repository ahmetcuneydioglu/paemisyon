import { Skeleton } from "./skeleton";

/** Rota geçişi iskeleti: kabuk yerinde kalır, içerik beklerken düzen sıçramaz. */
export function PageLoading({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={[
        "mx-auto w-full px-4 py-6 md:px-6",
        compact ? "max-w-4xl" : "max-w-6xl",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
    >
      <Skeleton className="h-7 w-44" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <Skeleton className="h-44" radius="card" />
          <div className="grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-32" radius="card" />
            <Skeleton className="h-32" radius="card" />
          </div>
        </div>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-28" radius="card" />
          <Skeleton className="h-36" radius="card" />
        </div>
      </div>
      <span className="sr-only">İçerik hazırlanıyor.</span>
    </div>
  );
}

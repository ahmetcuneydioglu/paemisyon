type PageLoadingProps = {
  compact?: boolean;
};

/**
 * Rota geçişi iskeleti: mevcut kabuk yerinde kalır, içerik beklerken düzen
 * sıçramaz. Token tabanlı olduğu için açık/koyu tema ve reduced-motion uyumludur.
 */
export function PageLoading({ compact = false }: PageLoadingProps) {
  return (
    <div
      className={[
        "mx-auto w-full animate-pulse px-6 py-6 motion-reduce:animate-none",
        compact ? "max-w-4xl" : "max-w-6xl",
      ].join(" ")}
      role="status"
      aria-live="polite"
      aria-label="Sayfa yükleniyor"
    >
      <div className="h-6 w-44 rounded-sm bg-line" />
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="h-44 rounded-md border border-line bg-surface" />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="h-32 rounded-md border border-line bg-surface" />
            <div className="h-32 rounded-md border border-line bg-surface" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-28 rounded-md border border-line bg-surface" />
          <div className="h-36 rounded-md border border-line bg-surface" />
        </div>
      </div>
      <span className="sr-only">İçerik hazırlanıyor.</span>
    </div>
  );
}

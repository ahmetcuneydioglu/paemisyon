function Shimmer({ className = "" }: { className?: string }) {
  return <span className={["lb-shimmer block rounded-md", className].join(" ")} />;
}

/** Yüklenme iskeleti — podyum + tablo (skeleton loading, algılanan hız için). */
export function LeaderboardSkeleton() {
  return (
    <div aria-hidden className="space-y-6">
      {/* Podyum */}
      <div className="grid grid-cols-3 items-end gap-2 sm:gap-4">
        {[1, 0, 2].map((k, i) => (
          <div
            key={k}
            className="flex flex-col items-center rounded-lg border border-line bg-surface p-4"
            style={{ marginTop: i === 1 ? 0 : 28 }}
          >
            <Shimmer className={i === 1 ? "size-[104px] rounded-full" : "size-[72px] rounded-full"} />
            <Shimmer className="mt-3 h-4 w-20" />
            <Shimmer className="mt-2 h-3 w-14" />
          </div>
        ))}
      </div>
      {/* Tablo */}
      <div className="overflow-hidden rounded-lg border border-line bg-surface">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 border-t border-line px-3 py-3 first:border-t-0">
            <Shimmer className="size-4 rounded" />
            <Shimmer className="size-9 rounded-full" />
            <div className="flex-1">
              <Shimmer className="h-3.5 w-32" />
              <Shimmer className="mt-1.5 h-2.5 w-20" />
            </div>
            <Shimmer className="h-4 w-10" />
          </div>
        ))}
      </div>
    </div>
  );
}

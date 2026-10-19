"use client";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Çöken başlık (Doc 49/13 §2 madde 7): afiş görünümden çıkınca üstte yapışkan ince satır
 * ("235 gün · PAEM") belirir. IntersectionObserver; animasyon yok, yalnız görünürlük.
 */
export function HeroCollapse({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      ([e]) => setCollapsed(!e.isIntersecting),
      { rootMargin: "-56px 0px 0px 0px", threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <>
      <div
        aria-hidden={!collapsed}
        className={cn(
          "sticky top-14 z-10 -mx-4 border-b border-line bg-bg px-4 py-2 transition-opacity motion-reduce:transition-none md:-mx-6 md:px-6",
          collapsed
            ? "opacity-100"
            : "pointer-events-none h-0 overflow-hidden border-b-0 py-0 opacity-0",
        )}
      >
        <p className="type-brand font-normal text-accent-ink">{label}</p>
      </div>
      <div ref={ref}>{children}</div>
    </>
  );
}

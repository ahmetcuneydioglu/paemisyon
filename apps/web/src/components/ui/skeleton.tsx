import { cn } from "@/lib/cn";

/** Yükleme iskeleti: yüzey tonu, nabız; metin ölçüsünde satırlar için `h-4`. */
export function Skeleton({
  className,
  radius = "control",
}: {
  className?: string;
  radius?: "control" | "card" | "pill";
}) {
  return (
    <span
      aria-hidden
      className={cn(
        "block animate-pulse bg-surface-alt",
        radius === "card"
          ? "rounded-card"
          : radius === "pill"
            ? "rounded-pill"
            : "rounded-control",
        className ?? "h-4 w-full",
      )}
    />
  );
}

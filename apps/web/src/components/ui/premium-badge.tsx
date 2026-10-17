import { Lock } from "lucide-react";
import { Badge } from "./badge";

/** Premium rozeti — "bu içerik/hak Premium'a ait" (Doc 46). `solid` dikkat çeker, `soft` sessiz. */
export function PremiumBadge({
  variant = "solid",
  label = "Premium",
  className = "",
}: {
  variant?: "solid" | "soft";
  label?: string;
  className?: string;
}) {
  return (
    <Badge
      tone={variant === "solid" ? "warning" : "neutral"}
      className={className}
    >
      <Lock size={12} aria-hidden />
      {label}
    </Badge>
  );
}

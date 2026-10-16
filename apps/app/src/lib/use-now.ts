import { useEffect, useState } from "react";

/** Saniyede bir yenilenen "şimdi" (geri sayımlar için). Saat erişimi render dışında kalır. */
export function useNow(intervalMs = 1000, enabled = true): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return;
    const h = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(h);
  }, [intervalMs, enabled]);
  return now;
}

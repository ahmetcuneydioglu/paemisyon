import { Pin } from "lucide-react";
import { Badge } from "./badge";

/** Kaynak etiketi — sunucu null gönderirse (panel ayarı kapalı/deneme) hiç çizilmez. */
export function SourceTag({ source }: { source: string | null }) {
  if (!source) return null;
  return (
    <Badge tone="neutral">
      <Pin size={12} aria-hidden />
      {source}
    </Badge>
  );
}

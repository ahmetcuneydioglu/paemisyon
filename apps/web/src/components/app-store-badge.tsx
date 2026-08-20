import Image from "next/image";
import { config } from "@/lib/config";

/**
 * App Store indirme rozeti.
 *
 * Apple'ın kimlik kılavuzu, mağaza bağlantısı için RESMÎ rozet çizimini
 * zorunlu tutar (kendi buton tasarımımız kullanılamaz). Varlık Apple'ın
 * badge servisinden alınan Türkçe SVG'dir; ölçeklenir ama biçimi değişmez.
 */
export function AppStoreBadge({
  className = "",
  width = 150,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <a
      href={config.appStoreUrl}
      target="_blank"
      rel="noopener"
      aria-label="Paemisyon'u App Store'dan indir"
      className={`inline-block transition-opacity hover:opacity-85 ${className}`}
    >
      <Image
        src="/app-store-badge-tr.svg"
        alt="App Store'dan indirin"
        width={width}
        height={Math.round((width * 40) / 151)}
        priority={false}
      />
    </a>
  );
}

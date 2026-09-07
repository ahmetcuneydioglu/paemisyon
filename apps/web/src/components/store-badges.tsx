import Image from "next/image";
import { config } from "@/lib/config";

/**
 * Mağaza indirme rozetleri.
 *
 * Apple ve Google, mağaza bağlantısı için RESMÎ rozet çizimini zorunlu tutar;
 * kendi buton tasarımımız kullanılamaz. Bu yüzden ikisi de sağlayıcının kendi
 * varlığıdır ve yalnız ölçeklenir, biçimi değiştirilmez.
 *
 * Rozetler tek bir bileşende toplandı: iOS ve Android bağlantısı her zaman
 * BİRLİKTE görünmeli — yalnız iPhone rozetinin durduğu bir başlık, Android
 * kullanıcısına "bu uygulama bende yok" dedirtiyordu.
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

export function PlayStoreBadge({
  className = "",
  width = 150,
}: {
  className?: string;
  width?: number;
}) {
  return (
    <a
      href={config.playStoreUrl}
      target="_blank"
      rel="noopener"
      aria-label="Paemisyon'u Google Play'den indir"
      className={`inline-block transition-opacity hover:opacity-85 ${className}`}
    >
      <Image
        src="/img/playStore.png"
        alt="Google Play'den alın"
        width={width}
        // Kaynak varlığın en-boy oranı 114×34; yükseklik ondan türetilir ki
        // rozet asla eziklemesin (mağaza kılavuzlarının şartı).
        height={Math.round((width * 34) / 114)}
        priority={false}
      />
    </a>
  );
}

/**
 * İkisi yan yana. Varsayılan SARMAZ: üst çubuk 56 px yüksekliğinde ve sarma
 * açıkken rozetler alt alta düşüp başlığı taşırıyordu. Geniş alanlarda
 * (altbilgi, iniş sayfası) `wrap` ile serbest bırakılır.
 */
export function StoreBadges({
  className = "",
  width = 132,
  wrap = false,
}: {
  className?: string;
  width?: number;
  wrap?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 ${wrap ? "flex-wrap" : "flex-nowrap"} ${className}`}
    >
      <AppStoreBadge width={width} />
      <PlayStoreBadge width={width} />
    </span>
  );
}

import Link from "next/link";
import { SiteNav } from "./site-nav";
import { HeaderAuthArea } from "./header-auth-area";
import { ThemeToggle } from "./theme-toggle";

const NAV = [
  { href: "/kanunlar", label: "Kanunlar" },
  { href: "/paem", label: "PAEM" },
  { href: "/misyon", label: "Misyon" },
  { href: "/denemeler", label: "Denemeler" },
  { href: "/gunun-sorusu", label: "Günün Sorusu" },
  { href: "/premium", label: "Premium" },
];

/**
 * Public üst nav (Doc 27 L1 Kapı, wireframe 01): tek katlı, sticky, token dilinde.
 * Giriş alanı istemcide çözülür (HeaderAuthArea) — böylece bu bileşen istek
 * durumu okumaz ve tüm public sayfalar statik/ISR kalır.
 */
export function SiteHeader() {
  const authArea = <HeaderAuthArea />;

  return (
    <header className="tk-scope sticky top-0 z-30 border-b border-line bg-surface/95 font-body backdrop-blur">
      <div className="relative mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="font-heading text-[17px] font-bold tracking-tight text-brand"
          aria-label="Paemisyon ana sayfa"
        >
          PAEMİSYON
        </Link>
        <SiteNav items={NAV} authArea={authArea} />
        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle compact />
          {authArea}
        </div>
      </div>
    </header>
  );
}

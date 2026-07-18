import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { getCurrentUser } from "@/lib/auth/current-user";
import { SiteNav } from "./site-nav";
import { ButtonLink } from "@/components/ui/button";
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
 * Girişli kullanıcıya tek CTA: uygulamaya (Bugün) dönüş — public sayfalar
 * vitrindir, çalışma alanı sidebar kabuğundadır.
 */
export async function SiteHeader() {
  const user = await getCurrentUser();

  const authArea = user ? (
    <div className="flex items-center gap-2">
      <ButtonLink href="/bugun" size="sm">
        Uygulamaya dön
      </ButtonLink>
      <form action={signOut}>
        <button
          type="submit"
          className="tk-interactive cursor-pointer rounded-sm px-2.5 py-1.5 text-[13px] text-ink-soft hover:text-ink"
        >
          Çıkış
        </button>
      </form>
    </div>
  ) : (
    <div className="flex items-center gap-2">
      <ButtonLink href="/giris" variant="ghost" size="sm">
        Giriş
      </ButtonLink>
      <ButtonLink href="/kayit" size="sm">
        Kayıt ol
      </ButtonLink>
    </div>
  );

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

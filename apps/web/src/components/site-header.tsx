import Image from "next/image";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { signOut } from "@/app/(auth)/actions";
import { MobileMenu } from "./mobile-menu";

const NAV = [
  { href: "/denemeler", label: "Denemeler", icon: "icon-test" },
  { href: "/kanunlar", label: "Kanunlar", icon: "icon-information" },
  { href: "/paem", label: "PAEM", icon: "icon-enter" },
  { href: "/misyon", label: "Misyon", icon: "icon-enter" },
  { href: "/lider-tablosu", label: "Lider Tablosu", icon: "icon-user" },
  { href: "/soru-oner", label: "Soru Öner", icon: "icon-question" },
  { href: "/profil/denemelerim", label: "Denemelerim", icon: "icon-calendar" },
];

/**
 * İki katlı başlık — eski header.php birebir (Doc 18 §4.1):
 * üst açık gri bar (logo + mağaza rozetleri + giriş/üye alanı),
 * alt lacivert nav (#052c5c, beyaz Rubik linkler). Mobilde ayrı bar + menü.
 */
export async function SiteHeader() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  return (
    <header>
      {/* Üst bar */}
      <div className="hidden bg-(--color-grey-bg) md:block">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/">
            <Image src="/img/logo.png" alt="Paemisyon" width={170} height={48} priority />
          </Link>
          <div className="flex items-center gap-3">
            <a href="https://apps.apple.com" target="_blank" rel="noreferrer">
              <Image src="/img/appStore.png" alt="App Store" width={110} height={34} />
            </a>
            <a href="https://play.google.com" target="_blank" rel="noreferrer">
              <Image src="/img/playStore.png" alt="Google Play" width={110} height={34} />
            </a>
            {user ? (
              <div className="ml-4 flex items-center gap-3">
                <span className="font-heading text-sm font-bold text-(--color-navy)">
                  <i className="icon-user mr-1" aria-hidden />
                  {(user.user_metadata?.display_name as string) ?? user.email}
                </span>
                <form action={signOut}>
                  <button className="btn2 btn2-red" type="submit">Çıkış</button>
                </form>
              </div>
            ) : (
              <div className="ml-4 flex items-center gap-2">
                <Link href="/giris" className="btn2 btn2-green">Giriş Yap</Link>
                <Link href="/kayit" className="btn2 btn2-orange">Kayıt Ol</Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lacivert nav */}
      <nav className="hidden bg-(--color-navy-dark) md:block">
        <div className="mx-auto max-w-6xl px-4">
          <ul className="flex">
            {NAV.map((n) => (
              <li key={n.href}>
                <Link
                  href={n.href}
                  className="font-heading flex items-center gap-2 px-4 py-5 text-[16px] font-medium text-white hover:bg-(--color-navy-deep)"
                >
                  <i className={`${n.icon} text-[15px]`} aria-hidden />
                  {n.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobil bar */}
      <MobileMenu
        nav={NAV.map(({ href, label }) => ({ href, label }))}
        loggedIn={!!user}
      />
    </header>
  );
}

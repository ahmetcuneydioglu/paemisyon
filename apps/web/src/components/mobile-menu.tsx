"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

/** Mobil başlık — eski #headerMobile: sol kullanıcı, ortada logo, sağda menü. */
export function MobileMenu({
  nav,
  loggedIn,
}: {
  nav: { href: string; label: string }[];
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  useEffect(() => setOpen(false), [pathname]); // sayfa değişince kapan

  return (
    <div className="md:hidden">
      <div className="flex items-center justify-between bg-(--color-navy-dark) px-4 py-3">
        <Link href={loggedIn ? "/profil/denemelerim" : "/giris"} aria-label="Hesap" className="text-xl text-white">
          <i className="icon-user" aria-hidden />
        </Link>
        <Link href="/">
          <Image src="/img/mobileLogo.png" alt="Paemisyon" width={140} height={36} />
        </Link>
        <button aria-label="Menü" aria-expanded={open} onClick={() => setOpen(!open)} className="text-xl text-white">
          <i className={open ? "icon-x" : "icon-menu"} aria-hidden />
        </button>
      </div>
      {open && (
        <nav className="bg-(--color-navy-deep)">
          <ul>
            {nav.map((n) => (
              <li key={n.href}>
                <Link href={n.href} className="font-heading block border-b border-white/10 px-5 py-3 font-medium text-white">
                  {n.label}
                </Link>
              </li>
            ))}
            {!loggedIn && (
              <li>
                <Link href="/giris" className="font-heading block px-5 py-3 font-bold text-(--color-yellow)">
                  Giriş Yap / Kayıt Ol
                </Link>
              </li>
            )}
          </ul>
        </nav>
      )}
    </div>
  );
}

import Link from "next/link";

/** Alt bilgi — yasal linkler + telif (Doc 18 §4.1; yasal sayfalar Doc 25 Bölge 0). */
export function SiteFooter() {
  return (
    <footer className="border-t border-(--color-border) bg-white">
      <div className="mx-auto max-w-6xl px-4 py-6 text-center">
        <ul className="mb-2 flex flex-wrap justify-center gap-x-6 gap-y-1 text-[13px]">
          <li><Link className="hover:underline" href="/sss">SSS</Link></li>
          <li><Link className="hover:underline" href="/gizlilik">Gizlilik Politikası</Link></li>
          <li><Link className="hover:underline" href="/kosullar">Kullanım Koşulları</Link></li>
          <li>
            <a className="hover:underline" href="mailto:destek@paemisyon.com">İletişim</a>
          </li>
        </ul>
        <p className="text-[12px] text-neutral-500">
          © {new Date().getFullYear()} Paemisyon — Tüm hakları saklıdır. Resmî
          kurumlarla bağlantılı değildir.
        </p>
      </div>
    </footer>
  );
}

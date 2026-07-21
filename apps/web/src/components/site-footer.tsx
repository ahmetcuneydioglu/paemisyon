import Link from "next/link";
import { ContactChannels } from "@/components/contact-channels";

const GROUPS: { title: string; links: { href: string; label: string; external?: boolean }[] }[] = [
  {
    title: "Çalış",
    links: [
      { href: "/kanunlar", label: "Kanun Kütüphanesi" },
      { href: "/gunun-sorusu", label: "Günün Quizi" },
      { href: "/denemeler", label: "Canlı Denemeler" },
      { href: "/hesaplayici/paem-puan", label: "Puan Hesaplayıcı" },
    ],
  },
  {
    title: "Rehberler",
    links: [
      { href: "/paem", label: "PAEM Rehberi" },
      { href: "/misyon", label: "Misyon Rehberi" },
      { href: "/premium", label: "Premium" },
      { href: "/sss", label: "SSS" },
    ],
  },
  {
    title: "Kurumsal",
    links: [
      { href: "/gizlilik", label: "Gizlilik (KVKK)" },
      { href: "/kosullar", label: "Kullanım Koşulları" },
      { href: "mailto:destek@paemisyon.com", label: "İletişim", external: true },
      { href: "/soru-oner", label: "Soru Öner" },
    ],
  },
];

/** Alt bilgi (L1 Kapı) — iç bağlantı örgüsünün son halkası + yasal zorunluluklar. */
export function SiteFooter() {
  return (
    <footer className="tk-scope border-t border-line bg-surface font-body">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="font-heading text-[15px] font-bold text-brand">PAEMİSYON</p>
          <p className="mt-2 max-w-[28ch] text-[13px] leading-relaxed text-ink-soft">
            Polis sınavlarına hazırlığın merkezi: kaynaklı çıkmış sorular, canlı denemeler,
            kişisel koç.
          </p>
          <ContactChannels variant="inline" className="mt-3" />
        </div>
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <p className="tk-caption mb-3">{g.title}</p>
            <ul className="space-y-2 text-[14px]">
              {g.links.map((l) => (
                <li key={l.href}>
                  {l.external ? (
                    <a href={l.href} className="text-ink-soft hover:text-ink">
                      {l.label}
                    </a>
                  ) : (
                    <Link href={l.href} className="text-ink-soft hover:text-ink">
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-t border-line">
        <p className="mx-auto max-w-6xl px-4 py-4 text-[12px] text-ink-soft">
          © {new Date().getFullYear()} Paemisyon — Tüm hakları saklıdır. Resmî kurumlarla
          bağlantılı değildir; sorular kaynak etiketli gerçek sınav sorularıdır.
        </p>
      </div>
    </footer>
  );
}

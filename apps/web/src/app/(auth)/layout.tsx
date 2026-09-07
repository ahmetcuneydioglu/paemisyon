import Link from "next/link";
import { StoreBadges } from "@/components/store-badges";
import { BrandMark } from "@/components/brand-mark";

/** Kimlik sayfaları: ortalanmış tek kolon, dikkat dağıtmayan kabuk. */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <header className="flex items-center justify-between gap-4 p-6">
        <Link href="/" aria-label="Paemisyon ana sayfa">
          <BrandMark textClassName="text-lg" />
        </Link>
        {/* Giriş yapmak üzere olan ziyaretçi genelde telefonda: native
            sürümü burada görsün. Form akışını bozmayacak kadar sessiz. */}
        <StoreBadges width={100} />
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8">{children}</main>
    </div>
  );
}

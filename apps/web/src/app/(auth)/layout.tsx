import Link from "next/link";
import { BrandMark } from "@/components/brand-mark";

/** Kimlik sayfaları: ortalanmış tek kolon, dikkat dağıtmayan kabuk. */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <header className="p-6">
        <Link href="/" aria-label="Paemisyon ana sayfa">
          <BrandMark textClassName="text-lg" />
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8">{children}</main>
    </div>
  );
}

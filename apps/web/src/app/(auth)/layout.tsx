import Link from "next/link";

/** Kimlik sayfaları: ortalanmış tek kolon, dikkat dağıtmayan kabuk. */
export default function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-alt">
      <header className="p-6">
        <Link href="/" className="font-heading text-lg font-bold text-brand">
          PAEMİSYON
        </Link>
      </header>
      <main className="flex flex-1 items-start justify-center px-4 pb-16 pt-8">{children}</main>
    </div>
  );
}

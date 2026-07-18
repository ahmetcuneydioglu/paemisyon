import { Sidebar } from "@/components/shell/sidebar";

/** L2 Çalışma Alanı kabuğu: sol sidebar + akışkan içerik (Doc 27 §1). */
export default function ShellLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

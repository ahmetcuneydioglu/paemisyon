import { AppShell } from "@/components/shell/app-shell";

/** L2 Çalışma Alanı kabuğu: sol sidebar + akışkan içerik + ⌘K (Doc 27 §1-2). */
export default function ShellLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppShell>{children}</AppShell>;
}

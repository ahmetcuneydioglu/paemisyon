import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Girişli katman (Doc 27): kimlik zorunlu. Kabuk alt gruplarda —
 * (shell) = L2 sidebar'lı çalışma alanı · seans = L3 odak (kabuksuz).
 */
export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data } = await (await supabaseServer()).auth.getUser();
  if (!data.user) redirect("/giris");
  return <div className="tk-scope min-h-screen font-body">{children}</div>;
}

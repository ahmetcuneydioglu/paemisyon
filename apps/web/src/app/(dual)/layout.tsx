import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Sidebar } from "@/components/shell/sidebar";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * "Aynı URL iki derinlik" (Doc 24 §10, Doc 27 §2.5): bu gruptaki sayfalar
 * (kanunlar, kanun, denemeler) girişsiz ziyaretçiye SEO vitrini (site kabuğu),
 * girişli kullanıcıya çalışma alanı (sidebar kabuğu) olarak açılır.
 * Ayrı "app" URL'i yoktur.
 */
export default async function DualLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const { data } = await (await supabaseServer()).auth.getUser();

  if (!data.user) {
    return (
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </div>
    );
  }

  return (
    <div className="tk-scope flex min-h-screen font-body">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { api } from "@/lib/api";
import type { MeProfile } from "@/lib/public-api";
import { Galeri } from "./galeri";

export const metadata: Metadata = {
  title: "Tasarım kiti",
  robots: { index: false },
};
export const dynamic = "force-dynamic";

/**
 * Bileşen galerisi (Doc 49/11 §2.2) — yalnız beta/admin rolü; diğerlerine 404
 * (rota gizli). Göz testi burada: her bileşen bütün varyantlarıyla, koyu/açık.
 */
export default async function TasarimPage() {
  const me = await api<MeProfile>("/me").catch(() => null);
  const roller = me?.roles ?? [];
  if (!roller.includes("admin") && !roller.includes("beta")) notFound();
  return <Galeri />;
}

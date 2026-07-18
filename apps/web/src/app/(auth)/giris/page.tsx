import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/bugun" } = await searchParams;
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (data.user)
    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/bugun");
  return <AuthForm mode="giris" next={next} />;
}

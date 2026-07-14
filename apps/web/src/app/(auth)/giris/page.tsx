import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function GirisPage() {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (data.user) redirect("/denemeler");
  return <AuthForm mode="giris" />;
}

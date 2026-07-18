import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = {
  title: "Kayıt Ol",
  robots: { index: false },
};

export default async function KayitPage() {
  const user = await getCurrentUser();
  if (user) redirect("/bugun");
  return <AuthForm mode="kayit" />;
}

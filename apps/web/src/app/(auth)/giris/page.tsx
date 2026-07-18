import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { AuthForm } from "../auth-form";

export const metadata: Metadata = { title: "Giriş", robots: { index: false } };

export default async function GirisPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = "/bugun" } = await searchParams;
  const user = await getCurrentUser();
  if (user)
    redirect(next.startsWith("/") && !next.startsWith("//") ? next : "/bugun");
  return <AuthForm mode="giris" next={next} />;
}

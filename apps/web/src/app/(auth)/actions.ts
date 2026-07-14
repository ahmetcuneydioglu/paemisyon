"use server";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

/** Kimlik server action'ları — Supabase Auth (tüm platformlarla ORTAK hesap, Doc 18 §7). */

export type AuthState = { error?: string };

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "E-posta ve şifre zorunludur." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "E-posta veya şifre hatalı." };
  redirect("/denemeler");
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (name.length < 2) return { error: "Ad Soyad zorunludur." };
  if (!email || password.length < 8) return { error: "Geçerli e-posta ve en az 8 karakterli şifre gir." };

  const supabase = await supabaseServer();
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: name } },
  });
  if (error) return { error: "Kayıt başarısız: " + error.message };
  redirect("/denemeler");
}

export async function signOut() {
  const supabase = await supabaseServer();
  await supabase.auth.signOut();
  redirect("/");
}

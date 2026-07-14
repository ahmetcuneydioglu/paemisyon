"use client";
import { createBrowserClient } from "@supabase/ssr";
import { config } from "../config";

/** Tarayıcı tarafı Supabase istemcisi (yalnızca kimlik — Doc 8). */
export function supabaseBrowser() {
  return createBrowserClient(config.supabaseUrl, config.supabaseAnonKey);
}

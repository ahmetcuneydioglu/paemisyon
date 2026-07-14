import { supabaseServer } from "./supabase/server";
import { config } from "./config";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/**
 * NestJS API çağrısı (sunucu tarafı): Bearer token cookie-oturumdan gelir,
 * {data}/{error} zarfı açılır. Web iş mantığı İÇERMEZ — yalnızca API tüketir (Doc 18 §7).
 */
export async function api<T>(path: string, init?: RequestInit & { auth?: boolean }): Promise<T> {
  const headers = new Headers(init?.headers);
  headers.set("Content-Type", "application/json");
  if (init?.auth !== false) {
    const supabase = await supabaseServer();
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) {
      headers.set("Authorization", `Bearer ${data.session.access_token}`);
    }
  }
  const res = await fetch(`${config.apiBaseUrl}${path}`, { ...init, headers, cache: "no-store" });
  const json = (await res.json().catch(() => null)) as
    | { data?: T; error?: { code?: string; message?: string; details?: unknown } }
    | null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? `İstek başarısız (${res.status}).`,
      json?.error?.details,
    );
  }
  return (json?.data ?? null) as T;
}

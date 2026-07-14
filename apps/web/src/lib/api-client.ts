"use client";
import { supabaseBrowser } from "./supabase/client";
import { config } from "./config";

export class ApiClientError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

/** Tarayıcı tarafı NestJS çağrısı (sınav içi cevap kaydı gibi etkileşimler). */
export async function apiClient<T>(
  path: string,
  init?: Omit<RequestInit, "body"> & { body?: unknown },
): Promise<T> {
  const { data } = await supabaseBrowser().auth.getSession();
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(data.session?.access_token
        ? { Authorization: `Bearer ${data.session.access_token}` }
        : {}),
    },
    body: init?.body != null ? JSON.stringify(init.body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as
    | { data?: T; error?: { code?: string; message?: string; details?: unknown } }
    | null;
  if (!res.ok) {
    throw new ApiClientError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? `İstek başarısız (${res.status}).`,
      json?.error?.details,
    );
  }
  return (json?.data ?? null) as T;
}

import { env } from "./env";
import { supabase } from "./supabase";

/**
 * NestJS API istemcisi (Doc 7 zarfı: {data} / {error:{code,message,details,trace_id}}).
 * Flutter'daki davranış korunur (Doc 49 denetimi §10): Bearer token eklenir; 401 gelirse oturum
 * bir kez tazelenip istek yinelenir, yine 401 ise oturum kapatılır.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly traceId?: string | null,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Ağ kopması / zaman aşımı; çevrimdışı kuyruk (F5) bu sınıfı tanır. */
export class NetworkError extends Error {
  constructor(message = "Bağlantı kurulamadı.") {
    super(message);
    this.name = "NetworkError";
  }
}

type Envelope<T> = { data?: T; error?: { code?: string; message?: string; details?: unknown; trace_id?: string | null } };

export type ApiInit = Omit<RequestInit, "body"> & { body?: unknown; auth?: boolean };

async function accessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

async function send(path: string, init: ApiInit, token: string | null): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);
  try {
    return await fetch(`${env?.apiBaseUrl ?? ""}${path}`, {
      ...init,
      signal: controller.signal,
      headers: {
        Accept: "application/json",
        ...(init.body != null ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(init.headers ?? {}),
      },
      body: init.body != null ? JSON.stringify(init.body) : undefined,
    });
  } catch (e) {
    throw new NetworkError(e instanceof Error && e.name === "AbortError" ? "İstek zaman aşımına uğradı." : undefined);
  } finally {
    clearTimeout(timer);
  }
}

export async function api<T>(path: string, init: ApiInit = {}): Promise<T> {
  const needsAuth = init.auth !== false;
  let token = needsAuth ? await accessToken() : null;
  let res = await send(path, init, token);

  if (res.status === 401 && needsAuth) {
    const { data, error } = await supabase.auth.refreshSession();
    if (!error && data.session) {
      token = data.session.access_token;
      res = await send(path, init, token);
    }
    if (res.status === 401) {
      await supabase.auth.signOut();
    }
  }

  const json = (await res.json().catch(() => null)) as Envelope<T> | null;
  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? "UNKNOWN",
      json?.error?.message ?? `İstek başarısız (${res.status}).`,
      json?.error?.details,
      json?.error?.trace_id ?? null,
    );
  }
  return (json?.data ?? null) as T;
}

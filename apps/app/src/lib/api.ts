import { isAuthRetryableFetchError } from "@supabase/supabase-js";
import { env } from "./env";
import { Platform } from "react-native";
import { supabase } from "./supabase";

/**
 * NestJS API istemcisi (Doc 7 zarfı: {data} / {error:{code,message,details,trace_id}}).
 * Bearer token eklenir; 401 gelirse oturum bir kez tazelenip istek yinelenir. Oturum yalnız taze
 * token da reddedilirse ya da yenileme jetonu geçersizse kapanır; ağ yüzünden tazelenemezse korunur.
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

/** Ağ/zaman aşımı kaynaklı tazeleme hatası mı (oturum hâlâ geçerli olabilir)? */
function isRetryableAuthError(error: unknown): boolean {
  return isAuthRetryableFetchError(error) || (error instanceof Error && /network|fetch|timeout/i.test(error.message));
}

/** Sunucu oturumu reddetti: yerel oturum kapanır (yönlendirme kapısı girişe götürür). */
async function signOutLocally(): Promise<void> {
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
}

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
        // Doc 57: sunucu mağaza değerlendirme istemini yalnız ios/android'e üretir.
        ...(Platform.OS === "ios" || Platform.OS === "android" ? { "X-Platform": Platform.OS } : {}),
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
      // Taze token da reddedildi: sunucu yalnız token'ın KENDİSİ geçersizse 401 döner
      // (altyapı arızası 503, 15 Kas 2026) → oturum gerçekten bitmiş.
      if (res.status === 401) await signOutLocally();
    } else if (error && !isRetryableAuthError(error)) {
      // Yenileme jetonu iptal edilmiş/süresi dolmuş: oturum bitti.
      await signOutLocally();
    }
    // Tazeleme ağ yüzünden olmadıysa (çevrimdışı, Supabase'e erişilemedi) oturum KORUNUR:
    // eskiden ilk 401 + başarısız tazeleme kullanıcıyı çıkarıyordu (Fable denetimi bulgu 2).
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

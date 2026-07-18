import { config } from "./config";
import { getAccessToken } from "./auth/current-user";

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
type ApiRequestInit = RequestInit & {
  auth?: boolean;
  next?: { revalidate?: number | false; tags?: string[] };
};

export async function api<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { auth = true, ...requestInit } = init ?? {};
  const headers = new Headers(requestInit.headers);
  headers.set("Content-Type", "application/json");
  if (auth) {
    const accessToken = await getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }
  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...requestInit,
    headers,
    // Kullanıcıya özel yanıt asla paylaşılmaz. Public çağrı, verdiği revalidate
    // politikasını kullanabilir; politika yoksa yine taze okunur.
    cache: auth ? "no-store" : (requestInit.cache ?? (requestInit.next ? undefined : "no-store")),
  });
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

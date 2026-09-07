import { config } from './config';
import { supabase } from './supabase';

/** Backend hata zarfından çıkan, kullanıcıya gösterilebilir hata. */
export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

/**
 * NestJS API çağrısı (Doc 7): Bearer token ekler, {data}/{error} zarfını açar.
 * Panel iş mantığı İÇERMEZ — yalnızca API'yi çağırır (Doc 9 §1).
 *
 * DİKKAT: `body` DÜZ NESNE verilir, `JSON.stringify` EDİLMEZ — bu fonksiyon
 * zaten stringliyor. Önceden stringlenmiş gövde çift kodlanır; Express'in JSON
 * çözücüsü üst seviyede metin kabul etmediği için istek 400 döner ve mutasyon
 * sessizce başarısız olur. Çıkmış sınav sayfasında "Yayına al", soru onay
 * kutuları ve Premium tiki bu yüzden hiç çalışmıyordu (7 Eyl 2026).
 */
export async function api<T>(
  path: string,
  init?: Omit<RequestInit, 'body'> & { body?: unknown },
): Promise<T> {
  const { data } = await supabase().auth.getSession();
  const token = data.session?.access_token;

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
    body: init?.body != null ? JSON.stringify(init.body) : undefined,
  });

  const json = (await res.json().catch(() => null)) as
    | { data?: T; error?: { code?: string; message?: string } }
    | null;

  if (!res.ok) {
    throw new ApiError(
      res.status,
      json?.error?.code ?? 'UNKNOWN',
      json?.error?.message ?? `İstek başarısız (${res.status}).`,
    );
  }
  return (json?.data ?? null) as T;
}

import type {
  HubEventsPage,
  HubPayloadItem,
  HubPayloadRequestItem,
  HubReportRequest,
} from './hub-sync.types';

/** Geçici hata: ağ, 503/429/5xx, 55P03 geri çekilmesi tükendi. Sonraki koşu aynı imleçten sürer. */
export class HubTemporaryError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'HubTemporaryError';
  }
}
/** Kalıcı hata: 401/404/4xx. İnsan müdahalesi gerekir; yeniden denemek anlamsızdır. */
export class HubPermanentError extends Error {
  constructor(message: string, readonly status?: number) {
    super(message);
    this.name = 'HubPermanentError';
  }
}

export interface HubSyncClientOptions {
  baseUrl: string; // ör. http://127.0.0.1:3200
  secret: string;
  product?: string; // varsayılan paemisyon
  fetchImpl?: typeof fetch;
  /** 503 ve ağ hatasında bekleme (ms); testte kısaltılır. */
  backoffMs?: readonly number[];
  sleep?: (ms: number) => Promise<void>;
  timeoutMs?: number;
}

const DEFAULT_BACKOFF = [500, 1000, 2000, 4000] as const;

/**
 * Merkez senkron uçları (veri modeli §8, S4a): events → payloads → ack; reports.
 * Anahtar yalnız Authorization başlığında taşınır, hiçbir hata mesajına ya da günlüğe yazılmaz.
 */
export class HubSyncClient {
  private readonly base: string;
  private readonly fetchImpl: typeof fetch;
  private readonly backoff: readonly number[];
  private readonly sleep: (ms: number) => Promise<void>;
  private readonly timeoutMs: number;

  constructor(private readonly opts: HubSyncClientOptions) {
    const product = opts.product ?? 'paemisyon';
    this.base = `${opts.baseUrl.replace(/\/+$/, '')}/api/sync/${product}`;
    this.fetchImpl = opts.fetchImpl ?? fetch;
    this.backoff = opts.backoffMs ?? DEFAULT_BACKOFF;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.timeoutMs = opts.timeoutMs ?? 30_000;
  }

  events(after: number, limit = 500): Promise<HubEventsPage> {
    return this.request<HubEventsPage>('GET', `/events?after=${after}&limit=${limit}`);
  }

  async payloads<T = unknown>(items: HubPayloadRequestItem[]): Promise<HubPayloadItem<T>[]> {
    if (items.length === 0) return [];
    if (items.length > 100) throw new Error('payloads: en çok 100 öğe');
    const res = await this.request<{ items: HubPayloadItem<T>[] }>('POST', '/payloads', { items });
    return res.items;
  }

  ack(seq: number, error: string | null = null): Promise<{ last_acked_seq: number }> {
    return this.request('POST', '/ack', { seq, error: error ? error.slice(0, 2000) : null });
  }

  report(body: HubReportRequest): Promise<{ status: number; body: unknown }> {
    return this.requestRaw('POST', '/reports', body).then(async (r) => ({
      status: r.status,
      body: await r.json().catch(() => null),
    }));
  }

  private async request<T>(method: 'GET' | 'POST', path: string, body?: unknown): Promise<T> {
    const res = await this.requestRaw(method, path, body);
    return (await res.json()) as T;
  }

  private async requestRaw(method: 'GET' | 'POST', path: string, body?: unknown): Promise<Response> {
    let attempt = 0;
    for (;;) {
      let res: Response;
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.timeoutMs);
        try {
          res = await this.fetchImpl(this.base + path, {
            method,
            headers: {
              Authorization: `Bearer ${this.opts.secret}`,
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
            body: body === undefined ? undefined : JSON.stringify(body),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }
      } catch (e) {
        if (attempt < this.backoff.length) {
          await this.sleep(this.backoff[attempt++]);
          continue;
        }
        throw new HubTemporaryError(`Merkeze ulaşılamadı (${method} ${path}): ${(e as Error).message}`);
      }
      if (res.ok) return res;
      if (res.status === 503 || res.status === 429 || res.status >= 500) {
        if (attempt < this.backoff.length) {
          const retryAfter = Number(res.headers.get('retry-after'));
          await this.sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : this.backoff[attempt]);
          attempt += 1;
          continue;
        }
        throw new HubTemporaryError(`Merkez geçici olarak yanıt vermiyor (${res.status}, ${method} ${path})`, res.status);
      }
      const text = await res.text().catch(() => '');
      throw new HubPermanentError(
        `Merkez isteği reddetti (${res.status}, ${method} ${path}): ${text.slice(0, 300)}`,
        res.status,
      );
    }
  }
}

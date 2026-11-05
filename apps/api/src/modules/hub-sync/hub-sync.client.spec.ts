import { HubPermanentError, HubSyncClient, HubTemporaryError } from './hub-sync.client';

type Call = { url: string; init: RequestInit };
function makeFetch(
  responses: Array<{ status: number; body?: unknown; headers?: Record<string, string> }>,
  calls: Call[] = [],
) {
  let i = 0;
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const r = responses[Math.min(i, responses.length - 1)];
    i += 1;
    return new Response(r.body === undefined ? '' : JSON.stringify(r.body), {
      status: r.status,
      headers: r.headers,
    });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}
const noSleep = async () => undefined;

describe('HubSyncClient (sözleşme §8, S4a)', () => {
  it('events: Bearer başlığı, imleç ve sayfa alanları', async () => {
    const page = {
      events: [],
      stream_epoch: 1,
      snapshot_start_seq: null,
      snapshot_end_seq: null,
      last_acked_seq: 0,
      has_more: false,
    };
    const { fetchImpl, calls } = makeFetch([{ status: 200, body: page }]);
    const c = new HubSyncClient({
      baseUrl: 'http://merkez/',
      secret: 'gizli',
      fetchImpl,
      sleep: noSleep,
    });
    expect(await c.events(42, 100)).toEqual(page);
    expect(calls[0].url).toBe('http://merkez/api/sync/paemisyon/events?after=42&limit=100');
    expect((calls[0].init.headers as Record<string, string>).Authorization).toBe('Bearer gizli');
  });
  it('503 geçici: geri çekilmeyle yeniden dener, tükenince HubTemporaryError', async () => {
    const { fetchImpl, calls } = makeFetch([{ status: 503, headers: { 'retry-after': '0' } }]);
    const c = new HubSyncClient({
      baseUrl: 'http://merkez',
      secret: 's',
      fetchImpl,
      sleep: noSleep,
      backoffMs: [1, 1],
    });
    await expect(c.events(0)).rejects.toBeInstanceOf(HubTemporaryError);
    expect(calls).toHaveLength(3);
  });
  it('503 sonra 200: başarıyla döner', async () => {
    const { fetchImpl } = makeFetch([
      { status: 503 },
      { status: 200, body: { last_acked_seq: 7 } },
    ]);
    const c = new HubSyncClient({
      baseUrl: 'http://merkez',
      secret: 's',
      fetchImpl,
      sleep: noSleep,
      backoffMs: [1],
    });
    expect(await c.ack(7)).toEqual({ last_acked_seq: 7 });
  });
  it('401 kalıcı: HubPermanentError, anahtar mesajda yok', async () => {
    const { fetchImpl } = makeFetch([{ status: 401, body: { error: 'Yetkisiz' } }]);
    const c = new HubSyncClient({
      baseUrl: 'http://merkez',
      secret: 'COK-GIZLI',
      fetchImpl,
      sleep: noSleep,
    });
    const err = await c.events(0).catch((e) => e);
    expect(err).toBeInstanceOf(HubPermanentError);
    expect(String(err.message)).not.toContain('COK-GIZLI');
  });
  it('payloads: 100 üstünü reddeder, boş listeyi istek atmadan döner', async () => {
    const { fetchImpl, calls } = makeFetch([{ status: 200, body: { items: [] } }]);
    const c = new HubSyncClient({
      baseUrl: 'http://merkez',
      secret: 's',
      fetchImpl,
      sleep: noSleep,
    });
    expect(await c.payloads([])).toEqual([]);
    expect(calls).toHaveLength(0);
    const many = Array.from({ length: 101 }, (_, i) => ({
      entity_type: 'question' as const,
      entity_id: String(i),
      entity_version: 1,
    }));
    await expect(c.payloads(many)).rejects.toThrow('en çok 100');
  });
  it('ağ hatası geçici sayılır', async () => {
    const fetchImpl = (async () => {
      throw new Error('ECONNREFUSED');
    }) as unknown as typeof fetch;
    const c = new HubSyncClient({
      baseUrl: 'http://merkez',
      secret: 's',
      fetchImpl,
      sleep: noSleep,
      backoffMs: [1],
    });
    await expect(c.events(0)).rejects.toBeInstanceOf(HubTemporaryError);
  });
});

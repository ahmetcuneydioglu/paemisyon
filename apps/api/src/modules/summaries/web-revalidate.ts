/**
 * Web ISR yenileme çağrısı (Doc 54). `WEB_REVALIDATE_SECRET` yoksa sessizce atlanır (yerel/CI);
 * ağ hatası yayını geri almaz — önbellek en geç kendi süresinde tazelenir.
 *
 * Sonuç çağırana döner ki admin "tazelendi" yerine gerçeği görsün: Vercel Firewall (Bot Protection /
 * Attack Challenge) sunucudan gelen isteği 429 + `x-vercel-mitigated: challenge` ile geri çevirebilir;
 * çözüm web'in Vercel Firewall'unda `/api/revalidate` için Bypass kuralıdır (01-altyapi-ve-yuzeyler.md).
 */
import { Logger } from '@nestjs/common';

const log = new Logger('WebRevalidate');

export const WEB_REVALIDATE_USER_AGENT = 'paemisyon-api/revalidate';

export type WebRevalidateResult =
  | { ok: true; skipped?: true; paths: number }
  | { ok: false; status: number | null; mitigated: string | null; detail: string; paths: number };

export function isWebRevalidateEnabled(): boolean {
  return Boolean(process.env.WEB_REVALIDATE_SECRET);
}

export async function revalidateWebPaths(paths: string[]): Promise<WebRevalidateResult> {
  const secret = process.env.WEB_REVALIDATE_SECRET;
  const unique = [...new Set(paths)];
  if (!secret || unique.length === 0) return { ok: true, skipped: true, paths: 0 };
  const base = (process.env.WEB_BASE_URL ?? 'https://paemisyon.com').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'user-agent': WEB_REVALIDATE_USER_AGENT,
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ paths: unique }),
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) return { ok: true, paths: unique.length };
    const mitigated = res.headers.get('x-vercel-mitigated');
    const detail = [
      mitigated && `mitigated=${mitigated}`,
      res.headers.get('x-vercel-id') && `id=${res.headers.get('x-vercel-id')}`,
      res.headers.get('retry-after') && `retry-after=${res.headers.get('retry-after')}`,
      res.headers.get('content-type') && `type=${res.headers.get('content-type')}`,
    ]
      .filter(Boolean)
      .join(' ');
    log.warn(`web yenileme ${res.status} ${detail}: ${unique.join(', ')}`);
    return { ok: false, status: res.status, mitigated, detail, paths: unique.length };
  } catch (e) {
    const detail = (e as Error).message;
    log.warn(`web yenileme başarısız: ${detail}`);
    return { ok: false, status: null, mitigated: null, detail, paths: unique.length };
  }
}

/** Birden çok yolu 50'lik paketlerle gönderir; ilk başarısız paket sonucu döner (yoksa toplam başarı). */
export async function revalidateWebPathsBatched(paths: string[]): Promise<WebRevalidateResult> {
  const unique = [...new Set(paths)];
  for (let i = 0; i < unique.length; i += 50) {
    const r = await revalidateWebPaths(unique.slice(i, i + 50));
    if (!r.ok) return { ...r, paths: unique.length };
  }
  return { ok: true, paths: unique.length };
}

/** Kullanıcıya gösterilecek kısa açıklama (admin bildirimi). */
export function describeWebRevalidate(r: WebRevalidateResult): string {
  if (r.ok)
    return r.skipped
      ? 'Web yenilemesi kapalı (WEB_REVALIDATE_SECRET yok).'
      : `${r.paths} sayfa tazelendi.`;
  if (r.status === 429 && r.mitigated === 'challenge')
    return "Web yenilemesi Vercel Firewall tarafından engellendi (429 challenge). Firewall'da /api/revalidate için Bypass kuralı gerekir.";
  if (r.status === 429)
    return 'Web yenilemesi 429 aldı (Vercel hız sınırı). Firewall kuralını gevşetin ya da /api/revalidate için Bypass ekleyin.';
  if (r.status === 401)
    return 'Web yenilemesi reddedildi (401): REVALIDATE_SECRET ile WEB_REVALIDATE_SECRET eşleşmiyor.';
  if (r.status) return `Web yenilemesi ${r.status} döndü (${r.detail || 'ayrıntı yok'}).`;
  return `Web yenilemesine ulaşılamadı: ${r.detail}`;
}

/** Madde özetinin göründüğü anon sayfalar: madde sayfası + kanun okuyucu. */
export function articleSummaryPaths(lawSlug: string, articleNo: string): string[] {
  const no = articleNo.toLocaleLowerCase('tr-TR').replace(/[\s/]+/g, '-');
  return [`/kanun/${lawSlug}/madde/${no}`, `/kanun/${lawSlug}/oku`];
}

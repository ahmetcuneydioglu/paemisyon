/**
 * Web ISR yenileme çağrısı (Doc 54). `WEB_REVALIDATE_SECRET` yoksa sessizce atlanır (yerel/CI);
 * ağ hatası yayını geri almaz — önbellek en geç kendi süresinde tazelenir.
 */
import { Logger } from '@nestjs/common';

const log = new Logger('WebRevalidate');

export async function revalidateWebPaths(paths: string[]): Promise<void> {
  const secret = process.env.WEB_REVALIDATE_SECRET;
  if (!secret || paths.length === 0) return;
  const base = (process.env.WEB_BASE_URL ?? 'https://paemisyon.com').replace(/\/$/, '');
  try {
    const res = await fetch(`${base}/api/revalidate`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-revalidate-secret': secret },
      body: JSON.stringify({ paths }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) log.warn(`web yenileme ${res.status}: ${paths.join(', ')}`);
  } catch (e) {
    log.warn(`web yenileme başarısız: ${(e as Error).message}`);
  }
}

/** Madde özetinin göründüğü anon sayfalar: madde sayfası + kanun okuyucu. */
export function articleSummaryPaths(lawSlug: string, articleNo: string): string[] {
  const no = articleNo.toLocaleLowerCase('tr-TR').replace(/[\s/]+/g, '-');
  return [`/kanun/${lawSlug}/madde/${no}`, `/kanun/${lawSlug}/oku`];
}

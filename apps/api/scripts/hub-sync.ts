/**
 * Soru Merkezi senkronu — elle tetik (Doc 55 §4).
 *
 *   npx tsx scripts/hub-sync.ts --dry-run [--pages=N] [--from-zero] [--page-size=500] [--report=<dosya>]
 *   npx tsx scripts/hub-sync.ts            # gerçek koşu: yazar ve ack gönderir
 *   npx tsx scripts/hub-sync.ts --reports  # yalnız iletilmemiş soru bildirimlerini merkeze gönderir (F3)
 *
 * Ortam: DATABASE_URL (yerel kopya ya da canlı — canlıda connection_limit=1 ve DB-yazma penceresi kuralı),
 *        HUB_SYNC_URL, HUB_SYNC_SECRET. Anahtar hiçbir çıktıya yazılmaz.
 * Kuru koşu: olay başına işlem açılır ve geri alınır; yalnız hub_sync_log (dry_run=true) yazılır,
 * imleç ve ack dokunulmaz.
 */
import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { HubReportForwarder } from '../src/modules/hub-sync/hub-report-forwarder';
import { HubSyncApplier } from '../src/modules/hub-sync/hub-sync.applier';
import { HubSyncClient } from '../src/modules/hub-sync/hub-sync.client';
import { HubSyncService, type RunReport } from '../src/modules/hub-sync/hub-sync.service';
import type { PrismaService } from '../src/infra/prisma/prisma.service';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, '').split('=');
    return [k, v === undefined ? true : v];
  }),
) as Record<string, string | true>;

const dryRun = args['dry-run'] === true;
const onlyReports = args.reports === true;
const baseUrl = process.env.HUB_SYNC_URL;
const secret = process.env.HUB_SYNC_SECRET;
if (!baseUrl || !secret) {
  console.error('HUB_SYNC_URL ve HUB_SYNC_SECRET gerekli.');
  process.exit(2);
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL gerekli.');
  process.exit(2);
}
const dbHost = new URL(process.env.DATABASE_URL).hostname;
console.log(`hub-sync ${dryRun ? 'KURU KOŞU' : 'GERÇEK KOŞU'} · merkez ${baseUrl} · veritabanı ${dbHost}`);
if ((!dryRun || onlyReports) && !/^(127\.0\.0\.1|localhost)$/.test(dbHost) && args['confirm-live'] !== true) {
  console.error('Canlı veritabanına gerçek koşu için --confirm-live gerekir (DB-yazma penceresi, backend durdurulmuş olmalı).');
  process.exit(2);
}

const prisma = new PrismaClient() as unknown as PrismaService;
const client = new HubSyncClient({ baseUrl, secret });
const service = new HubSyncService(prisma, new HubSyncApplier(prisma), client, { enabled: true, cron: false });

const toMarkdown = (r: RunReport): string => {
  const lines = [
    `# hub-sync ${r.dryRun ? 'kuru koşu' : 'gerçek koşu'} — ${r.startedAt.slice(0, 16)}`,
    '',
    `Merkez akış dönemi ${r.streamEpoch ?? '?'} · imleç ${r.startSeq} → ${r.lastAppliedSeq} · ${r.pages} sayfa, ${r.events} olay, ${r.seconds} sn · ack: ${r.acked ? 'evet' : 'hayır'}${r.stoppedBy ? ` · DURDU: ${r.stoppedBy}` : ''}`,
    '',
    '| Sonuç | Sayı |',
    '|---|---|',
    ...Object.entries(r.results).sort().map(([k, n]) => `| ${k} | ${n} |`),
    '',
    '| Varlık : eylem : sonuç | Sayı |',
    '|---|---|',
    ...Object.entries(r.counts).sort().map(([k, n]) => `| ${k} | ${n} |`),
    '',
  ];
  for (const [cls, samples] of Object.entries(r.samples)) {
    lines.push(`## ${cls} (ilk ${samples.length})`, '', ...samples.map((s) => `- ${s}`), '');
  }
  if (r.unmapped.length) lines.push('## Eşlenmemiş', '', ...r.unmapped.map((u) => `- ${u}`), '');
  if (r.errors.length) lines.push('## Hatalar', '', ...r.errors.map((e) => `- ${e}`), '');
  return lines.join('\n') + '\n';
};

(async () => {
  if (onlyReports) {
    // Bildirim iletimi: adaptör bayrağından bağımsız, elle tetik (enabled: true burada bilinçli).
    const forwarder = new HubReportForwarder(prisma, client, { enabled: true, cron: false });
    try {
      const r = await forwarder.forwardPending(args.limit ? Number(args.limit) : 200);
      console.log(`Bildirim iletimi: ${JSON.stringify(r)}`);
      process.exit(r.failed ? 1 : 0);
    } finally {
      await prisma.$disconnect();
    }
  }
  let report: RunReport | undefined;
  try {
    report = await service.run({
      dryRun,
      maxPages: args.pages ? Number(args.pages) : undefined,
      pageSize: args['page-size'] ? Number(args['page-size']) : undefined,
      fromZero: args['from-zero'] === true,
    });
  } catch (e) {
    report = (e as { report?: RunReport }).report;
    console.error(`Hata: ${(e as Error).message}`);
  } finally {
    await prisma.$disconnect();
  }
  if (report) {
    console.log(JSON.stringify({ ...report, samples: undefined }, null, 2));
    const out = typeof args.report === 'string' ? args.report : null;
    if (out) {
      writeFileSync(out, toMarkdown(report));
      writeFileSync(out.replace(/\.md$/, '') + '.json', JSON.stringify(report, null, 2) + '\n');
      console.log(`Rapor: ${out}`);
    }
  }
  process.exit(report && report.errors.length && report.stoppedBy ? 1 : 0);
})();

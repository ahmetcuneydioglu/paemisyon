import { Inject, Injectable, Logger, Optional } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { HubSyncApplier, type ApplyResult } from './hub-sync.applier';
import { HubSyncClient, HubTemporaryError } from './hub-sync.client';
import type { HubEvent, HubPayloadRequestItem } from './hub-sync.types';

export interface RunOptions {
  dryRun: boolean;
  /** En çok bu kadar olay sayfası (500'lük); kuru koşuda sınır koymak için. */
  maxPages?: number;
  pageSize?: number;
  /** İmleci yok say, 0'dan oku (kuru koşu / akış sıfırlama). */
  fromZero?: boolean;
}

export interface RunReport {
  dryRun: boolean;
  startedAt: string;
  seconds: number;
  pages: number;
  events: number;
  streamEpoch: number | null;
  startSeq: number;
  lastAppliedSeq: number;
  acked: boolean;
  counts: Record<string, number>; // `${entityType}:${action}:${result}`
  results: Record<string, number>; // result toplamı
  samples: Record<string, string[]>; // sınıf → ilk 25 ayrıntı
  unmapped: string[];
  errors: string[];
  stoppedBy: string | null;
}

export interface HubSyncOptions {
  enabled: boolean;
  cron: boolean;
}
export const HUB_SYNC_CLIENT = 'HUB_SYNC_CLIENT';
export const HUB_SYNC_OPTIONS = 'HUB_SYNC_OPTIONS';

/**
 * Döngü (Doc 55 §4): çek → yük al → uygula → ack. Teslim en az bir kez; uygulama idempotent.
 * Geçici hata ack'siz durur; kalıcı veri hatası olayı durdurmaz, günlüğe düşer ve ack `error`'la gider.
 */
@Injectable()
export class HubSyncService {
  private readonly logger = new Logger(HubSyncService.name);
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly applier: HubSyncApplier,
    @Optional() @Inject(HUB_SYNC_CLIENT) private readonly client: HubSyncClient | null,
    @Optional() @Inject(HUB_SYNC_OPTIONS) private readonly options: HubSyncOptions = { enabled: false, cron: false },
  ) {}

  /** Doc 52 düzeni: süreç içi cron, bayrakla açılır; aynı anda tek koşu. */
  @Cron('*/10 * * * *')
  async tick(): Promise<void> {
    if (!this.options.enabled || !this.options.cron || !this.client) return;
    if (this.running) return;
    try {
      const report = await this.run({ dryRun: false, maxPages: 20 });
      this.logger.log(`hub-sync: ${report.events} olay, ${JSON.stringify(report.results)}, imleç ${report.lastAppliedSeq}`);
    } catch (e) {
      this.logger.error(`hub-sync başarısız: ${(e as Error).message}`);
    }
  }

  async run(opts: RunOptions): Promise<RunReport> {
    if (!this.client) throw new Error('HUB_SYNC_URL / HUB_SYNC_SECRET tanımlı değil');
    if (this.running) throw new Error('hub-sync zaten çalışıyor');
    this.running = true;
    const started = Date.now();
    const pageSize = Math.min(Math.max(opts.pageSize ?? 500, 1), 500);
    const report: RunReport = {
      dryRun: opts.dryRun,
      startedAt: new Date(started).toISOString(),
      seconds: 0,
      pages: 0,
      events: 0,
      streamEpoch: null,
      startSeq: 0,
      lastAppliedSeq: 0,
      acked: false,
      counts: {},
      results: {},
      samples: {},
      unmapped: [],
      errors: [],
      stoppedBy: null,
    };
    try {
      this.applier.resetRunCaches();
      const state = await this.prisma.hubSyncState.upsert({ where: { id: 1 }, create: { id: 1 }, update: {} });
      let after = opts.fromZero ? 0 : Number(state.lastAckedSeq);
      let epoch = state.streamEpoch;
      report.startSeq = after;
      report.lastAppliedSeq = after;
      let lastAckError: string | null = null;

      for (let page = 0; page < (opts.maxPages ?? Number.POSITIVE_INFINITY); page += 1) {
        const pageData = await this.client.events(after, pageSize);
        report.streamEpoch = pageData.stream_epoch;
        if (epoch != null && pageData.stream_epoch !== epoch && !opts.fromZero && after !== 0) {
          // Akış dönemi değişti: imleç geçersiz, baştan oku (§8 akış dönemi).
          this.logger.warn(`hub-sync: akış dönemi ${epoch} → ${pageData.stream_epoch}; after=0`);
          report.samples['epoch-reset'] = [`${epoch} → ${pageData.stream_epoch}`];
          after = 0;
          epoch = pageData.stream_epoch;
          if (!opts.dryRun) await this.prisma.hubSyncState.update({ where: { id: 1 }, data: { streamEpoch: epoch, lastAckedSeq: 0 } });
          continue;
        }
        epoch = pageData.stream_epoch;
        if (pageData.events.length === 0) break;
        report.pages += 1;

        const payloads = await this.fetchPayloads(pageData.events);
        for (const event of pageData.events) {
          const key = payloadKey(event);
          const item = payloads.get(key);
          const payload = event.event_type === 'upsert' ? item?.payload ?? null : null;
          let result: ApplyResult;
          if (event.event_type === 'upsert' && item?.error && !payload) {
            result = { seq: event.seq, entityType: event.entity_type, entityId: event.entity_id, action: 'upsert', result: 'error', detail: `yük alınamadı: ${item.error}`, ackError: `${event.entity_id}: yük ${item.error}` };
          } else {
            result = await this.applier.apply(event, payload, { dryRun: opts.dryRun });
          }
          await this.record(result, opts.dryRun, report);
          if (result.ackError) lastAckError = result.ackError;
          report.lastAppliedSeq = event.seq;
          report.events += 1;
        }
        after = pageData.events[pageData.events.length - 1].seq;
        if (!opts.dryRun) {
          await this.client.ack(after, lastAckError);
          await this.prisma.hubSyncState.update({
            where: { id: 1 },
            data: { streamEpoch: epoch, lastAckedSeq: BigInt(after), lastRunAt: new Date(), lastError: lastAckError },
          });
          report.acked = true;
          lastAckError = null;
        }
        if (!pageData.has_more) break;
      }
    } catch (e) {
      const message = (e as Error).message;
      report.errors.push(message);
      report.stoppedBy = e instanceof HubTemporaryError ? 'temporary' : 'fatal';
      if (!opts.dryRun) {
        await this.prisma.hubSyncState.update({ where: { id: 1 }, data: { lastRunAt: new Date(), lastError: message.slice(0, 2000) } }).catch(() => undefined);
      }
      if (!(e instanceof HubTemporaryError)) throw Object.assign(e as Error, { report });
    } finally {
      report.seconds = Math.round((Date.now() - started) / 1000);
      this.running = false;
    }
    return report;
  }

  private async fetchPayloads(events: HubEvent[]): Promise<Map<string, { payload: unknown; error: string | null }>> {
    const wanted: HubPayloadRequestItem[] = [];
    const seen = new Set<string>();
    for (const e of events) {
      if (e.event_type !== 'upsert') continue;
      if (e.entity_type === 'tag' || e.entity_type === 'source') continue;
      const key = payloadKey(e);
      if (seen.has(key)) continue;
      seen.add(key);
      wanted.push({ entity_type: e.entity_type, entity_id: e.entity_id, entity_version: e.entity_version });
    }
    const out = new Map<string, { payload: unknown; error: string | null }>();
    for (let i = 0; i < wanted.length; i += 100) {
      const items = await this.client!.payloads(wanted.slice(i, i + 100));
      for (const it of items) out.set(`${it.entity_type}:${it.entity_id}:${it.entity_version ?? ''}`, { payload: it.payload, error: it.error });
    }
    return out;
  }

  private async record(r: ApplyResult, dryRun: boolean, report: RunReport): Promise<void> {
    const cls = `${r.entityType}:${r.action}:${r.result}`;
    report.counts[cls] = (report.counts[cls] ?? 0) + 1;
    report.results[r.result] = (report.results[r.result] ?? 0) + 1;
    const samples = (report.samples[cls] ??= []);
    if (samples.length < 25) samples.push(`seq ${r.seq} ${r.detail}`);
    if (r.result === 'unmapped' && report.unmapped.length < 200) report.unmapped.push(r.detail);
    if (r.result === 'error' && report.errors.length < 200) report.errors.push(`seq ${r.seq}: ${r.detail}`);
    await this.prisma.hubSyncLog.create({
      data: { seq: BigInt(r.seq), entityType: r.entityType, entityId: r.entityId, action: r.action, result: r.result, detail: r.detail.slice(0, 4000), dryRun },
    });
  }
}

function payloadKey(e: HubEvent): string {
  return `${e.entity_type}:${e.entity_id}:${e.entity_version ?? ''}`;
}

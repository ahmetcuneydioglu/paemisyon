import { Injectable, Logger } from '@nestjs/common';

export interface DuelBroadcast {
  topic: string;
  event: string;
  payload: Record<string, unknown>;
}

/**
 * Supabase Realtime Broadcast — yalnız TAŞIYICI (Doc 59). Kararlar veritabanında ve API'de
 * verilir; burası "durum değişti" haberini özel kanala yollar. İstemci yalnız dinler
 * (realtime.messages'ta INSERT politikası yok), yayın servis anahtarıyla buradan çıkar.
 *
 * Yayın düşerse oyun bozulmaz: istemci durum yoklamasıyla (GET /me/duel/matches/:id)
 * aynı anlık görüntüyü alır. Bu yüzden hata yutulur ve yalnız günlüğe yazılır.
 */
@Injectable()
export class DuelRealtimeService {
  private readonly logger = new Logger(DuelRealtimeService.name);

  async send(messages: DuelBroadcast[]): Promise<void> {
    if (messages.length === 0) return;
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return; // yerel/sınama: taşıyıcı yok, yoklama yeter
    try {
      const res = await fetch(`${url}/realtime/v1/api/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: key,
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ messages: messages.map((m) => ({ ...m, private: true })) }),
        signal: AbortSignal.timeout(2500),
      });
      if (!res.ok) this.logger.warn(`Realtime yayını reddedildi: ${res.status}`);
    } catch (err) {
      this.logger.warn(
        `Realtime yayını gönderilemedi: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }
}

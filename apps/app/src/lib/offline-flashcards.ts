import { Directory, File, Paths } from "expo-file-system";
import { api, ApiError, NetworkError } from "./api";

/**
 * Çevrimdışı kart puanı kuyruğu (Doc 56) — `offline-queue.ts` ile aynı kurallar: sırayla
 * gönderim, NetworkError'da dur, sunucu reddinde düşür. Olay kimliği (`clientEventId`) istemcide
 * üretildiği için aynı puan iki kez gitse de sunucu ikincisini yok sayar (idempotent).
 */
export interface QueuedFlashcardEvent {
  sessionId: string;
  clientEventId: string;
  flashcardId: string;
  rating: "again" | "known" | "easy";
  timeSpentMs: number | null;
  createdAt: number;
}

const dir = new Directory(Paths.document, "paemisyon");
const file = new File(dir, "offline-flashcard-events-v1.json");
let cache: QueuedFlashcardEvent[] | null = null;
let flushing = false;

async function load(): Promise<QueuedFlashcardEvent[]> {
  if (cache) return cache;
  try {
    cache = file.exists ? (JSON.parse(await file.text()) as QueuedFlashcardEvent[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function save(items: QueuedFlashcardEvent[]): Promise<void> {
  cache = items;
  try {
    if (!dir.exists) dir.create();
    file.write(JSON.stringify(items));
  } catch {
    /* disk yazılamazsa bellekte kalır */
  }
}

export async function enqueueFlashcardEvent(e: Omit<QueuedFlashcardEvent, "createdAt">): Promise<void> {
  const items = (await load()).filter((x) => x.clientEventId !== e.clientEventId);
  items.push({ ...e, createdAt: Date.now() });
  await save(items);
}

/** Geri alınan puan daha gitmediyse kuyruktan düşer; gittiyse sunucuda geri alınır (çağıran bilir). */
export async function dropQueuedFlashcardEvent(clientEventId: string): Promise<boolean> {
  const items = await load();
  const kalan = items.filter((x) => x.clientEventId !== clientEventId);
  if (kalan.length === items.length) return false;
  await save(kalan);
  return true;
}

export async function flushFlashcardQueue(): Promise<{ sent: number; dropped: number; stoppedByNetwork: boolean }> {
  if (flushing) return { sent: 0, dropped: 0, stoppedByNetwork: false };
  flushing = true;
  let sent = 0, dropped = 0, stoppedByNetwork = false;
  try {
    const items = [...(await load())].sort((a, b) => a.createdAt - b.createdAt);
    const remaining: QueuedFlashcardEvent[] = [];
    for (const it of items) {
      if (stoppedByNetwork) {
        remaining.push(it);
        continue;
      }
      try {
        await api(`/me/flashcards/sessions/${it.sessionId}/events`, {
          method: "POST",
          body: { clientEventId: it.clientEventId, flashcardId: it.flashcardId, rating: it.rating, ...(it.timeSpentMs != null ? { timeSpentMs: it.timeSpentMs } : {}) },
        });
        sent++;
      } catch (e) {
        if (e instanceof NetworkError) {
          stoppedByNetwork = true;
          remaining.push(it);
        } else if (e instanceof ApiError) dropped++;
        else remaining.push(it);
      }
    }
    await save(remaining);
  } finally {
    flushing = false;
  }
  return { sent, dropped, stoppedByNetwork };
}

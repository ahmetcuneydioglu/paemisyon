import { Directory, File, Paths } from "expo-file-system";
import { useSyncExternalStore } from "react";
import { api, ApiError, NetworkError } from "./api";

/**
 * Çevrimdışı cevap kuyruğu (yalnız alıştırma; deneme değil). Flutter `answer_queue.dart` ile
 * aynı kurallar: (session, question) tekil, son cevap kazanır; sırayla gönderim; NetworkError'da
 * dur ve kalanını sakla; diğer hatalarda (sunucu reddi, limit) öğeyi düşür. Depo: JSON dosyası
 * (SecureStore boyut sınırına takılmasın).
 */
export interface QueuedAnswer {
  sessionId: string;
  questionId: string;
  versionId: string;
  selectedOptionId: string | null;
  timeSpentMs: number | null;
  createdAt: number;
}

const dir = new Directory(Paths.document, "paemisyon");
const file = new File(dir, "offline-answers-v1.json");
let cache: QueuedAnswer[] | null = null;
let flushing = false;
const listeners = new Set<() => void>();
const emit = () => {
  for (const l of listeners) l();
};

async function load(): Promise<QueuedAnswer[]> {
  if (cache) return cache;
  try {
    cache = file.exists ? (JSON.parse(await file.text()) as QueuedAnswer[]) : [];
  } catch {
    cache = [];
  }
  return cache;
}

async function save(items: QueuedAnswer[]): Promise<void> {
  cache = items;
  emit();
  try {
    if (!dir.exists) dir.create();
    file.write(JSON.stringify(items));
  } catch {
    /* disk yazılamazsa bellekte kalır */
  }
}

export async function enqueueAnswer(a: Omit<QueuedAnswer, "createdAt">): Promise<void> {
  const items = (await load()).filter((x) => !(x.sessionId === a.sessionId && x.questionId === a.questionId));
  items.push({ ...a, createdAt: Date.now() });
  await save(items);
}

export async function pendingCount(): Promise<number> {
  return (await load()).length;
}

/** Sırayla gönderir. Ağ hatasında durur (kalanlar saklanır); sunucu reddinde öğe düşer. */
export async function flushQueue(): Promise<{ sent: number; dropped: number; stoppedByNetwork: boolean }> {
  if (flushing) return { sent: 0, dropped: 0, stoppedByNetwork: false };
  flushing = true;
  let sent = 0, dropped = 0, stoppedByNetwork = false;
  try {
    const items = [...(await load())].sort((a, b) => a.createdAt - b.createdAt);
    const remaining: QueuedAnswer[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i]!;
      if (stoppedByNetwork) {
        remaining.push(it);
        continue;
      }
      try {
        await api(`/quiz/sessions/${it.sessionId}/answers`, { method: "POST", body: { questionId: it.questionId, questionVersionId: it.versionId, ...(it.selectedOptionId ? { selectedOptionId: it.selectedOptionId } : {}), ...(it.timeSpentMs != null ? { timeSpentMs: it.timeSpentMs } : {}) } });
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

/** Bekleyen sayısı (Bugün rozeti). */
export function usePendingAnswers(): number {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void load().then(emit);
      return () => listeners.delete(l);
    },
    () => cache?.length ?? 0,
    () => 0,
  );
}

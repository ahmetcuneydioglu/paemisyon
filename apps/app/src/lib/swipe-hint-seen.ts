import { useSyncExternalStore } from "react";
import { readLocal, writeLocal } from "./local-store";

/**
 * Bilgi kartı kaydırma ipucu görüldü bayrağı (cihazda; çıkışta kalır). İlk oturumda ilk kart sağa-sola
 * salınır ("Biliyorum" / "Tekrar" tonları görünür); bir kez oynadıktan sonra bir daha gösterilmez.
 * `null` = henüz okunmadı; ipucu okunana kadar beklenir (yanlışlıkla ikinci kez oynamasın).
 * Kalıp `intro-seen.ts` ile aynı.
 */
let value: boolean | null = null;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

export function loadSwipeHintSeen(): Promise<void> {
  loading ??= readLocal<boolean>("flashcards-swipe-hint-seen", false).then((v) => {
    value = v;
    emit();
  });
  return loading;
}

export function markSwipeHintSeen(): void {
  if (value === true) return;
  value = true;
  emit();
  void writeLocal("flashcards-swipe-hint-seen", true);
}

export function useSwipeHintSeen(): boolean | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void loadSwipeHintSeen();
      return () => listeners.delete(l);
    },
    () => value,
    () => value,
  );
}

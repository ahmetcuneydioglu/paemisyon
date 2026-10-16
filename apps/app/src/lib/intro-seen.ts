import { useSyncExternalStore } from "react";
import { readLocal, writeLocal } from "./local-store";

/**
 * Tanıtım görüldü bayrağı (cihazda; çıkışta kalır). `null` = henüz okunmadı; kapı bekler.
 * Flutter'daki `intro_seen_v1` ile aynı anlam; depo farklı (SecureStore), göç gerekmez.
 */
let value: boolean | null = null;
const listeners = new Set<() => void>();
let loading: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

export function loadIntroSeen(): Promise<void> {
  loading ??= readLocal<boolean>("intro-seen", false).then((v) => {
    value = v;
    emit();
  });
  return loading;
}

export function markIntroSeen(): void {
  value = true;
  emit();
  void writeLocal("intro-seen", true);
}

export function useIntroSeen(): boolean | null {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      void loadIntroSeen();
      return () => listeners.delete(l);
    },
    () => value,
    () => value,
  );
}

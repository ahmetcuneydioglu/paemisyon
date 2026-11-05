import { useSyncExternalStore } from "react";
import { AccessibilityInfo } from "react-native";

/**
 * Sistem "hareketi azalt" tercihi (Doc 26 §3.4): süs animasyonları (halo nefesi, taç
 * süzülmesi, satır girişi) kapanır; durum değişimi anında olur. Tek sorgu + tek dinleyici,
 * tüm bileşenler aynı değeri okur.
 */
let current = false;
let started = false;
const listeners = new Set<() => void>();

function set(value: boolean) {
  if (value === current) return;
  current = value;
  listeners.forEach((l) => l());
}

function start() {
  if (started) return;
  started = true;
  void AccessibilityInfo.isReduceMotionEnabled().then(set, () => {});
  AccessibilityInfo.addEventListener("reduceMotionChanged", set);
}

function subscribe(listener: () => void) {
  start();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useReduceMotion(): boolean {
  return useSyncExternalStore(subscribe, () => current, () => false);
}

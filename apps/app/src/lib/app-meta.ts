import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import { readLocal, writeLocal } from "./local-store";

/**
 * Uygulama kimliği (Doc 52 §4.3): jeton kaydına `appVersion` ve `deviceId` eşlik eder.
 * Sürüm app.config `version`'dan; cihaz kimliği ilk açılışta üretilip yerelde saklanan rastgele
 * UUID'dir (donanım kimliği okunmaz, kullanıcı hesabına bağlı değildir). Aynı cihazda jeton
 * yenilenince sunucu eski kaydı kapatır; farklı cihazlar ayrı satır olur.
 */
const DEVICE_KEY = "device.id";
let cached: string | null = null;

export function appVersion(): string {
  return Constants.expoConfig?.version ?? "0.0.0";
}

export async function deviceId(): Promise<string> {
  if (cached) return cached;
  const stored = await readLocal<string | null>(DEVICE_KEY, null);
  if (stored) return (cached = stored);
  const fresh = Crypto.randomUUID();
  await writeLocal(DEVICE_KEY, fresh);
  return (cached = fresh);
}

/** "2.1.0" ≥ "2.0.3"? Sayısal parça karşılaştırması; bozuk değer "0". */
export function versionAtLeast(current: string, min: string | null | undefined): boolean {
  if (!min) return true;
  const a = current.split(".").map((x) => parseInt(x, 10) || 0);
  const b = min.split(".").map((x) => parseInt(x, 10) || 0);
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const x = a[i] ?? 0;
    const y = b[i] ?? 0;
    if (x !== y) return x > y;
  }
  return true;
}

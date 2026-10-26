import * as Notifications from "expo-notifications";
import { readLocal, writeLocal } from "./local-store";

/**
 * Günlük hatırlatma artık SUNUCUDAN gelir (Doc 52: `study_reminder` kategorisi, kullanıcının
 * `reminderTime` saatinde, günlük tavan ve sessiz saat kuralıyla). 26 Eki 2026 öncesi sürümler
 * aynı saate yerel bildirim de planlıyordu; iki kez dürtmemek için açılışta eski yerel plan
 * iptal edilir ve tercih kapatılır. Bu dosya o geçiş için kalır; yeni plan kurmaz.
 */
export interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}
const KEY = "reminder.prefs";
const DEFAULT: ReminderPrefs = { enabled: false, hour: 19, minute: 0 };

export const readReminderPrefs = () => readLocal<ReminderPrefs>(KEY, DEFAULT);

/** Açılışta: eski yerel hatırlatma varsa iptal eder; bir kez çalışır, sonra ucuz okuma. */
export async function refreshReminder(): Promise<void> {
  const p = await readReminderPrefs();
  if (!p.enabled) return;
  await Notifications.cancelAllScheduledNotificationsAsync().catch(() => undefined);
  await writeLocal(KEY, { ...p, enabled: false });
}

import * as Notifications from "expo-notifications";
import { AndroidImportance, SchedulableTriggerInputTypes } from "expo-notifications";
import { Platform } from "react-native";
import { api } from "./api";
import { readLocal, writeLocal } from "./local-store";

/**
 * Günlük hatırlatma (yerel bildirim; Flutter ile aynı davranış): kapalı başlar, kullanıcı açar;
 * varsayılan 19:00; 5 günlük pencere, günde bir; metin `GET /public/daily-quiz/teasers`
 * (en iyi çaba, 6 sn). Dokunuş `route: daily-quiz`.
 */
export interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
}
const KEY = "reminder.prefs";
const DEFAULT: ReminderPrefs = { enabled: false, hour: 19, minute: 0 };
const CHANNEL = "daily_reminder";

export const readReminderPrefs = () => readLocal<ReminderPrefs>(KEY, DEFAULT);

async function teasers(days: number): Promise<string[]> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 6000);
    const r = await api<{ date: string; teaser: string }[]>(`/public/daily-quiz/teasers?days=${days}`, { auth: false, signal: ctrl.signal });
    clearTimeout(t);
    return r.map((x) => x.teaser).filter(Boolean);
  } catch {
    return [];
  }
}

/** Tercihi yazar ve planı yeniler. Açarken izin ister; reddedilirse false döner. */
export async function setReminder(prefs: ReminderPrefs): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await writeLocal(KEY, prefs);
  if (!prefs.enabled) return true;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) {
    await writeLocal(KEY, { ...prefs, enabled: false });
    return false;
  }
  if (Platform.OS === "android") await Notifications.setNotificationChannelAsync(CHANNEL, { name: "Günlük hatırlatıcı", importance: AndroidImportance.DEFAULT });
  const texts = await teasers(5);
  const now = new Date();
  for (let d = 0; d < 5; d++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + d, prefs.hour, prefs.minute, 0, 0);
    if (at.getTime() <= now.getTime()) continue;
    await Notifications.scheduleNotificationAsync({
      content: { title: d % 2 === 0 ? "Günün Sorusu 🎯" : "Nöbet vakti", body: texts[d] ?? "Bugünkü turun hazır; 10 dakika yeter.", data: { route: "daily-quiz" }, ...(Platform.OS === "android" ? { channelId: CHANNEL } : {}) },
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: at },
    });
  }
  return true;
}

/** Uygulama açılışında pencereyi tazeler (tercih açıksa). */
export async function refreshReminder(): Promise<void> {
  const p = await readReminderPrefs();
  if (p.enabled) await setReminder(p);
}

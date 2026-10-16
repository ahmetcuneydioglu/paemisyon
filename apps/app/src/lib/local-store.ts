import * as SecureStore from "expo-secure-store";

/** Küçük, cihaza özel tercihler (tema, görülen tanıtım). Gizli değil; <2 KB. */
export async function readLocal<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await SecureStore.getItemAsync(`local.${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeLocal<T>(key: string, value: T): Promise<void> {
  try {
    await SecureStore.setItemAsync(`local.${key}`, JSON.stringify(value));
  } catch {
    // Yerel tercih yazılamazsa sessiz geçilir; işlev bozulmaz.
  }
}

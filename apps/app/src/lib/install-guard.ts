import { Directory, File, Paths } from "expo-file-system";
import * as SecureStore from "expo-secure-store";
import { env } from "./env";

/**
 * Yeniden kurulum bekçisi. iOS Keychain (SecureStore) uygulama silinince SİLİNMEZ; belge dizini
 * silinir. Bu yüzden silip yeniden kuran kişi eski oturumla açılır ve tanıtımı bir daha görmez
 * (cihazı devralan biri önceki hesaba düşer). Kural:
 *
 * - Belgede kurulum işareti VAR → olağan açılış.
 * - İşaret YOK, Keychain'de `install.id` VAR → yeniden kurulum: oturum ve yerel tercihler silinir.
 * - İkisi de YOK → ilk kurulum ya da bekçiden önceki bir sürümden güncelleme: hiçbir şey silinmez
 *   (güncelleyen kullanıcının oturumu düşmesin).
 *
 * Oturum ve yerel tercih okumaları `installReady`'yi bekler; böylece silme her okumadan önce biter.
 */
const KEYCHAIN_INSTALL_ID = "install.id";
const marker = new File(new Directory(Paths.document, "paemisyon"), "install-v1.json");

/** `local-store` ile yazılan cihaz tercihleri (`local.` önekiyle). Yeni anahtar eklenince buraya da eklenir. */
const LOCAL_KEYS = ["intro-seen", "theme-preference", "reader.scale", "home.examStrip.hidden", "flashcards-swipe-hint-seen"];

/** Supabase'in varsayılan depolama anahtarı (`sb-<proje>-auth-token`) ve PKCE/kullanıcı türevleri. */
function sessionKeys(): string[] {
  if (!env) return [];
  let ref: string;
  try {
    ref = new URL(env.supabaseUrl).hostname.split(".")[0] ?? "";
  } catch {
    return [];
  }
  const base = `sb-${ref}-auth-token`;
  return [base, `${base}-code-verifier`, `${base}-user`];
}

/** `supabase.ts` parçalı yazar (`<anahtar>.n`, `<anahtar>.0`…); sayaç okunamasa da ilk parçalar silinir. */
async function removeChunked(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`).catch(() => null);
  const count = Math.max(Number(countRaw) || 0, 8);
  await SecureStore.deleteItemAsync(`${key}.n`).catch(() => {});
  for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(`${key}.${i}`).catch(() => {});
}

function newId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

async function run(): Promise<void> {
  try {
    if (marker.exists) return;
    const previous = await SecureStore.getItemAsync(KEYCHAIN_INSTALL_ID).catch(() => null);
    if (previous) {
      for (const key of sessionKeys()) await removeChunked(key);
      for (const key of LOCAL_KEYS) await SecureStore.deleteItemAsync(`local.${key}`).catch(() => {});
    }
    const id = newId();
    await SecureStore.setItemAsync(KEYCHAIN_INSTALL_ID, id);
    if (!marker.parentDirectory.exists) marker.parentDirectory.create({ intermediates: true });
    marker.write(JSON.stringify({ id, at: new Date().toISOString() }));
  } catch {
    // Bekçi açılışı asla bozmaz: hata olursa olağan akış sürer.
  }
}

export const installReady: Promise<void> = run();

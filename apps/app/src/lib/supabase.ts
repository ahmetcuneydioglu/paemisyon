import "react-native-url-polyfill/auto";
import { createClient, type SupportedStorage } from "@supabase/supabase-js";
import * as SecureStore from "expo-secure-store";
import { AppState } from "react-native";
import { env } from "./env";

/**
 * Supabase YALNIZ kimlik için (Doc 8, Doc 49 §2.2): oturum, Apple/Google, e-posta. Veri NestJS
 * API'den gelir. Oturum SecureStore'da parçalı saklanır (tek değer ~2 KB sınırı; gys-mobil kalıbı).
 */
const CHUNK_SIZE = 1800;

async function readChunked(key: string): Promise<string | null> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  if (!countRaw) return null;
  const count = Number(countRaw);
  if (!Number.isInteger(count) || count <= 0) return null;
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(`${key}.${i}`);
    if (part == null) return null;
    parts.push(part);
  }
  return parts.join("");
}

async function removeChunked(key: string): Promise<void> {
  const countRaw = await SecureStore.getItemAsync(`${key}.n`);
  const count = countRaw ? Number(countRaw) : 0;
  await SecureStore.deleteItemAsync(`${key}.n`);
  for (let i = 0; i < count; i += 1) await SecureStore.deleteItemAsync(`${key}.${i}`);
}

async function writeChunked(key: string, value: string): Promise<void> {
  const previousRaw = await SecureStore.getItemAsync(`${key}.n`);
  const previous = previousRaw ? Number(previousRaw) : 0;
  const count = Math.max(1, Math.ceil(value.length / CHUNK_SIZE));
  for (let i = 0; i < count; i += 1) {
    await SecureStore.setItemAsync(`${key}.${i}`, value.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE));
  }
  await SecureStore.setItemAsync(`${key}.n`, String(count));
  for (let i = count; i < previous; i += 1) await SecureStore.deleteItemAsync(`${key}.${i}`);
}

const secureStorage: SupportedStorage = { getItem: readChunked, setItem: writeChunked, removeItem: removeChunked };

export const isConfigured = env !== null;

export const supabase = createClient(env?.supabaseUrl ?? "http://127.0.0.1:54321", env?.supabaseAnonKey ?? "missing", {
  auth: {
    storage: secureStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: "pkce",
  },
});

// Ön planda token yenileme çalışır; arka planda durur (Supabase RN rehberi).
AppState.addEventListener("change", (state) => {
  if (state === "active") supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});

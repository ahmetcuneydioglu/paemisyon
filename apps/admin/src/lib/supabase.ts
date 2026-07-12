import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

let client: SupabaseClient | null = null;

/** Tarayıcı Supabase istemcisi (YALNIZCA kimlik için — Doc 8). Tekil. */
export function supabase(): SupabaseClient {
  client ??= createClient(config.supabaseUrl, config.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true },
  });
  return client;
}

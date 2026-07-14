import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { config } from "../config";

/** Server Component / Route Handler tarafı Supabase istemcisi (cookie oturumlu). */
export async function supabaseServer() {
  const cookieStore = await cookies();
  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Component içinde set çağrılamaz — middleware tazeliyor, güvenle yutulur.
        }
      },
    },
  });
}

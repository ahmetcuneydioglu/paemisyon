import { cache } from "react";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";

/**
 * Middleware'in doğruladığı kullanıcıyı istek ağacında paylaşır. İstemciden
 * gelen aynı adlı başlık middleware'de silinip güvenilir değerle yeniden yazılır.
 */
export const getCurrentUser = cache(async () =>
  (await headers()).get("x-paemisyon-user-id"),
);

/** Paralel API çağrıları için cookie oturumunu bir kez çözümler. */
export const getAccessToken = cache(async () => {
  const { data } = await (await supabaseServer()).auth.getSession();
  return data.session?.access_token ?? null;
});

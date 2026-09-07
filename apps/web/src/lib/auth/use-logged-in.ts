"use client";

import { useEffect, useState } from "react";

/**
 * Public sayfalarda oturumu İSTEMCİDE sezer.
 *
 * Sunucuda `headers()`/`getCurrentUser()` okunursa sayfa dinamikleşir ve tüm
 * public katman edge cache'ini kaybeder (Doc 27). Bu yüzden statik/ISR sayfa
 * anonim hâliyle üretilir; girişli kullanıcı hidrasyondan sonra çerezden
 * anlaşılır ve çağrı-eylem ona göre değişir.
 *
 * Anonim ziyaretçi — yani SEO kitlesi — prerender edilmiş hâli anında görür,
 * flash yaşamaz. Dönüş `false` başlar; "henüz bilmiyorum" ile "girişsiz" aynı
 * kabul edilir, çünkü yanlış tarafta kalmanın bedeli anonim kullanıcıya
 * fazladan bir düğme göstermek kadardır.
 */
export function useLoggedIn(): boolean {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const id = setTimeout(
      () => setLoggedIn(document.cookie.includes("-auth-token")),
      0,
    );
    return () => clearTimeout(id);
  }, []);
  return loggedIn;
}

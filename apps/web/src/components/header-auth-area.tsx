"use client";

import { useEffect, useState } from "react";
import { signOut } from "@/app/(auth)/actions";
import { ButtonLink } from "@/components/ui/button";

/**
 * Public üst nav'ın giriş alanı — İSTEMCİDE çözülür ki `(site)` layout'u
 * `headers()`/`getCurrentUser()` okumasın ve tüm public sayfalar statik/ISR
 * olarak edge cache'inden servis edilebilsin.
 *
 * Anonim ziyaretçi (SEO kitlesi) prerender edilmiş "Giriş/Kayıt"ı anında görür
 * — flash yok. Girişli kullanıcı public sayfada oturum çerezinden sezilip
 * "Uygulamaya dön/Çıkış"a döner (landing'e girişli gelenler zaten middleware
 * ile /bugun'e yönlendirilir).
 */
export function HeaderAuthArea() {
  const [loggedIn, setLoggedIn] = useState(false);
  useEffect(() => {
    const id = setTimeout(
      () => setLoggedIn(document.cookie.includes("-auth-token")),
      0,
    );
    return () => clearTimeout(id);
  }, []);

  if (loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <ButtonLink href="/bugun" size="sm">
          Uygulamaya dön
        </ButtonLink>
        <form action={signOut}>
          <button
            type="submit"
            className="tk-interactive cursor-pointer rounded-sm px-2.5 py-1.5 text-[13px] text-ink-soft hover:text-ink"
          >
            Çıkış
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ButtonLink href="/giris" variant="ghost" size="sm">
        Giriş
      </ButtonLink>
      <ButtonLink href="/kayit" size="sm">
        Kayıt ol
      </ButtonLink>
    </div>
  );
}

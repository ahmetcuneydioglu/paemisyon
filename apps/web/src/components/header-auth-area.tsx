"use client";

import { ButtonLink } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { useLoggedIn } from "@/lib/auth/use-logged-in";

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
  const loggedIn = useLoggedIn();

  if (loggedIn) {
    return (
      <div className="flex items-center gap-2">
        <ButtonLink href="/bugun" size="sm">
          Uygulamaya dön
        </ButtonLink>
        <LogoutButton className="tk-interactive cursor-pointer rounded-control px-2.5 py-1.5 text-[13px] text-ink-soft hover:text-ink">
          Çıkış
        </LogoutButton>
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

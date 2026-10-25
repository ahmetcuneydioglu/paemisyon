"use client";

import { useState, type ReactNode } from "react";
import { signOut } from "@/app/(auth)/actions";
import { apiClient } from "@/lib/api-client";
import { pushAbonelikBirak } from "@/lib/web-push";

/**
 * Çıkış düğmesi — önce bu tarayıcının push token'ını sunucudan siler, sonra
 * oturumu kapatan sunucu eylemini çağırır. Mobil çıkışla aynı sözleşme
 * (apps/app AuthProvider → unregisterPushToken). Token silme başarısız olsa da
 * çıkış devam eder.
 *
 * Görünüm çağıranın: `className` verilir, içerik `children`. Böylece public üst
 * nav'daki küçük metin düğmesi ile profil kartındaki tehlike rengi aynı bileşeni
 * kullanır.
 */
export function LogoutButton({
  className,
  children = "Çıkış",
}: {
  className?: string;
  children?: ReactNode;
}) {
  const [busy, setBusy] = useState(false);

  async function cikis() {
    if (busy) return;
    setBusy(true);
    await pushAbonelikBirak((token) =>
      apiClient("/me/push-token", { method: "DELETE", body: { token } }),
    );
    await signOut();
  }

  return (
    <button type="button" onClick={cikis} disabled={busy} aria-busy={busy} className={className}>
      {children}
    </button>
  );
}

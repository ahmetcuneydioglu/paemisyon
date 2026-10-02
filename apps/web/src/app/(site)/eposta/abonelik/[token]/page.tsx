import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { config } from "@/lib/config";
import { PreferencesForm, type Preferences } from "./preferences-form";

export const metadata: Metadata = {
  title: "E-posta tercihleri",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

/**
 * Oturumsuz e-posta tercih / çıkış sayfası (docs/47-eposta-ses §6). Kimlik
 * yalnız bağlantıdaki rastgele belirteçtir; sayfa adresi maskeli gösterir.
 * Geçersiz belirteç → 404 (hangi adresin kayıtlı olduğu sızmaz).
 */
export default async function EpostaAbonelikPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!/^[A-Za-z0-9_-]{20,64}$/.test(token)) notFound();

  const res = await fetch(`${config.apiBaseUrl}/email/preferences/${token}`, {
    cache: "no-store",
  });
  if (res.status === 404) notFound();
  const json = (await res.json().catch(() => null)) as {
    data?: Preferences;
  } | null;

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-heading mb-2 text-2xl font-bold text-(--color-navy)">
        E-posta tercihlerin
      </h1>
      {json?.data ? (
        <PreferencesForm token={token} initial={json.data} />
      ) : (
        <p className="mt-4 text-sm text-(--color-red)">
          Tercihler şu anda yüklenemedi. Birkaç dakika sonra tekrar dene;
          e-posta almak istemiyorsan{" "}
          <a
            className="underline"
            href="mailto:destek@paemisyon.com?subject=abonelikten-cik"
          >
            destek@paemisyon.com
          </a>{" "}
          adresine yaz.
        </p>
      )}
    </div>
  );
}

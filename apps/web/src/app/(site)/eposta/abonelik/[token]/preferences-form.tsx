"use client";
import { useState } from "react";
import { config } from "@/lib/config";

export type Preferences = {
  emailMasked: string;
  status:
    "subscribed" | "unsubscribed" | "bounced" | "complained" | "suppressed";
  canResubscribe: boolean;
  topics: { duyuru: boolean; kampanya: boolean };
};

const TOPICS: {
  key: keyof Preferences["topics"];
  title: string;
  description: string;
}[] = [
  {
    key: "duyuru",
    title: "Duyurular",
    description: "Yeni özellikler, sınav takvimi ve mevzuat güncellemeleri.",
  },
  {
    key: "kampanya",
    title: "Kampanyalar",
    description: "İndirim ve fırsat bildirimleri.",
  },
];

async function put(token: string, body: unknown): Promise<Preferences> {
  const res = await fetch(`${config.apiBaseUrl}/email/preferences/${token}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json().catch(() => null)) as {
    data?: Preferences;
    error?: { message?: string };
  } | null;
  if (!res.ok || !json?.data)
    throw new Error(json?.error?.message ?? "Kaydedilemedi.");
  return json.data;
}

export function PreferencesForm({
  token,
  initial,
}: {
  token: string;
  initial: Preferences;
}) {
  const [prefs, setPrefs] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(body: unknown, okNote: string) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      setPrefs(await put(token, body));
      setNote(okNote);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const blocked =
    prefs.status === "bounced" ||
    prefs.status === "complained" ||
    prefs.status === "suppressed";

  return (
    <div className="space-y-6 text-[15px] leading-relaxed text-gray-700">
      <p className="text-sm text-neutral-500">Adres: {prefs.emailMasked}</p>

      {prefs.status === "unsubscribed" && (
        <div className="rounded-md border border-(--color-border) bg-(--color-grey-bg) px-4 py-3 text-sm">
          Bu adrese artık e-posta göndermiyoruz.{" "}
          {prefs.canResubscribe && (
            <button
              type="button"
              disabled={busy}
              onClick={() => run({ aboneOl: true }, "Yeniden abone oldun.")}
              className="font-semibold text-(--color-navy) underline disabled:opacity-50"
            >
              Yeniden abone ol
            </button>
          )}
        </div>
      )}

      {blocked && (
        <div className="rounded-md border border-(--color-border) bg-(--color-grey-bg) px-4 py-3 text-sm">
          Bu adrese gönderim durduruldu (posta teslim edilemedi ya da istenmeyen
          olarak işaretlendi). Yeniden almak istersen{" "}
          <a className="underline" href="mailto:destek@paemisyon.com">
            destek@paemisyon.com
          </a>
          adresine yaz.
        </div>
      )}

      {prefs.status === "subscribed" && (
        <>
          <fieldset className="space-y-3">
            <legend className="mb-1 text-sm font-medium">
              Hangi e-postaları almak istersin?
            </legend>
            {TOPICS.map((t) => (
              <label
                key={t.key}
                className="flex cursor-pointer items-start gap-3 rounded-md border border-(--color-border) px-4 py-3"
              >
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={prefs.topics[t.key]}
                  disabled={busy}
                  onChange={(e) =>
                    run(
                      { topics: { [t.key]: e.target.checked } },
                      "Tercihin kaydedildi.",
                    )
                  }
                />
                <span>
                  <span className="block text-[14px] font-bold text-(--color-ink)">
                    {t.title}
                  </span>
                  <span className="block text-[13px] text-(--color-ink-soft)">
                    {t.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="border-t border-(--color-border) pt-5">
            <button
              type="button"
              disabled={busy}
              onClick={() =>
                run(
                  { aboneOl: false },
                  "Abonelikten çıktın. Artık e-posta almayacaksın.",
                )
              }
              className="rounded-md border border-(--color-border) px-4 py-2 text-sm font-semibold text-(--color-red) disabled:opacity-50"
            >
              Bütün e-postaları durdur
            </button>
            <p className="mt-2 text-[12px] text-neutral-500">
              Hesap doğrulama ve şifre sıfırlama gibi işlem e-postaları bundan
              etkilenmez.
            </p>
          </div>
        </>
      )}

      {note && (
        <p className="text-sm font-medium text-(--color-green)">{note}</p>
      )}
      {error && (
        <p className="text-sm font-semibold text-(--color-red)">{error}</p>
      )}
    </div>
  );
}

"use client";
import { useState } from "react";
import { config } from "@/lib/config";
import { Button } from "@/components/ui/button";
import { Notice } from "@/components/ui/notice";

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
    <div className="flex flex-col gap-5">
      {prefs.status === "unsubscribed" && (
        <Notice
          tone="info"
          action={
            prefs.canResubscribe ? (
              <Button
                variant="secondary"
                size="sm"
                disabled={busy}
                onClick={() => run({ aboneOl: true }, "Yeniden abone oldun.")}
              >
                Yeniden abone ol
              </Button>
            ) : undefined
          }
        >
          Bu adrese artık e-posta göndermiyoruz.
        </Notice>
      )}

      {blocked && (
        <Notice tone="warning">
          Bu adrese gönderim durduruldu (posta teslim edilemedi ya da istenmeyen
          olarak işaretlendi). Yeniden almak istersen{" "}
          <a className="underline" href="mailto:destek@paemisyon.com">
            destek@paemisyon.com
          </a>{" "}
          adresine yaz.
        </Notice>
      )}

      {prefs.status === "subscribed" && (
        <>
          <fieldset className="flex flex-col gap-2">
            <legend className="type-subhead mb-2 text-ink">
              Hangi e-postaları almak istersin?
            </legend>
            {TOPICS.map((t) => (
              <label
                key={t.key}
                className="tk-interactive flex cursor-pointer items-start gap-3 rounded-card border border-line bg-surface px-4 py-3 hover:border-ink-soft has-[:checked]:border-accent"
              >
                <input
                  type="checkbox"
                  className="mt-1 size-4 accent-accent"
                  checked={prefs.topics[t.key]}
                  disabled={busy}
                  onChange={(e) =>
                    run(
                      { topics: { [t.key]: e.target.checked } },
                      "Tercihin kaydedildi.",
                    )
                  }
                />
                <span className="flex flex-col">
                  <span className="type-subhead text-ink">{t.title}</span>
                  <span className="type-body-sm text-ink-soft">
                    {t.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>

          <div className="flex flex-col gap-2 border-t border-line pt-5">
            <Button
              variant="danger"
              disabled={busy}
              className="self-start"
              onClick={() =>
                run(
                  { aboneOl: false },
                  "Abonelikten çıktın. Artık e-posta almayacaksın.",
                )
              }
            >
              Bütün e-postaları durdur
            </Button>
            <p className="type-body-sm text-ink-subtle">
              Hesap doğrulama ve şifre sıfırlama gibi işlem e-postaları bundan
              etkilenmez.
            </p>
          </div>
        </>
      )}

      {note && <Notice tone="success">{note}</Notice>}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

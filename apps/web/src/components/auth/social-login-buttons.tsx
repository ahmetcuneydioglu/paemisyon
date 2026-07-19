"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { safeNext } from "@/lib/auth";
import {
  OAUTH_PROVIDERS,
  authErrorMessage,
  oauthRedirectTo,
  type OAuthProviderId,
} from "@/lib/auth/providers";

/**
 * Google / Apple ile giriş butonları (giris + kayit ortak). İstemci tarafı
 * PKCE OAuth (@supabase/ssr): buton → signInWithOAuth → sağlayıcı → /auth/callback
 * (kod değişimi sunucuda). Session cookie'de saklanır; token localStorage'a elle
 * yazılmaz. redirectTo çalışma anındaki origin'den türer (localhost/preview/prod).
 */
export function SocialLoginButtons({ next = "/bugun" }: { next?: string }) {
  // Hangi sağlayıcı yükleniyor — biri aktifken diğerleri kilitlenir.
  const [loading, setLoading] = useState<OAuthProviderId | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function start(provider: OAuthProviderId) {
    if (loading) return;
    setError(null);
    setLoading(provider);
    try {
      const supabase = supabaseBrowser();
      const redirectTo = oauthRedirectTo(window.location.origin, safeNext(next));
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      // Başarılıysa tarayıcı sağlayıcıya yönlenir; buraya dönerse hata var.
      if (error) {
        setError(authErrorMessage(provider, error.message));
        setLoading(null);
      }
    } catch (e) {
      setError(authErrorMessage(provider, e instanceof Error ? e.message : null));
      setLoading(null);
    }
  }

  return (
    <div className="space-y-2">
      {OAUTH_PROVIDERS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => start(p.id)}
          disabled={loading !== null}
          aria-busy={loading === p.id}
          className="tk-interactive flex h-11 w-full items-center justify-center gap-2.5 rounded-sm border border-line bg-surface px-4 text-[14px] font-semibold text-ink hover:border-ink-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading === p.id ? (
            <Spinner />
          ) : p.id === "google" ? (
            <GoogleIcon />
          ) : (
            <AppleIcon />
          )}
          <span>{loading === p.id ? "Yönlendiriliyor…" : p.label}</span>
        </button>
      ))}
      {error && (
        <p
          className="rounded-sm bg-danger/10 px-3 py-2 text-[13px] font-semibold text-danger"
          role="alert"
        >
          {error}
        </p>
      )}
    </div>
  );
}

function Spinner() {
  return (
    <span
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden
    />
  );
}

/** Google 4-renk "G" — hafif inline SVG (ikon paketi yok). */
function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.02-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.98 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.02-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.02 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

/** Apple logosu — tek renk (currentColor), Apple marka kuralına uygun. */
function AppleIcon() {
  return (
    <svg width="16" height="18" viewBox="0 0 16 18" aria-hidden focusable="false" fill="currentColor">
      <path d="M13.03 9.57c-.02-1.98 1.62-2.93 1.69-2.98-.92-1.35-2.36-1.53-2.87-1.55-1.22-.12-2.38.72-3 .72-.62 0-1.58-.7-2.6-.68-1.34.02-2.58.78-3.27 1.98-1.39 2.42-.36 6 1 7.96.66.96 1.45 2.04 2.48 2 .99-.04 1.37-.64 2.57-.64 1.2 0 1.54.64 2.6.62 1.07-.02 1.75-.98 2.41-1.95.76-1.12 1.07-2.2 1.09-2.26-.02-.01-2.09-.8-2.11-3.19ZM11.05 3.4c.55-.67.92-1.6.82-2.53-.79.03-1.75.53-2.32 1.19-.51.59-.96 1.53-.84 2.44.88.07 1.79-.45 2.34-1.1Z" />
    </svg>
  );
}

"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { resendConfirmation, signIn, signUp, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { AuthDivider } from "@/components/auth/auth-divider";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";

/** Giriş/Kayıt formu — eski popup'ın sayfa hali; ikonlu alanlar, eski buton dili. */
export function AuthForm({
  mode,
  next = "/bugun",
}: {
  mode: "giris" | "kayit";
  next?: string;
}) {
  const isLogin = mode === "giris";
  const [showPassword, setShowPassword] = useState(false);
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isLogin ? signIn : signUp,
    {},
  );
  const [resendState, resendAction, resendPending] = useActionState<
    AuthState,
    FormData
  >(resendConfirmation, {});

  if (state.verificationRequired) {
    return (
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-success/30 bg-surface p-6 shadow-sm">
          <div
            className="flex size-11 items-center justify-center rounded-full bg-success/10 text-xl text-success"
            aria-hidden
          >
            ✓
          </div>
          <h1 className="mt-4 font-heading text-xl font-bold text-ink">
            E-postanı doğrula
          </h1>
          <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
            {state.notice}
          </p>
          <p className="mt-2 break-all text-[13px] font-semibold text-ink">
            {state.email}
          </p>
          <form action={resendAction} className="mt-5">
            <input type="hidden" name="email" value={state.email ?? ""} />
            <Button
              type="submit"
              variant="secondary"
              className="w-full"
              disabled={resendPending}
            >
              {resendPending ? "Gönderiliyor…" : "E-postayı yeniden gönder"}
            </Button>
          </form>
          {(resendState.notice || resendState.error) && (
            <p
              className={[
                "mt-3 text-[13px]",
                resendState.error ? "text-danger" : "text-success",
              ].join(" ")}
              role="status"
            >
              {resendState.error ?? resendState.notice}
            </p>
          )}
          <Link
            href="/giris"
            className="mt-5 inline-block text-[13px] font-bold text-brand hover:underline"
          >
            Giriş sayfasına dön →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md">
      <div className="mb-6">
        <span className="tk-caption text-brand">
          Tek hesap · tüm platformlar
        </span>
        <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
          {isLogin ? "Tekrar hoş geldin" : "Hazırlığına bugün başla"}
        </h1>
        <p className="mt-2 text-[14px] text-ink-soft">
          {isLogin
            ? "Koçun ve ilerlemen seni bekliyor."
            : "PAEM ve Misyon hazırlığın aynı hesapta, her cihazda."}
        </p>
      </div>
      <div className="space-y-5 rounded-lg border border-line bg-surface p-6 shadow-sm">
      <form action={action} className="space-y-4">
        <input type="hidden" name="next" value={next} />
        {!isLogin && (
          <Field name="name" type="text" label="Ad soyad" autoComplete="name" />
        )}
        <Field name="email" type="email" label="E-posta" autoComplete="email" />
        <div>
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor="auth-password"
              className="text-[13px] font-semibold text-ink"
            >
              Şifre
            </label>
            {isLogin && (
              <Link
                href="/sifremi-unuttum"
                className="text-[12px] font-bold text-brand hover:underline"
              >
                Şifremi unuttum
              </Link>
            )}
          </div>
          <div className="mt-1 flex h-11 items-center rounded-sm border border-line bg-surface px-3 focus-within:border-brand">
            <input
              id="auth-password"
              required
              minLength={isLogin ? undefined : 8}
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete={isLogin ? "current-password" : "new-password"}
              className="min-w-0 flex-1 bg-transparent text-[14px] text-ink outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="tk-interactive ml-2 min-h-11 px-1 text-[12px] font-bold text-ink-soft hover:text-ink"
              aria-label={showPassword ? "Şifreyi gizle" : "Şifreyi göster"}
            >
              {showPassword ? "Gizle" : "Göster"}
            </button>
          </div>
          {!isLogin && (
            <p className="mt-1 text-[11px] text-ink-soft">En az 8 karakter</p>
          )}
        </div>
        {state.error && (
          <p
            className="rounded-sm bg-danger/10 px-3 py-2 text-[13px] font-semibold text-danger"
            role="alert"
          >
            {state.error}
          </p>
        )}
        <Button type="submit" disabled={pending} size="lg" className="w-full">
          {pending ? "Bekleyin…" : isLogin ? "Giriş Yap" : "Kayıt Ol"}
        </Button>
      </form>

        <AuthDivider />
        <SocialLoginButtons next={next} />

        <p className="text-center text-[13px] text-ink-soft">
          {isLogin ? (
            <>
              Hesabın yok mu?{" "}
              <Link
                className="font-bold text-brand hover:underline"
                href="/kayit"
              >
                Kayıt ol
              </Link>
            </>
          ) : (
            <>
              Zaten üye misin?{" "}
              <Link
                className="font-bold text-brand hover:underline"
                href="/giris"
              >
                Giriş yap
              </Link>
            </>
          )}
        </p>
        {!isLogin && (
          <p className="text-center text-[11px] leading-relaxed text-ink-soft">
            Kayıt olarak{" "}
            <Link href="/kosullar" className="underline">
              Kullanım Koşulları
            </Link>{" "}
            ve{" "}
            <Link href="/gizlilik" className="underline">
              Gizlilik Politikası
            </Link>
            ’nı kabul edersin.
          </p>
        )}
      </div>
    </div>
  );
}

function Field(props: {
  name: string;
  type: string;
  label: string;
  autoComplete: string;
}) {
  return (
    <div>
      <label
        htmlFor={`auth-${props.name}`}
        className="text-[13px] font-semibold text-ink"
      >
        {props.label}
      </label>
      <input
        id={`auth-${props.name}`}
        required
        name={props.name}
        type={props.type}
        autoComplete={props.autoComplete}
        className="mt-1 h-11 w-full rounded-sm border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-brand"
      />
    </div>
  );
}

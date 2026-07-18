"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  requestPasswordReset,
  updatePassword,
  type AuthState,
} from "./actions";

export function PasswordForm({ mode }: { mode: "request" | "update" }) {
  const isUpdate = mode === "update";
  const [show, setShow] = useState(false);
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isUpdate ? updatePassword : requestPasswordReset,
    {},
  );
  return (
    <div className="w-full max-w-md">
      <span className="tk-caption text-brand">Hesap güvenliği</span>
      <h1 className="mt-1 font-heading text-2xl font-bold text-ink">
        {isUpdate ? "Yeni şifreni belirle" : "Şifreni yenile"}
      </h1>
      <p className="mt-2 text-[14px] text-ink-soft">
        {isUpdate
          ? "Güçlü ve başka yerde kullanmadığın bir şifre seç."
          : "E-posta adresine güvenli bir yenileme bağlantısı gönderelim."}
      </p>
      <form
        action={action}
        className="mt-6 space-y-4 rounded-lg border border-line bg-surface p-6 shadow-sm"
      >
        {!isUpdate ? (
          <Field
            name="email"
            type="email"
            label="E-posta"
            autoComplete="email"
          />
        ) : (
          <>
            <div>
              <label
                htmlFor="new-password"
                className="text-[13px] font-semibold text-ink"
              >
                Yeni şifre
              </label>
              <div className="mt-1 flex h-11 rounded-sm border border-line px-3 focus-within:border-brand">
                <input
                  id="new-password"
                  name="password"
                  required
                  minLength={8}
                  type={show ? "text" : "password"}
                  autoComplete="new-password"
                  className="min-w-0 flex-1 bg-transparent text-ink outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShow((v) => !v)}
                  className="min-h-11 text-[12px] font-bold text-ink-soft"
                >
                  {show ? "Gizle" : "Göster"}
                </button>
              </div>
            </div>
            <Field
              name="confirmation"
              type={show ? "text" : "password"}
              label="Yeni şifre tekrar"
              autoComplete="new-password"
              minLength={8}
            />
          </>
        )}
        {(state.error || state.notice) && (
          <p
            className={[
              "rounded-sm px-3 py-2 text-[13px]",
              state.error
                ? "bg-danger/10 text-danger"
                : "bg-success/10 text-success",
            ].join(" ")}
            role="status"
          >
            {state.error ?? state.notice}
          </p>
        )}
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {pending
            ? "İşleniyor…"
            : isUpdate
              ? "Şifreyi güncelle"
              : "Bağlantı gönder"}
        </Button>
        <Link
          href="/giris"
          className="block text-center text-[13px] font-bold text-brand hover:underline"
        >
          Giriş sayfasına dön
        </Link>
      </form>
    </div>
  );
}

function Field({
  name,
  type,
  label,
  autoComplete,
  minLength,
}: {
  name: string;
  type: string;
  label: string;
  autoComplete: string;
  minLength?: number;
}) {
  return (
    <div>
      <label
        htmlFor={`password-${name}`}
        className="text-[13px] font-semibold text-ink"
      >
        {label}
      </label>
      <input
        id={`password-${name}`}
        name={name}
        type={type}
        required
        minLength={minLength}
        autoComplete={autoComplete}
        className="mt-1 h-11 w-full rounded-sm border border-line bg-surface px-3 text-[14px] text-ink outline-none focus:border-brand"
      />
    </div>
  );
}

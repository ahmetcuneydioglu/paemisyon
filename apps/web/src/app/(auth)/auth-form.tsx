"use client";
import Link from "next/link";
import { useActionState } from "react";
import { signIn, signUp, type AuthState } from "./actions";

/** Giriş/Kayıt formu — eski popup'ın sayfa hali; ikonlu alanlar, eski buton dili. */
export function AuthForm({ mode }: { mode: "giris" | "kayit" }) {
  const isLogin = mode === "giris";
  const [state, action, pending] = useActionState<AuthState, FormData>(
    isLogin ? signIn : signUp,
    {},
  );

  return (
    <div className="bg-(--color-grey-bg) py-12">
      <div className="mx-auto max-w-md px-4">
        <h1 className="head3 mb-6">
          <i className={isLogin ? "icon-enter" : "icon-add-user"} aria-hidden />
          {isLogin ? "Üye Girişi" : "Üye Ol"}
        </h1>
        <form action={action} className="card-content space-y-4">
          {!isLogin && (
            <Field icon="icon-user" name="name" type="text" placeholder="Ad Soyad" autoComplete="name" />
          )}
          <Field icon="icon-email" name="email" type="email" placeholder="E-posta" autoComplete="email" />
          <Field
            icon="icon-lock"
            name="password"
            type="password"
            placeholder="Şifre"
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
          {state.error && <p className="text-sm font-semibold text-(--color-red)">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-old btn-old-navy w-full disabled:opacity-60">
            {pending ? "Bekleyin…" : isLogin ? "Giriş Yap" : "Kayıt Ol"}
          </button>
          <p className="text-center text-[13px]">
            {isLogin ? (
              <>Hesabın yok mu? <Link className="font-bold text-(--color-navy) hover:underline" href="/kayit">Üye Ol</Link></>
            ) : (
              <>Zaten üye misin? <Link className="font-bold text-(--color-navy) hover:underline" href="/giris">Giriş Yap</Link></>
            )}
          </p>
          <p className="text-center text-[12px] text-neutral-500">
            iOS uygulamasındaki hesabınla aynı — tek hesap, tüm platformlar.
          </p>
        </form>
      </div>
    </div>
  );
}

function Field(props: { icon: string; name: string; type: string; placeholder: string; autoComplete: string }) {
  return (
    <label className="flex items-center gap-3 border border-(--color-border) bg-white px-3 py-2 focus-within:border-(--color-navy)">
      <i className={`${props.icon} text-(--color-navy)`} aria-hidden />
      <input
        required
        name={props.name}
        type={props.type}
        placeholder={props.placeholder}
        autoComplete={props.autoComplete}
        className="w-full text-sm outline-none"
      />
    </label>
  );
}

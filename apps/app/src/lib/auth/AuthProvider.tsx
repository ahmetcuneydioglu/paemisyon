import type { Session } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { queryClient } from "@/lib/query";
import { supabase } from "@/lib/supabase";
import { unregisterPushToken } from "../push";
import { signOutFromProviders } from "./social";

type AuthState =
  | { status: "loading"; session: null }
  | { status: "signedOut"; session: null }
  | { status: "signedIn"; session: Session };

type AuthContextValue = AuthState & { signOut: () => Promise<void> };

const AuthContext = createContext<AuthContextValue>({ status: "loading", session: null, signOut: async () => {} });

/** Oturum durumu tek yerden; hesap değişiminde sorgu önbelleği temizlenir. Push kaydı F5'te eklenir. */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading", session: null });

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setState(data.session ? { status: "signedIn", session: data.session } : { status: "signedOut", session: null });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") queryClient.clear();
      setState(session ? { status: "signedIn", session } : { status: "signedOut", session: null });
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      ...state,
      signOut: async () => {
        // Push jetonu bu hesaptan düşsün (başka hesapla girişte yeniden kaydedilir).
        await unregisterPushToken().catch(() => {});
        await supabase.auth.signOut();
        await signOutFromProviders();
      },
    }),
    [state],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

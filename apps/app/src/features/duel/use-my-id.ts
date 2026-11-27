import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

/** Oturumdaki kullanıcının kimliği (= uygulama kullanıcı id'si); maçta "ben" satırını bulmak için. */
export function useMyId(): string | null {
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setId(data.session?.user.id ?? null);
    });
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setId(session?.user.id ?? null));
    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, []);
  return id;
}

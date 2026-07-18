import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "./lib/config";

/**
 * Oturum tazeleme (supabase-ssr standart deseni): süresi dolan access token'ı
 * her istekte sessizce yeniler; korumalı sayfalar yönlendirmeyi kendisi yapar.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(
    appConfig.supabaseUrl,
    appConfig.supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const { data } = await supabase.auth.getUser();
  const protectedPrefixes = [
    "/bugun",
    "/kutuphane",
    "/performans",
    "/profil",
    "/seans",
    "/sinav",
    "/sonuc",
  ];
  const isProtected = protectedPrefixes.some(
    (prefix) =>
      request.nextUrl.pathname === prefix ||
      request.nextUrl.pathname.startsWith(`${prefix}/`),
  );
  if (isProtected && !data.user) {
    const login = request.nextUrl.clone();
    login.pathname = "/giris";
    login.search = "";
    login.searchParams.set(
      "next",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|img/|fonts/).*)"],
};

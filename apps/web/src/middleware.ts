import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { config as appConfig } from "./lib/config";

/**
 * Oturum tazeleme (supabase-ssr standart deseni): süresi dolan access token'ı
 * her istekte sessizce yeniler; korumalı sayfalar yönlendirmeyi kendisi yapar.
 */
export async function middleware(request: NextRequest) {
  const refreshedCookies: { name: string; value: string; options: CookieOptions }[] = [];
  const supabase = createServerClient(
    appConfig.supabaseUrl,
    appConfig.supabaseAnonKey,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: (list) => {
          list.forEach(({ name, value }) => request.cookies.set(name, value));
          refreshedCookies.push(...list);
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
    const redirectResponse = NextResponse.redirect(login);
    refreshedCookies.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options),
    );
    return redirectResponse;
  }

  // Girişli kullanıcının evi uygulama kabuğu: landing yerine /bugun.
  // Bu yönlendirme sayfadan buraya taşındı ki landing (/) statik/ISR olarak
  // edge cache'inden servis edilebilsin (Doc 27 §3.1 — en yüksek trafikli sayfa).
  if (data.user && request.nextUrl.pathname === "/") {
    const home = request.nextUrl.clone();
    home.pathname = "/bugun";
    home.search = "";
    const redirectResponse = NextResponse.redirect(home);
    refreshedCookies.forEach(({ name, value, options }) =>
      redirectResponse.cookies.set(name, value, options),
    );
    return redirectResponse;
  }

  // Server Component'ler aynı doğrulanmış kullanıcıyı ikinci kez Supabase'den
  // istemez. Dışarıdan gönderilebilecek aynı adlı başlık her istekte ezilir.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-paemisyon-user-id");
  if (data.user) requestHeaders.set("x-paemisyon-user-id", data.user.id);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  refreshedCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|img/|fonts/).*)"],
};

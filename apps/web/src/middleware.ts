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

  // Doğrulanmış kullanıcıyı Server Component'lere güvenli başlıkla taşı (ikinci
  // Supabase çağrısı olmasın). Dışarıdan gelen aynı adlı başlık her istekte ezilir.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("x-paemisyon-user-id");
  if (data.user) requestHeaders.set("x-paemisyon-user-id", data.user.id);

  const protectedPrefixes = [
    "/bugun",
    "/calisma", // kanun/SEO sayfalarının girişli app-kabuğu sürümleri (rewrite hedefi)
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

  // Aynı URL iki derinlik (Doc 27): kanun/SEO sayfaları anon'a STATİK edge
  // sayfası, girişli kullanıcıya app kabuğunda çalışma alanı. Anon URL statik
  // kalsın diye girişli istek /calisma/*'a REWRITE'lanır — URL /kanun* kalır.
  const p = request.nextUrl.pathname;
  // "Kanunu oku" (Doc 25 §4) sayfasının app-kabuğu eşi henüz yok → rewrite'tan
  // hariç tut; girişli kullanıcı da anon (site) okuma sayfasını görür (Faz 2'de
  // /calisma/.../oku eklenince bu istisna kalkar).
  const isLawPublicPage =
    (p === "/kanunlar" || p.startsWith("/kanun/")) && !p.endsWith("/oku");
  if (data.user && isLawPublicPage) {
    const rewrite = request.nextUrl.clone();
    rewrite.pathname = `/calisma${p}`;
    const rewriteResponse = NextResponse.rewrite(rewrite, {
      request: { headers: requestHeaders },
    });
    refreshedCookies.forEach(({ name, value, options }) =>
      rewriteResponse.cookies.set(name, value, options),
    );
    return rewriteResponse;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  refreshedCookies.forEach(({ name, value, options }) =>
    response.cookies.set(name, value, options),
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon|img/|fonts/).*)"],
};

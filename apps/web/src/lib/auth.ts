/** Yalnız uygulama-içi göreli dönüş yollarına izin verir (open redirect koruması). */
export function safeNext(
  value: FormDataEntryValue | string | null | undefined,
  fallback = "/bugun",
) {
  if (typeof value !== "string") return fallback;
  const path = value.trim();
  if (!path.startsWith("/") || path.startsWith("//") || path.includes("\\"))
    return fallback;
  return path;
}

export function authRedirectUrl(siteUrl: string, next: string) {
  const url = new URL("/auth/callback", siteUrl);
  url.searchParams.set("next", safeNext(next));
  return url.toString();
}

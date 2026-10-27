import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

/**
 * İsteğe bağlı ISR yenileme (Doc 54, 28 Eki 2026). API bir madde özetini yayınlayınca/yayından alınca
 * çağırır; anon madde sayfası (24 sa) ve okuyucu (1 sa) önbelleği beklemeden tazelenir.
 * Yetki: `REVALIDATE_SECRET` ile `x-revalidate-secret` başlığı. Gövde: { paths: string[] } (en çok 50, "/kanun/…" ile başlar).
 */
export async function POST(req: Request) {
  const secret = process.env.REVALIDATE_SECRET;
  if (!secret || req.headers.get("x-revalidate-secret") !== secret) {
    return NextResponse.json({ error: "yetkisiz" }, { status: 401 });
  }
  let body: { paths?: unknown };
  try {
    body = (await req.json()) as { paths?: unknown };
  } catch {
    return NextResponse.json({ error: "gövde JSON olmalı" }, { status: 400 });
  }
  const paths = Array.isArray(body.paths)
    ? body.paths.filter((p): p is string => typeof p === "string" && /^\/[a-z0-9\-/]+$/i.test(p)).slice(0, 50)
    : [];
  if (paths.length === 0) return NextResponse.json({ error: "paths gerekli" }, { status: 400 });
  for (const p of paths) revalidatePath(p);
  return NextResponse.json({ revalidated: paths });
}

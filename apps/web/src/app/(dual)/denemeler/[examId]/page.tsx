import { redirect } from "next/navigation";

/**
 * /denemeler/<id> — denemenin kendi sayfası yok; kapı `baslamadan-once`
 * (canlı / yaklaşan / bitmiş durumunu o sayfa yönetir). Bildirim e-postaları ve
 * web push 25 Kas 2026'ya dek bu adrese bağlanıyordu ve 404 veriyordu; kutudaki
 * eski bağlantılar burada karşılanır. Sorgu parametreleri (ör. ?role=, ?source=) korunur.
 */
export default async function DenemeYonlendir({
  params,
  searchParams,
}: {
  params: Promise<{ examId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { examId } = await params;
  const q = new URLSearchParams();
  for (const [k, v] of Object.entries(await searchParams)) {
    for (const x of Array.isArray(v) ? v : v === undefined ? [] : [v]) q.append(k, x);
  }
  const qs = q.toString();
  redirect(`/denemeler/${encodeURIComponent(examId)}/baslamadan-once${qs ? `?${qs}` : ""}`);
}

/**
 * Merkezdeki soru sayfasının adresi (panel bağlantısı için). `HUB_SYNC_URL` yoksa null:
 * panel kodu yine gösterir, bağlantı vermez. Anahtar bu adrese girmez.
 */
export function hubQuestionUrl(
  hubCode: string | null | undefined,
  baseUrl = process.env.HUB_SYNC_URL,
): string | null {
  if (!hubCode || !baseUrl) return null;
  return `${baseUrl.replace(/\/+$/, '')}/admin/questions/${encodeURIComponent(hubCode)}`;
}

import type { Dashboard } from "@/features/exams/queries";

/**
 * Ücretsiz planın tek satırlık özeti (Ben kartı, Üyelik). Sayılar SUNUCUDAN gelir
 * (`/me/dashboard`: plans tablosu, ücretsiz satırı); istemci kural bilmez. Pano henüz
 * yüklenmediyse sayısız genel ifade döner, uydurma sayı yazılmaz (13 Kas 2026).
 */
export function ucretsizPlanOzeti(dash: Pick<Dashboard, "today" | "personalExam"> | undefined, ayrac = " · "): string {
  const parcalar: string[] = [];
  const soru = dash?.today.dailyLimit;
  const deneme = dash?.personalExam.dailyAllowance;
  parcalar.push(soru != null ? `Günde ${soru.toLocaleString("tr-TR")} soru` : "Günlük soru sınırı");
  if (deneme != null) parcalar.push(deneme === 0 ? "Kişisel deneme yok" : `Günde ${deneme} kişisel deneme`);
  parcalar.push("son 7 günün yanlışları");
  return parcalar.join(ayrac);
}

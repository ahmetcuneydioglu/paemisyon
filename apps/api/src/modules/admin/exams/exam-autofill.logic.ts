/**
 * Otomatik deneme üretimi — SAF mantık (Doc 18 §8 devamı).
 * Müfredat bölümlerinin (ExamSection.weightPercent) ağırlığına göre soru
 * kotası dağıtır; banka yetersizse artığı kapasitesi olan bölümlere aktarır.
 * Rastgelelik seçim aşamasında (weightedPick) — tahsis deterministiktir.
 */

export interface SectionCapacity {
  sectionId: string;
  /** ExamSection.weightPercent (0 olabilir — o zaman eşit pay varsayılır). */
  weight: number;
  /** Bu bölümün derslerindeki YAYINDA soru sayısı. */
  available: number;
}

/**
 * En-büyük-kalan (largest remainder) yöntemiyle ağırlıklı kota tahsisi.
 * Kurallar:
 *  - Hiçbir bölüme kapasitesinden fazla verilmez.
 *  - Tüm ağırlıklar 0 ise eşit ağırlık varsayılır.
 *  - Kapasite yüzünden dağıtılamayan pay, kapasitesi kalan bölümlere
 *    ağırlık sırasıyla aktarılır; toplam kapasite < istek ise eldeki kadar döner.
 */
export function allocateQuota(
  sections: SectionCapacity[],
  total: number,
): Map<string, number> {
  const result = new Map<string, number>();
  const usable = sections.filter((s) => s.available > 0);
  if (usable.length === 0 || total <= 0) return result;

  const weightSum = usable.reduce((a, s) => a + s.weight, 0);
  const weightOf = (s: SectionCapacity) =>
    weightSum > 0 ? s.weight / weightSum : 1 / usable.length;

  // 1) Taban paylar + kalanlar.
  let assigned = 0;
  const remainders: { s: SectionCapacity; frac: number }[] = [];
  for (const s of usable) {
    const exact = total * weightOf(s);
    const base = Math.min(Math.floor(exact), s.available);
    result.set(s.sectionId, base);
    assigned += base;
    remainders.push({ s, frac: exact - Math.floor(exact) });
  }

  // 2) Kalan koltuklar: önce kesir büyüklüğüne, eşitlikte ağırlığa göre.
  remainders.sort((a, b) => b.frac - a.frac || b.s.weight - a.s.weight);
  let leftover = total - assigned;
  // Tur tur dağıt — bir bölüm kapasiteye çarptıysa sıradakine geç.
  while (leftover > 0) {
    let placed = false;
    for (const { s } of remainders) {
      if (leftover === 0) break;
      const cur = result.get(s.sectionId)!;
      if (cur < s.available) {
        result.set(s.sectionId, cur + 1);
        leftover--;
        placed = true;
      }
    }
    if (!placed) break; // toplam kapasite bitti — eldeki kadar
  }
  return result;
}

export interface CandidateQuestion {
  questionId: string;
  /** Kaç denemede kullanılmış (ExamQuestion sayısı) — az kullanılan öncelikli. */
  usageCount: number;
  /** Konu-dengeli bölüm içi seçim için (pickSectionQuestions). */
  topicId?: string;
}

/**
 * Bölüm içi seçim: az kullanılmış sorular önce (taze deneme), aynı kullanım
 * seviyesinde rastgele. `rand` enjekte edilir (test determinizmi).
 */
export function pickQuestions(
  candidates: CandidateQuestion[],
  quota: number,
  rand: () => number = Math.random,
): string[] {
  const shuffled = [...candidates]
    .map((c) => ({ c, r: rand() }))
    .sort((a, b) => a.c.usageCount - b.c.usageCount || a.r - b.r)
    .map((x) => x.c.questionId);
  return shuffled.slice(0, Math.max(0, quota));
}

/**
 * Bölüm kotasını bölümün KONULARINA dengeli dağıtarak seçer — saf rastgele
 * seçim büyük konulara yığılabiliyor (ör. Genel Kültür'ün 30 sorusunun tek
 * konudan gelmesi "dağılım bozuk" okunur). Konular eşit ağırlıklı pay alır
 * (küçük konunun artığı büyüklere akar); konu içinde az-kullanılmış öncelik.
 * Sonuç konu gruplu döner (gerçek kitapçıkta aynı konu ardışıktır).
 */
export function pickSectionQuestions(
  candidates: CandidateQuestion[],
  quota: number,
  rand: () => number = Math.random,
): string[] {
  const byTopic = new Map<string, CandidateQuestion[]>();
  for (const c of candidates) {
    const key = c.topicId ?? '_';
    byTopic.set(key, [...(byTopic.get(key) ?? []), c]);
  }
  if (byTopic.size <= 1) return pickQuestions(candidates, quota, rand);

  const topicQuota = allocateQuota(
    [...byTopic.entries()].map(([topicId, pool]) => ({
      sectionId: topicId,
      weight: 1, // konular eşit pay — müfredat konu ağırlığı tanımlamıyor
      available: pool.length,
    })),
    quota,
  );
  const ids: string[] = [];
  for (const [topicId, pool] of byTopic) {
    ids.push(...pickQuestions(pool, topicQuota.get(topicId) ?? 0, rand));
  }
  return ids;
}
